import Image from "next/image";
import type { ActivityDetail } from "@enroll-website/types";

export function ActivityHero({ activity }: { activity: ActivityDetail }) {
  return (
    <header className="relative isolate h-[min(52vh,420px)] w-full overflow-hidden bg-zinc-900">
      <Image
        src={activity.hero_image_url}
        alt={`ภาพประกอบกิจกรรม ${activity.name}`}
        fill
        priority
        className="object-cover opacity-90"
        sizes="100vw"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[var(--background)] via-black/35 to-black/20" aria-hidden />
      <div className="absolute inset-x-0 bottom-0 mx-auto max-w-3xl px-4 pb-10 pt-24 text-white">
        <div className="mb-3 flex flex-wrap items-center gap-3">
          {activity.schedule?.[0]?.venue && (
            <p className="text-sm font-bold tracking-widest text-[var(--color-gold)] uppercase">
              {activity.schedule[0].venue}
            </p>
          )}
          {activity.seat_capacity > 0 && (
            <div className="flex items-center gap-1.5 rounded-full bg-zinc-950/40 backdrop-blur-md border border-[var(--color-gold)]/30 px-3 py-1 text-xs font-semibold tracking-wide text-[var(--color-gold)] shadow-sm">
              <svg className="h-3.5 w-3.5 opacity-90" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
              </svg>
              <span>{activity.enrolled_count} / {activity.seat_capacity} ที่นั่ง</span>
            </div>
          )}
        </div>
        <h1 className="text-balance text-4xl font-serif leading-tight text-white drop-shadow-md sm:text-5xl">
          {activity.name}
        </h1>
      </div>
    </header>
  );
}
