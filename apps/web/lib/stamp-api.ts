import { getAuthToken } from "./auth";

function apiBase(): string | null {
  const base = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
  return base && base.length > 0 ? base : null;
}

export async function fetchStampStores(): Promise<{ name: string, count: number }[]> {
  const base = apiBase();
  const token = getAuthToken();

  if (!base || !token) {
    return [];
  }

  try {
    const res = await fetch(`${base}/stampstore`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (res.status === 401 || res.status === 403) {
      // In a real app we'd trigger a global logout event here
      // For now, returning empty gracefully like user-api.ts
      return [];
    }

    if (!res.ok) {
      return [];
    }

    const data = await res.json();
    if (data.success && Array.isArray(data.data)) {
      return data.data;
    }
    return [];
  } catch (e) {
    console.error("Failed to fetch stamp stores:", e);
    return [];
  }
}

export async function redeemStampCode(code: string): Promise<{ success: boolean, message: string }> {
  const base = apiBase();
  const token = getAuthToken();

  if (!base || !token) {
    return { success: false, message: "Authentication required" };
  }

  try {
    const res = await fetch(`${base}/stampstore/createstamp`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ code }),
    });

    const data = await res.json();

    if (res.status === 401 || res.status === 403) {
      return { success: false, message: "Session expired. Please log in again." };
    }

    if (!res.ok || !data.success) {
      return { success: false, message: data.error?.message || data.message || "Failed to redeem code" };
    }

    return { success: true, message: data.message || "Code redeemed successfully" };
  } catch (e) {
    console.error("Failed to redeem stamp code:", e);
    return { success: false, message: "Connection error" };
  }
}
