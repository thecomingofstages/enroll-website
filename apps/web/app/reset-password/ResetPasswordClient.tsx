"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

export default function ResetPasswordClient() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    setToken(params.get("token") ?? "");
  }, []);

  const hasToken = token.trim().length > 0;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!token.trim()) {
      setError("ลิงก์รีเซ็ตรหัสผ่านไม่ถูกต้องหรือหมดอายุแล้ว");
      return;
    }

    if (!newPassword || newPassword.length < 8) {
      setError("รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("ยืนยันรหัสผ่านไม่ตรงกัน");
      return;
    }

    setIsSubmitting(true);
    try {
      const base = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
      if (!base) throw new Error("API URL is not configured");

      const res = await fetch(`${base}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || "ไม่สามารถรีเซ็ตรหัสผ่านได้");
      }

      setSuccess("รีเซ็ตรหัสผ่านสำเร็จแล้ว กรุณาเข้าสู่ระบบอีกครั้ง");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => router.push("/"), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "ไม่สามารถรีเซ็ตรหัสผ่านได้");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-16 text-zinc-100">
      <div className="mx-auto flex w-full max-w-md flex-col rounded-lg border border-zinc-800 bg-zinc-900/80 p-6 shadow-2xl shadow-black/40">
        <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-gold">TCOS</p>
        <h1 className="mt-2 text-2xl font-semibold">Reset Password</h1>
        <p className="mt-2 text-sm text-zinc-400">
          ตั้งรหัสผ่านใหม่สำหรับบัญชีของคุณและเราจะบังคับให้เข้าสู่ระบบอีกครั้งหลังจากยืนยันสำเร็จ
        </p>

        {error && (
          <div className="mt-4 rounded border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400">
            {error}
          </div>
        )}

        {success && (
          <div className="mt-4 rounded border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-400">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-zinc-400">
              รหัสผ่านใหม่
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full rounded border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-gold/60"
              placeholder="อย่างน้อย 8 ตัวอักษร"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-zinc-400">
              ยืนยันรหัสผ่าน
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-gold/60"
              placeholder="พิมพ์ซ้ำ"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !hasToken}
            className="w-full rounded bg-gold px-3 py-2.5 text-sm font-semibold text-background transition hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? "กำลังอัปเดตรหัสผ่าน..." : "ยืนยันการเปลี่ยนรหัสผ่าน"}
          </button>
        </form>
      </div>
    </main>
  );
}
