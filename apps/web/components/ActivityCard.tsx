"use client";

import React from "react";
import { Activity, formatActivityDate } from "../lib/mockData";

interface ActivityCardProps {
  activity: Activity;
  variant: "recommended" | "grid";
  onRegister: (activity: Activity) => void;
}

export default function ActivityCard({
  activity,
  variant,
  onRegister,
}: ActivityCardProps) {
  const dateLabel = formatActivityDate(activity.date);
  const tags = activity.tags.slice(0, 2);
  const isRecommended = variant === "recommended";
  const cardColors = [
    "bg-base-black",
    "bg-dark-grey",
    "bg-muted-charcoal",
    "bg-primary-yellow",
    "bg-light-green",
  ];
  const colorIndex = activity.id
    .split("")
    .reduce((total, char) => total + char.charCodeAt(0), 0) % cardColors.length;
  const isLightCard = cardColors[colorIndex] === "bg-primary-yellow" || cardColors[colorIndex] === "bg-light-green";

  return (
    <article
      className={`group relative overflow-hidden rounded-lg border border-muted-charcoal/40 ${cardColors[colorIndex]} shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:border-primary-yellow/40 ${
        isRecommended ? "aspect-[16/10]" : "aspect-[16/9]"
      }`}
    >
      <div className={`absolute inset-0 ${
        isLightCard
          ? "bg-gradient-to-t from-base-black/20 via-base-black/5 to-white/10"
          : "bg-gradient-to-t from-base-black/70 via-base-black/20 to-white/5"
      }`} />
      <div className={`absolute inset-x-0 bottom-0 space-y-1.5 p-4 ${isLightCard ? "text-base-black" : "text-white"}`}>
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <span
              key={tag}
              className={`rounded px-2 py-0.5 text-[8px] font-extrabold uppercase tracking-wide ${
                isLightCard
                  ? "bg-base-black/85 text-white"
                  : "bg-primary-yellow/90 text-base-black"
              }`}
            >
              {tag}
            </span>
          ))}
        </div>

        <h3 className="line-clamp-2 font-playfair text-lg font-extrabold leading-tight sm:text-xl">
          {activity.name}
        </h3>

        <div className={`flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] font-semibold ${isLightCard ? "text-base-black/80" : "text-zinc-300"}`}>
          <span>{dateLabel}</span>
          <span>|</span>
          <span>{activity.location}</span>
          <span>|</span>
          <span>{activity.price === 0 ? "Free" : `฿${activity.price}`}</span>
        </div>

        <button
          type="button"
          onClick={() => onRegister(activity)}
          className={`mt-2 rounded-md px-3 py-1.5 text-[10px] font-bold transition-colors ${
            isLightCard
              ? "border border-base-black/50 bg-base-black text-primary-yellow hover:bg-muted-charcoal"
              : "border border-primary-yellow/40 bg-base-black/60 text-primary-yellow hover:bg-primary-yellow hover:text-base-black"
          }`}
        >
          Register
        </button>
      </div>
    </article>
  );
}
