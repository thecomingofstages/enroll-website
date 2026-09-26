"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAppState } from "../lib/context";

function HomeIcon() {
  return (
    <svg className="h-5 w-5 md:h-6 md:w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
      />
    </svg>
  );
}

function QrIcon() {
  return (
    <svg className="h-5 w-5 md:h-6 md:w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
      />
    </svg>
  );
}

function AccountIcon() {
  return (
    <svg className="h-5 w-5 md:h-6 md:w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
      />
    </svg>
  );
}

function StampIcon() {
  return (
    <svg className="h-5 w-5 md:h-6 md:w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M12 2a5 5 0 0 0-5 5c0 1.6.7 2.8 1.5 3.8L12 14l3.5-3.2c.8-1 1.5-2.2 1.5-3.8a5 5 0 0 0-5-5Z"
      />
      <circle cx="12" cy="7" r="2" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 22a6 6 0 0 1 12 0" />
    </svg>
  );
}

const baseItemClass =
  "relative flex min-w-0 flex-col items-center gap-1.5 rounded-lg px-3 py-2 transition-colors";

const inactiveItemClass =
  "text-zinc-200 hover:cursor-pointer hover:bg-white/10 hover:cursor-pointer hover:text-[#d8b85a] active:bg-white/10 active:text-[#d8b85a]";

const activeItemClass = "text-[#d8b85a]";
const activeUnderlineClass =
  "after:absolute after:bottom-0 after:left-2 after:right-2 after:h-[2px] after:rounded-full after:bg-[#d8b85a]";

const labelClass = "text-[14px] font-sans tracking-wide md:text-xs";

export default function StickyFooter() {
  const {
    user,
    registrations,
    openCheckinModal,
    openAccountModal,
    openLoginModal,
    closeModals,
    activeModal,
  } = useAppState();

  const pathname = usePathname();
  const router = useRouter();

  const handleHomeClick = () => {
    if (activeModal) {
      closeModals();
    } else if (pathname !== "/") {
      router.push("/");
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleQrClick = () => {
    if (!user) { openLoginModal(); return; }
    if (pathname !== "/") {
      router.push("/");
      setTimeout(openCheckinModal, 100);
    } else {
      openCheckinModal();
    }
  };

  const handleAccountClick = () => {
    if (!user) { openLoginModal(); return; }
    if (pathname !== "/") {
      router.push("/");
      setTimeout(openAccountModal, 100);
    } else {
      openAccountModal();
    }
  };

  // Only highlight Home when on "/" and no modal is open that belongs to another tab.
  // On /activity/... nothing is highlighted.
  const isHomeActive =
    pathname === "/" &&
    activeModal !== "checkin" &&
    activeModal !== "account";
  const isQrActive = activeModal === "checkin";
  const isAccountActive = activeModal === "account";
  const isStampActive = pathname === "/stamp";

  const handleStampClick = () => {
    if (activeModal) {
      closeModals();
    }
    router.push("/stamp");
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-[#2a2a27] bg-[#1b1b19]/98 px-4 py-3 shadow-2xl backdrop-blur-md md:hidden">
      <div className="mx-auto w-full max-w-3xl">
        <nav className="grid grid-cols-4 items-center gap-2">
          <button
            type="button"
            onClick={handleHomeClick}
            className={`${baseItemClass} ${
              isHomeActive ? activeItemClass : inactiveItemClass
            } ${isHomeActive ? activeUnderlineClass : ""}`}
          >
            <HomeIcon />
            <span className={labelClass}>Home</span>
          </button>

          <button
            type="button"
            onClick={handleQrClick}
            className={`relative ${baseItemClass} ${
              isQrActive ? activeItemClass : inactiveItemClass
            } ${isQrActive ? activeUnderlineClass : ""}`}
          >
            <QrIcon />
            {registrations.length > 0 && (
              <span className="absolute top-1 right-[calc(50%-34px)] flex h-4 min-w-4 items-center justify-center rounded-full bg-primary-yellow px-1 text-[9px] font-extrabold text-base-black md:right-[calc(50%-40px)]">
                {registrations.length}
              </span>
            )}
            <span className={labelClass}>QR Code</span>
          </button>

          <button
            type="button"
            onClick={handleAccountClick}
            className={`${baseItemClass} ${
              isAccountActive ? activeItemClass : inactiveItemClass
            } ${isAccountActive ? activeUnderlineClass : ""}`}
          >
            <AccountIcon />
            <span className={labelClass}>Account</span>
          </button>

          <button
            type="button"
            onClick={handleStampClick}
            className={`${baseItemClass} ${
              isStampActive ? activeItemClass : inactiveItemClass
            } ${isStampActive ? activeUnderlineClass : ""}`}
          >
            <StampIcon />
            <span className={labelClass}>Stamp</span>
          </button>
        </nav>
      </div>
    </div>
  );
}