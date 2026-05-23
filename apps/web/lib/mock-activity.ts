import type { ActivityDetail } from "@enroll-website/types";

const sample: ActivityDetail = {
  _id: "demo-theater-tech",
  name: "Navigating to the future of theater design",
  description:
    "เวิร์กช็อปเชิงลึกเกี่ยวกับเทคนิคการแสดงบนเวทีและการผสานดิจิทัล เพื่อให้ผู้เข้าร่วมได้สัมผัสแนวคิดการออกแบบแสง เสียง และฉากในโลกยุคใหม่",
  price: 150,
  seat_capacity: 80,
  enrolled_count: 12,
  tags: ["theater", "tech"],
  is_registration_open: true,
  is_featured: true,
  hero_image_url:
    "https://images.unsplash.com/photo-1503095396549-807759245b35?w=1600&q=80",
  venue: {
    name: "The Indigo Grand Hall",
    address_lines: ["24 Exhibition Way", "SE1 7PB, London"],
    map_image_url:
      "https://images.unsplash.com/photo-1524661135-423995f22d0f?w=1200&q=80",
    directions_url: "https://maps.app.goo.gl/HP1KwHAY1WdPBjAU9",
  },
  highlights: [
    "การผสมผสาน AI ในการออกแบบแสง",
    "ซาวด์สเคปเชิงพื้นที่แบบเรียลไทม์",
    "เทคนิคการสร้างฉากแบบโมดูลาร์",
  ],
  speaker: {
    name: "Marcus Thorne",
    role: "ผู้อำนวยการฝ่ายสร้างสรรค์, Apex Stages",
    avatar_url:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&q=80",
  },
  schedule: [
    {
      date: "2026-06-21",
      start_time: "10:00",
      end_time: "11:30",
      title: "ดิจิทัลโปรซีเนียม",
      description: "บรรยายพิเศษและเคสสตัดดี้การออกแบบเวทีด้วยเทคโนโลยีดิจิทัล",
      highlight: true,
    },
    {
      date: "2026-06-21",
      start_time: "11:30",
      end_time: "13:00",
      title: "ช่วงย่อย: เสียงเชิงพื้นที่",
      description: "เวิร์กช็อปสั้นๆ เกี่ยวกับการออกแบบซาวด์สเคปแบบ immersive",
    },
    {
      date: "2026-06-22",
      start_time: "14:00",
      end_time: "16:00",
      venue: "สตูดิโอย่อย (Sub-studio B)",
      venue_detail: {
        name: "สตูดิโอย่อย (Sub-studio B)",
        address_lines: ["ชั้น 3, อาคาร B", "ศูนย์ศิลปวัฒนธรรม"],
        map_image_url:
          "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=1200&q=80",
        directions_url: "https://maps.app.goo.gl/bWNjRri7igKzP7qH9",
      },
      title: "แผนที่นำทางสู่อนาคต",
      description: "เสวนากับผู้เชี่ยวชาญด้านการผลิตงานแสดงและนวัตกรรมเวที",
    },
  ],
  extra_questions: [
    {
      question_id: "open-mic",
      question_text: "สนใจเข้าร่วม Open Mic หรือไม่?",
      placeholder: "กรอกคำตอบ...",
      type: "text",
      is_required: false,
    },
  ],
};

const byId: Record<string, ActivityDetail> = {
  [sample._id]: sample,
};

export function getMockActivityDetail(id: string): ActivityDetail | null {
  return byId[id] ?? { ...sample, _id: id };
}
