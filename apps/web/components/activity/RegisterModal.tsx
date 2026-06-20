"use client";

import { act, useEffect, useId, useState } from "react";
import type { ActivityDetail } from "@enroll-website/types";
import { postActivityRegistration, postPaymentSlip } from "@/lib/activity-api";
import { useAppState } from "@/lib/context";

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

function validatePassword(pw: string): string | null {
  if (!pw) return "กรุณากรอกรหัสผ่าน";
  if (pw.length < 8) return "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร";
  return null;
}

function validateConfirmPassword(pw: string, cpw: string): string | null {
  if (!cpw) return "กรุณายืนยันรหัสผ่าน";
  if (pw !== cpw) return "รหัสผ่านไม่ตรงกัน";
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
  initialStep,
  existingRegistrationId,
}: {
  activity: ActivityDetail;
  onClose: () => void;
  initialStep?: StepId;
  existingRegistrationId?: string;
}) {
  const titleId = useId();
  const { user, openAccountModal, openLoginModal, loginWithToken, refreshRegistrations } = useAppState();
  
  const steps: StepConfig[] = [{ id: "info", label: "ข้อมูล" }];
  if (activity.extra_questions && activity.extra_questions.length > 0) {
    steps.push({ id: "questions", label: "คำถาม" });
  }
  if (activity.price > 0) {
    steps.push({ id: "payment", label: "ชำระเงิน" });
  }

  const defaultStepIndex = initialStep ? Math.max(0, steps.findIndex(s => s.id === initialStep)) : 0;
  const [currentStepIndex, setCurrentStepIndex] = useState(defaultStepIndex);
  const [isSuccess, setIsSuccess] = useState(false);
  const currentStep = steps[currentStepIndex];
  const isFirstStep = currentStepIndex === 0 || (existingRegistrationId && currentStep.id === "payment");
  const isLastStep = currentStepIndex === steps.length - 1;
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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
  const passwordError = password.length > 0 ? validatePassword(password) : null;
  const confirmPasswordError = confirmPassword.length > 0 ? validateConfirmPassword(password, confirmPassword) : null;

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

  const canNextFrom1 = user
    ? true
    : !validateFirstName(firstName) &&
      !validateLastName(lastName) &&
      !validatePhone(phone) &&
      nickname.trim().length > 0 &&
      !validateEmail(email) &&
      !validatePassword(password) &&
      !validateConfirmPassword(password, confirmPassword) &&
      gender !== "";
  const canNextFrom2 = slip !== null;

  const setAnswer = (id: string, value: string) => {
    setExtraAnswers((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setFeedback(null);
    
    if (existingRegistrationId) {
      if (!slip) {
        setSlipError("กรุณาอัปโหลดสลิป");
        setSubmitting(false);
        return;
      }
      const res = await postPaymentSlip(existingRegistrationId, slip);
      setSubmitting(false);
      if (res.ok) {
        setIsSuccess(true);
      } else {
        setFeedback({
          message: res.message ?? "เกิดข้อผิดพลาด",
          variant: "error",
        });
      }
      return;
    }

    const custom_answers = Object.entries(extraAnswers).map(([k, v]) => ({
      question_id: k,
      answer: v,
    }));
    
    const newUserPayload = user ? undefined : {
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      nickname: nickname.trim(),
      phone: phone.trim(),
      email: email.trim(),
      password: password,
      gender: gender || "Unspecified",
      education_level: educationLevel.trim() || undefined,
      institution: institution.trim() || undefined,
      address: address.trim() || undefined,
    };

    const res = await postActivityRegistration(
      activity._id,
      {
        activity_id: activity._id,
        custom_answers,
        new_user: newUserPayload,
      },
      slip,
    );
    setSubmitting(false);
    if (res.ok) {
      if (res.access_token && !user) {
        let subId = "temp-id";
        try {
          const payload = JSON.parse(atob(res.access_token.split('.')[1]));
          subId = payload.sub || subId;
        } catch(e) {}
        
        loginWithToken({
          id: subId,
          name: `${firstName.trim()} ${lastName.trim()}`,
          email: email.trim(),
          phone: phone.trim(),
          preferences: [],
        }, res.access_token);
      } else if (user) {
        refreshRegistrations();
      }
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
      className="fixed inset-0 z-50 flex items-center-safe justify-center bg-black/75 p-0 sm:items-center sm:p-"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !submitting) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="flex h-[92vh] max-h-screen w-full max-w-lg flex-col overflow-hidden rounded-md bg-zinc-950 shadow-2xl backdrop-blur-sm border border-zinc-800"
      >
        <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3 sm:px-5">
          <h2 id={titleId} className="text-2xl font-sans font-bold text-foreground">
            Register Activity
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting && !isSuccess}
            className="rounded-xs p-2 text-stone-500 disabled:pointer-events-none disabled:opacity-60 transition-opacity hover:cursor-pointer"
            aria-label="ปิด"
          >
            ✕
          </button>
        </div>

        {isSuccess ? (
          <div className="flex flex-1 flex-col items-center justify-center p-8 text-center min-h-87.5">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green text-background">
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-sans font-bold text-green mb-5">Activity Registered</h3>
            <p className="mt-3 text-md text-foreground font-prompt">
              ข้อมูลของคุณถูกบันทึกเรียบร้อยแล้ว<br />
              คุณสามารถตรวจสอบรายละเอียดการลงทะเบียนได้ที่หน้าโปรไฟล์ของคุณ
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-8 w-full max-w-30 rounded-xs bg-gold px-4 py-3 text-sm font-semibold text-background hover:opacity-60 transition-opacity hover:cursor-pointer"
            >
              Close
            </button>
          </div>
        ) : (
          <>
            <div className="flex shrink-0 gap-1 border-b border-zinc-800 px-2 py-3 sm:gap-2 sm:px-5">
              {steps.map((s, idx) => (
                <div key={s.id} className="flex flex-1 flex-col items-center justify-center gap-1 sm:flex-row sm:justify-start sm:gap-2">
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                      currentStepIndex === idx
                        ? "bg-gold text-background"
                        : currentStepIndex > idx
                          ? "bg-card text-gold border border-gold"
                          : "bg-card text-foreground"
                    }`}
                  >
                    {idx + 1}
                  </span>
                  <span className="text-center text-[10px] font-medium font-prompt text-foreground sm:text-left sm:text-xs">
                    {s.label}
                  </span>
                </div>
              ))}
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5 sm:py-5">
              {currentStep.id === "info" ? (
                user ? (
                  <div className="relative flex flex-col items-center justify-center p-6 sm:p-8 min-h-[400px] overflow-hidden">
                    {/* Background Glow */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#d8b85a]/20 blur-[80px] rounded-full pointer-events-none" />
                    
                    <div className="relative z-10 flex flex-col items-center w-full max-w-sm rounded-3xl bg-zinc-900/60 p-8 shadow-[0_8px_30px_rgb(0,0,0,0.06)] backdrop-blur-xl border border-white/60">
                      
                      {/* Avatar with rings */}
                      <div className="relative mb-6">
                        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#d8b85a] to-[#f4f0ea] animate-pulse blur-md opacity-60"></div>
                        <div className="relative h-24 w-24 rounded-full bg-stone-100 overflow-hidden ring-4 ring-white shadow-xl flex items-center justify-center text-4xl font-sans font-black text-[#d8b85a]">
                          {user.avatarUrl ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                          ) : (
                            user.name.charAt(0).toUpperCase()
                          )}
                        </div>
                        {/* Verified Badge */}
                        <div className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-[#1b1b19] text-background ring-4 ring-white shadow-md">
                          <svg className="h-4 w-4 text-[#d8b85a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      </div>

                      <h3 className="font-prompt text-2xl font-black text-gold tracking-tight">{user.name}</h3>
                      <p className="text-sm font-medium text-foreground mt-1">{user.email}</p>

                      <div className="mt-8 w-full border-t border-zinc-700 focus:border-gold/60 /60 pt-6 text-center">
                        <p className="mt-2 text-md font-prompt text-foreground leading-relaxed">
                          ระบบพบข้อมูลโปรไฟล์ของคุณแล้ว<br/>กด <strong className="text-gold">&quot;Next&quot;</strong> เพื่อดำเนินการต่อได้เลย
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                <>
                  <p className="rounded-xs bg-sky-100 px-3 py-2 text-sm text-sky-900">
                    {activity.extra_questions && activity.extra_questions.length > 0
                      ? "กรอกข้อมูลผู้เข้าร่วม ขั้นตอนถัดไปคือตอบคำถามเพิ่มเติม"
                      : activity.price > 0 
                        ? "กรอกข้อมูลผู้เข้าร่วม ขั้นตอนถัดไปคือชำระเงินผ่าน PromptPay และอัปโหลดสลิป"
                        : "กรอกข้อมูลผู้เข้าร่วมให้ครบถ้วน จากนั้นกดยืนยันการลงทะเบียนได้เลย"}
                  </p>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <label className="block sm:col-span-1">
                      <span className="text-sm font-medium text-zinc-400 font-prompt">
                        ชื่อ <span className="text-red-300">*</span>
                      </span>
                      <input
                        className={`mt-1 w-full rounded-xs border font-prompt px-3 py-2 text-foreground outline-none ring-red-800/30 focus:ring-2 ${
                          firstNameError
                            ? "border-red-300 bg-red-900"
                            : "border-zinc-700 focus:border-gold/60  bg-zinc-900"
                        }`}
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        autoComplete="given-name"
                      />
                      {firstNameError && (
                        <p className="mt-1 text-xs text-red-400 font-prompt">
                          {firstNameError}
                        </p>
                      )}
                    </label>
                    <label className="block sm:col-span-1">
                      <span className="text-sm font-medium text-zinc-400 font-prompt">
                        นามสกุล <span className="text-red-300">*</span>
                      </span>
                      <input
                        className={`mt-1 w-full rounded-xs border font-prompt px-3 py-2 text-foreground outline-none ring-red-800/30 focus:ring-2 ${
                          lastNameError
                            ? "border-red-400 bg-red-900"
                            : "border-zinc-700 focus:border-gold/60  bg-zinc-900"
                        }`}
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        autoComplete="family-name"
                      />
                      {lastNameError && (
                        <p className="mt-1 text-xs text-red-400 font-prompt">{lastNameError}</p>
                      )}
                    </label>
                    <label className="block sm:col-span-1">
                      <span className="text-sm font-medium text-zinc-400 font-prompt">
                        ชื่อเล่น <span className="text-red-300">*</span>
                      </span>
                      <input
                        className="mt-1 w-full rounded-xs border font-prompt border-zinc-700 focus:border-gold/60  bg-zinc-900 px-3 py-2 text-foreground outline-none ring-red-800/30 focus:ring-2"
                        value={nickname}
                        onChange={(e) => setNickname(e.target.value)}
                      />
                    </label>
                    <label className="block sm:col-span-1">
                      <span className="text-sm font-medium text-zinc-400 font-prompt">
                        เบอร์โทร <span className="text-red-300">*</span>
                      </span>
                      <input
                        className={`mt-1 w-full rounded-xs border font-prompt px-3 py-2 text-foreground outline-none ring-red-800/30 focus:ring-2 ${
                          phoneError
                            ? "border-red-400 bg-red-900"
                            : "border-zinc-700 focus:border-gold/60  bg-zinc-900"
                        }`}
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        inputMode="tel"
                        autoComplete="tel"
                      />
                      {phoneError && (
                        <p className="mt-1 text-xs text-red-400 font-prompt">{phoneError}</p>
                      )}
                    </label>
                    <label className="block sm:col-span-2">
                      <span className="text-sm font-medium text-zinc-400 font-prompt">
                        อีเมล <span className="text-red-300">*</span>
                      </span>
                      <input
                        className={`mt-1 w-full rounded-xs border font-prompt px-3 py-2 text-foreground outline-none ring-red-800/30 focus:ring-2 ${
                          emailError
                            ? "border-red-400 bg-red-900"
                            : "border-zinc-700 focus:border-gold/60  bg-zinc-900"
                        }`}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        type="email"
                      />
                      {emailError && (
                        <p className="mt-1 text-xs text-red-400 font-prompt">{emailError}</p>
                      )}
                    </label>
                    <label className="block sm:col-span-1">
                      <span className="text-sm font-medium text-zinc-400 font-prompt">
                        รหัสผ่าน <span className="text-red-300">*</span>
                      </span>
                      <input
                        className={`mt-1 w-full rounded-xs border font-prompt px-3 py-2 text-foreground outline-none ring-red-800/30 focus:ring-2 ${
                          passwordError
                            ? "border-red-400 bg-red-900"
                            : "border-zinc-700 focus:border-gold/60  bg-zinc-900"
                        }`}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        type="password"
                        placeholder="อย่างน้อย 8 ตัวอักษร"
                      />
                      {passwordError && (
                        <p className="mt-1 text-xs text-red-400 font-prompt">{passwordError}</p>
                      )}
                    </label>
                    <label className="block sm:col-span-1">
                      <span className="text-sm font-medium text-zinc-400 font-prompt">
                        ยืนยันรหัสผ่าน <span className="text-red-300">*</span>
                      </span>
                      <input
                        className={`mt-1 w-full rounded-xs border font-prompt px-3 py-2 text-foreground outline-none ring-red-800/30 focus:ring-2 ${
                          confirmPasswordError
                            ? "border-red-400 bg-red-900"
                            : "border-zinc-700 focus:border-gold/60  bg-zinc-900"
                        }`}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        type="password"
                        placeholder="พิมพ์รหัสผ่านอีกครั้ง"
                      />
                      {confirmPasswordError && (
                        <p className="mt-1 text-xs text-red-400 font-prompt">{confirmPasswordError}</p>
                      )}
                    </label>
                    <label className="block sm:col-span-1">
                      <span className="text-sm font-medium text-zinc-400 font-prompt">
                        เพศ <span className="text-red-300">*</span>
                      </span>
                      <select
                        className="mt-1 w-full rounded-xs border font-prompt border-zinc-700 focus:border-gold/60  bg-zinc-900 px-3 py-2 text-foreground outline-none ring-red-800/30 focus:ring-2"
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
                      <span className="text-sm font-medium text-zinc-400 font-prompt">
                        ระดับชั้น
                      </span>
                      <input
                        className="mt-1 w-full rounded-xs border font-prompt border-zinc-700 focus:border-gold/60  bg-zinc-900 px-3 py-2 text-foreground outline-none ring-red-800/30 focus:ring-2"
                        value={educationLevel}
                        onChange={(e) => setEducationLevel(e.target.value)}
                        placeholder="เช่น ม.4, ปี 1"
                      />
                    </label>
                    <label className="block sm:col-span-2">
                      <span className="text-sm font-medium text-zinc-400 font-prompt">
                        สถาบันการศึกษา
                      </span>
                      <input
                        className="mt-1 w-full rounded-xs border font-prompt border-zinc-700 focus:border-gold/60  bg-zinc-900 px-3 py-2 text-foreground outline-none ring-red-800/30 focus:ring-2"
                        value={institution}
                        onChange={(e) => setInstitution(e.target.value)}
                        placeholder="เช่น ชื่อโรงเรียน หรือ มหาวิทยาลัย"
                      />
                    </label>
                    <label className="block sm:col-span-2">
                      <span className="text-sm font-medium text-zinc-400 font-prompt">
                        ที่อยู่
                      </span>
                      <textarea
                        className="mt-1 min-h-[80px] w-full rounded-xs border border-zinc-700 focus:border-gold/60 font-prompt  bg-zinc-900 px-3 py-2 text-foreground outline-none ring-red-800/30 focus:ring-2"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="รายละเอียดที่อยู่"
                      />
                    </label>
                  </div>
                </>
                )
              ) : null}

              {currentStep.id === "payment" ? (
                <div className="space-y-4">
                  <p className="text-sm font-medium font-prompt text-foreground">
                    ชำระเงินผ่าน PromptPay <span className="text-gold">(฿{activity.price})</span>
                  </p>
                  <div className="mx-auto flex h-44 w-44 items-center justify-center rounded-xl bg-white ring-1 ring-stone-200 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`https://promptpay.io/${process.env.NEXT_PUBLIC_PROMPTPAY_NUMBER || "0623456789"}/${activity.price}.png`}
                      alt={`QR Code for ฿${activity.price}`}
                      className="h-full w-full object-contain p-2"
                    />
                  </div>
                  <p className="text-center text-xs text-stone-300 mb-1">
                    PromptPay: {process.env.NEXT_PUBLIC_PROMPTPAY_NUMBER || "062-345-6789"}
                  </p>
                  <p className="text-center text-xs text-stone-300">
                    {process.env.NEXT_PUBLIC_PROMPTPAY_NAME || "somename"}
                  </p>
                  <div>
                    <span className="text-sm font-semibold font-prompt text-zinc-300">
                      อัปโหลดสลิปการโอน <span className="text-red-300">*</span>
                    </span>
                    <label className="mt-2 flex cursor-pointer flex-col items-center justify-center rounded-xs border border-dashed border-stone-500 bg-zinc-900 px-4 py-8 text-center text-sm text-stone-500 transition hover:border-red-400 hover:bg-red-900/30">
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
                        <span className="font-medium font-prompt text-stone-800">
                          {slip.name}
                        </span>
                      ) : (
                        <>
                          <span className="font-prompt" >คลิกหรือลากไฟล์สลิปมาวาง</span>
                          <span className="mt-1 text-xs font-prompt">
                            PNG, JPG — ไม่เกิน 5MB
                          </span>
                        </>
                      )}
                    </label>
                  </div>
                  {slipError ? (
                    <p className="text-sm font-medium text-red-400">{slipError}</p>
                  ) : null}
                </div>
              ) : null}

              {currentStep.id === "questions" ? (
                <div className="space-y-4">
                  {activity.extra_questions.length === 0 ? (
                    <p className="text-sm text-foreground">
                      ไม่มีคำถามเพิ่มเติมสำหรับกิจกรรมนี้
                    </p>
                  ) : (
                    activity.extra_questions.map((q) => (
                      <div key={q.question_id} className="block">
                        <span className="text-sm font-medium font-prompt text-foreground">
                          {q.question_text}
                          {q.is_required && <span className="text-red-300 ml-1">*</span>}
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
                                <span className="text-sm font-prompt text-zinc-300 group-hover:text-zinc-400">{opt}</span>
                              </label>
                            ))}
                          </div>
                        ) : (
                          <textarea
                            className="mt-2 min-h-[100px] w-full font-prompt rounded-xs border border-zinc-700 focus:border-gold/60  bg-zinc-900 px-3 py-2 text-sm text-foreground outline-none ring-red-800/30 focus:ring-2"
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
                <div
                  className={`mt-4 rounded-xs px-3 py-2 text-sm flex flex-col gap-2 ${
                    feedback.variant === "success"
                      ? "border border-green"
                      : "border border-red-400"
                  }`}
                >
                  <p>{feedback.message}</p>
                  {feedback.message.includes("เข้าสู่ระบบ") && (
                    <button 
                      type="button"
                      onClick={() => {
                        onClose();
                        openLoginModal();
                      }}
                      className="mt-1 self-start rounded-md bg-gold px-4 py-2 text-xs font-bold text-background shadow-sm hover:opacity-60 transition-opacity"
                    >
                      เข้าสู่ระบบทันที
                    </button>
                  )}
                </div>
              ) : null}

              <div className="flex shrink-0 gap-2 mt-5">
              {!isFirstStep ? (
                <button
                  type="button"
                  className="rounded-xs border border-zinc-500 px-4 py-2.5 text-sm font-medium text-zinc-500 hover:border-zinc-200 hover:cursor-pointer"
                  onClick={() => setCurrentStepIndex((prev) => Math.max(0, prev - 1))}
                  disabled={submitting}
                >
                  Previous
                </button>
              ) : (
                <span />
              )}
              {!isLastStep ? (
                <button
                  type="button"
                  className="ml-auto min-w-[120px] rounded-xs bg-gold px-4 py-2.5 text-sm font-semibold text-background hover:opacity-60 transition-opacity hover:cursor-pointer"
                  disabled={
                    submitting ||
                    (currentStep.id === "info" && !canNextFrom1)
                  }
                  onClick={() => {
                    if (currentStep.id === "payment") {
                      if (!slip) {
                        setSlipError("กรุณาอัปโหลดสลิปที่ถูกต้องก่อนดำเนินการต่อ");
                        return;
                      }
                      if (slipError) return;
                    }
                    setCurrentStepIndex((prev) => Math.min(steps.length - 1, prev + 1));
                  }}
                >
                  Next
                </button>
              ) : (
                <button
                  type="button"
                  className="ml-auto min-w-[160px] rounded-xs bg-gold px-4 py-2.5 text-sm font-semibold text-background hover:opacity-60 transition-opacity hover:cursor-pointer disabled:opacity-60 transition-opacity"
                  disabled={submitting}
                  onClick={handleSubmit}
                >
                  {submitting
                    ? "Registering..."
                    : activity.price > 0
                      ? `Register (฿${activity.price})`
                      : "Register (FREE)"}
                </button>
              )}
            </div>
            </div>

            
          </>
        )}
      </div>
    </div>
  );
}

export function ActivityRegisterSection({
  activity,
}: {
  activity: ActivityDetail;
}) {
  const [open, setOpen] = useState(false);
  const { registrations } = useAppState();
  
  const registration = registrations.find(r => r.activityId === activity._id || r.activityId === (activity as any).id);
  const isRegistered = !!registration;
  const isPendingPayment = isRegistered && registration.paymentStatus === 'pending';

  const isFull =
    activity.seat_capacity > 0 &&
    activity.enrolled_count >= activity.seat_capacity;
  const isNotStarted = new Date(activity.open_registration_at?? "2026-01-01T00:00:00") > new Date();
  const isEnded = new Date(activity.close_registration_at?? "2099-12-31T00:00:00") < new Date(); 
  let isDisabled = isRegistered;

  let buttonText;
  if (isRegistered) { buttonText = "Registered ✓"; } 
  else if (activity.registration_open_override === false) { 
    buttonText = "Registration Closed ⤬";
    isDisabled = true;
  }
  else if (activity.registration_open_override === true) { buttonText = activity.price > 0 ? `Register (฿${activity.price})` : "Register (FREE)"; }
  else {
    if (isFull) { buttonText = "Seats Full ⤬"; }
    else if (isEnded) { buttonText = "Registration Ended ⤬"; } 
    else if (isNotStarted) { buttonText = "Registration Opens Soon ..."; }
    else { buttonText = activity.price > 0 ? `Register (฿${activity.price})` : "Register (FREE)"; }
    isDisabled = isFull || isEnded || isNotStarted;
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
          className={`w-full rounded-md py-3.5 text-center font-bold shadow-sm transition sm:text-lg ${
            //isPendingPayment
              //</div>? "bg-primary-yellow text-base-black hover:bg-yellow-500"
              isRegistered ? "bg-green text-background cursor-default"
            : isNotStarted ? "bg-zinc-700 text-foreground cursor-not-allowed" 
            : isDisabled ? "bg-red-300 text-background cursor-not-allowed"
            : "bg-gold text-background hover:cursor-pointer hover:opacity-60 transition-opacity"
          }`}
        >
          {buttonText}
        </button>
      </div>
      {open && (!isDisabled || isPendingPayment) ? (
        <RegisterModal
          key={activity._id}
          activity={activity}
          onClose={() => setOpen(false)}
          initialStep={isPendingPayment ? "payment" : "info"}
          existingRegistrationId={isPendingPayment ? registration.id : undefined}
        />
      ) : null}
    </>
  );
}
