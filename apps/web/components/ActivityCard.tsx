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
      <div className="min-w-0 max-w-[11rem] flex-1 sm:max-w-[13.5rem]">
        <div className="flex items-center justify-between gap-1.5">
          <span className={`font-kanit text-[11px] font-medium sm:text-xs ${labelClass}`}>
            ผู้สมัคร
          </span>
          <span className="font-kanit text-xs font-semibold text-[#d8b85a] sm:text-sm">
            {count}/{capacity}
          </span>
        </div>
        <div className={`mt-0.5 h-[3px] w-full sm:h-1 ${trackClass}`}>
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
    <div className="w-full">
      <div className="flex items-center justify-between gap-2">
        <span className={`font-kanit text-sm font-medium ${labelClass}`}>ผู้สมัคร</span>
        <span className="font-kanit text-sm font-semibold text-[#d8b85a]">
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
  
  const dateLabel = formatActivityDate(activity.date);
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
      <article className="flex h-full flex-col overflow-hidden rounded-xl border border-zinc-700/70 bg-zinc-900 shadow-sm transition-shadow hover:shadow-md">
        <div className="relative aspect-[16/9] overflow-hidden bg-zinc-800">
          {/*<div className="absolute inset-0 bg-gradient-to-br from-zinc-700/40 via-zinc-800 to-zinc-900" />*/}
          <img src={activity.hero_image_url} className="h-full w-full object-cover" />
          <div className="absolute right-2 top-2 rounded-md border border-black bg-[#131311] px-2 py-0.5 font-kanit text-[10px] font-bold text-[#d8b85a] shadow-sm">
            {activity.price === 0 ? "ฟรี" : `฿${activity.price}`}
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-2 p-3 pb-2">
          <h3 className="line-clamp-2 font-taviraj text-base font-bold leading-tight text-zinc-100">
            {activity.name}
          </h3>
          <div className="space-y-1 font-kanit text-xs font-medium text-zinc-400">
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
            className="mt-auto w-full rounded-md border border-zinc-600 bg-[#131311] px-3 py-1.5 font-kanit text-xs font-bold text-zinc-200 transition-colors hover:border-[#d8b85a] hover:text-[#d8b85a] text-center"
          >
            {isRegistered ? "✓ Enrolled" : "Register"}
          </a>
        </div>
      </article>
    );
  }

  return (
    <article
      className={`group relative overflow-hidden ${cardColors[colorIndex]} shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:border-primary-yellow/40 ${
        isRecommended 
          ? "h-[calc(100dvh-156px)] md:h-[calc(100dvh-88px)] w-full rounded-none border-b border-muted-charcoal/40" 
          : "aspect-[16/9] rounded-lg border border-muted-charcoal/40"
      }`}
    >
      <div className={`absolute inset-0 ${
        isLightCard
          ? "bg-gradient-to-t from-base-black/20 via-base-black/5 to-white/10"
          : "bg-gradient-to-t from-base-black/70 via-base-black/20 to-white/5"
      }`} />
      <div className="relative h-full w-full">
        <img src={activity.hero_image_url} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-black/75" />
      </div>
      <div className={`absolute inset-x-0 bottom-0 space-y-1.5 p-4 ${isLightCard ? "text-base-black" : "text-white"}`}>
        <h3 className="line-clamp-2 font-taviraj text-xl font-extrabold leading-tight sm:text-2xl md:text-3xl">
          {activity.name}
        </h3>

        <div className={`flex flex-wrap items-center gap-x-2 gap-y-1 font-kanit text-[11px] font-semibold sm:text-xs ${isLightCard ? "text-base-black/80" : "text-zinc-300"}`}>
          <span>{dateLabel}</span>
          <span>|</span>
          <span>{activity.location}</span>
          <span>|</span>
          <span>{activity.price === 0 ? "Free" : `฿${activity.price}`}</span>
        </div>

        <div className="mt-2 flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => isRegistered ? openCheckinModal() : onRegister(activity)}
            className="shrink-0 rounded-md border border-zinc-600 bg-[#131311] px-3.5 py-1.5 font-kanit text-xs font-bold text-zinc-200 transition-colors hover:border-[#d8b85a] hover:text-[#d8b85a]"
          >
            {isRegistered ? "ดูบัตรของคุณ" : "Register"}
          </button>
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
