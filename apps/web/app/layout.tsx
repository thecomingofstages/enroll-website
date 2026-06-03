import type { Metadata } from "next";
import { Geist, Geist_Mono, Prompt, Playfair_Display } from "next/font/google";
import "./globals.css";
import { siteMetadataBase } from "@/lib/site-url";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
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
      className={`${geistSans.variable} ${geistMono.variable} ${prompt.variable} ${playfair.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-zinc-50">
        {children}
      </body>
    </html>
  );
}
