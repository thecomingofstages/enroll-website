"use client";

import React, { useEffect, useState } from "react";
import { useAppState, type TCOSAccount } from "../lib/context";
import { getAuthToken, hasAuthToken } from "../lib/auth";
import { setAuthErrorHandler } from "../lib/user-api";

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

function getExpiryTime(payload: QrTokenPayload): number {
  const rawExpiry = payload.expires_at ?? payload.expires_date;
  const parsedExpiry = rawExpiry ? new Date(rawExpiry).getTime() : Number.NaN;
  if (Number.isFinite(parsedExpiry)) return parsedExpiry;

  const ttl = payload.expires_in ?? FALLBACK_QR_TTL_SECONDS;
  return Date.now() + ttl * 1000;
}

async function fetchMemberQrToken(): Promise<QrTokenPayload> {
  const base = apiBase();

  if (base) {
    const token = getAuthToken();
    const response = await fetch(`${base}/users/me/qr`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    const payload = await response.json().catch(() => null);
    const data = normalizeQrPayload(payload);

    if (response.status === 401 || response.status === 403) {
      // Token rejected — let the registered handler trigger recovery.
      // We still throw so the caller shows the user-visible error state
      // until recovery completes.
      throw new Error("Session expired. Please log in again.");
    }

    if (!response.ok || !data) {
      const message =
        payload && typeof payload === "object"
          ? (payload as { error?: { message?: string } }).error?.message
          : null;
      throw new Error(message ?? `QR API failed (${response.status})`);
    }

    return data;
  }

  // Dev fallback — no API configured
  return {
    qr_token: `mock.${Date.now()}`,
    expires_at: new Date(
      Date.now() + FALLBACK_QR_TTL_SECONDS * 1000
    ).toISOString(),
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
    nickname: user.nickname?.trim(),
  };
}

export default function QRCheckinModal() {
  const { activeModal, user, logout, openLoginModal } = useAppState();
  const [timeLeft, setTimeLeft] = useState(FALLBACK_QR_TTL_SECONDS);
  const [qrToken, setQrToken] = useState("");
  const [qrExpiresAt, setQrExpiresAt] = useState<number | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrError, setQrError] = useState<string | null>(null);
  const [refreshNonce, setRefreshNonce] = useState(0);
  const [neverExpire, setNeverExpire] = useState(false);

  // Stale-token recovery. fetchMemberQrToken throws on 401; we register a
  // shared handler in user-api so the same recovery path runs from
  // AccountProfile, RegistrationModal, and here. Clearing the handler on
  // unmount keeps the global slot from leaking across modals.
  useEffect(() => {
    setAuthErrorHandler(() => {
      alert("เซสชันหมดอายุ กรุณาเข้าสู่ระบบอีกครั้ง");
      logout();
      openLoginModal();
    });
    return () => setAuthErrorHandler(null);
  }, [logout, openLoginModal]);

  useEffect(() => {
    if (activeModal !== "checkin") return;
    // Token-gated, not user-gated. On reload the AppProvider rehydrate races
    // with this effect; checking the token directly means we don't short-
    // circuit and miss the QR load if `user` hasn't propagated yet.
    if (!hasAuthToken()) {
      setQrLoading(false);
      return;
    }

    let cancelled = false;

    const loadQrToken = async () => {
      setQrLoading(true);
      setQrError(null);

      try {
        if (!user) throw new Error("No user found");
        
        const payload = {
          qr_token: user.id,
          expires_in: FALLBACK_QR_TTL_SECONDS
        };
        
        if (cancelled) return;

        const expiresAt = getExpiryTime(payload as QrTokenPayload);
        setQrToken(payload.qr_token);
        setQrExpiresAt(expiresAt);
        setTimeLeft(Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000)));
      } catch (error) {
        if (cancelled) return;
        setQrToken("");
        setQrExpiresAt(null);
        setTimeLeft(0);
        setQrError(
          error instanceof Error ? error.message : "Cannot load QR Code"
        );
      } finally {
        if (!cancelled) setQrLoading(false);
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
  const isExpired = !neverExpire && timeLeft === 0;

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
            background:
              "radial-gradient(circle, rgba(216,184,90,1) 0%, rgba(216,184,90,0.45) 40%, transparent 100%)",
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
              {/* QR Code */}
              <div className="w-full">
                <div className="flex flex-col items-center justify-center">
                  <div className="rounded-xl bg-background p-3">
                    {/* Toggle Mode */}
                    <div className="relative flex w-full mx-auto rounded-lg border border-gold/30 bg-[#1a1a1a] p-1 mb-5 font-prompt">
                      {/* Animated Slider Pill */}
                      <div 
                        className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-md bg-gold shadow-sm transition-transform duration-300 ease-in-out ${neverExpire ? "translate-x-full" : "translate-x-0"}`}
                      />
                      
                      <button
                        onClick={() => setNeverExpire(false)}
                        className={`relative z-10 flex-1 rounded-md py-2 text-xs font-semibold transition-colors duration-300 ${
                          !neverExpire ? "text-black" : "text-zinc-400 hover:text-white"
                        }`}
                      >
                        จำกัดเวลา
                      </button>
                      <button
                        onClick={() => setNeverExpire(true)}
                        className={`relative z-10 flex-1 rounded-md py-2 text-xs font-semibold transition-colors duration-300 ${
                          neverExpire ? "text-black" : "text-zinc-400 hover:text-white"
                        }`}
                      >
                        ไม่จำกัดเวลา
                      </button>
                    </div>

                    {/* Refresh Button Area (Fixed height to prevent layout shift) */}
                    <div className="h-[24px] mb-5 w-full flex items-center justify-center">
                      {!neverExpire && (
                        <button
                          onClick={() => setRefreshNonce((n) => n + 1)}
                          disabled={qrLoading}
                          className={`w-full text-center text-[16px] font-semibold hover:cursor-pointer hover:opacity-60 transition-opacity ${
                            isExpired || qrError ? "text-red-500" : "text-gold"
                          }`}
                        >
                          {isExpired ? "Expired" : `${minutesLeft}:${secondsLeft}`}
                          <span> {" • "} Refresh QR Code</span>
                        </button>
                      )}
                    </div>

                    <div className="rounded-lg bg-white border border-gold/30 p-3 shadow-lg mx-auto w-fit">
                      {qrLoading || (!qrToken && !qrError) ? (
                        <div className="flex h-60 w-60 items-center justify-center rounded-lg bg-white p-4 text-center">
                          <span className="text-xs font-black text-black">
                            Loading...
                          </span>
                        </div>
                      ) : qrError ? (
                        <div className="flex h-60 w-60 items-center justify-center rounded-lg bg-white p-4 text-center">
                          <span className="text-[14px] font-black text-red-500">
                            {qrError}
                          </span>
                        </div>
                      ) : isExpired ? (
                        <div className="flex h-60 w-60 items-center justify-center rounded-lg bg-white p-4 text-center">
                          <span className="text-xs font-black text-zinc-500">
                            Expired — tap to refresh
                          </span>
                        </div>
                      ) : (
                        <div className="flex h-60 w-60 items-center justify-center overflow-hidden rounded-md bg-white">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(qrToken)}&margin=0`}
                            className="h-full w-full object-contain"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Member Info */}
              <div className="w-full">
                <div className="space-y-2">
                  <div>
                    <p className="text-gold font-prompt text-3xl font-black mt-1 text-center">
                      {attendee?.firstName} {attendee?.lastName}
                    </p>
                    <p className="text-white font-sans text-[16px] text-sm mt-3 text-center">
                      TCOS Participant
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-4 mt-5 border-t border-gold/30">
                    <div className="mt-5 text-left space-y-4">
                      <div>
                        <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">
                          Phone
                        </p>
                        <p className="text-m font-semibold text-foreground mt-1">
                          {user.phone ?? "-"}
                        </p>
                      </div>
                      <div>
                        <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">
                          Email
                        </p>
                        <p className="text-m font-semibold text-foreground mt-1">
                          {user.email}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}