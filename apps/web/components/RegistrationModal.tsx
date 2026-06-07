"use client";

import React, { useState, useEffect } from "react";
import { useAppState } from "../lib/context";
import type { Activity } from "@enroll-website/types";
import { postActivityRegistration } from "../lib/activity-api";

export default function RegistrationModal() {
  const { 
    activeModal, 
    closeModals, 
    registerTargetActivity, 
    user, 
    login,
    registerToEvent, 
    simulateSlipVerification 
  } = useAppState();

  const [step, setStep] = useState<"account" | "payment" | "questions" | "success">("account");
  
  // Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  // Payment State
  const [slipFile, setSlipFile] = useState<File | null>(null);
  const [slipFileName, setSlipFileName] = useState("");
  const [isVerifyingSlip, setIsVerifyingSlip] = useState(false);
  const [slipVerifiedCode, setSlipVerifiedCode] = useState("");
  const [paymentError, setPaymentError] = useState("");
  
  // Custom Questions State
  const [answers, setAnswers] = useState<Record<string, string>>({});
  
  // Final Ticket State
  const [ticketDetails, setTicketDetails] = useState<any>(null);
  const [isRegistering, setIsRegistering] = useState(false);

  // Sync inputs with user account if logged in
  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
      phone === "" && setPhone(user.phone);
    }
  }, [user]);

  if (activeModal !== "register" || !registerTargetActivity) return null;

  const activity = registerTargetActivity;
  const isPaid = activity.price > 0;

  const handleAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !phone) {
      alert("กรุณากรอกข้อมูลผู้ลงทะเบียนให้ครบถ้วน");
      return;
    }
    
    // Validate password for new users
    if (!user) {
      if (password.length < 8) {
        alert("รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร");
        return;
      }
      if (password !== confirmPassword) {
        alert("รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน");
        return;
      }
    }

    if (isPaid) {
      setStep("payment");
    } else {
      // Free activity doesn't require payment, jump to additional questions
      if (activity.additionalQuestions.length > 0) {
        setStep("questions");
      } else {
        handleFinalRegistration();
      }
    }
  };

  const handleSlipUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setPaymentError("ขนาดไฟล์ต้องไม่เกิน 5MB");
      return;
    }

    setSlipFile(file);
    setSlipFileName(file.name);
    setSlipVerifiedCode("READY_TO_UPLOAD");
    setPaymentError("");
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!slipVerifiedCode) {
      setPaymentError("กรุณาอัปโหลดสลิปธนาคารที่ถูกต้องเพื่อดำเนินการต่อ");
      return;
    }

    if (activity.additionalQuestions.length > 0) {
      setStep("questions");
    } else {
      handleFinalRegistration();
    }
  };

  const handleQuestionsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Verify required questions
    for (const q of activity.additionalQuestions) {
      if (q.required && !answers[q.id]) {
        alert(`กรุณาตอบคำถาม: ${q.label}`);
        return;
      }
    }
    handleFinalRegistration();
  };

  const handleFinalRegistration = async () => {
    setIsRegistering(true);
    try {
      const payload: any = {
        activity_id: activity.id,
        answers,
      };

      if (!user) {
        payload.new_user = {
          name,
          email,
          phone,
          password,
          preferences: [],
        };
      }

      const res = await postActivityRegistration(
        activity.id,
        payload,
        isPaid ? slipFile : null
      );

      if (res.ok) {
        // If it's a guest registration, we should also log them in locally after success.
        if (!user) {
          await login(email, password);
        }
        
        setTicketDetails({ ticketCode: res.registration_id });
        setStep("success");
      } else {
        alert(res.message);
      }
    } catch (err) {
      alert("เกิดข้อผิดพลาดในการลงทะเบียนกิจกรรม");
    } finally {
      setIsRegistering(false);
    }
  };

  const resetState = () => {
    setStep("account");
    setName("");
    setEmail("");
    setPhone("");
    setPassword("");
    setConfirmPassword("");
    setSlipFile(null);
    setSlipFileName("");
    setSlipVerifiedCode("");
    setPaymentError("");
    setAnswers({});
    setTicketDetails(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-base-black/85 backdrop-blur-md overflow-y-auto">
      <div 
        className="w-full max-w-lg rounded-2xl glass-panel-glow border border-muted-charcoal/80 overflow-hidden shadow-2xl transition-all my-8"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Step Indicator Header */}
        <div className="border-b border-muted-charcoal/40 bg-zinc-950/50 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-block rounded-full bg-primary-yellow/10 px-2 py-0.5 text-[10px] font-extrabold uppercase text-primary-yellow tracking-wider">
              {activity.price === 0 ? "FREE EVENT" : `${activity.price} THB`}
            </span>
            <h3 className="font-inter text-base font-extrabold text-zinc-100 tracking-wide truncate max-w-[200px] sm:max-w-[280px]">
              ลงทะเบียน: {activity.name}
            </h3>
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

        {/* Step Progress Bar */}
        {step !== "success" && (
          <div className="flex h-1 w-full bg-zinc-900">
            <div 
              className="h-full bg-primary-yellow transition-all duration-300"
              style={{
                width: step === "account" ? "33%" : step === "payment" ? "66%" : "100%"
              }}
            />
          </div>
        )}

        {/* Main Content Body */}
        <div className="p-6">
          
          {/* STEP 1: Account Confirmation / Setup */}
          {step === "account" && (
            <form onSubmit={handleAccountSubmit} className="space-y-4">
              <div>
                <h4 className="text-sm font-bold text-primary-yellow uppercase tracking-wider mb-2">
                  Part 1: ยืนยันข้อมูลส่วนตัวสำหรับเข้างาน
                </h4>
                <p className="text-xs text-zinc-400">
                  {user ? "ระบบตรวจพบ TCOS Account ของคุณแล้ว กรุณาตรวจสอบข้อมูลสำหรับจัดส่งตั๋วใบนี้" : "กรอกข้อมูลของคุณเพื่อลงทะเบียนและสมัครบัญชี TCOS Account ไปพร้อมกันทันที"}
                </p>
              </div>

              <div className="space-y-3 bg-zinc-950/40 p-4 rounded-xl border border-muted-charcoal/40">
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-widest text-zinc-500 mb-1">ชื่อ-นามสกุลจริง</label>
                  <input
                    type="text"
                    required
                    placeholder="กรอกชื่อจริงของคุณ"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-lg bg-zinc-950 border border-muted-charcoal px-3 py-2 text-sm text-zinc-200 focus:border-primary-yellow/60 outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-widest text-zinc-500 mb-1">อีเมลผู้ลงทะเบียน</label>
                  <input
                    type="email"
                    required
                    placeholder="example@tcos.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-lg bg-zinc-950 border border-muted-charcoal px-3 py-2 text-sm text-zinc-200 focus:border-primary-yellow/60 outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-widest text-zinc-500 mb-1">เบอร์โทรศัพท์ติดต่อ</label>
                  <input
                    type="tel"
                    required
                    placeholder="08X-XXX-XXXX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full rounded-lg bg-zinc-950 border border-muted-charcoal px-3 py-2 text-sm text-zinc-200 focus:border-primary-yellow/60 outline-none transition-colors"
                  />
                </div>

                {!user && (
                  <>
                    <div className="pt-2 border-t border-muted-charcoal/40">
                      <label className="block text-[10px] font-extrabold uppercase tracking-widest text-zinc-500 mb-1">ตั้งรหัสผ่านสำหรับเข้าสู่ระบบ (8 ตัวอักษรขึ้นไป)</label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          required
                          placeholder="รหัสผ่านอย่างน้อย 8 ตัวอักษร"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full rounded-lg bg-zinc-950 border border-muted-charcoal px-3 py-2 pr-12 text-sm text-zinc-200 focus:border-primary-yellow/60 outline-none transition-colors"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-zinc-400 hover:text-primary-yellow transition-colors"
                        >
                          {showPassword ? "ซ่อน" : "แสดง"}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-extrabold uppercase tracking-widest text-zinc-500 mb-1">ยืนยันรหัสผ่าน</label>
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        placeholder="ยืนยันรหัสผ่านอีกครั้ง"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full rounded-lg bg-zinc-950 border border-muted-charcoal px-3 py-2 text-sm text-zinc-200 focus:border-primary-yellow/60 outline-none transition-colors"
                      />
                    </div>
                  </>
                )}
              </div>

              <button
                type="submit"
                className="w-full rounded-lg gold-gradient-bg py-3 text-sm font-bold text-base-black hover:scale-[1.01] active:scale-[0.99] transition-all"
              >
                {isPaid ? "ดำเนินการชำระเงิน PromptPay" : activity.additionalQuestions.length > 0 ? "ถัดไป: ตอบคำถามเพิ่มเติม" : "ลงทะเบียนทันที"}
              </button>
            </form>
          )}

          {/* STEP 2: PromptPay Payment & Upload Slip */}
          {step === "payment" && (
            <form onSubmit={handlePaymentSubmit} className="space-y-4">
              <div>
                <h4 className="text-sm font-bold text-primary-yellow uppercase tracking-wider mb-2">
                  Part 2: ชำระเงินค่าลงทะเบียนผ่าน PromptPay
                </h4>
                <p className="text-xs text-zinc-400">
                  สแกน QR Code ด้านล่างเพื่อชำระเงินจำนวน <span className="text-primary-yellow font-bold">{activity.price} บาท</span> จากนั้นอัปโหลดภาพหลักฐานการโอนเงินเพื่อตรวจสลิป
                </p>
              </div>

              {/* PromptPay QR Code Generative Layout */}
              <div className="flex flex-col items-center bg-white p-4 rounded-xl shadow-lg border-2 border-zinc-200 max-w-[280px] mx-auto">
                <div className="flex items-center justify-between w-full pb-2 border-b border-zinc-100 mb-2">
                  <span className="text-[10px] font-extrabold tracking-widest text-blue-900">PROMPTPAY</span>
                  <span className="text-[8px] font-semibold text-zinc-400">TCOS TICKET GATE</span>
                </div>
                
                {/* Visual Premium Mock QR Code */}
                <div className="relative bg-zinc-100 p-2 rounded-lg border border-zinc-200">
                  <div className="flex h-44 w-44 items-center justify-center rounded-lg border-2 border-dashed border-zinc-300 bg-zinc-100 text-center">
                    <span className="text-xs font-bold text-zinc-400">
                      PromptPay<br />QR Code
                    </span>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="bg-white p-1.5 rounded-md shadow border border-zinc-200">
                      <span className="text-[9px] font-bold text-blue-900 tracking-tighter">PP</span>
                    </div>
                  </div>
                </div>

                <div className="text-center mt-3">
                  <span className="text-[10px] text-zinc-500 block font-semibold">บัญชีอ้างอิง: บจก. เฮาส์ ออฟ ทีคอส</span>
                  <span className="text-sm font-bold text-zinc-800 tracking-wide mt-1 block">
                    ยอดเงินโอน: {activity.price}.00 THB
                  </span>
                </div>
              </div>

              {/* Slip Uploader and QR scanner status */}
              <div className="space-y-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 text-center">
                  อัปโหลดภาพหลักฐานการโอนเงิน (สลิปธนาคาร)
                </label>

                {paymentError && (
                  <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-xs text-red-400 text-center font-semibold">
                    ❌ {paymentError}
                  </div>
                )}

                <div className="relative border-2 border-dashed border-muted-charcoal rounded-xl p-4 text-center bg-zinc-950/40 hover:bg-zinc-950/60 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleSlipUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    disabled={isVerifyingSlip}
                  />
                  {slipFileName ? (
                    <div className="flex flex-col items-center py-2 space-y-1">
                      <div className="bg-primary-yellow/20 p-2 rounded-full border border-primary-yellow/30">
                        <svg className="h-5 w-5 text-primary-yellow" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                      </div>
                      <span className="text-xs text-primary-yellow font-bold">
                        แนบไฟล์สลิปเรียบร้อยแล้ว
                      </span>
                      <span className="text-[10px] text-zinc-400 font-mono">
                        ไฟล์: {slipFileName}
                      </span>
                    </div>
                  ) : (
                    <div className="py-2">
                      <svg className="mx-auto h-8 w-8 text-zinc-500 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-xs text-zinc-400 block font-semibold">
                        {slipFileName ? slipFileName : "คลิกหรือลากวางภาพสลิปที่นี่"}
                      </span>
                      <span className="text-[9px] text-zinc-500 mt-1 block">
                        ระบบจะสแกนหา QR Code ของสลิปเพื่อยืนยันโดยไม่จัดเก็บรูปเต็ม
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep("account")}
                  className="w-1/3 rounded-lg border border-muted-charcoal hover:bg-zinc-950/60 py-3 text-xs font-semibold text-zinc-400 transition-colors"
                >
                  ย้อนกลับ
                </button>
                <button
                  type="submit"
                  disabled={!slipVerifiedCode}
                  className="w-2/3 rounded-lg gold-gradient-bg py-3 text-sm font-bold text-base-black shadow-lg hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-40"
                >
                  ถัดไป: กรอกข้อมูลเพิ่มเติม
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: Additional Questions */}
          {step === "questions" && (
            <form onSubmit={handleQuestionsSubmit} className="space-y-4">
              <div>
                <h4 className="text-sm font-bold text-primary-yellow uppercase tracking-wider mb-2">
                  Part 3: คำถามเพิ่มเติมสำหรับกิจกรรมนี้
                </h4>
                <p className="text-xs text-zinc-400">
                  กรุณากรอกข้อมูลเสริมเพื่อประโยชน์ในการจัดเตรียมสิทธิ์พิเศษของกิจกรรม
                </p>
              </div>

              <div className="space-y-3 bg-zinc-950/40 p-4 rounded-xl border border-muted-charcoal/40">
                {activity.additionalQuestions.map((q) => (
                  <div key={q.id}>
                    <label className="block text-xs font-bold text-zinc-400 mb-1.5">
                      {q.label} {q.required && <span className="text-primary-yellow">*</span>}
                    </label>
                    
                    {q.type === "select" ? (
                      <select
                        required={q.required}
                        value={answers[q.id] || ""}
                        onChange={(e) => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                        className="w-full rounded-lg bg-zinc-950 border border-muted-charcoal px-3 py-2 text-sm text-zinc-200 focus:border-primary-yellow/60 outline-none transition-colors"
                      >
                        <option value="">-- เลือกคำตอบ --</option>
                        {q.options?.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        required={q.required}
                        placeholder="พิมพ์คำตอบของคุณที่นี่..."
                        value={answers[q.id] || ""}
                        onChange={(e) => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                        className="w-full rounded-lg bg-zinc-950 border border-muted-charcoal px-3 py-2 text-sm text-zinc-200 focus:border-primary-yellow/60 outline-none transition-colors"
                      />
                    )}
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(isPaid ? "payment" : "account")}
                  className="w-1/3 rounded-lg border border-muted-charcoal hover:bg-zinc-950/60 py-3 text-xs font-semibold text-zinc-400 transition-colors"
                >
                  ย้อนกลับ
                </button>
                <button
                  type="submit"
                  disabled={isRegistering}
                  className="w-2/3 rounded-lg gold-gradient-bg py-3 text-sm font-bold text-base-black shadow-lg hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50"
                >
                  {isRegistering ? "กำลังบันทึก..." : "เสร็จสิ้นและลงทะเบียน"}
                </button>
              </div>
            </form>
          )}

          {/* STEP 4: Success Ticket Card Display */}
          {step === "success" && ticketDetails && (
            <div className="space-y-5 text-center">
              
              {/* Premium animated checkmark */}
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-light-green/20 border border-light-green/40 shadow-inner animate-bounce-slow">
                <svg className="h-8 w-8 text-light-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                </svg>
              </div>

              <div>
                <h4 className="text-lg font-playfair font-black text-primary-yellow tracking-widest uppercase">
                  ลงทะเบียนสำเร็จ!
                </h4>
                <p className="text-xs text-zinc-400 mt-1">
                  ระบบจัดเตรียมตั๋วเข้าร่วมงานของคุณเรียบร้อยแล้ว
                </p>
              </div>

              {/* Grand Visual Digital Ticket */}
              <div className="relative rounded-2xl bg-zinc-950 border border-muted-charcoal overflow-hidden shadow-2xl text-left">
                {/* Banner Strip */}
                <div className="h-3 gold-gradient-bg w-full" />
                
                <div className="p-5 space-y-4">
                  <div className="flex justify-between items-start border-b border-muted-charcoal/40 pb-3">
                    <div>
                      <span className="text-[9px] font-extrabold tracking-widest text-zinc-500 uppercase">TCOS Ticket Pass</span>
                      <h5 className="font-inter text-sm font-extrabold text-primary-yellow mt-0.5 truncate max-w-[180px]">
                        {activity.name}
                      </h5>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] font-extrabold tracking-widest text-zinc-500 uppercase">Ticket Code</span>
                      <span className="font-mono text-xs font-bold text-zinc-300 block mt-0.5">
                        {ticketDetails.ticketCode}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-[8px] font-extrabold uppercase tracking-wider text-zinc-500">ผู้เข้าร่วมงาน</span>
                      <span className="font-semibold text-zinc-200 block mt-0.5">{name}</span>
                    </div>
                    <div>
                      <span className="text-[8px] font-extrabold uppercase tracking-wider text-zinc-500">เบอร์โทรศัพท์</span>
                      <span className="font-mono text-zinc-200 block mt-0.5">{phone}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-[8px] font-extrabold uppercase tracking-wider text-zinc-500">วันเวลาจัดแสดง</span>
                      <span className="font-sans text-zinc-200 block mt-0.5">
                        {new Date(activity.date).toLocaleString("th-TH", {
                          dateStyle: "medium",
                          timeStyle: "short"
                        })} น.
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-[8px] font-extrabold uppercase tracking-wider text-zinc-500">สถานที่จัดงาน</span>
                      <span className="font-sans text-zinc-300 block mt-0.5">{activity.location}</span>
                    </div>
                  </div>

                  {/* Cut Line effect */}
                  <div className="flex items-center justify-between gap-1 py-1">
                    <div className="h-3 w-3 rounded-full bg-base-black -ml-6.5 border-r border-muted-charcoal" />
                    <div className="flex-1 border-t border-dashed border-muted-charcoal/60" />
                    <div className="h-3 w-3 rounded-full bg-base-black -mr-6.5 border-l border-muted-charcoal" />
                  </div>

                  <div className="flex items-center gap-4 bg-zinc-950/60 p-2 rounded-xl border border-muted-charcoal/20">
                    {/* Simulated Check-in QR */}
                    <div className="bg-white p-1 rounded-lg">
                      <div className="flex h-14 w-14 items-center justify-center rounded border-2 border-dashed border-zinc-300 bg-zinc-100 text-center">
                        <span className="text-[6px] font-bold leading-tight text-zinc-400">
                          QR Code
                        </span>
                      </div>
                    </div>
                    <div className="flex-1 space-y-1">
                      <span className="text-[9px] font-extrabold tracking-widest text-primary-yellow uppercase block">Dynamic Check-In</span>
                      <p className="text-[10px] text-zinc-400">
                        สแกน QR Code นี้ที่หน้าเคาน์เตอร์ฝ่าย Sales&Reg เพื่อเช็คชื่อเข้างานทันที
                      </p>
                    </div>
                  </div>

                </div>
              </div>

              <button
                onClick={() => { closeModals(); resetState(); }}
                className="w-full rounded-lg border border-primary-yellow/30 bg-primary-yellow/10 py-3 text-sm font-bold text-primary-yellow hover:bg-primary-yellow/20 active:scale-[0.99] transition-all"
              >
                ปิดหน้าต่างตั๋ว
              </button>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
