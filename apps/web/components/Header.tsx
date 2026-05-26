"use client";

import React from "react";
import { useAppState } from "../lib/context";

const LOGO_SRC = "/logo-the-coming-of-stages.png";

function NavIconHome() {
  return (
    <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
      />
    </svg>
  );
}

function NavIconQr() {
  return (
    <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
      />
    </svg>
  );
}

function NavIconAccount() {
  return (
    <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
      />
    </svg>
  );
}

const navLinkClass =
  "inline-flex min-w-0 items-center justify-center gap-3 whitespace-nowrap rounded-lg px-5 py-3 text-base font-semibold text-white transition-colors hover:bg-white/10 hover:text-primary-yellow";

export default function Header() {
  const { user, openLoginModal, openSignupModal, openCheckinModal, openAccountModal, logout } = useAppState();

  const firstName = user?.name.split(" ")[0] ?? "";

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      <header className="flex w-full items-center justify-between gap-3 border-b border-[#2a2a27] bg-[#1b1b19] px-4 py-3 text-white md:hidden">
        <a href="#" className="shrink-0 rounded-lg bg-[#1b1b19] px-2 py-1.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={LOGO_SRC}
            alt="House of TCOS"
            width={132}
            height={60}
            className="h-12 w-auto object-contain"
            decoding="async"
          />
        </a>

        <div className="flex min-w-0 shrink-0 items-center justify-end gap-2">
          {user ? (
            <div className="flex max-w-[44vw] flex-col items-end gap-1">
              <span className="truncate text-xs font-semibold text-white">
              สวัสดี <span className="font-bold text-white">{firstName}</span>
              </span>
              <button
                type="button"
                onClick={logout}
                className="shrink-0 whitespace-nowrap rounded-lg border border-white/25 bg-white px-3 py-1.5 text-[11px] font-semibold text-base-black shadow-sm transition-colors hover:border-primary-yellow active:scale-[0.98]"
              >
                ออกจากระบบ
              </button>
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={openLoginModal}
                className="shrink-0 whitespace-nowrap rounded-lg border border-white/25 bg-white px-3 py-1.5 text-[11px] font-semibold text-base-black shadow-sm transition-colors hover:border-primary-yellow active:scale-[0.98]"
              >
                เข้าสู่ระบบ
              </button>
              <button
                type="button"
                onClick={openSignupModal}
                className="shrink-0 whitespace-nowrap rounded-lg border border-primary-yellow bg-primary-yellow px-3 py-1.5 text-[11px] font-bold text-base-black shadow-sm transition-all hover:bg-[#c7a94f] active:scale-[0.98]"
              >
                สมัครสมาชิก
              </button>
            </>
          )}
        </div>
      </header>

      <header className="hidden w-full grid-cols-[auto_1fr_auto] items-center gap-6 border-b border-white/10 bg-base-black px-6 py-5 text-white md:grid lg:px-8 lg:py-6">
        <div className="flex min-w-0 items-center">
          <a href="#" className="shrink-0 rounded-lg bg-base-black px-3 py-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={LOGO_SRC}
              alt="House of TCOS"
              width={220}
              height={170}
              className="h-20 w-auto object-contain lg:h-24"
              decoding="async"
            />
          </a>

        </div>

        <nav className="mx-auto grid w-full max-w-3xl grid-cols-3 items-center justify-center gap-14 lg:gap-24">
          <button type="button" onClick={scrollToTop} className={navLinkClass}>
            <NavIconHome />
            Home
          </button>
          <button type="button" onClick={user ? openCheckinModal : openLoginModal} className={navLinkClass}>
            <NavIconQr />
            QR Code
          </button>
          <button type="button" onClick={user ? openAccountModal : openLoginModal} className={navLinkClass}>
            <NavIconAccount />
            Account
          </button>
        </nav>

        <div className="flex shrink-0 flex-nowrap items-center gap-2 sm:gap-3">
          {user ? (
            <div className="flex flex-col items-end gap-1">
              <span className="whitespace-nowrap text-xs font-semibold text-white sm:text-sm">
                สวัสดี{" "}
                <span className="font-bold text-white">{firstName}</span>
              </span>
              <button
                type="button"
                onClick={logout}
                className="shrink-0 whitespace-nowrap rounded-lg border border-white/25 bg-white px-3 py-1.5 text-xs font-semibold text-base-black shadow-sm transition-colors hover:border-primary-yellow active:scale-[0.98] sm:px-4"
              >
                ออกจากระบบ
              </button>
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={openLoginModal}
                className="shrink-0 whitespace-nowrap rounded-lg border border-white/25 bg-white px-3 py-1.5 text-xs font-semibold text-base-black shadow-sm transition-colors hover:border-primary-yellow active:scale-[0.98] sm:px-4"
              >
                เข้าสู่ระบบ
              </button>
              <button
                type="button"
                onClick={openSignupModal}
                className="shrink-0 whitespace-nowrap rounded-lg border border-primary-yellow bg-primary-yellow px-3 py-2 text-xs font-bold text-base-black shadow-sm transition-all hover:bg-[#c7a94f] active:scale-[0.98] sm:px-4"
              >
                สมัครสมาชิก
              </button>
            </>
          )}
        </div>
      </header>
    </>
  );
}
