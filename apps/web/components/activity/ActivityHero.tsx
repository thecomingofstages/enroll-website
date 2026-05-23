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
        <p className="text-sm font-bold tracking-widest text-[var(--color-gold)] uppercase mb-2">
          {activity.venue?.name}
        </p>
        <h1 className="text-balance text-4xl font-serif leading-tight text-white drop-shadow-md sm:text-5xl">
          {activity.name}
        </h1>
      </div>
    </header>
  );
}
