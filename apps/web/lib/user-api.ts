function apiBase(): string | null {
  const base = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
  return base && base.length > 0 ? base : null;
}

function getAuthToken(): string | null {
  if (typeof document !== "undefined") {
    const match = document.cookie.match(/(?:^|; )access_token=([^;]*)/);
    if (match && match[1]) return match[1];
  }
  if (typeof localStorage !== "undefined") {
    return localStorage.getItem("tcos_access_token") || localStorage.getItem("access_token");
  }
  return null;
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
