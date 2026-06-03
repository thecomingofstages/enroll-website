"use client";

import { useEffect, useId, useState } from "react";
import type { ActivityDetail } from "@enroll-website/types";
import { postActivityRegistration } from "@/lib/activity-api";

type StepId = "info" | "payment" | "questions";

interface StepConfig {
  id: StepId;
  label: string;
}

const slipAccept = "image/png,image/jpeg";

const slipAllowedMime = new Set(["image/png", "image/jpeg"]);

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

function validateEmail(email: string): string | null {
  const trimmed = email.trim();
  if (!trimmed) return "กรุณากรอกอีเมล";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed))
    return "รูปแบบอีเมลไม่ถูกต้อง";
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
  
  const steps: StepConfig[] = [{ id: "info", label: "ข้อมูล" }];
  if (activity.price > 0) {
    steps.push({ id: "payment", label: "ชำระเงิน" });
  }
  if (activity.extra_questions && activity.extra_questions.length > 0) {
    steps.push({ id: "questions", label: "คำถาม" });
  }

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isSuccess, setIsSuccess] = useState(false);
  const currentStep = steps[currentStepIndex];
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === steps.length - 1;
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState("");
  const [educationLevel, setEducationLevel] = useState("");
  const [institution, setInstitution] = useState("");
  const [address, setAddress] = useState("");
  const [slip, setSlip] = useState<File | null>(null);
  const [extraAnswers, setExtraAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{
    message: string;
    variant: "success" | "error";
  } | null>(null);
  const [slipError, setSlipError] = useState<string | null>(null);
  const firstNameError = firstName.length > 0 ? validateFirstName(firstName) : null;
  const lastNameError = lastName.length > 0 ? validateLastName(lastName) : null;
  const phoneError = phone.length > 0 ? validatePhone(phone) : null;
  const emailError = email.length > 0 ? validateEmail(email) : null;

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
    !validatePhone(phone) &&
    nickname.trim().length > 0 &&
    !validateEmail(email) &&
    gender !== "";
  const canNextFrom2 = slip !== null;

  const setAnswer = (id: string, value: string) => {
    setExtraAnswers((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setFeedback(null);
    const custom_answers = Object.entries(extraAnswers).map(([k, v]) => ({
      question_id: k,
      answer: v,
    }));
    const res = await postActivityRegistration(
      activity._id,
      {
        activity_id: activity._id,
        custom_answers,
        new_user: {
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          nickname: nickname.trim(),
          phone: phone.trim(),
          email: email.trim(),
          password: `Temp@${phone.trim()}`,
          gender: gender || "Unspecified",
          education_level: educationLevel.trim() || undefined,
          institution: institution.trim() || undefined,
          address: address.trim() || undefined,
        },
      },
      slip,
    );
    setSubmitting(false);
    if (res.ok) {
      setIsSuccess(true);
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
            disabled={submitting && !isSuccess}
            className="rounded-lg p-2 text-stone-500 hover:bg-stone-200/60 hover:text-stone-800 disabled:pointer-events-none disabled:opacity-40"
            aria-label="ปิด"
          >
            ✕
          </button>
        </div>

        {isSuccess ? (
          <div className="flex flex-1 flex-col items-center justify-center p-8 text-center min-h-[350px]">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-stone-900">ลงทะเบียนสำเร็จ!</h3>
            <p className="mt-3 text-sm text-stone-600">
              ข้อมูลของคุณถูกบันทึกเรียบร้อยแล้ว<br />
              คุณสามารถตรวจสอบสถานะและดูตั๋วเข้างานได้ที่หน้าโปรไฟล์ของคุณ
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-8 w-full max-w-[200px] rounded-xl bg-stone-900 px-4 py-3 text-sm font-semibold text-white hover:bg-stone-800"
            >
              กลับสู่หน้ากิจกรรม
            </button>
          </div>
        ) : (
          <>
            <div className="flex shrink-0 gap-1 border-b border-stone-200/60 px-2 py-3 sm:gap-2 sm:px-5">
              {steps.map((s, idx) => (
                <div key={s.id} className="flex flex-1 flex-col items-center justify-center gap-1 sm:flex-row sm:justify-start sm:gap-2">
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                      currentStepIndex === idx
                        ? "bg-red-800 text-white"
                        : currentStepIndex > idx
                          ? "bg-red-200 text-red-900"
                          : "bg-stone-200 text-stone-600"
                    }`}
                  >
                    {idx + 1}
                  </span>
                  <span className="text-center text-[10px] font-medium text-stone-600 sm:text-left sm:text-xs">
                    {s.label}
                  </span>
                </div>
              ))}
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5 sm:py-5">
              {currentStep.id === "info" ? (
                <>
                  <p className="rounded-lg bg-sky-100 px-3 py-2 text-sm text-sky-900">
                    {activity.price > 0 
                      ? "กรอกข้อมูลผู้เข้าร่วม ขั้นตอนถัดไปคือชำระเงินผ่าน PromptPay และอัปโหลดสลิป"
                      : activity.extra_questions && activity.extra_questions.length > 0 
                        ? "กรอกข้อมูลผู้เข้าร่วม ขั้นตอนถัดไปคือตอบคำถามเพิ่มเติม"
                        : "กรอกข้อมูลผู้เข้าร่วมให้ครบถ้วน จากนั้นกดยืนยันการลงทะเบียนได้เลย"}
                  </p>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <label className="block sm:col-span-1">
                      <span className="text-sm font-medium text-stone-700">
                        ชื่อ <span className="text-red-500">*</span>
                      </span>
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
                        <p className="mt-1 text-xs text-red-600">
                          {firstNameError}
                        </p>
                      )}
                    </label>
                    <label className="block sm:col-span-1">
                      <span className="text-sm font-medium text-stone-700">
                        นามสกุล <span className="text-red-500">*</span>
                      </span>
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
                    <label className="block sm:col-span-1">
                      <span className="text-sm font-medium text-stone-700">
                        ชื่อเล่น <span className="text-red-500">*</span>
                      </span>
                      <input
                        className="mt-1 w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-stone-900 outline-none ring-red-800/30 focus:ring-2"
                        value={nickname}
                        onChange={(e) => setNickname(e.target.value)}
                      />
                    </label>
                    <label className="block sm:col-span-1">
                      <span className="text-sm font-medium text-stone-700">
                        เบอร์โทร <span className="text-red-500">*</span>
                      </span>
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
                    <label className="block sm:col-span-2">
                      <span className="text-sm font-medium text-stone-700">
                        อีเมล <span className="text-red-500">*</span>
                      </span>
                      <input
                        className={`mt-1 w-full rounded-lg border px-3 py-2 text-stone-900 outline-none ring-red-800/30 focus:ring-2 ${
                          emailError
                            ? "border-red-400 bg-red-50"
                            : "border-stone-200 bg-white"
                        }`}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        type="email"
                      />
                      {emailError && (
                        <p className="mt-1 text-xs text-red-600">{emailError}</p>
                      )}
                    </label>
                    <label className="block sm:col-span-1">
                      <span className="text-sm font-medium text-stone-700">
                        เพศ <span className="text-red-500">*</span>
                      </span>
                      <select
                        className="mt-1 w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-stone-900 outline-none ring-red-800/30 focus:ring-2"
                        value={gender}
                        onChange={(e) => setGender(e.target.value)}
                      >
                        <option value="" disabled>
                          เลือกเพศ
                        </option>
                        <option value="Male">ชาย (Male)</option>
                        <option value="Female">หญิง (Female)</option>
                        <option value="LGBTQ+">เพศทางเลือก (LGBTQ+)</option>
                        <option value="Unspecified">ไม่ระบุ</option>
                      </select>
                    </label>
                    <label className="block sm:col-span-1">
                      <span className="text-sm font-medium text-stone-700">
                        ระดับชั้น
                      </span>
                      <input
                        className="mt-1 w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-stone-900 outline-none ring-red-800/30 focus:ring-2"
                        value={educationLevel}
                        onChange={(e) => setEducationLevel(e.target.value)}
                        placeholder="เช่น ม.4, ปี 1"
                      />
                    </label>
                    <label className="block sm:col-span-2">
                      <span className="text-sm font-medium text-stone-700">
                        สถาบันการศึกษา
                      </span>
                      <input
                        className="mt-1 w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-stone-900 outline-none ring-red-800/30 focus:ring-2"
                        value={institution}
                        onChange={(e) => setInstitution(e.target.value)}
                        placeholder="เช่น ชื่อโรงเรียน หรือ มหาวิทยาลัย"
                      />
                    </label>
                    <label className="block sm:col-span-2">
                      <span className="text-sm font-medium text-stone-700">
                        ที่อยู่
                      </span>
                      <textarea
                        className="mt-1 min-h-[80px] w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-stone-900 outline-none ring-red-800/30 focus:ring-2"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="รายละเอียดที่อยู่"
                      />
                    </label>
                  </div>
                </>
              ) : null}

              {currentStep.id === "payment" ? (
                <div className="space-y-4">
                  <p className="text-sm font-medium text-stone-800">
                    ชำระเงินผ่าน PromptPay (฿{activity.price})
                  </p>
                  <p className="text-sm text-stone-600">สแกน QR เพื่อโอน</p>
                  <div className="mx-auto flex h-44 w-44 items-center justify-center rounded-xl bg-white ring-1 ring-stone-200 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`https://promptpay.io/0623456789/${activity.price}.png`}
                      alt={`QR Code for ฿${activity.price}`}
                      className="h-full w-full object-contain p-2"
                    />
                  </div>
                  <p className="text-center text-xs text-stone-500">
                    PromptPay: 062-345-6789 (TCOS)
                  </p>
                  <div>
                    <span className="text-sm font-medium text-stone-700">
                      อัปโหลดสลิปการโอน <span className="text-red-500">*</span>
                    </span>
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
                          const extOk = ["png", "jpg", "jpeg"].includes(ext);
                          const typeOk = mime ? slipAllowedMime.has(mime) : extOk;
                          if (!typeOk) {
                            setSlip(null);
                            e.target.value = "";
                            setSlipError("ใช้ได้เฉพาะรูปภาพ PNG หรือ JPG");
                            return;
                          }
                          setSlipError(null);
                          setSlip(f);
                        }}
                      />
                      {slip ? (
                        <span className="font-medium text-stone-800">
                          {slip.name}
                        </span>
                      ) : (
                        <>
                          <span>คลิกหรือลากไฟล์สลิปมาวาง</span>
                          <span className="mt-1 text-xs">
                            PNG, JPG — ไม่เกิน 5MB
                          </span>
                        </>
                      )}
                    </label>
                  </div>
                  {slipError ? (
                    <p className="text-sm font-medium text-red-700">{slipError}</p>
                  ) : null}
                </div>
              ) : null}

              {currentStep.id === "questions" ? (
                <div className="space-y-4">
                  {activity.extra_questions.length === 0 ? (
                    <p className="text-sm text-stone-600">
                      ไม่มีคำถามเพิ่มเติมสำหรับกิจกรรมนี้
                    </p>
                  ) : (
                    activity.extra_questions.map((q) => (
                      <div key={q.question_id} className="block">
                        <span className="text-sm font-medium text-stone-800">
                          {q.question_text}
                          {q.is_required && <span className="text-red-500 ml-1">*</span>}
                        </span>
                        {q.type === "single_choice" && q.options ? (
                          <div className="mt-3 flex flex-col gap-2.5 pl-1">
                            {q.options.map((opt, idx) => (
                              <label key={idx} className="flex items-center gap-3 cursor-pointer group">
                                <input
                                  type="radio"
                                  name={q.question_id}
                                  value={opt}
                                  checked={extraAnswers[q.question_id] === opt}
                                  onChange={(e) => setAnswer(q.question_id, e.target.value)}
                                  className="h-4 w-4 border-stone-300 text-red-800 focus:ring-red-800/30"
                                />
                                <span className="text-sm text-stone-700 group-hover:text-stone-900">{opt}</span>
                              </label>
                            ))}
                          </div>
                        ) : (
                          <textarea
                            className="mt-2 min-h-[100px] w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 outline-none ring-red-800/30 focus:ring-2"
                            placeholder={q.placeholder ?? "กรอกคำตอบ..."}
                            value={extraAnswers[q.question_id] ?? ""}
                            onChange={(e) => setAnswer(q.question_id, e.target.value)}
                          />
                        )}
                      </div>
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
              {!isFirstStep ? (
                <button
                  type="button"
                  className="rounded-xl border border-stone-300 px-4 py-3 text-sm font-medium text-stone-800 hover:bg-stone-100"
                  onClick={() => setCurrentStepIndex((prev) => Math.max(0, prev - 1))}
                  disabled={submitting}
                >
                  ย้อนกลับ
                </button>
              ) : (
                <span />
              )}
              {!isLastStep ? (
                <button
                  type="button"
                  className="ml-auto min-w-[120px] rounded-xl bg-red-800 px-4 py-3 text-sm font-semibold text-white hover:bg-red-900 disabled:opacity-40"
                  disabled={
                    submitting ||
                    (currentStep.id === "info" && !canNextFrom1) ||
                    (currentStep.id === "payment" && !canNextFrom2)
                  }
                  onClick={() => setCurrentStepIndex((prev) => Math.min(steps.length - 1, prev + 1))}
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
                    : activity.price > 0
                      ? `ยืนยันการลงทะเบียน (฿${activity.price})`
                      : "ยืนยันการลงทะเบียน (ฟรี)"}
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export function ActivityRegisterSection({
  activity,
  isRegistered = false,
}: {
  activity: ActivityDetail;
  isRegistered?: boolean;
}) {
  const [open, setOpen] = useState(false);

  const isFull =
    activity.seat_capacity > 0 &&
    activity.enrolled_count >= activity.seat_capacity;
  const isClosed = !activity.is_registration_open;
  const isDisabled = isClosed || isFull || isRegistered;

  let buttonText = activity.price > 0 ? `ลงทะเบียนเข้าร่วม (฿${activity.price})` : "ลงทะเบียนเข้าร่วม (ฟรี)";
  if (isRegistered) {
    buttonText = "✅ ลงทะเบียนแล้ว";
  } else if (isClosed) {
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
            isRegistered
              ? "bg-emerald-100 text-emerald-800 cursor-default border border-emerald-200"
              : isDisabled
                ? "bg-stone-300 text-stone-500 cursor-not-allowed"
                : "bg-red-800 text-white hover:bg-red-900"
          }`}
        >
          {buttonText}
        </button>
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
