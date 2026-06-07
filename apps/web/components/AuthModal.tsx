"use client";

import React, { useState } from "react";
import { useAppState } from "../lib/context";

type SignupErrors = {
  firstName?: string;
  lastName?: string;
  nickname?: string;
  email?: string;
  phone?: string;
  gender?: string;
  password?: string;
  confirmPassword?: string;
};

function FieldLabel({
  children,
  required,
}: {
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label className="mb-1 block text-xs font-semibold tracking-wide text-zinc-400 uppercase">
      {children}
      {required && <span className="ml-0.5 text-gold">*</span>}
    </label>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="mt-1 flex items-center gap-1 text-[11px] font-medium text-red-400">
      <span>↑</span> {message}
    </p>
  );
}

const inputClass = (hasError: boolean) =>
  `w-full rounded border bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 outline-none transition-all duration-150 ${
    hasError
      ? "border-red-500/70 focus:border-red-400 focus:ring-1 focus:ring-red-400/20"
      : "border-zinc-700 focus:border-gold/60 focus:ring-1 focus:ring-gold/10"
  }`;

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  ) : (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  );
}

function PasswordInput({
  value,
  onChange,
  placeholder,
  hasError,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  hasError: boolean;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${inputClass(hasError)} pr-10`}
      />
      <button
        type="button"
        onClick={() => setShow(!show)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 transition-colors hover:text-gold"
        tabIndex={-1}
      >
        <EyeIcon open={show} />
      </button>
    </div>
  );
}

// ─── Button variants ──────────────────────────────────────────────
const btnPrimary =
  "w-full rounded bg-gold py-2.5 text-sm font-semibold text-background transition-all duration-150 hover:opacity-60 hover:cursor-pointer hover:border-gold active:scale-[0.985] disabled:opacity-40 disabled:cursor-not-allowed";

const btnSecondary =
  "w-full rounded border border-zinc-700 py-2.5 text-sm font-medium text-zinc-400 transition-all duration-150 hover:cursor-pointer hover:border-zinc-500 hover:text-zinc-200 active:scale-[0.985]";

// ─── Divider ──────────────────────────────────────────────────────
function Divider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-px flex-1 bg-zinc-800" />
      <span className="text-[11px] text-zinc-600">{label}</span>
      <div className="h-px flex-1 bg-zinc-800" />
    </div>
  );
}

export default function AuthModal() {
  const { activeModal, closeModals, login, signup } = useAppState();
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");

  React.useEffect(() => {
    if (activeModal === "login" || activeModal === "signup") {
      setAuthMode(activeModal);
    }
  }, [activeModal]);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState("");
  const [gradeLevel, setGradeLevel] = useState("");
  const [errors, setErrors] = useState<SignupErrors>({});
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (activeModal !== "login" && activeModal !== "signup") return null;

  const clearErr = (key: keyof SignupErrors) =>
    setErrors((prev) => ({ ...prev, [key]: undefined }));

  const handleDirectLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: SignupErrors = {};
    if (!email.trim()) newErrors.email = "กรุณากรอกอีเมล";
    if (!password) newErrors.password = "กรุณากรอกรหัสผ่าน";
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setError("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }
    setErrors({});
    setError("");
    setIsSubmitting(true);
    try {
      await login(email, password);
      resetState();
    } catch {
      setError("การเข้าสู่ระบบล้มเหลว กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: SignupErrors = {};
    if (!firstName.trim()) newErrors.firstName = "กรุณากรอกชื่อ";
    if (!lastName.trim()) newErrors.lastName = "กรุณากรอกนามสกุล";
    if (!nickname.trim()) newErrors.nickname = "กรุณากรอกชื่อเล่น";
    if (!phone.trim()) newErrors.phone = "กรุณากรอกเบอร์โทร";
    if (!email.trim()) newErrors.email = "กรุณากรอกอีเมล";
    if (!gender) newErrors.gender = "กรุณาเลือกเพศ";
    if (!password) newErrors.password = "กรุณากรอกรหัสผ่าน";
    else if (password.length < 6) newErrors.password = "อย่างน้อย 6 ตัวอักษร";
    if (!confirmPassword) newErrors.confirmPassword = "กรุณายืนยันรหัสผ่าน";
    else if (password !== confirmPassword) newErrors.confirmPassword = "รหัสผ่านไม่ตรงกัน";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setError("กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน");
      return;
    }
    setErrors({});
    setError("");
    setIsSubmitting(true);
    try {
      await signup({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        nickname: nickname.trim(),
        email: email.trim(),
        phone: phone.trim(),
        gender,
        password,
        gradeLevel: gradeLevel.trim() || undefined,
      });
      resetState();
    } catch {
      setError("เกิดข้อผิดพลาดในการสมัครสมาชิก");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetState = () => {
    setFirstName(""); setLastName(""); setNickname("");
    setEmail(""); setPhone(""); setGender(""); setGradeLevel("");
    setPassword(""); setConfirmPassword("");
    setErrors({}); setError("");
  };

  const switchMode = (mode: "login" | "signup") => {
    setAuthMode(mode);
    setErrors({});
    setError("");
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      onClick={() => { closeModals(); resetState(); }}
    >
      <div
        className={`relative w-full rounded-lg border border-zinc-800 bg-zinc-950 shadow-2xl shadow-black/60 ${
          authMode === "signup" ? "max-w-md" : "max-w-sm"
        }`}
        onClick={(e) => e.stopPropagation()}
      >

        {/* ── Header ── */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-gold">
              TCOS
            </p>
            <h2 className="mt-0.5 font-playfair text-xl font-bold text-zinc-100">
              {authMode === "login" ? "Sign In" : "Create Account"}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => { closeModals(); resetState(); }}
            className="flex h-8 w-8 items-center justify-center rounded text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ── Body ── */}
        <div className="max-h-[75vh] overflow-y-auto px-5 py-5">

          {/* Global error */}
          {error && (
            <div className="mb-4 flex items-start gap-2 rounded border border-red-500/20 bg-red-500/8 px-3 py-2.5 text-xs text-red-400">
              <span className="mt-0.5 shrink-0">⚠</span>
              <span>{error}</span>
            </div>
          )}

          {authMode === "login" ? (
            /* ──── LOGIN FORM ──── */
            <form onSubmit={handleDirectLogin} className="space-y-4">
              <div>
                <FieldLabel required>อีเมล</FieldLabel>
                <input
                  type="email"
                  placeholder="name@email.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); clearErr("email"); }}
                  className={inputClass(Boolean(errors.email))}
                />
                <FieldError message={errors.email} />
              </div>

              <div>
                <FieldLabel required>รหัสผ่าน</FieldLabel>
                <PasswordInput
                  value={password}
                  onChange={(v) => { setPassword(v); clearErr("password"); }}
                  placeholder="รหัสผ่าน"
                  hasError={Boolean(errors.password)}
                />
                <FieldError message={errors.password} />
              </div>

              <button type="submit" disabled={isSubmitting} className={btnPrimary}>
                {isSubmitting ? "กำลังเข้าสู่ระบบ..." : "Sign In"}
              </button>

              <Divider label="ยังไม่มีบัญชี?" />

              <button type="button" onClick={() => switchMode("signup")} className={btnSecondary}>
                Create Account
              </button>
            </form>
          ) : (
            /* ──── SIGNUP FORM ──── */
            <form onSubmit={handleSignup} className="space-y-4">

              {/* Name row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <FieldLabel required>ชื่อ</FieldLabel>
                  <input
                    type="text" placeholder="ชื่อ" value={firstName}
                    onChange={(e) => { setFirstName(e.target.value); clearErr("firstName"); }}
                    className={inputClass(Boolean(errors.firstName))}
                  />
                  <FieldError message={errors.firstName} />
                </div>
                <div>
                  <FieldLabel required>นามสกุล</FieldLabel>
                  <input
                    type="text" placeholder="นามสกุล" value={lastName}
                    onChange={(e) => { setLastName(e.target.value); clearErr("lastName"); }}
                    className={inputClass(Boolean(errors.lastName))}
                  />
                  <FieldError message={errors.lastName} />
                </div>
              </div>

              {/* Nickname + Phone row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <FieldLabel required>ชื่อเล่น</FieldLabel>
                  <input
                    type="text" placeholder="ชื่อเล่น" value={nickname}
                    onChange={(e) => { setNickname(e.target.value); clearErr("nickname"); }}
                    className={inputClass(Boolean(errors.nickname))}
                  />
                  <FieldError message={errors.nickname} />
                </div>
                <div>
                  <FieldLabel required>เบอร์โทร</FieldLabel>
                  <input
                    type="tel" placeholder="08X-XXX-XXXX" value={phone}
                    onChange={(e) => { setPhone(e.target.value); clearErr("phone"); }}
                    className={inputClass(Boolean(errors.phone))}
                  />
                  <FieldError message={errors.phone} />
                </div>
              </div>

              {/* Email */}
              <div>
                <FieldLabel required>อีเมล</FieldLabel>
                <input
                  type="email" placeholder="name@email.com" value={email}
                  onChange={(e) => { setEmail(e.target.value); clearErr("email"); }}
                  className={inputClass(Boolean(errors.email))}
                />
                <FieldError message={errors.email} />
              </div>

              {/* Gender + Grade row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <FieldLabel required>เพศ</FieldLabel>
                  <select
                    value={gender}
                    onChange={(e) => { setGender(e.target.value); clearErr("gender"); }}
                    className={inputClass(Boolean(errors.gender))}
                  >
                    <option value="">เลือกเพศ</option>
                    <option value="Male">ชาย</option>
                    <option value="Female">หญิง</option>
                    <option value="LGBTQ+">LGBTQ+</option>
                    <option value="Unspecified">ไม่ระบุ</option>
                  </select>
                  <FieldError message={errors.gender} />
                </div>
                <div>
                  <FieldLabel>ระดับชั้น</FieldLabel>
                  <input
                    type="text" placeholder="เช่น ม.4, ปี 1" value={gradeLevel}
                    onChange={(e) => setGradeLevel(e.target.value)}
                    className={inputClass(false)}
                  />
                </div>
              </div>

              {/* Password row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <FieldLabel required>รหัสผ่าน</FieldLabel>
                  <PasswordInput
                    value={password}
                    onChange={(v) => { setPassword(v); clearErr("password"); }}
                    placeholder="รหัสผ่าน"
                    hasError={Boolean(errors.password)}
                  />
                  <FieldError message={errors.password} />
                </div>
                <div>
                  <FieldLabel required>ยืนยันรหัสผ่าน</FieldLabel>
                  <PasswordInput
                    value={confirmPassword}
                    onChange={(v) => { setConfirmPassword(v); clearErr("confirmPassword"); }}
                    placeholder="ยืนยัน"
                    hasError={Boolean(errors.confirmPassword)}
                  />
                  <FieldError message={errors.confirmPassword} />
                </div>
              </div>

              <p className="text-center text-[11px] leading-relaxed text-zinc-600">
                รหัสผ่านนี้ใช้สร้าง QR Code เพื่อสแกนเข้างาน
              </p>

              <button type="submit" disabled={isSubmitting} className={btnPrimary}>
                {isSubmitting ? "กำลังสมัครสมาชิก..." : "Create Account"}
              </button>

              <Divider label="มีบัญชีอยู่แล้ว?" />

              <button type="button" onClick={() => switchMode("login")} className={btnSecondary}>
                Sign In
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}