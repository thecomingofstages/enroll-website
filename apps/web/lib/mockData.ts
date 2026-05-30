export interface Activity {
  id: string;
  name: string;
  description: string;
  longDescription: string;
  date: string;
  location: string;
  capacity: number;
  registeredCount: number;
  status: 'open' | 'closed';
  tags: string[];
  isFeatured: boolean;
  price: number; // 0 means Free
  coverImage: string;
  colorTheme: string; // Tailwind color class for card visual header: e.g. 'bg-[#800f14]', 'bg-[#18392b]', etc.
  additionalQuestions: {
    id: string;
    label: string;
    type: 'text' | 'select' | 'checkbox';
    options?: string[];
    required: boolean;
  }[];
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
  badge: 'ประกาศ' | 'สปอนเซอร์' | 'กิจกรรม' | 'ทุน';
  bgColor: string;
  textColor: string;
  badgeBg: string;
}

export const ACTIVITY_FILTER_CATEGORIES = [
  "ทั้งหมด",
  "การแสดง",
  "สายเขียน",
  "แสงและเสียง",
  "เครื่องแต่งกาย",
  "เบื้องหลัง",
  "เข้าฟรี",
] as const;

export const RECOMMENDED_LIMIT = 4;

export interface Sponsor {
  id: string;
  name: string;
  logoText: string;
}

export const INITIAL_ACTIVITIES: Activity[] = [
  {
    id: "act-001",
    name: "ละครเวที ทางผ่าน",
    description: "มิติใหม่แห่งการเล่าเรื่องราวชีวิต ละครเวทีฟอร์มยักษ์ที่จะพาคุณก้าวข้ามผ่านช่วงเวลาสำคัญ",
    longDescription: "ละครเวทีชิ้นพิเศษโดย TCOS นำเสนอแสงเสียงและการแสดงอันสมจริงในทุกองก์การแสดง",
    date: "2025-03-20T18:00:00+07:00",
    location: "โรงละครแห่งชาติ",
    capacity: 250,
    registeredCount: 182,
    status: "open",
    tags: ["การแสดง", "ละคร"],
    isFeatured: true,
    price: 350,
    coverImage: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&auto=format&fit=crop&q=80",
    colorTheme: "bg-[#800f14]", // Crimson Red
    additionalQuestions: [
      {
        id: "shirt-size",
        label: "ขนาดเสื้อยืด TCOS Grand Showcase (สำหรับสิทธิ์ VIP)",
        type: "select",
        options: ["S", "M", "L", "XL", "XXL"],
        required: true
      }
    ]
  },
  {
    id: "act-002",
    name: "Costume & Wardrobe",
    description: "การจัดอบรมและปฏิบัติจริงด้านการออกแบบเครื่องแต่งกายละครเวทีและสวมบทบาท",
    longDescription: "เวิร์กช็อปเจาะลึกวิธีการจัดหา พรีเซนต์ และประยุกต์เครื่องแต่งกายในละครเวที",
    date: "2025-03-12T13:00:00+07:00",
    location: "ลาดพร้าว",
    capacity: 50,
    registeredCount: 30,
    status: "open",
    tags: ["เครื่องแต่งกาย"],
    isFeatured: false,
    price: 200,
    coverImage: "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=600&auto=format&fit=crop&q=80",
    colorTheme: "bg-[#18392b]", // Dark Green
    additionalQuestions: []
  },
  {
    id: "act-003",
    name: "Spoken Word Open Night",
    description: "ค่ำคืนแห่งการร่ายกลอนและสุนทรพจน์ในบรรยากาศแสงสลัวริมแม่น้ำ",
    longDescription: "ปลดปล่อยพลังงานของตัวอักษรและวรรณศิลป์ของคุณร่วมกับกวีสายเขียนมากมาย",
    date: "2025-05-10T19:30:00+07:00",
    location: "River City",
    capacity: 100,
    registeredCount: 88,
    status: "open",
    tags: ["สายเขียน"],
    isFeatured: false,
    price: 150,
    coverImage: "https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=600&auto=format&fit=crop&q=80",
    colorTheme: "bg-[#391e4a]", // Dark Purple
    additionalQuestions: []
  },
  {
    id: "act-004",
    name: "Directing Masterclass",
    description: "เรียนรู้มุมมอง ทักษะ และการนำทางเวทีโดยผู้กำกับระดับแนวหน้าของประเทศ",
    longDescription: "เวิร์กช็อปที่จะเปลี่ยนความคิดการเล่าเรื่องและการบล็อกการแสดงบนเวทีอย่างมีทิศทาง",
    date: "2025-05-02T10:00:00+07:00",
    location: "BACC",
    capacity: 40,
    registeredCount: 40, // Full
    status: "closed",
    tags: ["การแสดง"],
    isFeatured: false,
    price: 500,
    coverImage: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=600&auto=format&fit=crop&q=80",
    colorTheme: "bg-[#59421a]", // Brown
    additionalQuestions: []
  },
  {
    id: "act-005",
    name: "Workshop เขียนบทละคร: โครงสร้างการเล่าเรื่อง",
    description: "เข้าใจหลักการเขียนบทละคร การสร้างคาแรกเตอร์ตัวละคร และปมขัดแย้งของเรื่อง",
    longDescription: "คอร์สสัมมนาและเขียนบทจริงสำหรับเยาวชนและสายเขียนที่สนใจทำบทละครเวที",
    date: "2025-06-05T10:00:00+07:00",
    location: "โรงละครแห่งชาติ",
    capacity: 60,
    registeredCount: 42,
    status: "open",
    tags: ["สายเขียน", "เข้าฟรี"],
    isFeatured: false,
    price: 0, // FREE
    coverImage: "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=600&auto=format&fit=crop&q=80",
    colorTheme: "bg-[#162942]", // Navy Blue
    additionalQuestions: []
  },
  {
    id: "act-006",
    name: "บทกวีบนเวที: Spoken Word Masterclass",
    description: "เทคนิคการประพันธ์บทกวีร่วมสมัยและการแสดงบนเวทีอย่างสะกดสายตาผู้ชม",
    longDescription: "พัฒนาทักษะการเปล่งเสียง การจัดระเบียบร่างกาย และการถ่ายทอดอารมณ์ความรู้สึกสะกดอารมณ์คนดู",
    date: "2025-06-25T14:00:00+07:00",
    location: "TCOS Space",
    capacity: 80,
    registeredCount: 24,
    status: "open",
    tags: ["สายเขียน", "การแสดง"],
    isFeatured: false,
    price: 150,
    coverImage: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80",
    colorTheme: "bg-[#2d2d2d]", // Charcoal
    additionalQuestions: []
  }
];

export const INITIAL_ANNOUNCEMENTS: Announcement[] = [
  {
    id: "ann-001",
    badge: "ประกาศ",
    title: "เปิดรับสมาชิก TCOS ปี 2025",
    content: "สมัครเข้าร่วมเป็นสมาชิก TCOS วันนี้รับสิทธิพิเศษในการลงทะเบียนรับข่าวสาร สิทธิ์จองตั๋วก่อนใคร และส่วนลด 10% ทุกการเข้าเรียนเวิร์กช็อป",
    date: "22 พ.ค. 2025",
    bgColor: "bg-[#fcecc4]/90",
    textColor: "text-[#634812]",
    badgeBg: "bg-[#e2cb92]/50",
  },
  {
    id: "ann-002",
    badge: "สปอนเซอร์",
    title: "Supported by GreenArt Foundation",
    content: "ยินดีต้อนรับ GreenArt Foundation เข้าเป็นผู้สนับสนุนหลักในการเผยแพร่ผลงานศิลปะและการแสดงเชิงอนุรักษ์สากลอย่างเป็นทางการ",
    date: "20 พ.ค. 2025",
    bgColor: "bg-[#e0f2e9]/90",
    textColor: "text-[#18593b]",
    badgeBg: "bg-[#addcbd]/50",
  },
  {
    id: "ann-003",
    badge: "กิจกรรม",
    title: "Workshop พิเศษ นักเรียน ม.ปลาย",
    content: "โครงการฝึกฝนทักษะการกำกับเวทีและสวมบทบาทการแสดงสำหรับน้องๆ ม.ปลาย สมัครเข้าร่วมฟรีไม่มีค่าใช้จ่าย",
    date: "18 พ.ค. 2025",
    bgColor: "bg-[#e2ebf8]/90",
    textColor: "text-[#1b437c]",
    badgeBg: "bg-[#b9d0f3]/50",
  },
  {
    id: "ann-004",
    badge: "ทุน",
    title: "ทุนสนับสนุนศิลปินรุ่นใหม่",
    content: "เปิดขอรับการประเมินเพื่อรับทุนสร้างสรรค์ผลงานละครและนวัตกรรมการจัดแสดงโชว์รอบครึ่งปีหลัง สมัครได้ถึง 30 มิ.ย. นี้",
    date: "15 พ.ค. 2025",
    bgColor: "bg-[#fcf0d3]/90",
    textColor: "text-[#705615]",
    badgeBg: "bg-[#ebd39d]/50",
  },
];

export function getActivityAvailability(activity: Activity) {
  const spotsLeft = activity.capacity - activity.registeredCount;
  const isFull = spotsLeft <= 0;
  const isClosed = activity.status === "closed" || isFull;
  return { spotsLeft, isFull, isClosed };
}

export function formatActivityDate(dateIso: string) {
  return new Date(dateIso).toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
