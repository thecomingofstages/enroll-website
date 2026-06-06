import React from "react";

const LOGO_SRC = "/logo-the-coming-of-stages.png";

const footerLinks = [
  { label: "PRIVACY POLICY", href: "#privacy" },
  { label: "TERMS OF SERVICE", href: "#terms" },
  { label: "CONTACT", href: "#contact" },
] as const;

export default function SiteFooter() {
  return (
    <footer className="z-10 mt-auto w-full border-t-[0.5px] border-gray-900 bg-black px-6 pb-32 pt-8 text-center text-zinc-100 md:pb-8">
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-6">
        <div className="flex justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={LOGO_SRC}
            alt="The Coming of Stages"
            width={156}
            height={120}
            className="h-auto w-[min(100%,132px)] object-contain sm:w-[156px]"
            decoding="async"
          />
        </div>



        <p className="text-[14px] leading-relaxed text-zinc-500 sm:text-xs">
          © {new Date().getFullYear()} The Coming of Stages • Youth Power of Thai Theatre
        </p>
      </div>
    </footer>
  );
}
