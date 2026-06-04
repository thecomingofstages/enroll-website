"use client";

import { useState } from "react";
import type { ActivityDetail, ActivityScheduleItem, ActivityVenue } from "@enroll-website/types";
import { ActivityTimeline } from "./ActivityTimeline";
import { ActivityLocation } from "./ActivityLocation";

export function ActivityScheduleAndVenue({ activity }: { activity: ActivityDetail }) {
  const [currentDayIndex, setCurrentDayIndex] = useState(0);

  if (!activity.schedule || activity.schedule.length === 0) {
    return null;
  }

  // Backend schema already groups by date. We just ensure it's sorted.
  const sortedSchedule = [...activity.schedule].sort((a, b) => a.date.localeCompare(b.date));
  const currentDay = sortedSchedule[currentDayIndex];

  const handlePrev = () => {
    setCurrentDayIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setCurrentDayIndex((prev) => Math.min(sortedSchedule.length - 1, prev + 1));
  };

  const hasMultipleDays = sortedSchedule.length > 1;

  return (
    <div className="flex flex-col gap-6">
      <ActivityTimeline
        currentDay={currentDay}
        currentDayIndex={currentDayIndex}
        hasMultipleDays={hasMultipleDays}
        onPrev={handlePrev}
        onNext={handleNext}
        totalDays={sortedSchedule.length}
      />
      <ActivityLocation day={currentDay} />
    </div>
  );
}
