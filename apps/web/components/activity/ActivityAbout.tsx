import Image from "next/image";
import ReactMarkdown from "react-markdown";
import type { ActivityDetail } from "@enroll-website/types";

export function ActivityAbout({ activity }: { activity: ActivityDetail }) {
  return (
    <section className="rounded-2xl bg-[var(--card-bg)] p-5 shadow-lg border border-zinc-800 sm:p-6">
      <h2 className="text-2xl font-bold text-[var(--color-gold)] mb-4">เกี่ยวกับกิจกรรม</h2>
      <div className="prose prose-invert prose-zinc max-w-none text-sm text-zinc-300 sm:text-base prose-img:rounded-xl prose-img:border prose-img:border-zinc-800 prose-a:text-[var(--color-gold)]">
        <ReactMarkdown>{activity.description}</ReactMarkdown>
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl bg-zinc-900/50 p-4 border border-zinc-800">
          <h3 className="text-sm font-semibold text-[var(--color-gold)] uppercase tracking-wider">สิ่งที่จะได้รับ</h3>
          <ul className="mt-3 space-y-2.5 text-sm text-zinc-300">
            {activity.benefits?.map((line) => (
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
        <div className={`rounded-xl bg-zinc-900/50 p-4 border border-zinc-800`}>
          <h3 className="text-sm font-semibold text-[var(--color-gold)] uppercase tracking-wider">วิทยากรรับเชิญ</h3>
          {activity.speakers && activity.speakers.length > 0 && (
            <div className="mt-3 flex flex-col gap-4">
              {activity.speakers.map((speaker, index) => (
                <div key={index} className="flex items-center gap-4">
                  {speaker.image_url ? (
                    <Image
                      src={speaker.image_url}
                      alt={`รูปวิทยากร ${speaker.name}`}
                      width={56}
                      height={56}
                      className="h-14 w-14 rounded-full object-cover ring-2 ring-[var(--color-gold)]"
                    />
                  ) : (
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-800 ring-2 ring-[var(--color-gold)] text-lg  text-[var(--color-gold)]">
                      {speaker.name.slice(0, 1)}
                    </div>
                  )}
                  <div>
                    <p className=" text-lg text-zinc-100 leading-tight">{speaker.name}</p>
                    <p className="mt-0.5 text-sm text-[var(--color-gold)]">{speaker.position}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
