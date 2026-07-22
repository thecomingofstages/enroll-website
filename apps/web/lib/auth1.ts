// lib/auth.ts
// ─────────────────────────────────────────────────────────────
// JWT auth utility สำหรับ The Coming of Stages
// - เก็บ access token ใน memory (ไม่เก็บใน localStorage เพื่อความปลอดภัย)
// - refresh token อยู่ใน httpOnly cookie "tcos_refresh" — browser จัดการเอง
// - ทุก fetch ที่ต้องการ auth ให้ใช้ apiFetch() แทน fetch() ตรงๆ
// ─────────────────────────────────────────────────────────────

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

// ── In-memory token store ──────────────────────────────────────
let _accessToken: string | null = null;

export function setAccessToken(token: string) {
  _accessToken = token;
}

export function getAccessToken(): string | null {
  return _accessToken;
}

export function clearAccessToken() {
  _accessToken = null;
}

// ── Login ──────────────────────────────────────────────────────
export async function login(email: string, password: string): Promise<void> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include", // รับ httpOnly refresh cookie
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message ?? "Login failed");
  }

  const data = await res.json();
  setAccessToken(data.access_token);
}

// ── Logout ─────────────────────────────────────────────────────
export async function logout(): Promise<void> {
  await fetch(`${API_BASE}/auth/logout`, {
    method: "POST",
    headers: buildAuthHeaders(),
    credentials: "include", // ส่ง refresh cookie ไปให้ server clear
  }).catch(() => {}); // ไม่ throw แม้ server error

  clearAccessToken();
}

// ── Silent token refresh ───────────────────────────────────────
// เรียกเมื่อ access token หมดอายุ (401) — ใช้ refresh cookie อัตโนมัติ
async function refreshAccessToken(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      credentials: "include",
    });

    if (!res.ok) return false;

    const data = await res.json();
    setAccessToken(data.access_token);
    return true;
  } catch {
    return false;
  }
}

// ── Auth headers helper ────────────────────────────────────────
export function buildAuthHeaders(): HeadersInit {
  const token = getAccessToken();
  return token
    ? { "Content-Type": "application/json", Authorization: `Bearer ${token}` }
    : { "Content-Type": "application/json" };
}

// ── apiFetch — ใช้แทน fetch() สำหรับทุก protected endpoint ───
// จะ retry 1 ครั้งหลัง refresh token อัตโนมัติถ้าได้ 401
export async function apiFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const url = path.startsWith("http") ? path : `${API_BASE}${path}`;

  const res = await fetch(url, {
    ...options,
    credentials: "include",
    headers: {
      ...buildAuthHeaders(),
      ...(options.headers ?? {}),
    },
  });

  // Token หมดอายุ → refresh แล้ว retry
  if (res.status === 401) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      return fetch(url, {
        ...options,
        credentials: "include",
        headers: {
          ...buildAuthHeaders(),
          ...(options.headers ?? {}),
        },
      });
    }
    // refresh ไม่ได้ → clear token (user ต้อง login ใหม่)
    clearAccessToken();
  }

  return res;
}
