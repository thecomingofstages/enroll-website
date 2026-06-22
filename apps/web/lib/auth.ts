/**
 * Single source of truth for reading the bearer token on the client.
 *
 * Used by:
 *   - lib/user-api.ts
 *   - lib/activity-api.ts
 *   - components/QRCheckinModal.tsx
 *   - lib/context.tsx (rehydrate + registration helper)
 *
 * Resolution order:
 *   1. Cookie  "access_token"        — primary path when backend sets it (URL-decoded)
 *   2. Cookie  "tcos_access_token"   — alternate name some deployments use
 *   3. localStorage "tcos_access_token"
 *   4. localStorage "access_token"
 *
 * Why cookie-first: the backend's Auth.controller.login response shape is the
 * canonical authority for "am I logged in". The backend's Auth.controller.js
 * currently sets only an HttpOnly `tcos_refresh` cookie and returns the access
 * token in the JSON body, so the cookie path is currently a no-op — localStorage
 * is doing the work. Keeping cookie-first lets us flip to backend-set cookies
 * (or to a refresh-token exchange) without changing every call site.
 */

const COOKIE_NAMES = ["access_token", "tcos_access_token"] as const;
const STORAGE_KEYS = ["tcos_access_token", "access_token"] as const;

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${name}=([^;]*)`),
  );
  if (!match || !match[1]) return null;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
}

function readStorage(name: string): string | null {
  if (typeof localStorage === "undefined") return null;
  const v = localStorage.getItem(name);
  return v && v.length > 0 ? v : null;
}

export function getAuthToken(): string | null {
  for (const name of COOKIE_NAMES) {
    const v = readCookie(name);
    if (v) return v;
  }
  for (const name of STORAGE_KEYS) {
    const v = readStorage(name);
    if (v) return v;
  }
  return null;
}

export function hasAuthToken(): boolean {
  return getAuthToken() !== null;
}

/**
 * Persist the token in BOTH localStorage and a client-readable cookie.
 *
 * Use this in:
 *   - login() / loginWithToken() / setAuthFromRegistration() in context.tsx
 *   - any post-login or post-registration flow that just received a token
 *
 * Note: this does NOT replace the backend's HttpOnly `tcos_refresh` cookie —
 * that's set by the server. This is the client-side mirror used by getAuthToken().
 *
 * If the backend ever starts setting a non-HttpOnly `access_token` cookie of its
 * own, this function becomes optional (we'd just call getAuthToken() and trust it).
 */
export function persistAuthToken(token: string | null): void {
  if (typeof localStorage !== "undefined") {
    if (token) {
      localStorage.setItem("tcos_access_token", token);
      // Clear the legacy plain name so it never lingers as a stale value.
      if (localStorage.getItem("access_token")) {
        localStorage.removeItem("access_token");
      }
    } else {
      localStorage.removeItem("tcos_access_token");
      localStorage.removeItem("access_token");
    }
  }

  if (typeof document !== "undefined") {
    const expires = token
      // 15 minutes — matches backend expires_in=900 from Auth.controller.login
      ? `; max-age=${15 * 60}; path=/; SameSite=Lax`
      : "; max-age=0; path=/";
    for (const name of COOKIE_NAMES) {
      const value = token ? encodeURIComponent(token) : "";
      document.cookie = `${name}=${value}${expires}`;
    }
  }
}