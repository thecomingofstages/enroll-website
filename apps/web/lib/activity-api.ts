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
          return payload.data;
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
      const regRes = await fetch(`${base}/registrations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const regData = await regRes.json().catch(() => ({}));
      
      if (!regRes.ok || !regData.success) {
        return {
          ok: false,
          message: regData.error?.message ?? `ลงทะเบียนไม่สำเร็จ (${regRes.status})`,
        };
      }
      
      const registrationId = regData.data.registration_id;

      // Step 2: Upload slip if exists
      if (paymentSlip) {
        const form = new FormData();
        form.set("slip", paymentSlip);
        const payRes = await fetch(`${base}/registrations/${encodeURIComponent(registrationId)}/payment`, {
          method: "POST",
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
        message: "ลงทะเบียนและตรวจสอบสลิปสำเร็จ"
      };
    } catch (e) {
      return {
        ok: false,
        message: e instanceof Error ? e.message : "เชื่อมต่อเซิร์ฟเวอร์ไม่ได้",
      };
    }
  }

  await new Promise((r) => setTimeout(r, 400));
  return {
    ok: true,
    registration_id: `mock-${activityId}-${Date.now()}`,
    message: "โหมดออฟไลน์: บันทึกฝั่งเครื่อง (รอ Backend จริง)",
  };
}
