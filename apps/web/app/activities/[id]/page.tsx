import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { fetchActivityDetail } from "@/lib/activity-api";
import { ActivityHero } from "@/components/activity/ActivityHero";
import { ActivityAbout } from "@/components/activity/ActivityAbout";
import { ActivityScheduleAndVenue } from "@/components/activity/ActivityScheduleAndVenue";
import { ActivityRegisterSection } from "@/components/activity/RegisterModal";

type PageProps = {
  params: Promise<{ id: string }>;
};

function truncateMeta(text: string, max: number): string {
  const t = text.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1).trimEnd()}…`;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  try {
    const activity = await fetchActivityDetail(id);
    if (!activity) {
      return { title: "ไม่พบกิจกรรม", robots: { index: false, follow: false } };
    }
    const description = truncateMeta(activity.description, 160);
    const ogImage =
      activity.hero_image_url.startsWith("http") || activity.hero_image_url.startsWith("//")
        ? [{ url: activity.hero_image_url }]
        : undefined;
    return {
      title: activity.name,
      description,
      openGraph: {
        title: activity.name,
        description,
        type: "website",
        ...(ogImage ? { images: ogImage } : {}),
      },
      twitter: {
        card: "summary_large_image",
        title: activity.name,
        description,
      },
    };
  } catch {
    return {
      title: "โหลดกิจกรรมไม่สำเร็จ",
      robots: { index: false, follow: false },
    };
  }
}

export default async function ActivityPage({ params }: PageProps) {
  const { id } = await params;
  const activity = await fetchActivityDetail(id);
  if (!activity) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-zinc-100 pb-16">
      <ActivityHero activity={activity} />
      <ActivityRegisterSection activity={activity} />
      <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 pb-10">
        <ActivityAbout activity={activity} />
        <ActivityScheduleAndVenue activity={activity} />
      </div>
    </main>
  );
}
