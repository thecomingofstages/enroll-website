"use client";

import React from "react";
import type { Activity } from "../lib/mockData";
// import { formatActivityDate } from "../lib/mockData";

import { useAppState } from "../lib/context";

interface ActivityCardProps {
  activity: Activity;
  variant: "recommended" | "grid";
  onRegister: (activity: Activity) => void;
}

function ActivityRegistrants({
  registeredCount,
  capacity,
  tone = "dark",
  compact = false,
}: {
  registeredCount: number;
  capacity: number;
  tone?: "dark" | "light";
  compact?: boolean;
}) {
  const safeCapacity = Math.max(capacity, 1);
  const count = Math.min(Math.max(registeredCount, 0), safeCapacity);
  const fillPercent = (count / safeCapacity) * 100;

  const labelClass = tone === "light" ? "text-base-black/70" : "text-zinc-300";
  const trackClass = tone === "light" ? "bg-base-black/25" : "bg-zinc-700";

  if (compact) {
    return (
      <div className="min-w-0 max-w-[32rem] flex-1">
  <div className="flex items-center justify-between gap-3">
    <p className=" font-semibold uppercase tracking-widest text-zinc-500 text-xs lg:text-xl mt-0">ENROLLED</p>
    <span className={`text-base font-semibold text-${count !== capacity || count === 0 ? "gold" : "red-300"} sm:text-lg`}>
      {count}{`${capacity === 0 ? "" : `  /  ${capacity}`}`}
    </span>
  </div>
  <div className={`mt-1 h-[5px] w-full sm:h-2 bg-background`}>
    <div
      className={`h-full bg-${capacity === 0 ? "background" : count !== capacity ? "gold" : "red-300"} transition-[width] duration-300`}
      style={{ width: `${fillPercent}%` }}
      role="progressbar"
      aria-valuenow={count}
      aria-valuemin={0}
      aria-valuemax={capacity}
      aria-label={`ผู้สมัคร ${count} จาก ${capacity}`}
    />
  </div>
</div>
    );
  }

  return (
    <div className="w-full mt-5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold uppercase tracking-wider text-zinc-500 mt-0">ENROLLED</p>
        <span className={`text-sm font-semibold text-${count !== capacity || count === 0 ? "gold" : "red-300"}`}>
          {count}{`${capacity === 0 ? "" : `  /  ${capacity}`}`}
        </span>
      </div>
      <div className={`mt-1.5 h-1 w-full bg-background`}>
        <div
          className={`h-full bg-${capacity === 0 ? "background" : count !== capacity ? "gold" : "red-300"} transition-[width] duration-300`}
          style={{ width: `${fillPercent}%` }}
          role="progressbar"
          aria-valuenow={count}
          aria-valuemin={0}
          aria-valuemax={capacity}
          aria-label={`ผู้สมัคร ${count} จาก ${capacity}`}
        />
      </div>
    </div>
  );
}

export default function ActivityCard({
  activity,
  variant,
  onRegister,
}: ActivityCardProps) {
  const { registrations, openCheckinModal } = useAppState();
  const isRegistered = registrations.some(r => r.activityId === activity._id || r.activityId === (activity as any)._id);
  
  const isFull =
    activity.seat_capacity > 0 &&
    activity.enrolled_count >= activity.seat_capacity;
  const isNotStarted = new Date(activity.open_registration_at?? "2026-01-01T00:00:00") > new Date();
  const isEnded = new Date(activity.close_registration_at?? "2099-12-31T00:00:00") < new Date(); 
  let isDisabled = isRegistered;

  let buttonText; let backgroundButtonColor = "bg-gold text-background";
  if (isRegistered) { buttonText = "Registered ✓"; backgroundButtonColor = "bg-green text-background"} 
  else if (activity.registration_open_override === false) { 
    buttonText = "Registration Closed ⤬"; backgroundButtonColor = "bg-red-300 text-background";
    isDisabled = true;
  }
  else if (activity.registration_open_override === true) { buttonText = "Register"; backgroundButtonColor = "bg-gold text-background"}
  else {
    if (isFull) { buttonText = "Seats Full ⤬"; backgroundButtonColor = "bg-red-300 text-background"}
    else if (isEnded) { buttonText = "Registration Ended ⤬"; backgroundButtonColor = "bg-red-300 text-background"} 
    else if (isNotStarted) { buttonText = "Registration Opens Soon ..."; backgroundButtonColor = "bg-zinc-700 text-foreground"}
    else { buttonText = activity.price > 0 ? `Register (฿${activity.price})` : "Register (FREE)"; backgroundButtonColor = "bg-gold text-background" }
    isDisabled = isFull || isEnded || isNotStarted;
  } 

  const dateLabel = activity.date;
  const isRecommended = variant === "recommended";
  const cardColors = [
    "bg-base-black",
    "bg-dark-grey",
    "bg-muted-charcoal",
    "bg-primary-yellow",
    "bg-light-green",
  ];
  const colorIndex = activity._id
    .split("")
    .reduce((total: number, char: string) => total + char.charCodeAt(0), 0) % cardColors.length;
  const isLightCard = cardColors[colorIndex] === "bg-primary-yellow" || cardColors[colorIndex] === "bg-light-green";

  if (!isRecommended) {
    return (
      <article className="flex h-full flex-col overflow-hidden rounded border border-zinc-800 bg-card shadow-sm transition-shadow hover:shadow-md">
        <div className="relative aspect-[16/9] overflow-hidden bg-zinc-800">
          {/*<div className="absolute inset-0 bg-gradient-to-br from-zinc-700/40 via-zinc-800 to-zinc-900" />*/}
          <img src={activity.hero_image_url} className="h-full w-full object-cover" />
          <div className={`absolute right-2 top-2 rounded-md border border-black bg-[#131311] px-3 py-0.5 text-xl font-semibold text-[#d8b85a] shadow-sm
            ${activity.price === -1 ? "hidden" : ""}`}>
            {activity.price === 0 ? "FREE" : `฿${activity.price}`}
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-2 p-3 pb-2">
          <h3 className="m-1 line-clamp-2 font-prompt text-xl font-semibold leading-tight text-zinc-100">
            {activity.name}
          </h3>
          <div className="space-y-1 text-base font-medium text-zinc-500">
            <p>{dateLabel}</p>
            <p>{activity.location}</p>
          </div>

          <ActivityRegistrants
            registeredCount={activity.enrolled_count}
            capacity={activity.seat_capacity}
          />

          <a
            type="button"
            href={`activity/${activity._id}`}
            className={`${ backgroundButtonColor } transition-opacity hover:cursor-pointer tracking-wider mt-1 mb-1 w-full text-md rounded-xs px-3 py-2 text-md font-semibold text-background transition:opacity hover:opacity-60 text-center`}
          >
            {buttonText}
          </a>
        </div>
      </article>
    );
  }

  return (
    <article
      className={`group relative overflow-hidden ${cardColors[colorIndex]} shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:border-primary-yellow/40 ${
        isRecommended 
          ? "h-[calc(100dvh-156px)] md:h-[calc(100dvh-88px)] w-full rounded-none" 
          : "aspect-[16/9] rounded-lg"
      }`}
    >
      <div className={`absolute inset-0 ${
        isLightCard
          ? "bg-gradient-to-t from-base-black/20 via-base-black/5 to-white/10"
          : "bg-gradient-to-t from-base-black/70 via-base-black/20 to-white/5"
      }`} />
      <div className="relative h-full w-full">
        <img src={activity.hero_image_url} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-black/85" />
      </div>
      <div className={`mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 mt-10 absolute inset-x-0 bottom-0 space-y-1.5 p-4 ${isLightCard ? "text-base-black" : "text-white"}`}>
        <p className="text-md lg:text-xl font-bold uppercase tracking-widest text-zinc-500 mb-1">Featured Activity</p>
        <h1 className="text-4xl lg:text-6xl font-prompt font-extrabold leading-tight">
          {activity.name}
        </h1>

        {/* 
        <div className={`flex flex-wrap items-center gap-x-2 gap-y-1 font-kanit text-[11px] font-semibold sm:text-xs ${isLightCard ? "text-base-black/80" : "text-zinc-300"}`}>
          <span>{dateLabel}</span>
          <span>|</span>
          <span>{activity.location}</span>
          <span>|</span>
          <span>{activity.price === 0 ? "Free" : `฿${activity.price}`}</span>
        </div>
        */}
        <div className="mt-10 mb-20 flex items-center gap-2.5">
          <a
            type="button"
            href={`activity/${activity._id}`}
            className={`${
              "bg-gold" 
            } tracking-wider mr-5 lg:mr-10 rounded-xs px-5 lg:px-10 py-2 text-md lg:text-2xl font-semibold text-background transition-colors hover:opacity-60 transitions-opacity text-center`}
          >
            More Info
          </a>
          <ActivityRegistrants
            registeredCount={activity.enrolled_count}
            capacity={activity.seat_capacity}
            tone={isLightCard ? "light" : "dark"}
            compact
          />
        </div>
      </div>
    </article>
  );
}
