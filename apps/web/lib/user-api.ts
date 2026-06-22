import { getAuthToken } from "./auth";

function apiBase(): string | null {
  const base = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
  return base && base.length > 0 ? base : null;
}

/**
 * Throw this from any authed API call when the backend returns 401/403 so
 * callers can distinguish a stale token from a real network/server error.
 *
 * Why: when a stale token is in localStorage but the backend rejects it,
 * `optionalAuth` (or `requireAuth`) on the server returns a 401. Previously
 * `fetchUserProfile` silently returned `null`, which made the frontend look
 * "logged out" while the header still showed a user — the original bug. By
 * surfacing the 401 to the caller (via callback or thrown error), modals can
 * trigger a single recovery path: clear local session + open the login modal.
 */
export class AuthExpiredError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "AuthExpiredError";
    this.status = status;
  }
}

/**
 * Hook for stale-token recovery. Set by components that want to react to
 * 401s on authed endpoints (e.g. AccountProfile, QRCheckinModal). When set,
 * the authed fetch helpers call this on 401 instead of throwing.
 *
 * Why a module-level setter rather than passing the callback everywhere:
 * the helpers (`fetchUserProfile`, `fetchUserActivities`, `fetchMemberQrToken`)
 * are called from many components and we don't want every call site to grow
 * a new parameter. Setting once per mounted tree keeps the API stable.
 *
 * Lifecycle: components register on mount, unregister on unmount.
 */
let authErrorHandler: (() => void) | null = null;

export function setAuthErrorHandler(handler: (() => void) | null): void {
  authErrorHandler = handler;
}

function notifyAuthError(): void {
  if (authErrorHandler) authErrorHandler();
}

export interface UserProfile {
  _id: string;
  first_name: string;
  last_name: string;
  nickname: string;
  email: string;
  phone: string;
  avatar_url?: string;
  preferences?: string[];
  gender?: string;
  education_level?: string;
  institution?: string;
  address?: string;
}

export interface ActivityRegistration {
  registration_id: string;
  status: string;
  registered_at: string;
  group_name: string | null;
  activity: {
    _id: string;
    name: string;
    hero_image_url?: string;
    date?: string;
    location?: string;
    // add more fields once you see the full activity object
  };
}

/*
export interface ActivityRegistration {
  _id: string;
  user_id: string;
  activity_id: string;
  activity_name: string;
  activity_date: string;
  activity_location: string;
  activity_cover_image?: string;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  registered_at: string;
  payment_status?: string;
}
  */

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: {
    message: string;
    code?: string;
  };
}

export async function fetchUserProfile(): Promise<UserProfile | null> {
  const base = apiBase();
  const token = getAuthToken();

  if (!base || !token) {
    return null;
  }

  try {
    const res = await fetch(`${base}/users/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (res.status === 401 || res.status === 403) {
      // Token rejected — let the registered handler (if any) trigger recovery.
      // We still return null so the caller doesn't have to handle a throw.
      notifyAuthError();
      return null;
    }

    if (!res.ok) {
      return null;
    }

    const data = (await res.json()) as ApiResponse<UserProfile>;
    if (data.success && data.data) {
      return data.data;
    }
    return null;
  } catch (e) {
    console.error("Failed to fetch user profile:", e);
    return null;
  }
}

export async function updateUserProfile(
  updates: Partial<UserProfile>
): Promise<{ success: boolean; message: string; data?: UserProfile }> {
  const base = apiBase();
  const token = getAuthToken();

  if (!base || !token) {
    return {
      success: false,
      message: "Authentication required",
    };
  }

  try {
    const res = await fetch(`${base}/users/me`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updates),
    });

    const data = (await res.json()) as ApiResponse<UserProfile>;

    if (res.status === 401 || res.status === 403) {
      notifyAuthError();
      return {
        success: false,
        message: "Session expired. Please log in again.",
      };
    }

    if (!res.ok || !data.success) {
      return {
        success: false,
        message: data.error?.message || "Failed to update profile",
      };
    }

    return {
      success: true,
      message: "Profile updated successfully",
      data: data.data,
    };
  } catch (e) {
    console.error("Failed to update user profile:", e);
    return {
      success: false,
      message: "Connection error",
    };
  }
}

export async function fetchUserActivities(): Promise<ActivityRegistration[]> {
  const base = apiBase();
  const token = getAuthToken();

  if (!base || !token) return [];

  try {
    const res = await fetch(`${base}/users/me/activities`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (res.status === 401 || res.status === 403) {
      notifyAuthError();
      return [];
    }

    const text = await res.text();
    if (!res.ok || !text) return [];

    const raw = JSON.parse(text);
    if (raw.success && Array.isArray(raw.data)) {
        return raw.data as ActivityRegistration[];
    }

return [];

  } catch (e) {
    console.error("Failed to fetch user activities:", e);
    return [];
  }
}
