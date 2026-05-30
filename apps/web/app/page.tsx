"use client";

import AccountModal from "@/components/AccountModal";
import ActivityCard from "@/components/ActivityCard";
import AuthModal from "@/components/AuthModal";
import Header from "@/components/Header";
import HomeSidebar from "@/components/HomeSidebar";
import QRCheckinModal from "@/components/QRCheckinModal";
import RegistrationModal from "@/components/RegistrationModal";
import SiteFooter from "@/components/SiteFooter";
import StickyFooter from "@/components/StickyFooter";
import { AppProvider } from "@/lib/context";
import { Activity } from "react";

export default function Home() {
  return (
    <AppProvider>
      <Header />
      <HomeSidebar />
      {/*<ActivityCard />*/}
      <AccountModal />
      <AuthModal />
      <QRCheckinModal />
      <RegistrationModal />
      <SiteFooter />
      <StickyFooter />
    </AppProvider>
  );
}
