"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppState } from "@/lib/context";

const baseNavLinkClass = "relative inline-flex min-w-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 text-base font-playfair text-[18px] transition-colors group";
const inactiveNavClass = "text-stone-300 hover:bg-white/10 hover:text-[#d8b85a]";
const activeNavClass = "text-[#d8b85a]";
const activeUnderlineClass = "after:absolute after:bottom-1 after:left-4 after:right-4 after:h-[2px] after:rounded-full after:bg-[#d8b85a]";

export function Header() {
  const { user, openLoginModal, openCheckinModal, openSignupModal, logout, openAccountModal, activeModal } = useAppState();
  const firstName = user?.name.split(" ")[0] ?? "";
  
  const pathname = usePathname();
  //const isHomeActive = (pathname === "/" || pathname.startsWith("/activity")) && !activeModal;
  const isHomeActive = activeModal === null;
  const isQrActive = activeModal === "checkin";
  const isAccountActive = activeModal === "account";

  console.log(activeModal)

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#111111] backdrop-blur supports-[backdrop-filter]:bg-[#111111]/80">
      <div className="relative mx-auto flex h-[90px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex flex-1 justify-start">
          <Link href="/" className="flex items-center">
            <div className="relative h-14 w-44 sm:h-16 sm:w-56">
              <Image
                src="/logo-the-coming-of-stages.png"
                alt="The Coming of Stages Logo"
                fill
                className="object-contain object-left"
                priority
              />
            </div>
          </Link>
        </div>
        <nav className="absolute left-1/2 top-1/2 hidden md:flex -translate-x-1/2 -translate-y-1/2 items-center gap-6 sm:gap-10">
          <Link
            href="/"
            className={`${baseNavLinkClass} ${isHomeActive ? activeNavClass : inactiveNavClass} ${isHomeActive ? activeUnderlineClass : ""}`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="opacity-80 group-hover:opacity-100"
            >
              <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            <span className="hidden sm:inline">Home</span>
          </Link>
          <button
            onClick={user ? openCheckinModal : openLoginModal}
            className={`${baseNavLinkClass} ${isQrActive ? activeNavClass : inactiveNavClass} ${isQrActive ? activeUnderlineClass : ""}`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="opacity-80 group-hover:opacity-100"
            >
              <rect width="5" height="5" x="3" y="3" rx="1" />
              <rect width="5" height="5" x="16" y="3" rx="1" />
              <rect width="5" height="5" x="3" y="16" rx="1" />
              <path d="M21 16h-3a2 2 0 0 0-2 2v3" />
              <path d="M21 21v.01" />
              <path d="M12 7v3a2 2 0 0 1-2 2H7" />
              <path d="M3 12h.01" />
              <path d="M12 3h.01" />
              <path d="M12 16v.01" />
              <path d="M16 12h1" />
              <path d="M21 12v.01" />
              <path d="M12 21v-1" />
            </svg>
            <span className="hidden sm:inline">QR Code</span>
          </button>

          <button
            onClick={user ? openAccountModal : openLoginModal}
            className={`${baseNavLinkClass} ${isAccountActive ? activeNavClass : inactiveNavClass} ${isAccountActive ? activeUnderlineClass : ""}`}
          >
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="opacity-80 group-hover:opacity-100"
              >
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <span className="hidden sm:inline">Account</span>
          </button>
          
        </nav>
        <div className="flex flex-1 justify-end shrink-0 flex-nowrap items-center gap-2 sm:gap-3">
          {user ? (
            <div className="flex flex-col items-end gap-1">
              <span className="whitespace-nowrap text-sm font-semibold text-white sm:text-base">
                สวัสดี{" "}
                <span className="font-bold text-white">{firstName}</span>
              </span>
              <button
                type="button"
                onClick={logout}
                className="shrink-0 whitespace-nowrap rounded-lg border border-white/25 bg-transparent px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-white/10 hover:text-[#d8b85a] active:scale-[0.98] sm:px-4 sm:text-sm"
              >
                ออกจากระบบ
              </button>
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={openLoginModal}
                className="shrink-0 whitespace-nowrap rounded-lg border border-white/25 bg-transparent px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-white/10 hover:text-[#d8b85a] active:scale-[0.98] sm:px-4 sm:text-sm"
              >
                เข้าสู่ระบบ
              </button>
              <button
                type="button"
                onClick={openSignupModal}
                className="shrink-0 whitespace-nowrap rounded-lg border border-white/25 bg-transparent px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-white/10 hover:text-[#d8b85a] active:scale-[0.98] sm:px-4 sm:text-sm"
              >
                สมัครสมาชิก
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
