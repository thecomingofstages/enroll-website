import Image from "next/image";
import type { ActivityDetail } from "@enroll-website/types";

export function ActivityAbout({ activity }: { activity: ActivityDetail }) {
  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-zinc-200/80 sm:p-6">
      <h2 className="text-lg font-semibold text-violet-700">เกี่ยวกับกิจกรรม</h2>
      <p className="mt-3 text-sm leading-relaxed text-zinc-700 sm:text-base">
        {activity.description}
      </p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl bg-violet-50/80 p-4 ring-1 ring-violet-100">
          <h3 className="text-sm font-semibold text-violet-800">สิ่งที่จะได้รับ</h3>
          <ul className="mt-3 space-y-2.5 text-sm text-zinc-800">
            {activity.highlights?.map((line) => (
              <li key={line} className="flex gap-2">
                <span
                  className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-violet-600 text-xs text-white"
                  aria-hidden
                >
                  ✓
                </span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl bg-zinc-50 p-4 ring-1 ring-zinc-200">
          <h3 className="text-sm font-semibold text-violet-800">วิทยากรรับเชิญ</h3>
          {activity.speaker && (
            <div className="mt-3 flex items-start gap-3">
              {activity.speaker.avatar_url ? (
                <Image
                  src={activity.speaker.avatar_url}
                  alt={`รูปวิทยากร ${activity.speaker.name}`}
                  width={48}
                  height={48}
                  className="h-12 w-12 rounded-full object-cover ring-2 ring-white"
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-violet-200 text-sm font-semibold text-violet-900">
                  {activity.speaker.name.slice(0, 1)}
                </div>
              )}
              <div>
                <p className="font-semibold text-zinc-900">{activity.speaker.name}</p>
                <p className="mt-0.5 text-sm text-zinc-600">{activity.speaker.role}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
