"use client";

import { useEffect, useId, useState } from "react";
import type { ActivityDetail } from "@enroll-website/types";
import { postActivityRegistration } from "@/lib/activity-api";

type Step = 1 | 2 | 3;

const slipAccept = "image/png,image/jpeg,application/pdf";

const slipAllowedMime = new Set(["image/png", "image/jpeg", "application/pdf"]);

function validateFirstName(name: string): string | null {
  const trimmed = name.trim();
  if (!trimmed) return "กรุณากรอกชื่อ";
  if (trimmed.length < 2) return "ชื่อต้องไม่น้อยกว่า 2 ตัวอักษร";
  return null;
}

function validateLastName(name: string): string | null {
  const trimmed = name.trim();
  if (!trimmed) return "กรุณากรอกนามสกุล";
  if (trimmed.length < 2) return "นามสกุลต้องไม่น้อยกว่า 2 ตัวอักษร";
  return null;
}

function validatePhone(phone: string): string | null {
  const trimmed = phone.trim();
  if (!trimmed) return "กรุณากรอกเบอร์โทร";
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length !== 10) return "เบอร์โทรต้องเป็น 10 หลัก";
  if (!["6", "8", "9"].includes(digits[1])) {
    return "เบอร์โทรต้องเริ่มด้วย 06, 08 หรือ 09";
  }
  return null;
}

export function RegisterModal({
  activity,
  onClose,
}: {
  activity: ActivityDetail;
  onClose: () => void;
}) {
  const titleId = useId();
  const [step, setStep] = useState<Step>(1);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [slip, setSlip] = useState<File | null>(null);
  const [extraAnswers, setExtraAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{
    message: string;
    variant: "success" | "error";
  } | null>(null);
  const [slipError, setSlipError] = useState<string | null>(null);
  const [firstNameError, setFirstNameError] = useState<string | null>(null);
  const [lastNameError, setLastNameError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !submitting) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, submitting]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const canNextFrom1 =
    !validateFirstName(firstName) &&
    !validateLastName(lastName) &&
    !validatePhone(phone);
  const canNextFrom2 = slip !== null;

  const setAnswer = (id: string, value: string) => {
    setExtraAnswers((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setFeedback(null);
    const custom_answers = Object.entries(extraAnswers).map(([k, v]) => ({ question_id: k, answer: v }));
    const res = await postActivityRegistration(
      activity._id,
      {
        activity_id: activity._id,
        custom_answers,
        new_user: {
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          phone: phone.trim(),
          email: `${phone.trim()}@temp.com`,
          nickname: firstName.trim(),
          password: `Temp@${phone.trim()}`,
          gender: "Unspecified"
        }
      },
      slip
    );
    setSubmitting(false);
    if (res.ok) {
      setFeedback({
        message: res.message ?? "ลงทะเบียนสำเร็จ",
        variant: "success",
      });
      setTimeout(() => {
        onClose();
      }, 900);
    } else {
      setFeedback({
        message: res.message ?? "เกิดข้อผิดพลาด",
        variant: "error",
      });
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !submitting) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="flex max-h-[min(92vh,720px)] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl bg-[#f4f0ea] shadow-2xl sm:rounded-2xl"
      >
        <div className="flex items-center justify-between border-b border-stone-200/80 px-4 py-3 sm:px-5">
          <h2 id={titleId} className="text-lg font-semibold text-stone-900">
            ลงทะเบียนเข้าร่วม
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-lg p-2 text-stone-500 hover:bg-stone-200/60 hover:text-stone-800 disabled:pointer-events-none disabled:opacity-40"
            aria-label="ปิด"
          >
            ✕
          </button>
        </div>

        <div className="flex shrink-0 gap-2 border-b border-stone-200/60 px-4 py-3 sm:px-5">
          {([1, 2, 3] as const).map((n) => (
            <div key={n} className="flex flex-1 items-center gap-2">
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
                  step === n
                    ? "bg-red-800 text-white"
                    : step > n
                      ? "bg-red-200 text-red-900"
                      : "bg-stone-200 text-stone-600"
                }`}
              >
                {n}
              </span>
              <span className="hidden text-xs font-medium text-stone-600 sm:inline">
                {n === 1 ? "ข้อมูล" : n === 2 ? "ชำระเงิน" : "คำถาม"}
              </span>
            </div>
          ))}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5 sm:py-5">
          {step === 1 ? (
            <>
              <p className="rounded-lg bg-sky-100 px-3 py-2 text-sm text-sky-900">
                กรอกข้อมูลผู้เข้าร่วม ขั้นตอนถัดไปคือชำระเงินผ่าน PromptPay และอัปโหลดสลิป
              </p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="block sm:col-span-1">
                  <span className="text-sm font-medium text-stone-700">ชื่อ</span>
                  <input
                    className={`mt-1 w-full rounded-lg border px-3 py-2 text-stone-900 outline-none ring-red-800/30 focus:ring-2 ${
                      firstNameError
                        ? "border-red-400 bg-red-50"
                        : "border-stone-200 bg-white"
                    }`}
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    autoComplete="given-name"
                  />
                  {firstNameError && (
                    <p className="mt-1 text-xs text-red-600">{firstNameError}</p>
                  )}
                </label>
                <label className="block sm:col-span-1">
                  <span className="text-sm font-medium text-stone-700">นามสกุล</span>
                  <input
                    className={`mt-1 w-full rounded-lg border px-3 py-2 text-stone-900 outline-none ring-red-800/30 focus:ring-2 ${
                      lastNameError
                        ? "border-red-400 bg-red-50"
                        : "border-stone-200 bg-white"
                    }`}
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    autoComplete="family-name"
                  />
                  {lastNameError && (
                    <p className="mt-1 text-xs text-red-600">{lastNameError}</p>
                  )}
                </label>
                <label className="block sm:col-span-2">
                  <span className="text-sm font-medium text-stone-700">เบอร์โทร</span>
                  <input
                    className={`mt-1 w-full rounded-lg border px-3 py-2 text-stone-900 outline-none ring-red-800/30 focus:ring-2 ${
                      phoneError
                        ? "border-red-400 bg-red-50"
                        : "border-stone-200 bg-white"
                    }`}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    inputMode="tel"
                    autoComplete="tel"
                  />
                  {phoneError && (
                    <p className="mt-1 text-xs text-red-600">{phoneError}</p>
                  )}
                </label>
              </div>
            </>
          ) : null}

          {step === 2 ? (
            <div className="space-y-4">
              <p className="text-sm font-medium text-stone-800">
                ชำระเงินผ่าน PromptPay (฿{activity.price})
              </p>
              <p className="text-sm text-stone-600">สแกน QR เพื่อโอน</p>
              <div className="mx-auto flex h-44 w-44 items-center justify-center rounded-xl bg-white text-sm font-medium text-stone-400 ring-1 ring-stone-200">
                QR Code
              </div>
              <p className="text-center text-xs text-stone-500">
                PromptPay: 062-345-6789 (TCOS) — ตัวอย่างสำหรับ UI
              </p>
              <div>
                <span className="text-sm font-medium text-stone-700">อัปโหลดสลิปการโอน</span>
                <label className="mt-2 flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-stone-300 bg-white px-4 py-8 text-center text-sm text-stone-500 transition hover:border-red-400 hover:bg-red-50/30">
                  <input
                    type="file"
                    accept={slipAccept}
                    className="sr-only"
                    onChange={(e) => {
                      const f = e.target.files?.[0] ?? null;
                      if (!f) {
                        setSlip(null);
                        setSlipError(null);
                        return;
                      }
                      if (f.size > 5 * 1024 * 1024) {
                        setSlip(null);
                        e.target.value = "";
                        setSlipError("ไฟล์ใหญ่เกิน 5MB");
                        return;
                      }
                      const mime = f.type.toLowerCase();
                      const ext = f.name.split(".").pop()?.toLowerCase() ?? "";
                      const extOk = ["png", "jpg", "jpeg", "pdf"].includes(ext);
                      const typeOk = mime
                        ? slipAllowedMime.has(mime)
                        : extOk;
                      if (!typeOk) {
                        setSlip(null);
                        e.target.value = "";
                        setSlipError("ใช้ได้เฉพาะ PNG, JPG หรือ PDF");
                        return;
                      }
                      setSlipError(null);
                      setSlip(f);
                    }}
                  />
                  {slip ? (
                    <span className="font-medium text-stone-800">{slip.name}</span>
                  ) : (
                    <>
                      <span>คลิกหรือลากไฟล์สลิปมาวาง</span>
                      <span className="mt-1 text-xs">PNG, JPG, PDF — ไม่เกิน 5MB</span>
                    </>
                  )}
                </label>
              </div>
              {slipError ? (
                <p className="text-sm font-medium text-red-700">{slipError}</p>
              ) : null}
            </div>
          ) : null}

          {step === 3 ? (
            <div className="space-y-4">
              {activity.extra_questions.length === 0 ? (
                <p className="text-sm text-stone-600">ไม่มีคำถามเพิ่มเติมสำหรับกิจกรรมนี้</p>
              ) : (
                activity.extra_questions.map((q) => (
                  <label key={q.question_id} className="block">
                    <span className="text-sm font-medium text-stone-800">{q.question_text}</span>
                    <textarea
                      className="mt-2 min-h-[100px] w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 outline-none ring-red-800/30 focus:ring-2"
                      placeholder={q.placeholder ?? "กรอกคำตอบ..."}
                      value={extraAnswers[q.question_id] ?? ""}
                      onChange={(e) => setAnswer(q.question_id, e.target.value)}
                    />
                  </label>
                ))
              )}
            </div>
          ) : null}

          {feedback ? (
            <p
              className={`mt-4 rounded-lg px-3 py-2 text-sm ${
                feedback.variant === "success"
                  ? "bg-emerald-100 text-emerald-900"
                  : "bg-red-100 text-red-900"
              }`}
            >
              {feedback.message}
            </p>
          ) : null}
        </div>

        <div className="flex shrink-0 gap-2 border-t border-stone-200/80 bg-[#f4f0ea] p-4 sm:p-5">
          {step > 1 ? (
            <button
              type="button"
              className="rounded-xl border border-stone-300 px-4 py-3 text-sm font-medium text-stone-800 hover:bg-stone-100"
              onClick={() => setStep((s) => (s === 1 ? 1 : ((s - 1) as Step)))}
              disabled={submitting}
            >
              ย้อนกลับ
            </button>
          ) : (
            <span />
          )}
          {step < 3 ? (
            <button
              type="button"
              className="ml-auto min-w-[120px] rounded-xl bg-red-800 px-4 py-3 text-sm font-semibold text-white hover:bg-red-900 disabled:opacity-40"
              disabled={
                submitting || (step === 1 ? !canNextFrom1 : step === 2 ? !canNextFrom2 : false)
              }
              onClick={() => setStep((s) => (s < 3 ? ((s + 1) as Step) : s))}
            >
              ถัดไป
            </button>
          ) : (
            <button
              type="button"
              className="ml-auto min-w-[160px] rounded-xl bg-red-800 px-4 py-3 text-sm font-semibold text-white hover:bg-red-900 disabled:opacity-40"
              disabled={submitting}
              onClick={handleSubmit}
            >
              {submitting
                ? "กำลังส่ง..."
                : `ยืนยันการลงทะเบียน (฿${activity.price})`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function ActivityRegisterSection({ activity }: { activity: ActivityDetail }) {
  const [open, setOpen] = useState(false);

  const isFull = activity.seat_capacity > 0 && activity.enrolled_count >= activity.seat_capacity;
  const isClosed = !activity.is_registration_open;
  const isDisabled = isClosed || isFull;

  let buttonText = `ลงทะเบียนเข้าร่วม (฿${activity.price})`;
  if (isClosed) {
    buttonText = "ปิดรับสมัครแล้ว";
  } else if (isFull) {
    buttonText = "ที่นั่งเต็มแล้ว";
  }

  return (
    <>
      <div className="mx-auto flex max-w-3xl flex-col gap-2 px-4 py-5">
        <button
          type="button"
          onClick={() => setOpen(true)}
          disabled={isDisabled}
          aria-expanded={open}
          aria-haspopup="dialog"
          className={`w-full rounded-xl py-3.5 text-center text-base font-semibold shadow-sm transition sm:text-lg ${
            isDisabled
              ? "bg-stone-300 text-stone-500 cursor-not-allowed"
              : "bg-red-800 text-white hover:bg-red-900"
          }`}
        >
          {buttonText}
        </button>
        {!isDisabled && (
          <p className="text-center text-xs text-zinc-500">
            กดเพื่อเปิดแบบฟอร์ม — รองรับหลายขั้นตอนตามสเปกทีม
          </p>
        )}
      </div>
      {open && !isDisabled ? (
        <RegisterModal
          key={activity._id}
          activity={activity}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </>
  );
}
