"use client";

import React from "react";
import { Activity, formatActivityDate } from "../lib/mockData";

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
    <p className="text-base font-semibold uppercase tracking-widest text-zinc-500 mt-0">Availability</p>
    <span className={`text-base font-semibold text-${count/capacity !== 1 ? "gold" : "red-300"} sm:text-lg`}>
      {count}/{capacity}
    </span>
  </div>
  <div className={`mt-1 h-[5px] w-full sm:h-2 ${trackClass}`}>
    <div
      className="h-full bg-[#d8b85a] transition-[width] duration-300"
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
        <p className="text-sm font-semibold uppercase tracking-wider text-zinc-500 mt-0">Availability</p>
        <span className={`text-sm font-semibold text-${count/capacity !== 1 ? "gold" : "red-300"}`}>
          {count}/{capacity}
        </span>
      </div>
      <div className={`mt-1.5 h-1 w-full ${trackClass}`}>
        <div
          className="h-full bg-[#d8b85a] transition-[width] duration-300"
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
  const isRegistered = registrations.some(r => r.activityId === activity.id || r.activityId === (activity as any)._id);
  
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
    .reduce((total, char) => total + char.charCodeAt(0), 0) % cardColors.length;
  const isLightCard = cardColors[colorIndex] === "bg-primary-yellow" || cardColors[colorIndex] === "bg-light-green";

  if (!isRecommended) {
    return (
      <article className="flex h-full flex-col overflow-hidden rounded border border-zinc-800 bg-card shadow-sm transition-shadow hover:shadow-md">
        <div className="relative aspect-[16/9] overflow-hidden bg-zinc-800">
          {/*<div className="absolute inset-0 bg-gradient-to-br from-zinc-700/40 via-zinc-800 to-zinc-900" />*/}
          <img src={activity.hero_image_url} className="h-full w-full object-cover" />
          <div className="absolute right-2 top-2 rounded-md border border-black bg-[#131311] px-3 py-0.5 text-xl font-semibold text-[#d8b85a] shadow-sm">
            {activity.price === 0 ? "FREE" : `฿${activity.price}`}
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-2 p-3 pb-2">
          <h3 className="m-1 line-clamp-2 font-taviraj text-xl font-semibold leading-tight text-zinc-100">
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
            className="tracking-wider mt-1 mb-1 w-full text-xs rounded-xs bg-gold px-3 py-2 text-md font-semibold text-background transitions:opacity hover:opacity-60 text-center"
          >
            {isRegistered ? "✓ ENROLLED" : "🗊 REGISTER"}
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
        <p className="text-xl font-bold uppercase tracking-widest text-zinc-500 mb-1">Featured Activity</p>
        <h1 className="text-6xl font-playfair font-extrabold leading-tight">
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
            className={`bg-gold tracking-wider mr-10 rounded-xs px-10 py-2 text-2xl font-semibold text-background transition-colors hover:opacity-60 text-center`}
          >
            {isRegistered ? "✓ ENROLLED" : "🗊 REGISTER"}
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
