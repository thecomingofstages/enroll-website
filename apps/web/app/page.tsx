"use client";

import AccountModal from "@/components/AccountModal";
import ActivityCard from "@/components/ActivityCard";
import AuthModal from "@/components/AuthModal";
import Header from "@/components/Header";
import QRCheckinModal from "@/components/QRCheckinModal";
import RegistrationModal from "@/components/RegistrationModal";
import SiteFooter from "@/components/SiteFooter";
import StickyFooter from "@/components/StickyFooter";
import { AppProvider, useAppState } from "@/lib/context";
import { Activity, INITIAL_ACTIVITIES } from "@/lib/mockData";

function MainContent() {
  const { activeModal } = useAppState();
  const handleRegister = (activity: Activity) => {
    // Intentionally disabled for now.
    // This button will navigate to a dedicated page later.
    void activity;
  };

  const showHome = activeModal !== "account" && activeModal !== "checkin";

  return (
    <>
      <Header />
      {showHome && INITIAL_ACTIVITIES.slice(0, 1).map((activity) => (
        <ActivityCard
          key={activity.id}
          activity={activity}
          variant="recommended"
          onRegister={handleRegister}
        />
      ))}
      {showHome && (
        <section className="bg-[#131311] px-4 py-6 md:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-7xl">
            <h2 className="font-trirong text-2xl font-extrabold text-white">
              กิจกรรมทั้งหมด
            </h2>

            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {INITIAL_ACTIVITIES.map((activity) => (
                <ActivityCard
                  key={`all-${activity.id}`}
                  activity={activity}
                  variant="grid"
                  onRegister={handleRegister}
                />
              ))}
            </div>
          </div>
        </section>
      )}
      <AccountModal />
      <AuthModal />
      <QRCheckinModal />
      <RegistrationModal />
      <SiteFooter />
      <StickyFooter />
    </>
  );
}

export default function Home() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}
