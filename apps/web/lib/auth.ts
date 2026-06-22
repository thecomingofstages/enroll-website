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
 *   1. localStorage "tcos_access_token"  (canonical)
 *   2. localStorage "access_token"       (legacy fallback)
 *
 * Why no cookies: the backend (Auth.controller.js) sets only an HttpOnly
 * `tcos_refresh` cookie and returns the access token in the JSON body, so
 * client-side cookies were never the source of truth. An earlier version of
 * this helper also mirrored the token into a document.cookie for speculative
 * cookie-first resolution, but Firefox's stricter cookie policy (Total Cookie
 * Protection, SameSite rules, and silent cookie-write rejection without
 * `Secure` on certain configurations) made the cookie write unreliable in
 * Firefox while it appeared to work in Chrome. localStorage works identically
 * in both browsers, so we use it alone.
 *
 * If the backend later starts setting a non-HttpOnly `access_token` cookie
 * and we want to read it, add a cookie read path back here — but only the
 * read path, never the write path from JS.
 */

const STORAGE_KEYS = ["tcos_access_token", "access_token"] as const;

function readStorage(name: string): string | null {
  if (typeof localStorage === "undefined") return null;
  const v = localStorage.getItem(name);
  return v && v.length > 0 ? v : null;
}

export function getAuthToken(): string | null {
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
 * Persist the token in localStorage. Use this in:
 *   - login() / loginWithToken() / setAuthFromRegistration() in context.tsx
 *   - any post-login or post-registration flow that just received a token
 *
 * Note: this does NOT replace the backend's HttpOnly `tcos_refresh` cookie —
 * that's set by the server. We don't write any client-side cookies here.
 */
export function persistAuthToken(token: string | null): void {
  if (typeof localStorage === "undefined") return;
  try {
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
  } catch {
    // Safari Private Browsing and storage-quota-exceeded scenarios can throw
    // on setItem. We swallow the error so login/registration flows don't
    // crash; the user simply won't stay logged in across reloads.
  }
}

/**
 * Decode the `exp` claim from a JWT, returning the Unix timestamp in
 * seconds, or null if the token is malformed or has no `exp`.
 *
 * No signature verification — this is a UX shortcut so the AppProvider
 * can short-circuit "definitely expired" cases on page load without a
 * network round-trip. The server is still the authority on whether a
 * token is valid; this only answers "does the token *claim* to be past
 * its expiry?"
 *
 * If the backend ever moves to opaque (non-JWT) tokens, this will
 * return null and the proactive check is skipped — the in-session
 * handler (setAuthErrorHandler) will still catch 401s from real
 * authed calls.
 */
export function decodeJwtExp(token: string | null): number | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length < 2) return null;
  try {
    const payload = JSON.parse(atob(parts[1]));
    return typeof payload?.exp === "number" ? payload.exp : null;
  } catch {
    return null;
  }
}