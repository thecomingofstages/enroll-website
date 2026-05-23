import Image from "next/image";
import type { ActivityDetail } from "@enroll-website/types";

export function ActivityAbout({ activity }: { activity: ActivityDetail }) {
  return (
    <section className="rounded-2xl bg-[var(--card-bg)] p-5 shadow-lg border border-zinc-800 sm:p-6">
      <h2 className="font-prompt text-2xl font-bold text-[var(--color-gold)]">เกี่ยวกับกิจกรรม</h2>
      <p className="mt-3 text-sm leading-relaxed text-zinc-300 sm:text-base">
        {activity.description}
      </p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl bg-zinc-900/50 p-4 border border-zinc-800">
          <h3 className="text-sm font-semibold text-[var(--color-gold)] uppercase tracking-wider">สิ่งที่จะได้รับ</h3>
          <ul className="mt-3 space-y-2.5 text-sm text-zinc-300">
            {activity.highlights?.map((line) => (
              <li key={line} className="flex gap-2">
                <span
                  className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--color-gold)] text-xs text-zinc-950 font-bold"
                  aria-hidden
                >
                  ✓
                </span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl bg-zinc-900/50 p-4 border border-zinc-800">
          <h3 className="text-sm font-semibold text-[var(--color-gold)] uppercase tracking-wider">วิทยากรรับเชิญ</h3>
          {activity.speaker && (
            <div className="mt-3 flex items-center gap-4">
              {activity.speaker.avatar_url ? (
                <Image
                  src={activity.speaker.avatar_url}
                  alt={`รูปวิทยากร ${activity.speaker.name}`}
                  width={56}
                  height={56}
                  className="h-14 w-14 rounded-full object-cover ring-2 ring-[var(--color-gold)]"
                />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-800 ring-2 ring-[var(--color-gold)] text-lg font-prompt text-[var(--color-gold)]">
                  {activity.speaker.name.slice(0, 1)}
                </div>
              )}
              <div>
                <p className="font-prompt text-lg text-zinc-100 leading-tight">{activity.speaker.name}</p>
                <p className="mt-0.5 text-sm text-[var(--color-gold)]">{activity.speaker.role}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
