import Image from "next/image";
import ReactMarkdown from "react-markdown";
import type { ActivityDetail } from "@enroll-website/types";

export function ActivityAbout({ activity }: { activity: ActivityDetail }) {
  return (
    <section className="rounded-md bg-card p-5 shadow-lg border border-zinc-800 sm:p-6">
      <h2 className="text-3xl font-bold text-gold font-sans mb-4">About this Activty</h2>
      <div className="prose prose-invert prose-zinc max-w-none text-sm text-foreground font-prompt sm:text-base prose-img:rounded-md prose-img:border prose-img:border-zinc-800 prose-a:text-[var(--color-gold)]">
        <ReactMarkdown>{activity.description}</ReactMarkdown>
      </div>
      <div className="mt-6 grid gap-4 grid-cols-1">
        <div className="rounded-md bg-zinc-900/50 p-5 border border-zinc-800">
          <h3 className="text-xl font-sans font-semibold text-[var(--color-gold)] tracking-wider">Benefits</h3>
          <ul className="mt-3 space-y-2.5 text-sm text-foreground">
            {activity.benefits?.map((line) => (
              <li key={line} className="flex gap-2">
                <span
                  className="mt-0.5 mr-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--color-gold)] text-xs text-zinc-950 font-bold"
                  aria-hidden
                >
                  ✓
                </span>
                <span className="font-prompt text-md">{line}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className={`rounded-md bg-zinc-900/50 p-5 border border-zinc-800`}>
          <h3 className="text-xl font-sans font-semibold text-[var(--color-gold)] tracking-wider">Special Guests</h3>
          {activity.speakers && activity.speakers.length > 0 && (
            <div className="mt-6 flex flex-col gap-6">
              {activity.speakers.map((speaker, index) => (
                <div key={index} className="flex items-center gap-4">
                  {speaker.image_url ? (
                    <Image
                      src={speaker.image_url}
                      alt={`รูปวิทยากร ${speaker.name}`}
                      width={56}
                      height={56}
                      className="h-12 w-12 rounded-full object-cover ring-1 ring-[var(--color-gold)]"
                    />
                  ) : (
                    <div className="font-prompt flex h-12 w-12 items-center justify-center rounded-full bg-zinc-800 ring-1 ring-[var(--color-gold)] text-lg  text-[var(--color-gold)]">
                      {speaker.name.slice(0, 1)}
                    </div>
                  )}
                  <div>
                    <p className=" font-prompt text-lg text-zinc-100 leading-tight">{speaker.name}</p>
                    <p className="font-prompt mt-0.5 text-sm text-[var(--color-gold)]">{speaker.position}</p>
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
