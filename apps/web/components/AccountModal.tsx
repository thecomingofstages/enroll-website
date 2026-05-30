"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Activity, formatActivityDate } from "../lib/mockData";
import { useAppState } from "../lib/context";

type ActivityTab = "all" | "upcoming" | "past";

function ProfileAvatar({ name }: { name: string }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("");

  return (
    <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border-2 border-primary-yellow bg-muted-charcoal font-playfair text-3xl font-black text-primary-yellow shadow-xl md:h-28 md:w-28">
      {initials || "TC"}
    </div>
  );
}

function ActivityTicket({
  activity,
  onViewTicket,
}: {
  activity: Activity;
  onViewTicket: () => void;
}) {
  return (
    <article className="relative overflow-hidden rounded-lg border border-muted-charcoal bg-dark-grey">
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `url(${activity.coverImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-base-black via-base-black/80 to-base-black/10" />
      <div className="relative flex min-h-44 flex-col justify-end gap-3 p-4">
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <h4 className="line-clamp-2 font-playfair text-xl font-black text-white">
              {activity.name}
            </h4>
            <p className="mt-1 text-[11px] font-semibold text-zinc-300">
              {formatActivityDate(activity.date)}
            </p>
            <p className="text-[11px] font-semibold text-zinc-400">
              {activity.location}
            </p>
          </div>
          <span className="shrink-0 rounded bg-light-green px-2 py-1 text-[9px] font-black uppercase text-light-green-text">
            Joined
          </span>
        </div>

        <button
          type="button"
          onClick={onViewTicket}
          className="ml-auto rounded-md bg-primary-yellow px-4 py-2 text-xs font-black text-base-black transition-all hover:bg-[#c7a94f] active:scale-[0.98]"
        >
          View Ticket
        </button>
      </div>
    </article>
  );
}

export default function AccountModal() {
  const {
    activeModal,
    closeModals,
    user,
    registrations,
    activities,
    openCheckinModal,
    updateProfile,
  } = useAppState();
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<ActivityTab>("all");
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [preferencesText, setPreferencesText] = useState(
    user?.preferences.join(", ") ?? ""
  );

  useEffect(() => {
    if (activeModal !== "account" || !user) return;
    setName(user.name);
    setEmail(user.email);
    setPhone(user.phone);
    setPreferencesText(user.preferences.join(", "));
    setIsEditing(false);
  }, [activeModal, user]);

  const registeredActivities = useMemo(() => {
    const now = Date.now();
    return registrations
      .map((registration) => {
        const activity = activities.find((item) => item.id === registration.activityId);
        return activity ? { registration, activity } : null;
      })
      .filter(Boolean)
      .filter((item) => {
        if (!item) return false;
        if (activeTab === "upcoming") return new Date(item.activity.date).getTime() >= now;
        if (activeTab === "past") return new Date(item.activity.date).getTime() < now;
        return true;
      }) as { registration: (typeof registrations)[number]; activity: Activity }[];
  }, [activeTab, activities, registrations]);

  if (activeModal !== "account" || !user) return null;

  const saveProfile = () => {
    updateProfile({
      name: name.trim() || user.name,
      email: email.trim() || user.email,
      phone: phone.trim() || user.phone,
      preferences: preferencesText
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    });
    setIsEditing(false);
  };

  const tabs: { id: ActivityTab; label: string }[] = [
    { id: "all", label: "All" },
    { id: "upcoming", label: "Upcoming" },
    { id: "past", label: "Past" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-base-black/85 px-4 pb-8 pt-8 backdrop-blur-md md:pt-12">
      <div className="w-full max-w-5xl overflow-hidden rounded-2xl border border-muted-charcoal bg-base-black text-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-muted-charcoal px-5 py-3">
          <h3 className="font-playfair text-xl font-black text-primary-yellow">Account</h3>
          <button
            type="button"
            onClick={closeModals}
            className="rounded-full border border-muted-charcoal px-3 py-1.5 text-xs font-bold transition-colors hover:border-primary-yellow hover:text-primary-yellow"
          >
            Close
          </button>
        </div>

        <div className="grid gap-5 p-5 md:grid-cols-[320px_1fr] md:p-6">
          <aside className="rounded-lg border border-muted-charcoal bg-dark-grey p-5">
            <ProfileAvatar name={user.name} />

            {isEditing ? (
              <div className="mt-5 space-y-3">
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="w-full rounded-md border border-muted-charcoal bg-base-black px-3 py-2 text-sm outline-none focus:border-primary-yellow"
                  placeholder="Name"
                />
                <input
                  value={preferencesText}
                  onChange={(event) => setPreferencesText(event.target.value)}
                  className="w-full rounded-md border border-muted-charcoal bg-base-black px-3 py-2 text-sm outline-none focus:border-primary-yellow"
                  placeholder="Interests, separated by comma"
                />
              </div>
            ) : (
              <div className="mt-5 text-center">
                <h4 className="font-playfair text-2xl font-black text-primary-yellow">
                  {user.name}
                </h4>
                <p className="text-xs text-zinc-400">@{user.id}</p>
                <div className="mt-5 border-t border-muted-charcoal pt-4 text-left">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                    Interests
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {user.preferences.map((preference) => (
                      <span
                        key={preference}
                        className="rounded border border-muted-charcoal bg-base-black px-2 py-1 text-[10px] font-bold text-zinc-300"
                      >
                        {preference}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="mt-5 grid gap-3">
              {isEditing ? (
                <>
                  <button
                    type="button"
                    onClick={saveProfile}
                    className="rounded-md border border-primary-yellow bg-primary-yellow px-4 py-2 text-xs font-black text-base-black transition-all hover:bg-[#c7a94f] active:scale-[0.98]"
                  >
                    Save Profile
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="rounded-md border border-muted-charcoal px-4 py-2 text-xs font-bold text-zinc-200 transition-colors hover:border-primary-yellow hover:text-primary-yellow"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="rounded-md border border-muted-charcoal px-4 py-2 text-xs font-bold text-zinc-200 transition-colors hover:border-primary-yellow hover:text-primary-yellow"
                  >
                    Edit Profile
                  </button>
                  <button
                    type="button"
                    onClick={openCheckinModal}
                    className="rounded-md border border-muted-charcoal px-4 py-2 text-xs font-bold text-zinc-200 transition-colors hover:border-primary-yellow hover:text-primary-yellow"
                  >
                    My QR Code
                  </button>
                </>
              )}
            </div>
          </aside>

          <section className="space-y-4">
            <div>
              <h3 className="font-playfair text-2xl font-black text-white md:text-3xl">
                My Activities
              </h3>
              <div className="mt-3 flex gap-5 border-b border-muted-charcoal">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`pb-2 text-xs font-black transition-colors ${
                      activeTab === tab.id
                        ? "border-b-2 border-primary-yellow text-primary-yellow"
                        : "text-zinc-500 hover:text-zinc-200"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {registeredActivities.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {registeredActivities.map(({ registration, activity }) => (
                  <ActivityTicket
                    key={registration.id}
                    activity={activity}
                    onViewTicket={openCheckinModal}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-muted-charcoal bg-dark-grey p-8 text-center">
                <p className="font-bold text-primary-yellow">ยังไม่มีกิจกรรมที่สมัคร</p>
                <p className="mt-2 text-xs text-zinc-400">
                  เมื่อสมัครกิจกรรมแล้ว รายการจะแสดงในหน้านี้
                </p>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
