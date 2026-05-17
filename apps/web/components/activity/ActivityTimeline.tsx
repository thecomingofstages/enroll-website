import type { ActivityDetail } from "@enroll-website/types";

export function ActivityTimeline({ activity }: { activity: ActivityDetail }) {
  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-zinc-200/80 sm:p-6">
      <h2 className="text-lg font-semibold text-violet-700">กำหนดการกิจกรรม</h2>
      <ol className="relative mt-6 space-y-0 pl-1">
        <span
          className="absolute bottom-2 left-[11px] top-2 w-px bg-zinc-200"
          aria-hidden
        />
        {activity.schedule.map((item, index) => (
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
    </section>
  );
}
