import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter, Kanit, Prompt, Playfair_Display, Sarabun, Taviraj, Trirong } from "next/font/google";
import "./globals.css";
import { siteMetadataBase } from "@/lib/site-url";
import { AppProvider } from "@/lib/context";
import AccountModal from "@/components/AccountModal";
import AuthModal from "@/components/AuthModal";
import QRCheckinModal from "@/components/QRCheckinModal";
import RegistrationModal from "@/components/RegistrationModal";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-serif",
  subsets: ["latin"],
});

const prompt = Prompt({
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-prompt",
  subsets: ["latin", "thai"],
});

const sarabun = Sarabun({
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-sarabun",
  subsets: ["latin", "thai"],
});

const trirong = Trirong({
  weight: ["400", "500", "600", "700"],
  variable: "--font-trirong",
  subsets: ["latin", "thai"],
  display: "swap",
});

const taviraj = Taviraj({
  weight: ["400", "500", "600", "700"],
  variable: "--font-taviraj",
  subsets: ["latin", "thai"],
  display: "swap",
});

const kanit = Kanit({
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-kanit",
  subsets: ["latin", "thai"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: siteMetadataBase(),
  title: {
    default: "Enrollment Website",
    template: "%s | Enrollment Website",
  },
  description: "TCOS enrollment",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} ${prompt.variable} ${playfair.variable} ${sarabun.variable} ${trirong.variable} ${taviraj.variable} ${kanit.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-zinc-50">
        <AppProvider>
          {children}
          <AccountModal />
          <AuthModal />
          <QRCheckinModal />
          <RegistrationModal />
        </AppProvider>
      </body>
    </html>
  );
}
