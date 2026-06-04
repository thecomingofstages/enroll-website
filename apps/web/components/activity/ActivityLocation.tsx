import Image from "next/image";
import type { ActivityScheduleItem } from "@enroll-website/types";

export function ActivityLocation({ day }: { day?: ActivityScheduleItem }) {
  if (!day || !day.venue) return null;

  const href = day.location_link_gg_map || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(day.venue)}`;
  const firstPic = day.location_pics && day.location_pics.length > 0 ? day.location_pics[0] : null;

  return (
    <section className="rounded-2xl bg-[var(--card-bg)] p-5 shadow-lg border border-zinc-800 sm:p-6">
      <h2 className="font-prompt text-2xl font-bold text-[var(--color-gold)]">สถานที่</h2>
      {firstPic ? (
        <div className="relative mt-4 aspect-[16/9] w-full overflow-hidden rounded-xl bg-zinc-900 border border-zinc-800">
          <Image
            src={firstPic}
            alt={`สถานที่ ${day.venue}`}
            fill
            className="object-cover opacity-80 mix-blend-lighten"
            sizes="(max-width:768px) 100vw, 672px"
          />
        </div>
      ) : null}
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-prompt text-lg font-bold text-zinc-100">{day.venue}</p>
          {day.additional_location_info?.map((line) => (
            <p key={line} className="text-sm text-zinc-400">
              {line}
            </p>
          ))}
        </div>
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 self-start rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-300 transition hover:bg-zinc-800 hover:border-[var(--color-gold)] hover:text-[var(--color-gold)] sm:self-auto"
        >
          <span aria-hidden>↗</span>
          ขอเส้นทาง
        </a>
      </div>
    </section>
  );
}
