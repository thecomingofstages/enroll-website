"use client";

import React, { useEffect, useState } from "react";
import { useAppState } from "../lib/context";

const LOGO_SRC = "/logo-the-coming-of-stages.png";
const QR_CODE_TTL_SECONDS = 15 * 60;

function formatTicketDate(dateIso: string) {
  return new Date(dateIso).toLocaleString("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function splitName(fullName = "") {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] ?? "-",
    lastName: parts.slice(1).join(" ") || "-",
    nickname: parts[0] ?? "-",
  };
}

export default function QRCheckinModal() {
  const { activeModal, closeModals, registrations, activities, user } = useAppState();
  const [selectedTicketIndex, setSelectedTicketIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(QR_CODE_TTL_SECONDS);
  const [securitySalt, setSecuritySalt] = useState("SECURE_SALT_INITIAL");
  const [brightnessMode, setBrightnessMode] = useState(false);

  useEffect(() => {
    if (activeModal !== "checkin" || registrations.length === 0) return;

    const timer = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [activeModal, registrations.length]);

  useEffect(() => {
    if (activeModal !== "checkin") {
      setBrightnessMode(false);
    }
  }, [activeModal]);

  if (activeModal !== "checkin") return null;

  const currentTicket = registrations[selectedTicketIndex];
  const currentActivity = currentTicket
    ? activities.find((activity) => activity.id === currentTicket.activityId)
    : null;
  const attendee = splitName(user?.name);
  const qrData = currentTicket
    ? `${currentTicket.ticketCode}-${securitySalt}`
    : "TCOS-NO-TICKET";
  const isCheckedIn = Boolean(currentTicket?.checkedIn || currentTicket?.status === "attended");
  const isExpired = timeLeft === 0;
  const groupNumber = currentTicket
    ? `กลุ่ม ${String(selectedTicketIndex + 1).padStart(2, "0")}`
    : "-";

  const ticketOptions = registrations.map((registration) => {
    const activity = activities.find((item) => item.id === registration.activityId);
    return {
      id: registration.id,
      label: activity?.name || "ไม่พบชื่อกิจกรรม",
    };
  });

  const refreshQrCode = () => {
    setSecuritySalt(`SALT_${Date.now()}`);
    setTimeLeft(QR_CODE_TTL_SECONDS);
  };

  const minutesLeft = Math.floor(timeLeft / 60);
  const secondsLeft = String(timeLeft % 60).padStart(2, "0");

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-base-black/85 px-4 pb-4 pt-16 backdrop-blur-md md:pt-20">
      <div
        className={`w-full max-w-sm overflow-hidden rounded-2xl border shadow-2xl transition-colors ${
          brightnessMode
            ? "border-primary-yellow bg-white text-base-black"
            : "border-muted-charcoal bg-base-black text-white"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-muted-charcoal/50 px-4 py-2.5">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-primary-yellow">
              QR Code
            </p>
            <h3 className="font-playfair text-lg font-black">TCOS Ticket Pass</h3>
          </div>
          <button
            type="button"
            onClick={closeModals}
            className="rounded-full border border-muted-charcoal px-3 py-1.5 text-xs font-bold transition-colors hover:border-primary-yellow hover:text-primary-yellow"
          >
            Close
          </button>
        </div>

        <div className="space-y-4 p-5">
          {registrations.length === 0 || !currentActivity || !currentTicket ? (
            <div className="rounded-xl border border-muted-charcoal bg-dark-grey p-6 text-center">
              <p className="font-bold text-primary-yellow">ยังไม่มีบัตรกิจกรรม</p>
              <p className="mt-2 text-xs text-zinc-400">
                ลงทะเบียนกิจกรรมก่อน แล้วบัตร QR Code จะมาแสดงที่นี่
              </p>
            </div>
          ) : (
            <>
              {registrations.length > 1 && (
                <label className="block space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-primary-yellow">
                    เลือกบัตรกิจกรรม
                  </span>
                  <select
                    value={selectedTicketIndex}
                    onChange={(event) => {
                      setSelectedTicketIndex(Number(event.target.value));
                      refreshQrCode();
                    }}
                    className="w-full rounded-lg border border-muted-charcoal bg-dark-grey px-3 py-2 text-xs text-white outline-none transition-colors focus:border-primary-yellow"
                  >
                    {ticketOptions.map((option, index) => (
                      <option key={option.id} value={index}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              <div className="rounded-2xl border border-primary-yellow/30 bg-dark-grey p-4 shadow-xl">
                <div className="mb-4 flex items-center justify-between gap-3 border-b border-muted-charcoal pb-3">
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
                      <p className="font-playfair text-sm font-black text-white">
                        The Coming of Stages
                      </p>
                      <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">
                        Official Admission
                      </p>
                    </div>
                  </div>
                  <span className="rounded-full bg-primary-yellow px-2.5 py-1 text-[10px] font-black text-base-black">
                    Admit One
                  </span>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">
                        ชื่อ
                      </p>
                      <p className="font-bold text-white">{attendee.firstName}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">
                        นามสกุล
                      </p>
                      <p className="font-bold text-white">{attendee.lastName}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">
                        ชื่อเล่น
                      </p>
                      <p className="font-bold text-primary-yellow">{attendee.nickname}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">
                        กลุ่มกิจกรรม
                      </p>
                      <p className="font-bold text-white">{groupNumber}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">
                      กิจกรรม
                    </p>
                    <h4 className="font-playfair text-xl font-black leading-tight text-primary-yellow">
                      {currentActivity.name}
                    </h4>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">
                        วันเวลา
                      </p>
                      <p className="font-semibold text-zinc-200">
                        {formatTicketDate(currentActivity.date)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">
                        สถานที่
                      </p>
                      <p className="font-semibold text-zinc-200">{currentActivity.location}</p>
                    </div>
                  </div>

                  <div className="flex flex-col items-center rounded-xl border border-muted-charcoal bg-base-black p-4">
                    <div className={brightnessMode ? "rounded-xl bg-white p-3" : "rounded-xl bg-white p-2"}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {isExpired ? (
                        <div className="flex h-44 w-44 items-center justify-center rounded-lg border border-muted-charcoal bg-zinc-100 p-5 text-center">
                          <span className="text-sm font-black text-base-black">
                            QR Code หมดอายุแล้ว
                          </span>
                        </div>
                      ) : (
                        <div className="flex h-44 w-44 items-center justify-center rounded-lg border-2 border-dashed border-zinc-300 bg-zinc-100 p-5 text-center">
                          <span className="text-sm font-bold text-zinc-400">
                            QR Code
                          </span>
                        </div>
                      )}
                    </div>
                    <p className="mt-3 font-mono text-[11px] font-bold text-zinc-300">
                      {currentTicket.ticketCode}
                    </p>
                    <p className={`mt-1 text-[10px] font-semibold ${isExpired ? "text-red-400" : "text-primary-yellow"}`}>
                      {isExpired ? "QR Code หมดอายุแล้ว กรุณากด Refresh QR Code" : `หมดอายุใน ${minutesLeft}:${secondsLeft} นาที`}
                    </p>
                  </div>

                  {isCheckedIn && (
                    <div className="rounded-xl border border-light-green/50 bg-light-green/15 p-3">
                      <p className="text-sm font-black text-light-green">
                        เข้าร่วมงานแล้ว
                      </p>
                      <p className="mt-1 text-xs text-zinc-300">
                        สแกนสำเร็จแล้วสำหรับกิจกรรมนี้ พร้อมข้อมูลผู้เข้าร่วมและหมายเลขกลุ่มกิจกรรม
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setBrightnessMode((current) => !current)}
                  className="rounded-lg border border-primary-yellow/50 bg-primary-yellow px-3 py-2 text-xs font-black text-base-black transition-all hover:bg-[#c7a94f] active:scale-[0.98]"
                >
                  Maximize Brightness
                </button>
                <button
                  type="button"
                  onClick={refreshQrCode}
                  className="rounded-lg border border-muted-charcoal bg-dark-grey px-3 py-2 text-xs font-bold text-white transition-all hover:border-primary-yellow hover:text-primary-yellow active:scale-[0.98]"
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
