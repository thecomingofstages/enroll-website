import type { ActivityScheduleItem } from "@enroll-website/types";

interface ActivityTimelineProps {
  currentDate: string;
  currentDayIndex: number;
  currentDayItems: ActivityScheduleItem[];
  hasMultipleDays: boolean;
  onPrev: () => void;
  onNext: () => void;
  totalDays: number;
  globalVenueName?: string;
}

export function ActivityTimeline({
  currentDate,
  currentDayIndex,
  currentDayItems,
  hasMultipleDays,
  onPrev,
  onNext,
  totalDays,
  globalVenueName,
}: ActivityTimelineProps) {
  const currentVenue = currentDayItems.find(item => item.venue)?.venue || globalVenueName;

  const formatDisplayDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString("th-TH", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-zinc-200/80 sm:p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-violet-700">กำหนดการกิจกรรม</h2>
        
        {hasMultipleDays && (
          <div className="flex items-center gap-2">
            <button
              onClick={onPrev}
              disabled={currentDayIndex === 0}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-zinc-200 transition hover:bg-zinc-50 disabled:pointer-events-none disabled:opacity-30"
              aria-label="วันก่อนหน้า"
            >
              <svg className="h-4 w-4 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={onNext}
              disabled={currentDayIndex === totalDays - 1}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-zinc-200 transition hover:bg-zinc-50 disabled:pointer-events-none disabled:opacity-30"
              aria-label="วันถัดไป"
            >
              <svg className="h-4 w-4 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}
      </div>

      <div className="mt-4 rounded-xl bg-zinc-50/50 p-4 ring-1 ring-zinc-100">
        <div className="mb-4 border-b border-zinc-200 pb-3">
          <h3 className="text-base font-semibold text-zinc-900">
            {hasMultipleDays ? `วันที่ ${currentDayIndex + 1}` : "วันจัดกิจกรรม"}
            <span className="ml-2 text-sm font-normal text-zinc-500">
              {formatDisplayDate(currentDate)}
            </span>
          </h3>
          {currentVenue && (
            <p className="mt-1 flex items-center text-sm font-medium text-violet-600">
              <svg className="mr-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.243-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              สถานที่: {currentVenue}
            </p>
          )}
        </div>

        <ol className="relative space-y-0 pl-1">
          <span
            className="absolute bottom-2 left-[11px] top-2 w-px bg-zinc-200"
            aria-hidden
          />
          {currentDayItems.map((item, index) => (
            <li key={index} className="relative flex gap-4 pb-8 last:pb-0">
              <div className="relative z-10 flex shrink-0 flex-col items-center pt-1">
                <span
                  className={`h-3 w-3 rounded-full ring-4 ring-white ${
                    item.highlight ? "bg-violet-600" : "bg-zinc-300"
                  }`}
                />
              </div>
              <div className="min-w-0 flex-1 pt-0.5">
                <p className="text-xs font-medium text-violet-600">{item.start_time} – {item.end_time}</p>
                <p className="mt-1 font-semibold text-zinc-900">{item.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-zinc-600">
                  {item.description}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
