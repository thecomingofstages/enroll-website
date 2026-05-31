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
import { Activity, INITIAL_ACTIVITIES } from "@/lib/mockData";

export default function Home() {
  const handleRegister = (activity: Activity) => {
    console.log("Register clicked for:", activity.name);
  };

  return (
    <AppProvider>
      <Header />
      {/* <HomeSidebar /> */}
      {INITIAL_ACTIVITIES.slice(0, 1).map((activity) => (
        <ActivityCard
          key={activity.id}
          activity={activity}
          variant="recommended"
          onRegister={handleRegister}
        />
      ))}
      *<AccountModal />*
      <AuthModal />
      <QRCheckinModal />
      <RegistrationModal />
      <SiteFooter />
      <StickyFooter />
    </AppProvider>
  );
}
