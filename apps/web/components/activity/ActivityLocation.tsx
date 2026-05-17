import Image from "next/image";
import type { ActivityDetail } from "@enroll-website/types";
import { directionsHref } from "@/lib/directions-url";

export function ActivityLocation({ activity }: { activity: ActivityDetail }) {
  const { venue } = activity;
  if (!venue) return null;

  const href = directionsHref(venue);

  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-zinc-200/80 sm:p-6">
      <h2 className="text-lg font-semibold text-violet-700">สถานที่</h2>
      {venue.map_image_url ? (
        <div className="relative mt-4 aspect-[16/9] w-full overflow-hidden rounded-xl bg-zinc-100 ring-1 ring-zinc-200">
          <Image
            src={venue.map_image_url}
            alt={`แผนที่ ${venue.name}`}
            fill
            className="object-cover"
            sizes="(max-width:768px) 100vw, 672px"
          />
        </div>
      ) : null}
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-semibold text-zinc-900">{venue.name}</p>
          {venue.address_lines?.map((line) => (
            <p key={line} className="text-sm text-zinc-600">
              {line}
            </p>
          ))}
        </div>
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 self-start rounded-lg border border-violet-300 px-4 py-2 text-sm font-medium text-violet-800 transition hover:bg-violet-50 sm:self-auto"
        >
          <span aria-hidden>↗</span>
          ขอเส้นทาง
        </a>
      </div>
    </section>
  );
}
