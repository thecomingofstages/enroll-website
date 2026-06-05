import { Noto_Sans_Thai } from "next/font/google";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import StickyFooter from "@/components/StickyFooter";

const notoThai = Noto_Sans_Thai({
  subsets: ["latin", "thai"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export default function ActivitiesLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className={`${notoThai.className} min-h-full flex flex-col pb-20 md:pb-0`} lang="th">
      <Header />
      <div className="flex-1 shrink-0">{children}</div>
      <Footer />
      <StickyFooter />
    </div>
  );
}
