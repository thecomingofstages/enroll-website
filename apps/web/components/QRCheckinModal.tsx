"use client";

import React, { useEffect, useState } from "react";
import { useAppState, type TCOSAccount } from "../lib/context";

const FALLBACK_QR_TTL_SECONDS = 5 * 60;

interface QrTokenPayload {
  qr_token: string;
  expires_at?: string;
  expires_date?: string;
  expires_in?: number;
}

function apiBase() {
  const base = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
  return base && base.length > 0 ? base : null;
}

function readAccessToken(user: unknown) {
  const userToken =
    user && typeof user === "object"
      ? (user as { accessToken?: string; token?: string }).accessToken ??
        (user as { accessToken?: string; token?: string }).token
      : null;

  return (
    userToken ||
    localStorage.getItem("tcos_access_token") ||
    localStorage.getItem("access_token") ||
    localStorage.getItem("token")
  );
}

function normalizeQrPayload(payload: unknown): QrTokenPayload | null {
  if (!payload || typeof payload !== "object") return null;

  const root = payload as {
    qr_token?: string;
    expires_at?: string;
    expires_date?: string;
    expires_in?: number;
    data?: QrTokenPayload;
  };
  const data = root.data ?? root;
  if (!data.qr_token) return null;

  return {
    qr_token: data.qr_token,
    expires_at: data.expires_at,
    expires_date: data.expires_date,
    expires_in: data.expires_in,
  };
}

function getExpiryTime(payload: QrTokenPayload) {
  const rawExpiry = payload.expires_at ?? payload.expires_date;
  const parsedExpiry = rawExpiry ? new Date(rawExpiry).getTime() : Number.NaN;
  if (Number.isFinite(parsedExpiry)) return parsedExpiry;

  const ttl = payload.expires_in ?? FALLBACK_QR_TTL_SECONDS;
  return Date.now() + ttl * 1000;
}

async function fetchMemberQrToken(user: unknown): Promise<QrTokenPayload> {
  const base = apiBase();

  if (base) {
    const accessToken = readAccessToken(user);
    const response = await fetch(`${base}/users/me/qr`, {
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
    });
    const payload = await response.json().catch(() => null);
    const data = normalizeQrPayload(payload);

    if (!response.ok || !data) {
      const message =
        payload && typeof payload === "object"
          ? (payload as { error?: { message?: string } }).error?.message
          : null;
      throw new Error(message ?? `QR API failed (${response.status})`);
    }

    return data;
  }

  return {
    qr_token: `mock.${Date.now()}`,
    expires_at: new Date(Date.now() + FALLBACK_QR_TTL_SECONDS * 1000).toISOString(),
    expires_in: FALLBACK_QR_TTL_SECONDS,
  };
}

function splitName(fullName = "") {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] ?? "-",
    lastName: parts.slice(1).join(" ") || "-",
  };
}

function getAttendeeDisplay(user: TCOSAccount) {
  const fromName = splitName(user.name);
  return {
    firstName: user.firstName?.trim() || fromName.firstName,
    lastName: user.lastName?.trim() || fromName.lastName,
    nickname: user.nickname?.trim()
  };
}

export default function QRCheckinModal() {
  const { activeModal, user } = useAppState();
  const [timeLeft, setTimeLeft] = useState(FALLBACK_QR_TTL_SECONDS);
  const [qrToken, setQrToken] = useState("");
  const [qrExpiresAt, setQrExpiresAt] = useState<number | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrError, setQrError] = useState<string | null>(null);
  const [refreshNonce, setRefreshNonce] = useState(0);

  useEffect(() => {
    if (activeModal !== "checkin" || !user) return;

    let cancelled = false;

    const loadQrToken = async () => {
      setQrLoading(true);
      setQrError(null);

      try {
        const payload = await fetchMemberQrToken(user);
        if (cancelled) return;

        const expiresAt = getExpiryTime(payload);
        setQrToken(payload.qr_token);
        setQrExpiresAt(expiresAt);
        setTimeLeft(Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000)));
      } catch (error) {
        if (cancelled) return;

        setQrToken("");
        setQrExpiresAt(null);
        setTimeLeft(0);
        setQrError(error instanceof Error ? error.message : "Cannot load QR Code");
      } finally {
        if (!cancelled) {
          setQrLoading(false);
        }
      }
    };

    void loadQrToken();

    return () => {
      cancelled = true;
    };
  }, [activeModal, refreshNonce, user]);

  useEffect(() => {
    if (activeModal !== "checkin" || !qrExpiresAt) return;

    const timer = window.setInterval(() => {
      setTimeLeft(Math.max(0, Math.ceil((qrExpiresAt - Date.now()) / 1000)));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [activeModal, qrExpiresAt]);

  if (activeModal !== "checkin") return null;

  const attendee = user ? getAttendeeDisplay(user) : null;
  const isExpired = timeLeft === 0;

  const refreshQrCode = () => {
    setRefreshNonce((current) => current + 1);
  };

  const minutesLeft = Math.floor(timeLeft / 60);
  const secondsLeft = String(timeLeft % 60).padStart(2, "0");

  return (
    <div className="w-full h-full py-8 px-4 sm:px-6 lg:px-8 relative z-1 bg-black">

    {/* Glow */}
<div className="pointer-events-none fixed inset-0 flex items-center justify-center overflow-hidden">
  <div
    style={{
      width: "700px",
      height: "700px",
      borderRadius: "100%",
      background: "radial-gradient(circle, rgba(216,184,90,1) 0%, rgba(216,184,90,0.45) 40%, transparent 100%)",
      filter: "blur(80px)",
    }}
  />
</div>
      
      {/* Ticket Card */}
      <div className="w-full max-w-[26rem] mx-auto">


        <div className="relative rounded-xs border border-gold/30 bg-background text-foreground shadow-2xl overflow-hidden">
          {!user ? (
            <div className="p-8 sm:p-12 text-center">
              <p className="text-lg font-bold text-gold">กรุณาเข้าสู่ระบบ</p>
              <p className="mt-3 text-sm text-zinc-400">
                เข้าสู่ระบบก่อนเพื่อดู QR Code ประจำตัวของคุณ
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-8 p-6 sm:p-8">
              {/* QR Code - First (85% width) */}
              <div className="w-full">
                <div className="flex flex-col items-center justify-center">
                  <div className="rounded-xl bg-background p-3">
                    <p className={`mt-1 text-center text-[16px] font-semibold mb-7 font-playfair ${
                      isExpired || qrError ? "text-red-300" : "text-gold"
                    }`} onClick={refreshQrCode} disabled={qrLoading}>
                      {isExpired
                        ? "Expired"
                        : `${minutesLeft}:${secondsLeft}`}
                        <span> • Refresh QR Code</span>
                    </p>
                    <div className="rounded-xs bg-card border border-gold/30 p-2">
                      {qrLoading || (!qrToken && !qrError) ? (
                        <div className="flex h-60 w-60 items-center justify-center rounded-lg bg-card p-4 text-center">
                          <span className="text-xs font-black text-background">
                            Loading...
                          </span>
                        </div>
                      ) : qrError ? (
                        <div className="flex h-60 w-60 items-center justify-center rounded-lg border bg-card p-4 text-center">
                          <span className="text-[14] font-black text-red-300">
                            Error
                          </span>
                        </div>
                      ) : isExpired ? (
                        <div className="flex h-60 w-60 items-center justify-center rounded-lg border p-4 text-center">
                          <span className="text-xs font-black text-black">
                            Expired
                          </span>
                        </div>
                      ) : (
                        <div className="flex h-60 w-60 items-center justify-center overflow-hidden rounded-lg">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(qrToken)}&color=113-113-113&bgcolor=1a1a1a`}
                            alt="Loading..."
                            className="h-full w-full object-contain"
                          />
                        </div>
                      )}
                    </div>
                    
                  </div>
                </div>
              </div>       

              {/* Member Info - Below QR */}
              <div className="w-full">
                {/* Header Section */}
               
                {/* Member Info */}
                <div className="space-y-2">
                  {/* Name Section */}
                  <div>
                    <p className="text-gold font-trirong text-3xl font-black mt-1 bg-center text-center">
                      {attendee?.firstName} {attendee?.lastName}
                    </p>
                    <p className="text-white font-playfair text-[16px] text-sm mt-3 text-center">
                      TCOS Participant
                    </p>
                  </div>

                  <div className="grid grid-cols-1 @sm:grid-cols-2 gap-4 mt-5 border-t border-gold/30">
  <div className="mt-5 text-left space-x-2">
    <div>
      <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 mt-0">Phone</p>
      <p className="text-m font-semibold text-foreground mt-1">{user.phone}</p>
    </div>
    <div>
      <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 mt-5">Email</p>
      <p className="text-m font-semibold text-foreground mt-1">{user.email}</p>
    </div>
    <div>
      <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 mt-5">Education Level</p>
      <p className="text-m font-semibold text-foreground mt-1">{user.education_level ?? "-"}</p>
    </div>
    <div>
      <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 mt-5">Institution</p>
      <p className="text-m font-semibold text-foreground mt-1">{user.institution ?? "-"}</p>
    </div>
  </div>
              </div>
                </div>
              </div>
            </div>
          )}

          {/* Bottom Actions */}

        </div>
      </div>
    </div>
  );
}
