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
    <label className="mb-1 block text-[11px] font-bold text-zinc-400 sm:mb-1.5 sm:text-xs">
      {children}
      {required && <span className="ml-0.5 text-red-400">*</span>}
    </label>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-[10px] font-bold text-red-500">{message}</p>;
}

const inputClass = (hasError: boolean) =>
  `w-full rounded-md border bg-zinc-950 px-2.5 py-1.5 text-xs text-zinc-200 outline-none transition-colors sm:rounded-lg sm:px-3 sm:py-2 sm:text-sm ${
    hasError
      ? "border-red-500 focus:border-red-500"
      : "border-muted-charcoal focus:border-primary-yellow/60"
  }`;

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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState("");
  const [gradeLevel, setGradeLevel] = useState("");
  const [errors, setErrors] = useState<SignupErrors>({});
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (activeModal !== "login" && activeModal !== "signup") return null;

  const handleDirectLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { email?: string; password?: string } = {};
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
      setError("การเข้าสู่ระบบล้มเหลว");
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
    if (!password) {
      newErrors.password = "กรุณากรอกรหัสผ่าน";
    } else if (password.length < 6) {
      newErrors.password = "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร";
    }
    if (!confirmPassword) {
      newErrors.confirmPassword = "กรุณายืนยันรหัสผ่าน";
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "รหัสผ่านไม่ตรงกัน";
    }

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
    setFirstName("");
    setLastName("");
    setNickname("");
    setEmail("");
    setPhone("");
    setGender("");
    setGradeLevel("");
    setPassword("");
    setConfirmPassword("");
    setErrors({});
    setShowPassword(false);
    setShowConfirmPassword(false);
    setError("");
  };

  const submitButtonClass =
    "w-full rounded-md border border-zinc-600 bg-zinc-800 py-2 text-xs font-bold text-zinc-100 shadow-lg transition-all hover:border-gold hover:text-gold active:scale-[0.99] disabled:opacity-50 sm:rounded-lg sm:py-2.5 sm:text-sm";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-base-black/80 p-3 backdrop-blur-md sm:p-4">
      <div
        className={`mx-auto w-full overflow-hidden rounded-xl border border-muted-charcoal/80 glass-panel-glow shadow-2xl sm:rounded-2xl ${
          authMode === "signup"
            ? "max-w-[min(100%,22rem)] sm:max-w-lg"
            : "max-w-[min(100%,20rem)] sm:max-w-md"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-2 border-b border-muted-charcoal/40 px-4 py-3 sm:px-6 sm:py-4">
          <div className="min-w-0 pr-2">
            <h3 className="font-taviraj text-base font-extrabold leading-tight tracking-wide text-primary-yellow sm:text-xl sm:tracking-wider">
              {authMode === "login"
                ? "เข้าสู่ระบบ TCOS Account"
                : "สร้างบัญชี TCOS Account"}
            </h3>
            <p
              className={`mt-0.5 text-[10px] text-zinc-400 sm:mt-1 sm:text-xs ${
                authMode === "signup" ? "font-kanit" : ""
              }`}
            >
              {authMode === "login"
                ? "เข้าสู่ระบบเพื่อดำเนินการต่อ"
                : "กรอกข้อมูลสมาชิกเพื่อเริ่มใช้งาน"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              closeModals();
              resetState();
            }}
            className="shrink-0 p-1 text-zinc-500 transition-colors hover:text-primary-yellow"
          >
            <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="max-h-[min(58vh,480px)] overflow-y-auto px-4 py-3 sm:max-h-[min(75vh,600px)] sm:p-6">
          {error && (
            <div
              className={`mb-3 rounded-md border border-red-500/30 bg-red-500/10 p-2 text-[11px] font-semibold text-red-400 sm:mb-4 sm:rounded-lg sm:p-3 sm:text-xs ${
                authMode === "signup" ? "font-kanit" : ""
              }`}
            >
              ⚠️ {error}
            </div>
          )}

          {authMode === "login" ? (
            <form onSubmit={handleDirectLogin} className="space-y-3 sm:space-y-4">
              <div>
                <FieldLabel required>อีเมล</FieldLabel>
                <input
                  type="email"
                  placeholder="name@gmail.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                  }}
                  className={inputClass(Boolean(errors.email))}
                />
                <FieldError message={errors.email} />
              </div>

              <div>
                <FieldLabel required>รหัสผ่าน</FieldLabel>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="รหัสผ่าน"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errors.password)
                        setErrors((prev) => ({ ...prev, password: undefined }));
                    }}
                    className={`${inputClass(Boolean(errors.password))} pr-9 sm:pr-10`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 transition-colors hover:text-primary-yellow sm:right-3"
                  >
                    {showPassword ? (
                      <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    ) : (
                      <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    )}
                  </button>
                </div>
                <FieldError message={errors.password} />
              </div>

              <button type="submit" disabled={isSubmitting} className={`${submitButtonClass} font-taviraj`}>
                {isSubmitting ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
              </button>

              <div className="pt-1 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode("signup");
                    setErrors({});
                    setError("");
                  }}
                  className="text-[11px] text-zinc-400 underline-offset-2 transition-colors hover:text-primary-yellow hover:underline sm:text-xs"
                >
                  ยังไม่มีบัญชีใช่หรือไม่? สมัครสมาชิก
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSignup} className="space-y-3 font-kanit sm:space-y-4">
              <div className="grid grid-cols-2 gap-x-2.5 gap-y-3 sm:gap-x-3 sm:gap-y-4">
                <div>
                  <FieldLabel required>ชื่อ</FieldLabel>
                  <input
                    type="text"
                    placeholder="ชื่อ"
                    value={firstName}
                    onChange={(e) => {
                      setFirstName(e.target.value);
                      if (errors.firstName)
                        setErrors((prev) => ({ ...prev, firstName: undefined }));
                    }}
                    className={inputClass(Boolean(errors.firstName))}
                  />
                  <FieldError message={errors.firstName} />
                </div>

                <div>
                  <FieldLabel required>นามสกุล</FieldLabel>
                  <input
                    type="text"
                    placeholder="นามสกุล"
                    value={lastName}
                    onChange={(e) => {
                      setLastName(e.target.value);
                      if (errors.lastName)
                        setErrors((prev) => ({ ...prev, lastName: undefined }));
                    }}
                    className={inputClass(Boolean(errors.lastName))}
                  />
                  <FieldError message={errors.lastName} />
                </div>

                <div>
                  <FieldLabel required>ชื่อเล่น</FieldLabel>
                  <input
                    type="text"
                    placeholder="ชื่อเล่น"
                    value={nickname}
                    onChange={(e) => {
                      setNickname(e.target.value);
                      if (errors.nickname)
                        setErrors((prev) => ({ ...prev, nickname: undefined }));
                    }}
                    className={inputClass(Boolean(errors.nickname))}
                  />
                  <FieldError message={errors.nickname} />
                </div>

                <div>
                  <FieldLabel required>เบอร์โทร</FieldLabel>
                  <input
                    type="tel"
                    placeholder="08X-XXX-XXXX"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      if (errors.phone)
                        setErrors((prev) => ({ ...prev, phone: undefined }));
                    }}
                    className={inputClass(Boolean(errors.phone))}
                  />
                  <FieldError message={errors.phone} />
                </div>

                <div className="col-span-2">
                  <FieldLabel required>อีเมล</FieldLabel>
                  <input
                    type="email"
                    placeholder="name@gmail.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                    }}
                    className={inputClass(Boolean(errors.email))}
                  />
                  <FieldError message={errors.email} />
                </div>

                <div className="col-span-2 grid grid-cols-2 gap-x-2.5 gap-y-1 sm:gap-x-3">
                  <div>
                    <FieldLabel required>รหัสผ่าน</FieldLabel>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="รหัสผ่าน"
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          if (errors.password)
                            setErrors((prev) => ({ ...prev, password: undefined }));
                        }}
                        className={`${inputClass(Boolean(errors.password))} pr-9 sm:pr-10`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 transition-colors hover:text-primary-yellow sm:right-3"
                      >
                        {showPassword ? (
                          <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        ) : (
                          <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                          </svg>
                        )}
                      </button>
                    </div>
                    <FieldError message={errors.password} />
                  </div>

                  <div>
                    <FieldLabel required>ยืนยันรหัสผ่าน</FieldLabel>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="ยืนยันรหัสผ่าน"
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value);
                          if (errors.confirmPassword)
                            setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                        }}
                        className={`${inputClass(Boolean(errors.confirmPassword))} pr-9 sm:pr-10`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 transition-colors hover:text-primary-yellow sm:right-3"
                      >
                        {showConfirmPassword ? (
                          <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        ) : (
                          <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                          </svg>
                        )}
                      </button>
                    </div>
                    <FieldError message={errors.confirmPassword} />
                  </div>

                  <p className="col-span-2 px-1 text-center text-[10px] leading-snug text-zinc-500 sm:text-[11px]">
                    รหัสผ่านนี้ใช้เพื่อสร้างเป็น QR Code เพื่อแสกนเข้างาน
                  </p>

                  <div>
                    <FieldLabel required>เพศ</FieldLabel>
                    <select
                      value={gender}
                      onChange={(e) => {
                        setGender(e.target.value);
                        if (errors.gender)
                          setErrors((prev) => ({ ...prev, gender: undefined }));
                      }}
                      className={inputClass(Boolean(errors.gender))}
                    >
                      <option value="">เลือกเพศ</option>
                      <option value="ชาย">ชาย</option>
                      <option value="หญิง">หญิง</option>
                      <option value="ไม่ระบุ">ไม่ระบุ</option>
                    </select>
                    <FieldError message={errors.gender} />
                  </div>

                  <div>
                    <FieldLabel>ระดับชั้น</FieldLabel>
                    <input
                      type="text"
                      placeholder="เช่น ม.4, ปี 1"
                      value={gradeLevel}
                      onChange={(e) => setGradeLevel(e.target.value)}
                      className={inputClass(false)}
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className={`${submitButtonClass} font-taviraj`}
              >
                {isSubmitting ? "กำลังสมัครสมาชิก..." : "สมัครสมาชิก"}
              </button>

              <div className="pt-1 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode("login");
                    setErrors({});
                    setError("");
                  }}
                  className="text-[11px] text-zinc-400 underline-offset-2 transition-colors hover:text-primary-yellow hover:underline sm:text-xs"
                >
                  มีบัญชีอยู่แล้ว? เข้าสู่ระบบ
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
