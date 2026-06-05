"use client";

import React, { useEffect, useState } from "react";
import { useAppState, type TCOSAccount } from "../lib/context";

const LOGO_SRC = "/logo-the-coming-of-stages.png";
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
    nickname: user.nickname?.trim() || "-",
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
  const [brightnessMode, setBrightnessMode] = useState(false);

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

  useEffect(() => {
    if (activeModal !== "checkin") {
      setBrightnessMode(false);
    }
  }, [activeModal]);

  if (activeModal !== "checkin") return null;

  const attendee = user ? getAttendeeDisplay(user) : null;
  const isExpired = timeLeft === 0;

  const refreshQrCode = () => {
    setRefreshNonce((current) => current + 1);
  };

  const minutesLeft = Math.floor(timeLeft / 60);
  const secondsLeft = String(timeLeft % 60).padStart(2, "0");

  const actionButtonClass = brightnessMode
    ? "rounded-lg border border-black/20 bg-transparent px-3 py-2 text-xs font-bold text-black transition-all hover:text-[#9a7b2e] active:scale-[0.98]"
    : "rounded-lg border border-white/25 bg-transparent px-3 py-2 text-xs font-bold text-white transition-all hover:text-[#d8b85a] active:scale-[0.98]";

  return (
    <div className="flex flex-1 items-start justify-center px-4 py-10">
      <div
        className={`w-full max-w-sm overflow-hidden rounded-2xl border shadow-2xl transition-colors ${
          brightnessMode
            ? "border-zinc-300 bg-white text-black"
            : "border-muted-charcoal bg-base-black text-white"
        }`}
      >
        <div
          className={`flex items-center justify-between border-b px-4 py-3 ${
            brightnessMode ? "border-zinc-200" : "border-muted-charcoal/50"
          }`}
        >
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-primary-yellow">
              My ID
            </p>
            <h3 className="font-playfair text-lg font-black">TCOS Member QR</h3>
          </div>
        </div>

        <div className="space-y-4 p-5">
          {!user ? (
            <div className="rounded-xl border border-muted-charcoal bg-dark-grey p-6 text-center">
              <p className="font-bold text-primary-yellow">กรุณาเข้าสู่ระบบ</p>
              <p className="mt-2 text-xs text-zinc-400">
                เข้าสู่ระบบก่อนเพื่อดู QR Code ประจำตัวของคุณ
              </p>
            </div>
          ) : (
            <>
              <div
                className={`rounded-2xl border p-4 shadow-xl ${
                  brightnessMode
                    ? "border-zinc-300 bg-white"
                    : "border-primary-yellow/30 bg-dark-grey"
                }`}
              >
                <div
                  className={`mb-4 flex items-center justify-between gap-3 border-b pb-3 ${
                    brightnessMode ? "border-zinc-200" : "border-muted-charcoal"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={LOGO_SRC}
                      alt="The Coming of Stages"
                      width={58}
                      height={44}
                      className="h-10 w-auto object-contain"
                    />
                    <div>
                      <p
                        className={`font-playfair text-sm font-black ${
                          brightnessMode ? "text-black" : "text-white"
                        }`}
                      >
                        The Coming of Stages
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <p
                        className={`text-[9px] font-bold uppercase tracking-widest ${
                          brightnessMode ? "text-zinc-600" : "text-zinc-500"
                        }`}
                      >
                        ชื่อ
                      </p>
                      <p
                        className={`font-bold ${brightnessMode ? "text-black" : "text-white"}`}
                      >
                        {attendee?.firstName}
                      </p>
                    </div>
                    <div>
                      <p
                        className={`text-[9px] font-bold uppercase tracking-widest ${
                          brightnessMode ? "text-zinc-600" : "text-zinc-500"
                        }`}
                      >
                        นามสกุล
                      </p>
                      <p
                        className={`font-bold ${brightnessMode ? "text-black" : "text-white"}`}
                      >
                        {attendee?.lastName}
                      </p>
                    </div>
                    <div>
                      <p
                        className={`text-[9px] font-bold uppercase tracking-widest ${
                          brightnessMode ? "text-zinc-600" : "text-zinc-500"
                        }`}
                      >
                        ชื่อเล่น
                      </p>
                      <p className="font-bold text-primary-yellow">{attendee?.nickname}</p>
                    </div>
                    <div>
                      <p
                        className={`text-[9px] font-bold uppercase tracking-widest ${
                          brightnessMode ? "text-zinc-600" : "text-zinc-500"
                        }`}
                      >
                        เบอร์ติดต่อ
                      </p>
                      <p
                        className={`font-bold ${brightnessMode ? "text-black" : "text-white"}`}
                      >
                        {user.phone}
                      </p>
                    </div>
                  </div>

                  <div>
                    <p
                      className={`text-[9px] font-bold uppercase tracking-widest ${
                        brightnessMode ? "text-zinc-600" : "text-zinc-500"
                      }`}
                    >
                      อีเมล
                    </p>
                    <h4 className="font-playfair text-sm font-black leading-tight text-primary-yellow">
                      {user.email}
                    </h4>
                  </div>

                  <div
                    className={`flex flex-col items-center rounded-xl border p-4 ${
                      brightnessMode
                        ? "border-zinc-300 bg-white"
                        : "border-muted-charcoal bg-base-black"
                    }`}
                  >
                    <div className="rounded-xl bg-white p-2">
                      {qrLoading || (!qrToken && !qrError) ? (
                        <div className="flex h-44 w-44 items-center justify-center rounded-lg bg-zinc-100 p-5 text-center">
                          <span className="text-sm font-black text-base-black">
                            Loading QR Code...
                          </span>
                        </div>
                      ) : qrError ? (
                        <div className="flex h-44 w-44 items-center justify-center rounded-lg border border-red-300 bg-zinc-100 p-5 text-center">
                          <span className="text-xs font-black text-red-700">
                            {qrError}
                          </span>
                        </div>
                      ) : isExpired ? (
                        <div className="flex h-44 w-44 items-center justify-center rounded-lg border border-muted-charcoal bg-zinc-100 p-5 text-center">
                          <span className="text-sm font-black text-base-black">
                            QR Code หมดอายุแล้ว
                          </span>
                        </div>
                      ) : (
                        <div className="flex h-44 w-44 items-center justify-center overflow-hidden rounded-lg bg-white">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=176x176&data=${encodeURIComponent(qrToken)}`}
                            alt="Member check-in QR Code"
                            className="h-full w-full object-contain"
                          />
                        </div>
                      )}
                    </div>
                    <p
                      className={`mt-3 font-mono text-[11px] font-bold ${
                        brightnessMode ? "text-zinc-700" : "text-zinc-300"
                      }`}
                    >
                      {qrToken || user.id}
                    </p>
                    <p
                      className={`mt-1 text-[10px] font-semibold ${
                        isExpired || qrError ? "text-red-400" : "text-primary-yellow"
                      }`}
                    >
                      {isExpired
                        ? "QR Code หมดอายุแล้ว กรุณากด Refresh QR Code"
                        : `หมดอายุใน ${minutesLeft}:${secondsLeft} นาที`}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setBrightnessMode((current) => !current)}
                  className={actionButtonClass}
                >
                  {brightnessMode ? "Normal Mode" : "Maximize Brightness"}
                </button>
                <button
                  type="button"
                  onClick={refreshQrCode}
                  disabled={qrLoading}
                  className={actionButtonClass}
                >
                  Refresh QR Code
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
