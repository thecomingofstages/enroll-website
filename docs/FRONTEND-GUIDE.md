# Frontend Guide — โปรเจค Enrollment Website

## 📚 ภาพรวมโปรเจค

โปรเจคนี้คือ **ระบบลงทะเบียนกิจกรรม** ที่สร้างด้วย **Next.js + TypeScript + Tailwind CSS**

**ประเภท:** Monorepo (Turborepo)
- `apps/web` — Next.js frontend
- `packages/types` — Shared TypeScript types

---

## 🏗️ โครงสร้างโปรเจค

```
enroll-website/
├── apps/web/                    # Next.js app
│   ├── app/
│   │   ├── activities/          # Route สำหรับหน้าข้อมูลกิจกรรม
│   │   │   ├── [id]/
│   │   │   │   ├── page.tsx     # หน้า activity detail
│   │   │   │   ├── error.tsx    # Error boundary
│   │   │   │   └── not-found.tsx # 404 page
│   │   │   └── layout.tsx       # Layout (เซ็ทฟอนต์ไทย)
│   │   ├── layout.tsx           # Root layout
│   │   ├── page.tsx             # Home page
│   │   └── globals.css
│   ├── components/
│   │   └── activity/
│   │       ├── ActivityHero.tsx      # Hero section (รูป + ชื่อ)
│   │       ├── ActivityAbout.tsx     # About section (คำอธิบาย + วิทยากร)
│   │       ├── ActivityTimeline.tsx  # Timeline (กำหนดการ)
│   │       ├── ActivityLocation.tsx  # Location (สถานที่ + แผนที่)
│   │       └── RegisterModal.tsx     # Modal ลงทะเบียน (3 ขั้น)
│   ├── lib/
│   │   ├── activity-api.ts      # API calls (fetch + post)
│   │   ├── directions-url.ts    # Maps fallback logic
│   │   ├── site-url.ts          # Metadata base URL
│   │   └── mock-activity.ts     # Demo data (ใช้เมื่อไม่มี API)
│   ├── .env.local               # Environment variables
│   └── next.config.ts           # Image domains config
├── packages/types/
│   └── index.ts                 # Shared types (ActivityDetail, etc.)
└── docs/
    ├── activity-page-and-backend-contract.md  # API contract
    └── FRONTEND-GUIDE.md         # ไฟล์นี้
```

---

## 🔄 การไหลของข้อมูลหน้า Activity Detail (`/activities/[id]`)

### 1️⃣ **User เข้า URL**
```
http://localhost:3000/activities/demo-theater-tech
```

### 2️⃣ **Next.js ทำงาน (Server Side)**
```typescript
// apps/web/app/activities/[id]/page.tsx
export async function ActivityPage({ params }) {
  const { id } = await params;
  const activity = await fetchActivityDetail(id);  // ← ดึงข้อมูล
  if (!activity) notFound();                        // ← ถ้าไม่มี → 404
  return <main>...</main>;
}
```

### 3️⃣ **fetchActivityDetail ทำอะไร?**
```typescript
// apps/web/lib/activity-api.ts
export async function fetchActivityDetail(id: string) {
  const base = apiBase();  // อ่านจาก NEXT_PUBLIC_API_URL
  
  if (base) {
    // มี API URL ตั้งไว้ → เรียก API
    const res = await fetch(`${base}/activities/${id}`);
    if (res.ok) return await res.json();
    if (res.status === 404) return null;
    throw new ActivityApiLoadError(...);
  }
  
  // ไม่มี API URL → ใช้ mock data
  return getMockActivityDetail(id);
}
```

**ตัดสินใจ:**
- ✅ `NEXT_PUBLIC_API_URL` ตั้ง + API สำเร็จ → ใช้ข้อมูลจริง
- ❌ `NEXT_PUBLIC_API_URL` ตั้ง + API ล้มเหลว → Error page
- ❌ `NEXT_PUBLIC_API_URL` ไม่ตั้ง → ใช้ mock data

### 4️⃣ **UI Components ทำงาน (Client Side)**

ข้อมูล `activity` ถูกส่งไปยัง components:

```tsx
// apps/web/app/activities/[id]/page.tsx
<ActivityHero activity={activity} />           {/* รูป + ชื่อ */}
<ActivityRegisterSection activity={activity} /> {/* ปุ่ม + modal */}
<ActivityAbout activity={activity} />          {/* คำอธิบาย + วิทยากร */}
<ActivityTimeline activity={activity} />       {/* กำหนดการ */}
<ActivityLocation activity={activity} />       {/* สถานที่ + แผนที่ */}
```

---

## 📝 ตัวอย่าง: Component ทำงานยังไง

### ActivityHero.tsx
```typescript
export function ActivityHero({ activity }) {
  return (
    <header>
      <Image
        src={activity.heroImageUrl}  // ← รูปพื้นหลัง
        alt={activity.name}
      />
      <h1>{activity.name}</h1>              {/* ← ชื่อกิจกรรม */}
      <p>{activity.venue.name}</p>          {/* ← ชื่อสถานที่ */}
    </header>
  );
}
```

### RegisterModal.tsx (Modal ลงทะเบียน)
```typescript
// State สำหรับ 3 ขั้นตอน
const [step, setStep] = useState<1 | 2 | 3>(1);
const [firstName, setFirstName] = useState("");
const [slip, setSlip] = useState<File | null>(null);
const [extraAnswers, setExtraAnswers] = useState({});

// Step 1: Validation
const phoneError = validatePhone(phone); // "เบอร์โทรต้องเป็น 10 หลัก"
const canNext = !phoneError && !firstNameError && !lastNameError;

// Step 2: อัปโหลดไฟล์
onChange={(e) => {
  const file = e.target.files?.[0];
  if (file.size > 5MB) setSlipError("ไฟล์ใหญ่เกิน 5MB");
  if (!validMime.has(file.type)) setSlipError("PNG/JPG/PDF เท่านั้น");
}}

// Step 3: ส่งฟอร์ม
async function handleSubmit() {
  const res = await postActivityRegistration(
    activity.id,
    { firstName, lastName, phone, extraAnswers },
    slip  // ← ไฟล์สลิป
  );
  if (res.ok) setFeedback({ message: "ลงทะเบียนสำเร็จ" });
}
```

---

## 🎨 UI/UX Components

| Component | ทำหน้าที่ | File |
|-----------|---------|------|
| **ActivityHero** | Hero image + ชื่อ + venue | `ActivityHero.tsx` |
| **ActivityAbout** | คำอธิบาย + highlights + speaker | `ActivityAbout.tsx` |
| **ActivityTimeline** | Timeline กำหนดการ | `ActivityTimeline.tsx` |
| **ActivityLocation** | สถานที่ + แผนที่ + ปุ่มเส้นทาง | `ActivityLocation.tsx` |
| **RegisterModal** | Form ลงทะเบียน (3 ขั้น) | `RegisterModal.tsx` |

---

## ⚙️ Setup & Configuration

### 1. Environment Variables (`.env.local`)
```env
# API endpoint (comment out = ใช้ mock data)
NEXT_PUBLIC_API_URL=http://localhost:3001

# Maps provider fallback
NEXT_PUBLIC_DIRECTIONS_FALLBACK=google

# Site URL for metadata
# NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

### 2. Image Domains (`next.config.ts`)
```typescript
images: {
  remotePatterns: [
    { protocol: "https", hostname: "images.unsplash.com" },
    { protocol: "https", hostname: "*.googleapis.com" },
    { protocol: "https", hostname: "maps.apple.com" },
    { protocol: "https", hostname: "*.openstreetmap.org" },
  ],
}
```

### 3. ฟอนต์ไทย (`apps/web/app/activities/layout.tsx`)
```typescript
import { Noto_Sans_Thai } from "next/font/google";
const notoThai = Noto_Sans_Thai({
  subsets: ["latin", "thai"],
  weight: ["400", "500", "600", "700"],
});
```

---

## 🚀 วิธี Run โปรเจค

### Install dependencies
```bash
npm install
```

### Run dev server
```bash
npm run dev
```

### เข้า
```
http://localhost:3000/activities/demo-theater-tech
```

---

## 📊 Data Types (Shared)

### ActivityDetail (จาก Backend)
```typescript
interface ActivityDetail {
  id: string;
  name: string;
  description: string;
  date: string;
  capacity: number;
  heroImageUrl: string;
  venue: {
    name: string;
    addressLines: string[];
    mapImageUrl?: string;
    directionsUrl?: string;
  };
  highlights: string[];
  speaker: {
    name: string;
    role: string;
    avatarUrl?: string;
  };
  schedule: {
    id: string;
    timeRange: string;
    title: string;
    description: string;
    highlight?: boolean;
  }[];
  priceThb: number;
  extraQuestions: {
    id: string;
    label: string;
    placeholder?: string;
  }[];
}
```

### ActivityRegistrationPayload (ส่งไป Backend)
```typescript
interface ActivityRegistrationPayload {
  firstName: string;
  lastName: string;
  phone: string;
  extraAnswers: Record<string, string>; // { "open-mic": "ตอบว่า..." }
}
// + paymentSlip file
```

---

## ✅ Validation Rules (Part 1 of Modal)

| Field | Rules | Error Message |
|-------|-------|---------------|
| firstName | min 2 chars | "ชื่อต้องไม่น้อยกว่า 2 ตัวอักษร" |
| lastName | min 2 chars | "นามสกุลต้องไม่น้อยกว่า 2 ตัวอักษร" |
| phone | 10 digits, starts 06/08/09 | "เบอร์โทรต้องเป็น 10 หลัก เริ่มด้วย 06/08/09" |

---

## 🔗 API Contract

### GET /activities/:id
```
Request:
GET http://localhost:3001/activities/demo-theater-tech

Response (200):
{
  "id": "demo-theater-tech",
  "name": "Navigating to the future of theater design",
  ...ActivityDetail fields...
}

Error (404):
→ Frontend ใช้ mock data หรือแสดง not-found page
```

### POST /activities/:id/register
```
Request:
POST http://localhost:3001/activities/demo-theater-tech/register
Content-Type: multipart/form-data

{
  firstName: "สมชาย",
  lastName: "ทดสอบ",
  phone: "0812345678",
  extraAnswers: "{\"open-mic\":\"ตอบว่าสนใจ\"}",
  paymentSlip: <File>
}

Response (200):
{
  "ok": true,
  "enrollmentId": "enrollment-123",
  "message": "ลงทะเบียนสำเร็จ"
}

Error (4xx/5xx):
{
  "ok": false,
  "message": "Error description"
}
```

---

## 📁 ไฟล์สำคัญ & ประโยชน์

| File | ประโยชน์ |
|------|---------|
| `apps/web/app/activities/[id]/page.tsx` | Entry point - ดึงข้อมูล + render UI |
| `apps/web/lib/activity-api.ts` | API calls - fetch/post + mock fallback |
| `apps/web/lib/mock-activity.ts` | Demo data - ใช้ขณะพัฒนา |
| `apps/web/components/activity/*` | UI components - render หน้า |
| `packages/types/index.ts` | Type definitions - ความปลอดภัย TS |
| `.env.local` | Configuration - API URL, fallback |

---

## 🧪 Testing Checklist

- [ ] เข้า `/activities/demo-theater-tech` → เห็นหน้าปกติ
- [ ] กดปุ่มลงทะเบียน → เปิด modal
- [ ] ใส่ข้อมูลผิด (เบอร์ 5 หลัก) → เห็น error message แดง
- [ ] ใส่ข้อมูลถูก → ปุ่มถัดไป enable
- [ ] Part 2: อัปโหลดไฟล์ > 5MB → error
- [ ] Part 3: ตอบคำถาม → สามารถส่งฟอร์มได้

---

## 🎯 Next Steps

1. **Backend Integration** → ตั้ง `NEXT_PUBLIC_API_URL` + เชื่อม Backend จริง
2. **PromptPay QR** → Backend ส่ง real QR code data
3. **Authentication** → ถ้าต้องล็อกอินก่อนลงทะเบียน
4. **Email Confirmation** → ส่งอีเมลยืนยันลงทะเบียน

---

**เขียน:** Frontend Team | **อัพเดต:** 2025-05-15
