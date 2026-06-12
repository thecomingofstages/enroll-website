"use client";

import { useEffect, useState } from "react";
import ActivityCard from "@/components/ActivityCard";
import { Header } from "@/components/layout/Header";
import QRCheckinModal from "@/components/QRCheckinModal";
import SiteFooter from "@/components/SiteFooter";
import StickyFooter from "@/components/StickyFooter";
import { useAppState } from "@/lib/context";
import type { Activity } from "../lib/mockData";
import { INITIAL_ACTIVITIES } from "@/lib/mockData";
import AccountProfile from "@/components/AccountProfile";

function MainContent() {
  const { activeModal } = useAppState();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = (activity: Activity) => {
    // Intentionally disabled for now.
    // This button will navigate to a dedicated page later.
    void activity;
  };

  useEffect(() => {
    const fetchActivities = async () => {
      setLoading(true);
      setError(null);
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        if (!apiUrl) {
          // Fallback to mock data if API URL is not configured
          // setActivities(INITIAL_ACTIVITIES);
          setLoading(false);
          return;
        }

        const response = await fetch(`${apiUrl}/activities`);
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        // Handle both direct array and wrapped response format
        const activityList = Array.isArray(data) ? data : data.data || data.activities || [];
        setActivities(activityList);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to fetch activities";
        setError(message);
        // Fallback to mock data on error
        // setActivities(INITIAL_ACTIVITIES);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, []);

  const showHome = activeModal !== "account" && activeModal !== "checkin";

  const showAccount = activeModal === "account";

  return (
    <>
      <Header />
      {showHome && activities.length > 0 && (
        <ActivityCard
          key={(activities[0] as any)._id}
          activity={(activities[0] as any)}
          variant="recommended"
          onRegister={handleRegister}
        />
      )}
      {showHome && (
        <section className="bg-[#131311] mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 mt-10">
          <div className="mx-auto w-full max-w-7xl">
            <h2 className="font-sans font-bold text-3xl md:text-3xl mb-7 text-foreground">Activities</h2>

            {loading ? (
              <div className="mt-4 text-center text-zinc-400">
                <p>Loading activities...</p>
              </div>
            ) : error ? (
              <div className="mt-4 text-center text-red-400">
                <p>Error: {error}</p>
                <p className="text-sm mt-2">Showing fallback data</p>
              </div>
            ) : activities.length === 0 ? (
              <div className="mt-4 text-center text-zinc-400">
                <p>No activities found</p>
              </div>
            ) : (
              <div className="mt-4 mb-15 gap-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {activities.map((activity) => (
                  <ActivityCard
                    key={`all-${activity._id}`}
                    activity={activity}
                    variant="grid"
                    onRegister={handleRegister}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      )}
      <QRCheckinModal />
      {showAccount && (
      <AccountProfile isOpen={showAccount}/>

      )}
      <SiteFooter />
      <StickyFooter />
    </>
  );
}

export default function Home() {
  return <MainContent />;
}
