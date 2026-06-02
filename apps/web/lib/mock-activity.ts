import type { ActivityDetail } from "@enroll-website/types";

const sample: ActivityDetail = {
  _id: "demo-theater-tech",
  name: "Navigating to the future of theater design",
  description:
    "![เวิร์กช็อปเบื้องหลังเวที](https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&q=80)\n\n**เวิร์กช็อปเชิงลึก**เกี่ยวกับเทคนิคการแสดงบนเวทีและการผสานดิจิทัล เพื่อให้ผู้เข้าร่วมได้สัมผัสแนวคิดการออกแบบแสง เสียง และฉากในโลกยุคใหม่ \n\nมาร่วมสำรวจการสร้างสรรค์ผลงานศิลปะผ่านมุมมองของเทคโนโลยีสุดล้ำ!",
  price: 150,
  seat_capacity: 80,
  enrolled_count: 12,
  tags: ["theater", "tech"],
  is_registration_open: true,
  is_featured: true,
  hero_image_url:
    "https://images.unsplash.com/photo-1503095396549-807759245b35?w=1600&q=80",
  benefits: [
    "ประกาศนียบัตรผ่านการอบรม",
    "ซาวด์สเคปเชิงพื้นที่แบบเรียลไทม์",
    "เทคนิคการสร้างฉากแบบโมดูลาร์",
  ],
  speakers: [
    {
      _id: "spk_1",
      name: "Marcus Thorne",
      position: "ผู้อำนวยการฝ่ายสร้างสรรค์, Apex Stages",
      image_url:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&q=80",
    },
    {
      _id: "spk_2",
      name: "Elena Rodriguez",
      position: "ผู้เชี่ยวชาญด้านแสงและเสียง",
      image_url:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&q=80",
    }
  ],
  schedule: [
    {
      date: "2026-06-21",
      venue: "The Indigo Grand Hall",
      location_link_gg_map: "https://maps.app.goo.gl/HP1KwHAY1WdPBjAU9",
      location_pics: [
        "https://images.unsplash.com/photo-1524661135-423995f22d0f?w=1200&q=80"
      ],
      additional_location_info: [
        "24 Exhibition Way",
        "SE1 7PB, London"
      ],
      slots: [
        {
          start_time: "09:00",
          end_time: "10:30",
          title: "พื้นฐานเสียงตามพื้นที่เชิงลึก (Spatial Audio)",
          description:
            "เรียนรู้ทฤษฎีและการประยุกต์ใช้ซาวด์สเคปสำหรับการแสดงสด",
          highlight: true,
        },
        {
          start_time: "10:45",
          end_time: "12:00",
          title: "เวิร์กช็อปแสงดิจิทัลเบื้องต้น",
          description: "พื้นฐานการใช้ระบบ DMX และการโปรแกรมแสง",
        },
      ]
    },
    {
      date: "2026-06-22",
      venue: "The Indigo Grand Hall",
      location_link_gg_map: "https://maps.app.goo.gl/HP1KwHAY1WdPBjAU9",
      location_pics: [
        "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=1200&q=80"
      ],
      additional_location_info: [
        "24 Exhibition Way",
        "SE1 7PB, London"
      ],
      slots: [
        {
          start_time: "13:00",
          end_time: "15:00",
          title: "ทดลองสร้างฉากโมดูลาร์ (Hands-on)",
          description: "ฝึกสร้างและประกอบโครงสร้างฉากด้วยระบบโมดูลาร์มาตรฐาน",
        },
        {
          start_time: "15:30",
          end_time: "17:00",
          title: "การแสดงผลงานและรับประกาศนียบัตร",
          description: "นำเสนอผลงานที่ร่วมกันสร้างในเวิร์กช็อป",
        }
      ]
    },
  ],
  open_registration_at: "2026-06-02T15:14:36.813Z",
  close_registration_at: "2026-06-20T23:59:59.000Z",
  registration_open_override: false,
  created_at: "2026-06-02T15:14:36.813Z",
  updated_at: "2026-06-02T15:14:36.813Z",
  extra_questions: [
    {
      question_id: "open-mic",
      question_text: "คำถามเพิ่มเติมเกี่ยวกับกิจกรรม",
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
