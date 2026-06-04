import Image from "next/image";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="w-full bg-[#111111] border-t border-white/10 mt-auto">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="relative h-20 w-48 mb-8">
          <Image
            src="/logo-the-coming-of-stages.png"
            alt="The Coming of Stages Logo"
            fill
            className="object-contain"
          />
        </div>

        <nav className="mb-10 flex flex-wrap justify-center gap-x-8 gap-y-4">
          <Link
            href="/privacy-policy"
            className="text-xs font-bold tracking-widest text-stone-400 uppercase transition-colors hover:text-white"
          >
            PRIVACY POLICY
          </Link>
          <Link
            href="/terms-of-service"
            className="text-xs font-bold tracking-widest text-stone-400 uppercase transition-colors hover:text-white"
          >
            TERMS OF SERVICE
          </Link>
          <Link
            href="/contact"
            className="text-xs font-bold tracking-widest text-stone-400 uppercase transition-colors hover:text-white"
          >
            CONTACT
          </Link>
        </nav>

        <p className="text-center text-xs text-stone-500">
          © 2026 The Coming of Stages. Thai Youth Theatre Collective.
        </p>
      </div>
    </footer>
  );
}
