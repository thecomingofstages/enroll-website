"use client";

import React, { useState } from "react";
import { useAppState } from "../lib/context";

export default function AuthModal() {
  const { activeModal, closeModals, login, requestOTP, verifyOTP } = useAppState();
  
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  
  React.useEffect(() => {
    if (activeModal === "login" || activeModal === "signup") {
      setAuthMode(activeModal);
    }
  }, [activeModal]);

  const [step, setStep] = useState<"info" | "otp">("info");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState("");
  const [errors, setErrors] = useState<{name?: string; email?: string; password?: string; phone?: string}>({});
  const [otpCode, setOtpCode] = useState("");
  const [simulatedOTP, setSimulatedOTP] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (activeModal !== "login" && activeModal !== "signup") return null;

  const preferencesList = [
    { value: "Technology", label: "💻 เทคโนโลยี & เว็บแคมวาส" },
    { value: "Music", label: "🎵 ดนตรี & คอนเสิร์ต" },
    { value: "Art", label: "🎨 ศิลปะ & งานฝีมือ" },
    { value: "Workshop", label: "🛠️ เวิร์กช็อปฝึกทักษะ" },
    { value: "Seminar", label: "🎤 สัมมนาวิชาการ" }
  ];

  const handleTogglePref = (pref: string) => {
    setSelectedPrefs(prev =>
      prev.includes(pref) ? prev.filter(p => p !== pref) : [...prev, pref]
    );
  };

  const handleDirectLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: {email?: string; password?: string} = {};
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
      // Mockup direct login success
      await login(email.split('@')[0] || "User", email, "08X-XXX-XXXX", []);
      resetState();
    } catch (err) {
      setError("การเข้าสู่ระบบล้มเหลว");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors: {name?: string; email?: string; password?: string; phone?: string} = {};
    if (!name.trim()) newErrors.name = "กรุณากรอกชื่อ-นามสกุล";
    if (!email.trim()) newErrors.email = "กรุณากรอกอีเมล";
    if (!password) newErrors.password = "กรุณากรอกรหัสผ่าน";
    if (!phone.trim()) newErrors.phone = "กรุณากรอกเบอร์โทรศัพท์";
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setError("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }
    
    setErrors({});
    setError("");
    setIsSubmitting(true);
    try {
      // Mockup direct signup since backend isn't ready
      await login(name, email, phone, []);
      resetState();
    } catch (err) {
      setError("เกิดข้อผิดพลาดในการสมัครสมาชิก");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyAndLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length !== 6) {
      setError("กรุณากรอกรหัส OTP 6 หลัก");
      return;
    }
    setError("");
    setIsSubmitting(true);
    try {
      const isValid = await verifyOTP(phone, otpCode);
      if (isValid) {
        await login(name, email, phone, selectedPrefs);
        resetState();
      } else {
        setError("รหัส OTP ไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง");
      }
    } catch (err) {
      setError("การยืนยันรหัส OTP ล้มเหลว");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetState = () => {
    setStep("info");
    setName("");
    setEmail("");
    setPhone("");
    setSelectedPrefs([]);
    setOtpCode("");
    setSimulatedOTP("");
    setPassword("");
    setErrors({});
    setShowPassword(false);
    setError("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-base-black/80 backdrop-blur-md">
      <div 
        className="w-full max-w-md rounded-2xl glass-panel-glow border border-muted-charcoal/80 overflow-hidden shadow-2xl transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Modal Header */}
        <div className="relative border-b border-muted-charcoal/40 px-6 py-5 flex items-center justify-between">
          <div>
            <h3 className="font-playfair text-xl font-extrabold text-primary-yellow tracking-wider">
              {step === "info" ? (authMode === "login" ? "เข้าสู่ระบบ TCOS Account" : "สร้างบัญชี TCOS Account") : "ยืนยันรหัส OTP"}
            </h3>
            <p className="text-xs text-zinc-400 mt-1">
              {step === "info" 
                ? (authMode === "login" ? "เข้าสู่ระบบเพื่อดำเนินการต่อ" : "เพื่อบันทึกประวัติและสะสมชั่วโมงกิจกรรมของคุณ")
                : `รหัส OTP ถูกส่งไปยังเบอร์ ${phone}`}
            </p>
          </div>
          <button 
            onClick={() => { closeModals(); resetState(); }}
            className="text-zinc-500 hover:text-primary-yellow transition-colors p-1"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Body / Forms */}
        <div className="p-6">
          {error && (
            <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-xs font-semibold text-red-400">
              ⚠️ {error}
            </div>
          )}

          {step === "info" ? (
            authMode === "login" ? (
              <form onSubmit={handleDirectLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">อีเมล</label>
                  <input
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errors.email) setErrors(prev => ({ ...prev, email: undefined }));
                    }}
                    className={`w-full rounded-lg bg-zinc-950 border px-3 py-2 text-sm text-zinc-200 outline-none transition-colors ${
                      errors.email ? "border-red-500 focus:border-red-500" : "border-muted-charcoal focus:border-primary-yellow/60"
                    }`}
                  />
                  {errors.email && <p className="mt-1.5 text-[10px] font-bold text-red-500">{errors.email}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">รหัสผ่าน</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="รหัสผ่าน"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (errors.password) setErrors(prev => ({ ...prev, password: undefined }));
                      }}
                      className={`w-full rounded-lg bg-zinc-950 border px-3 py-2 pr-10 text-sm text-zinc-200 outline-none transition-colors ${
                        errors.password 
                          ? "border-red-500 focus:border-red-500" 
                          : "border-muted-charcoal focus:border-primary-yellow/60"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-primary-yellow transition-colors"
                    >
                      {showPassword ? (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      )}
                    </button>
                  </div>
                  {errors.password && <p className="mt-1.5 text-[10px] font-bold text-red-500">{errors.password}</p>}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-lg gold-gradient-bg py-3 text-sm font-bold text-base-black shadow-lg shadow-primary-yellow/5 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50"
                >
                  {isSubmitting ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
                </button>

                <div className="mt-4 text-center">
                  <button type="button" onClick={() => { setAuthMode("signup"); setErrors({}); setError(""); }} className="text-xs text-zinc-400 hover:text-primary-yellow underline-offset-2 hover:underline transition-colors">
                    ยังไม่มีบัญชีใช่หรือไม่? สมัครสมาชิก
                  </button>
                </div>
              </form>
            ) : (
            <form onSubmit={handleRequestOTP} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">ชื่อ-นามสกุล</label>
                <input
                  type="text"
                  placeholder="กรอกชื่อจริงของคุณ"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (errors.name) setErrors(prev => ({ ...prev, name: undefined }));
                  }}
                  className={`w-full rounded-lg bg-zinc-950 border px-3 py-2 text-sm text-zinc-200 outline-none transition-colors ${
                    errors.name ? "border-red-500 focus:border-red-500" : "border-muted-charcoal focus:border-primary-yellow/60"
                  }`}
                />
                {errors.name && <p className="mt-1.5 text-[10px] font-bold text-red-500">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">อีเมล</label>
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors(prev => ({ ...prev, email: undefined }));
                  }}
                  className={`w-full rounded-lg bg-zinc-950 border px-3 py-2 text-sm text-zinc-200 outline-none transition-colors ${
                    errors.email ? "border-red-500 focus:border-red-500" : "border-muted-charcoal focus:border-primary-yellow/60"
                  }`}
                />
                {errors.email && <p className="mt-1.5 text-[10px] font-bold text-red-500">{errors.email}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">รหัสผ่าน</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="รหัสผ่าน"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errors.password) setErrors(prev => ({ ...prev, password: undefined }));
                    }}
                    className={`w-full rounded-lg bg-zinc-950 border px-3 py-2 pr-10 text-sm text-zinc-200 outline-none transition-colors ${
                      errors.password 
                        ? "border-red-500 focus:border-red-500" 
                        : "border-muted-charcoal focus:border-primary-yellow/60"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-primary-yellow transition-colors"
                  >
                    {showPassword ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    )}
                  </button>
                </div>
                {errors.password && <p className="mt-1.5 text-[10px] font-bold text-red-500">{errors.password}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">เบอร์โทรศัพท์</label>
                <input
                  type="tel"
                  placeholder="08X-XXX-XXXX"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    if (errors.phone) setErrors(prev => ({ ...prev, phone: undefined }));
                  }}
                  className={`w-full rounded-lg bg-zinc-950 border px-3 py-2 text-sm text-zinc-200 outline-none transition-colors ${
                    errors.phone ? "border-red-500 focus:border-red-500" : "border-muted-charcoal focus:border-primary-yellow/60"
                  }`}
                />
                {errors.phone && <p className="mt-1.5 text-[10px] font-bold text-red-500">{errors.phone}</p>}
              </div>



              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-lg gold-gradient-bg py-3 text-sm font-bold text-base-black shadow-lg shadow-primary-yellow/5 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50"
              >
                {isSubmitting ? "กำลังสมัครสมาชิก..." : "สมัครสมาชิก"}
              </button>

              <div className="mt-4 text-center">
                <button type="button" onClick={() => { setAuthMode("login"); setErrors({}); setError(""); }} className="text-xs text-zinc-400 hover:text-primary-yellow underline-offset-2 hover:underline transition-colors">
                  มีบัญชีอยู่แล้ว? เข้าสู่ระบบ
                </button>
              </div>
            </form>
            )
          ) : (
            <form onSubmit={handleVerifyAndLogin} className="space-y-4">
              
              {/* Simulated OTP Display Helper */}
              <div className="rounded-lg bg-primary-yellow/10 border border-primary-yellow/30 p-4 text-center">
                <span className="text-xs text-zinc-400 block mb-1">🎁 จำลองรหัส OTP ส่งไปยัง SMS ของท่าน:</span>
                <span className="font-mono text-2xl font-bold tracking-[0.25em] text-primary-yellow">
                  {simulatedOTP}
                </span>
                <p className="text-[10px] text-zinc-500 mt-2">กรุณานำรหัส 6 หลักด้านบนมาใส่ในช่องกรอกข้อมูล</p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 text-center mb-2">
                  ป้อนรหัส OTP 6 หลัก
                </label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  placeholder="000000"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                  className="w-full text-center font-mono text-xl tracking-[0.3em] rounded-lg bg-zinc-950 border border-muted-charcoal px-3 py-3 text-zinc-100 focus:border-primary-yellow/60 outline-none transition-colors"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep("info")}
                  className="w-1/3 rounded-lg border border-muted-charcoal hover:bg-zinc-950/60 py-3 text-xs font-semibold text-zinc-400 transition-colors"
                >
                  ย้อนกลับ
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-2/3 rounded-lg gold-gradient-bg py-3 text-sm font-bold text-base-black shadow-lg shadow-primary-yellow/5 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50"
                >
                  {isSubmitting ? "กำลังยืนยัน..." : "ยืนยันและสร้างบัญชี"}
                </button>
              </div>
            </form>
          )}
        </div>

      </div>
    </div>
  );
}
