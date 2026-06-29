import type {
  ActivityDetail,
  ActivityRegistrationPayload,
  ActivityRegistrationResult,
} from "@enroll-website/types";
import { getMockActivityDetail } from "./mock-activity";

/** Thrown when `NEXT_PUBLIC_API_URL` is set but the activity request fails (non-404). */
export class ActivityApiLoadError extends Error {
  readonly status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "ActivityApiLoadError";
    this.status = status;
  }
}

import { getAuthToken } from "./auth";

function apiBase(): string | null {
  const base = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
  return base && base.length > 0 ? base : null;
}

export async function fetchActivityDetail(id: string): Promise<ActivityDetail | null> {
  const base = apiBase();
  if (base) {
    try {
      const res = await fetch(`${base}/activities/${encodeURIComponent(id)}`, {
        next: { revalidate: 60 },
      });
      if (res.ok) {
        try {
          const payload = (await res.json()) as { data: ActivityDetail };
          const activity = payload.data;

          // Compute is_registration_open from date range if not set by Backend
          if (activity.is_registration_open === undefined || activity.is_registration_open === null || activity.is_registration_open === false) {
            const now = new Date();
            const openAt  = activity.open_registration_at  ? new Date(activity.open_registration_at)  : null;
            const closeAt = activity.close_registration_at ? new Date(activity.close_registration_at) : null;

            if (activity.registration_open_override === true) {
              const afterOpen   = !openAt  || now >= openAt;
              const beforeClose = !closeAt || now <= closeAt;
              activity.is_registration_open = afterOpen && beforeClose;
            } else if (activity.registration_open_override === false) {
              activity.is_registration_open = false;
            } else if (openAt || closeAt) {
              const afterOpen   = !openAt  || now >= openAt;
              const beforeClose = !closeAt || now <= closeAt;
              activity.is_registration_open = afterOpen && beforeClose;
            }
          }

          return activity;
        } catch {
          throw new ActivityApiLoadError("รูปแบบข้อมูลจาก API ไม่ถูกต้อง");
        }
      }
      if (res.status === 404) {
        return null;
      }
      throw new ActivityApiLoadError(`เซิร์ฟเวอร์ตอบกลับ ${res.status}`, res.status);
    } catch (e) {
      if (e instanceof ActivityApiLoadError) throw e;
      throw new ActivityApiLoadError("เชื่อมต่อ API ไม่ได้");
    }
  }
  return getMockActivityDetail(id);
}

export async function postActivityRegistration(
  activityId: string,
  payload: ActivityRegistrationPayload,
  paymentSlip: File | null
): Promise<ActivityRegistrationResult> {
  const base = apiBase();

  if (base) {
    try {
      // Step 1: Create registration
      const currentToken = getAuthToken();
      const regHeaders: HeadersInit = { "Content-Type": "application/json" };
      if (currentToken) {
        regHeaders["Authorization"] = `Bearer ${currentToken}`;
      }

      const regRes = await fetch(`${base}/registrations`, {
        method: "POST",
        headers: regHeaders,
        body: JSON.stringify(payload),
      });
      const regData = await regRes.json().catch(() => ({}));
      
      if (!regRes.ok || !regData.success) {
        const msg = regData.error?.message ?? `ลงทะเบียนไม่สำเร็จ (${regRes.status})`;
        const code = regData.error?.code;

        if (code === "DUPLICATE_REGISTRATION" || msg.toLowerCase().includes("already registered") || msg.includes("แล้ว")) {
          return {
            ok: false,
            message: "คุณได้ลงทะเบียนกิจกรรมนี้ไปแล้ว (หากยังชำระเงินไม่เสร็จ กรุณาทำรายการต่อที่หน้าโปรไฟล์ของคุณ)",
          };
        }

        if (code === "DUPLICATE_EMAIL" || msg.toLowerCase().includes("email already registered")) {
          return {
            ok: false,
            message: "อีเมลนี้มีในระบบแล้ว กรุณาเข้าสู่ระบบก่อนลงทะเบียน",
          };
        }

        return {
          ok: false,
          message: msg,
        };
      }
      
      const registrationId = regData.data.registration_id;

      // Step 2: Upload slip if exists
      if (paymentSlip) {
        const form = new FormData();
        form.set("slip", paymentSlip);
        
        // Use token from step 1 response (new user) or fallback to existing token
        const paymentToken = regData.data?.access_token || getAuthToken();
        const payHeaders: HeadersInit = {};
        if (paymentToken) {
          payHeaders["Authorization"] = `Bearer ${paymentToken}`;
        }

        const payRes = await fetch(`${base}/registrations/${encodeURIComponent(registrationId)}/payment`, {
          method: "POST",
          headers: payHeaders,
          body: form,
        });
        const payData = await payRes.json().catch(() => ({}));
        if (!payRes.ok || !payData.success) {
           let msg = payData.error?.message ?? "อัปโหลดสลิปไม่สำเร็จ";
           if (payRes.status === 409) {
             msg = "สลิปนี้ถูกใช้ชำระเงินไปแล้ว (สลิปซ้ำ)";
           } else if (payRes.status === 422) {
             msg = "ยอดเงินไม่ตรงกับราคา หรือ แสกน QR บนสลิปไม่พบ กรุณาอัปโหลดรูปใหม่";
           }
           return {
             ok: false,
             message: msg,
           };
        }
      }

      return { 
        ok: true,
        registration_id: registrationId, 
        message: "ลงทะเบียนและตรวจสอบสลิปสำเร็จ",
        access_token: regData.data?.access_token,
        user_data: regData.data?.user
      };
    } catch (e) {
      return {
        ok: false,
        message: e instanceof Error ? e.message : "เชื่อมต่อเซิร์ฟเวอร์ไม่ได้",
      };
    }
  }

  await new Promise((r) => setTimeout(r, 400));
  alert("⚠️ ระบบยังอยู่ใน 'โหมดจำลอง (Offline Mode)' ครับ! (เนื่องจาก NEXT_PUBLIC_API_URL ยังไม่ถูกอัปเดต) \n\nกรุณากด Ctrl+C ใน Terminal แล้วพิมพ์ `npm run dev` ใหม่อีกครั้งครับ");
  
  return {
    ok: true,
    registration_id: `mock-${activityId}-${Date.now()}`,
    message: "โหมดออฟไลน์: บันทึกฝั่งเครื่อง (รอ Backend จริง)",
  };
}

export async function fetchMyRegistrations(): Promise<any[]> {
  const base = apiBase();
  const token = getAuthToken();
  if (!base || !token) return [];

  try {
    const res = await fetch(`${base}/registrations/mine`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.success && data.data) {
      return data.data;
    }
  } catch (e) {
    console.error("Failed to fetch registrations", e);
  }
  return [];
}

export async function postPaymentSlip(
  registrationId: string,
  paymentSlip: File
): Promise<{ ok: boolean; message: string }> {
  const base = apiBase();
  const token = getAuthToken();
  if (!base) return { ok: false, message: "Offline" };

  try {
    const form = new FormData();
    form.set("slip", paymentSlip);
    const headers: HeadersInit = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch(`${base}/registrations/${encodeURIComponent(registrationId)}/payment`, {
      method: "POST",
      headers,
      body: form,
    });
    const data = await res.json().catch(() => ({}));
    
    if (!res.ok || !data.success) {
      let msg = data.error?.message ?? "อัปโหลดสลิปไม่สำเร็จ";
      if (res.status === 409) msg = "สลิปนี้ถูกใช้ชำระเงินไปแล้ว (สลิปซ้ำ)";
      else if (res.status === 422) msg = "ยอดเงินไม่ตรงกับราคา หรือ แสกน QR บนสลิปไม่พบ กรุณาอัปโหลดรูปใหม่";
      return { ok: false, message: msg };
    }
    return { ok: true, message: "อัปโหลดสลิปสำเร็จ" };
  } catch (e) {
    return { ok: false, message: "เชื่อมต่อเซิร์ฟเวอร์ไม่ได้" };
  }
}
