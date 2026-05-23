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

  // Group items by date
  const groupedByDate: Record<string, ActivityScheduleItem[]> = {};
  activity.schedule.forEach((item) => {
    if (!groupedByDate[item.date]) {
      groupedByDate[item.date] = [];
    }
    groupedByDate[item.date].push(item);
  });

  const sortedDates = Object.keys(groupedByDate).sort();
  const currentDate = sortedDates[currentDayIndex];
  const currentDayItems = groupedByDate[currentDate] || [];

  const handlePrev = () => {
    setCurrentDayIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setCurrentDayIndex((prev) => Math.min(sortedDates.length - 1, prev + 1));
  };

  const hasMultipleDays = sortedDates.length > 1;

  // Determine current venue detail
  // 1. Look for venue_detail in the first item of the current day that has it
  // 2. Fallback to main activity venue
  const currentVenueDetail = 
    currentDayItems.find(item => item.venue_detail)?.venue_detail || 
    activity.venue;

  // We pass down specific props to ActivityTimeline so it doesn't need to do the math again
  return (
    <div className="flex flex-col gap-6">
      <ActivityTimeline
        currentDate={currentDate}
        currentDayIndex={currentDayIndex}
        currentDayItems={currentDayItems}
        hasMultipleDays={hasMultipleDays}
        onPrev={handlePrev}
        onNext={handleNext}
        totalDays={sortedDates.length}
        globalVenueName={activity.venue?.name}
      />
      <ActivityLocation venue={currentVenueDetail} />
    </div>
  );
}
