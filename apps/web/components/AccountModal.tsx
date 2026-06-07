"use client";

import React, { useEffect, useMemo, useState } from "react";
import type { Activity } from "@enroll-website/types";
import { formatActivityDate } from "../lib/mockData";
import { useAppState } from "../lib/context";

// type ActivityTab = "all" | "upcoming" | "past";

function ImageIcon() {
  return (
    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M4 16l4.5-4.5a2 2 0 012.8 0L16 16m-2-2l1.5-1.5a2 2 0 012.8 0L20 14m-1-9H5a2 2 0 00-2 2v10a2 2 0 002 2h14a2 2 0 002-2V7a2 2 0 00-2-2zm-3 4h.01"
      />
    </svg>
  );
}

function ProfileAvatar({
  name,
  avatarUrl,
  isEditing,
  onAvatarChange,
}: {
  name: string;
  avatarUrl?: string;
  isEditing?: boolean;
  onAvatarChange?: (avatarUrl: string) => void;
}) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("");

  return (
    <div className="relative mx-auto h-24 w-24 md:h-28 md:w-28">
      <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full border-2 border-primary-yellow bg-muted-charcoal font-playfair text-3xl font-black text-primary-yellow shadow-xl">
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl}
            alt={`${name} profile`}
            className="h-full w-full object-cover"
          />
        ) : (
          initials || "TC"
        )}
      </div>
      {isEditing && (
        <label className="absolute bottom-1 right-1 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full border border-primary-yellow bg-base-black text-primary-yellow shadow-lg transition-colors hover:bg-primary-yellow hover:text-base-black">
          <ImageIcon />
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file || !onAvatarChange) return;

              const reader = new FileReader();
              reader.onload = () => {
                if (typeof reader.result === "string") {
                  onAvatarChange(reader.result);
                }
              };
              reader.readAsDataURL(file);
            }}
          />
        </label>
      )}
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
      />
      <div className="absolute inset-0 bg-gradient-to-t from-base-black via-base-black/80 to-base-black/10" />
      <div className="relative flex min-h-44 flex-col justify-end gap-3 p-4">
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <h4 className="line-clamp-2 font-inter text-xl font-black text-white">
              {activity.name}
            </h4>
            
          </div>
          <span className="shrink-0 rounded bg-light-green px-2 py-1 text-[9px] font-black uppercase text-light-green-text">
            Joined
          </span>
        </div>

        <button
          type="button"
          onClick={onViewTicket}
          className="ml-auto rounded-md border border-muted-charcoal px-4 py-2 text-xs font-bold text-zinc-200 transition-colors hover:text-[#d8b85a] active:scale-[0.98]"
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
  const [selectedActivityId, setSelectedActivityId] = useState("all");
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl ?? "");
  const [preferencesText, setPreferencesText] = useState(
    user?.preferences.join(", ") ?? ""
  );

  useEffect(() => {
    if (activeModal !== "account" || !user) return;
    setName(user.name);
    setEmail(user.email);
    setPhone(user.phone);
    setAvatarUrl(user.avatarUrl ?? "");
    setPreferencesText(user.preferences.join(", "));
    setIsEditing(false);
  }, [activeModal, user]);

  const registeredActivityOptions = useMemo(() => {
    const uniqueIds = new Set<string>();
    const options: { id: string; name: string }[] = [];
    registrations.forEach((reg) => {
      if (!uniqueIds.has(reg.activityId)) {
        uniqueIds.add(reg.activityId);
        const activity = activities.find((a) => a.id === reg.activityId);
        if (activity) {
          options.push({ id: activity.id, name: activity.name });
        }
      }
    });
    return options;
  }, [registrations, activities]);

  {/* 

  const registeredActivities = useMemo(() => {
    return registrations
      .map((registration) => {
        const activity = activities.find((item) => item.id === registration.activityId);
        return activity ? { registration, activity } : null;
      })
      .filter(Boolean)
      .filter((item) => {
        if (!item) return false;
        if (selectedActivityId !== "all" && item.activity.id !== selectedActivityId) return false;
        return true;
      }) as { registration: (typeof registrations)[number]; activity: Activity }[];
  }, [selectedActivityId, activities, registrations]);
*/}
  // Temporary Fix

  const registeredActivities = ""
  if (activeModal !== "account" || !user) return null;

  const saveProfile = () => {
    updateProfile({
      name: name.trim() || user.name,
      email: email.trim() || user.email,
      phone: phone.trim() || user.phone,
      avatarUrl,
      preferences: preferencesText
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    });
    setIsEditing(false);
  };

  const cancelProfileEdit = () => {
    setName(user.name);
    setEmail(user.email);
    setPhone(user.phone);
    setAvatarUrl(user.avatarUrl ?? "");
    setPreferencesText(user.preferences.join(", "));
    setIsEditing(false);
  };



  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 sm:p-6 backdrop-blur-sm hidden">
      <div className="relative w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-2xl border border-zinc-800 bg-zinc-950 text-white shadow-2xl">
        <button 
          onClick={closeModals} 
          className="absolute right-4 top-4 z-10 rounded-full p-2 text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <div className="flex items-center justify-between border-b border-muted-charcoal px-5 py-4 pr-14">
          <h3 className="font-playfair text-xl font-black text-primary-yellow">Account</h3>
        </div>

        <div className="grid gap-5 p-5 md:grid-cols-[320px_1fr] md:p-6">
          <aside className="rounded-lg border border-muted-charcoal bg-dark-grey p-5">
            <ProfileAvatar
              name={name || user.name}
              avatarUrl={avatarUrl}
              isEditing={isEditing}
              onAvatarChange={setAvatarUrl}
            />

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
                    className="rounded-md border border-muted-charcoal px-4 py-2 text-xs font-bold text-zinc-200 transition-colors hover:text-[#d8b85a] active:scale-[0.98]"
                  >
                    Save Profile
                  </button>
                  <button
                    type="button"
                    onClick={cancelProfileEdit}
                    className="rounded-md border border-muted-charcoal px-4 py-2 text-xs font-bold text-zinc-200 transition-colors hover:text-[#d8b85a] active:scale-[0.98]"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="rounded-md border border-muted-charcoal px-4 py-2 text-xs font-bold text-zinc-200 transition-colors hover:text-[#d8b85a] active:scale-[0.98]"
                  >
                    Edit Profile
                  </button>
                  <button
                    type="button"
                    onClick={openCheckinModal}
                    className="rounded-md border border-muted-charcoal px-4 py-2 text-xs font-bold text-zinc-200 transition-colors hover:text-[#d8b85a] active:scale-[0.98]"
                  >
                    QR Code
                  </button>
                </>
              )}
            </div>
          </aside>

          <section className="space-y-4">
            <div className="mb-4 flex flex-col gap-3 border-b border-muted-charcoal pb-3 md:flex-row md:items-center md:justify-between">
              <h3 className="font-playfair text-2xl font-black text-white md:text-3xl">
                My Activities
              </h3>
              {registeredActivityOptions.length > 0 && (
                <select
                  value={selectedActivityId}
                  onChange={(e) => setSelectedActivityId(e.target.value)}
                  className="rounded-lg border border-muted-charcoal bg-dark-grey px-3 py-2 text-xs font-bold text-white outline-none transition-colors focus:border-primary-yellow"
                >
                  <option value="all">แสดงทั้งหมด</option>
                  {registeredActivityOptions.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
            {/* 
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
              */}
          </section>
        </div>
      </div>
    </div>
  );
}
