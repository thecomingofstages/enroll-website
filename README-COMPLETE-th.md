# 📋 Enrollment Website — คู่มือนักพัฒนาฉบับสมบูรณ์

> โปรเจคแบบ monorepo สำหรับระบบลงทะเบียนกิจกรรม สร้างด้วย **Next.js 16** + **Express** + **TypeScript** + **Tailwind CSS**

**สถานะ**: Frontend ✅ เสร็จสมบูรณ์ | Backend ⏳ กำลังพัฒนา

---

## 📖 สารบัญ

1. [ภาพรวมโปรเจค](#-ภาพรวมโปรเจค)
2. [เทคโนโลยีที่ใช้](#-เทคโนโลยีที่ใช้)
3. [โครงสร้างโปรเจค](#-โครงสร้างโปรเจค)
4. [การติดตั้งและตั้งค่า](#-การติดตั้งและตั้งค่า)
5. [วิธีรันโปรเจค](#️-วิธีรันโปรเจค)
6. [สถาปัตยกรรม Frontend](#-สถาปัตยกรรม-frontend)
7. [อธิบายแต่ละ Component](#-อธิบายแต่ละ-component)
8. [การไหลของข้อมูลและ State Management](#-การไหลของข้อมูลและ-state-management)
9. [API Endpoints](#-api-endpoints)
10. [Environment Variables](#️-environment-variables)
11. [กฎการ Validate ข้อมูล](#-กฎการ-validate-ข้อมูล)
12. [คู่มือการ Deploy](#-คู่มือการ-deploy)
13. [การแก้ปัญหาที่พบบ่อย](#-การแก้ปัญหาที่พบบ่อย)

---

## 🎯 ภาพรวมโปรเจค

### นี่คืออะไร?

**Enrollment Website** คือเว็บแอปพลิเคชันแบบ full-stack ที่ให้ผู้ใช้:

- ดูรายละเอียดกิจกรรม/อีเวนต์
- ดูข้อมูลกิจกรรมครบถ้วน (รูปหลัก, รายละเอียด, วิทยากร, กำหนดการ, สถานที่)
- กรอกฟอร์มลงทะเบียน 3 ขั้นตอน
- อัปโหลดสลิปการชำระเงิน
- ตอบคำถามเพิ่มเติม

### ใครสร้าง?

- **องค์กร**: The Coming of Stages (TCOS)
- **สิทธิ์การใช้งาน**: MIT (2026)
- **ประเภท**: Monorepo (Frontend + Backend + Shared Types)

### ฟีเจอร์หลัก

✅ **Server-Side Rendered** — โหลดเร็ว, รองรับ SEO  
✅ **ฟอร์มลงทะเบียน 3 ขั้นตอน** — UX ที่ใช้งานง่าย  
✅ **Validation แบบ Real-time** — ข้อความแจ้งเตือนภาษาไทย  
✅ **รองรับภาษาไทย** — ฟอนต์ Noto Sans Thai  
✅ **Responsive Design** — Mobile-first ด้วย Tailwind CSS  
✅ **รองรับข้อมูล Mock** — พัฒนาได้โดยไม่ต้องมี Backend  
✅ **TypeScript Strict Mode** — Type-safe ตลอดทั้งโปรเจค  
✅ **Error Boundaries** — จัดการ error อย่างสวยงาม

---

## 🛠 เทคโนโลยีที่ใช้

### Frontend (apps/web)

| เทคโนโลยี        | เวอร์ชัน | หน้าที่                                   |
| ---------------- | -------- | ----------------------------------------- |
| **Next.js**      | 16.2.6   | React App Router, SSR, File-based routing |
| **React**        | 19.2.4   | UI library                                |
| **TypeScript**   | 5.x      | ความปลอดภัยของ Type                       |
| **Tailwind CSS** | 4.x      | CSS framework แบบ utility-first           |
| **PostCSS**      | 8.5.10   | ประมวลผล CSS                              |
| **next/font**    | Built-in | Google Fonts (Geist, Noto Sans Thai)      |

### Backend (apps/api)

| เทคโนโลยี      | เวอร์ชัน | หน้าที่                |
| -------------- | -------- | ---------------------- |
| **Express**    | 4.18.2   | HTTP server framework  |
| **Node.js**    | 16+      | JavaScript runtime     |
| **TypeScript** | 6.x      | ความปลอดภัยของ Type    |
| **nodemon**    | 3.1.14   | Auto-reload ในโหมด dev |

### Shared (packages/types)

| เทคโนโลยี          | หน้าที่                  |
| ------------------ | ------------------------ |
| **TypeScript**     | นิยาม Type ที่ใช้ร่วมกัน |
| **npm workspaces** | โครงสร้าง Monorepo       |

### เครื่องมือพัฒนา

| เครื่องมือ       | หน้าที่                        |
| ---------------- | ------------------------------ |
| **Turborepo**    | จัดการ task ใน Monorepo        |
| **ESLint**       | ตรวจสอบคุณภาพโค้ด              |
| **concurrently** | รัน dev server หลายตัวพร้อมกัน |

---

## 📁 โครงสร้างโปรเจค

```
enroll-website/                          # Root monorepo
├── README.md                            # README หลักของโปรเจค
├── package.json                         # ตั้งค่า workspace (npm v9+)
├── package-lock.json                    # Lock file ของ dependency
├── LICENSE                              # MIT License
├── .gitignore                           # กฎ Git ignore
│
├── apps/
│   ├── web/                             # Next.js Frontend App
│   │   ├── .env.local                   # ⚙️ Environment variables (local)
│   │   ├── .gitignore                   # Ignore patterns
│   │   ├── package.json                 # Dependencies
│   │   ├── tsconfig.json                # TypeScript config (strict mode)
│   │   ├── next.config.ts               # Next.js config (image domains)
│   │   ├── postcss.config.mjs           # PostCSS + Tailwind
│   │   ├── eslint.config.mjs            # กฎ ESLint
│   │   ├── CLAUDE.md                    # AI context (คำเตือนเวอร์ชัน Next.js)
│   │   ├── AGENTS.md                    # อ้างอิง AI agents
│   │   │
│   │   ├── app/                         # 📄 Next.js App Router
│   │   │   ├── layout.tsx               # Layout หลัก (ฟอนต์ Geist, metadata)
│   │   │   ├── page.tsx                 # หน้าแรก (index route)
│   │   │   ├── globals.css              # Global styles (Tailwind + CSS vars)
│   │   │   ├── favicon.ico              # Favicon
│   │   │   │
│   │   │   └── activities/              # Route กิจกรรม
│   │   │       ├── layout.tsx           # 🇹🇭 Layout ฟอนต์ไทย (Noto_Sans_Thai)
│   │   │       └── [id]/                # Dynamic segment {id}
│   │   │           ├── page.tsx         # 📄 หน้ารายละเอียดกิจกรรม (Server Component)
│   │   │           ├── error.tsx        # 🚨 Error boundary (500 errors)
│   │   │           └── not-found.tsx    # หน้า 404 Not Found
│   │   │
│   │   ├── components/                  # 🧩 Component ที่ใช้ซ้ำได้
│   │   │   └── activity/
│   │   │       ├── ActivityHero.tsx     # รูปหลัก + ชื่อ + ชื่อสถานที่
│   │   │       ├── ActivityAbout.tsx    # รายละเอียด + highlights + วิทยากร
│   │   │       ├── ActivityTimeline.tsx # Timeline กำหนดการ
│   │   │       ├── ActivityLocation.tsx # แผนที่ + ที่อยู่ + ปุ่มนำทาง
│   │   │       └── RegisterModal.tsx    # ⭐ Modal ลงทะเบียน 3 ขั้นตอน + validation
│   │   │
│   │   ├── lib/                         # 🔧 Utilities & Helpers
│   │   │   ├── activity-api.ts          # fetchActivityDetail(), postActivityRegistration()
│   │   │   ├── mock-activity.ts         # ข้อมูลตัวอย่าง (demo-theater-tech)
│   │   │   ├── directions-url.ts        # สร้าง URL แผนที่ (Google/Apple/OSM)
│   │   │   └── site-url.ts              # แก้ไข base URL ของ Metadata
│   │   │
│   │   └── public/                      # 🖼️ Static assets
│   │       ├── file.svg
│   │       ├── globe.svg
│   │       ├── next.svg
│   │       ├── vercel.svg
│   │       └── window.svg
│   │
│   └── api/                             # Node.js/Express Backend App
│       ├── package.json                 # Dependencies
│       ├── tsconfig.json                # TypeScript config (CommonJS)
│       │
│       └── src/
│           └── index.ts                 # ⏳ Express server (พื้นฐาน, กำลังพัฒนา)
│
├── packages/
│   └── types/                           # 📦 นิยาม Type ที่ใช้ร่วมกัน
│       ├── package.json                 # Type package metadata
│       └── index.ts                     # 🔤 TypeScript interfaces ทั้งหมด
│
└── docs/                                # 📚 เอกสาร
    ├── FRONTEND-GUIDE.md                # คู่มือ Frontend แบบละเอียด
    ├── activity-page-and-backend-contract.md # ข้อกำหนด API
    └── README-COMPLETE.md               # ไฟล์นี้ (คู่มือฉบับสมบูรณ์)
```

### อธิบายโฟลเดอร์แต่ละส่วน

#### `app/` (Next.js App Router)

- **Server Components** เป็นค่าเริ่มต้น (ทุกหน้าเป็น server-rendered)
- **Dynamic Routes**: `[id]` = URL parameter (เช่น `/activities/demo-theater-tech`)
- **จัดการ Error**: `error.tsx` ดักจับ error ที่ throw; `not-found.tsx` สำหรับ 404
- **Layout ซ้อนกัน**: `activities/layout.tsx` ครอบทุก route `/activities/*`

#### `components/activity/`

- ทุก component อยู่ใน **โฟลเดอร์เดียวกัน** เพื่อค้นหาง่าย
- `RegisterModal.tsx` ใหญ่ที่สุด (395 บรรทัด) มี logic ฟอร์ม 3 ขั้นตอน
- Component อื่นๆ เป็น **presentational pure** (ไม่มี state)

#### `lib/`

- **API Layer**: `activity-api.ts` จัดการ fetch/mock fallback logic
- **Config Helpers**: `directions-url.ts`, `site-url.ts` สำหรับสร้าง URL
- **ข้อมูล Mock**: `mock-activity.ts` ให้ข้อมูลตัวอย่าง (ใช้เมื่อไม่มี API)

#### `packages/types/`

- **แหล่งข้อมูลเดียว** สำหรับ TypeScript interfaces ทั้งหมด
- ใช้ทั้งใน `apps/web` และ `apps/api`
- ทำให้ API contract สอดคล้องกัน

---

## 🚀 การติดตั้งและตั้งค่า

### สิ่งที่ต้องมีก่อน

```bash
✅ Node.js >= 16 (ตรวจสอบ: node --version)
✅ npm >= 9 (ตรวจสอบ: npm --version)
✅ Git (ตรวจสอบ: git --version)
```

### ขั้นตอนที่ 1: Clone Repository

```bash
git clone https://github.com/your-org/enroll-website.git
cd enroll-website
```

### ขั้นตอนที่ 2: ติดตั้ง Dependencies

```bash
# ติดตั้ง dependencies ระดับ root
npm install

# คำสั่งนี้จะติดตั้งอัตโนมัติ:
# - apps/web dependencies
# - apps/api dependencies
# - packages/types dependencies
# (เพราะเป็น monorepo workspaces ใน package.json)
```

### ขั้นตอนที่ 3: ตั้งค่า Environment Variables

#### สร้าง `.env.local` สำหรับ Frontend

```bash
# apps/web/.env.local

# URL ของ API (ปล่อยว่างไว้เพื่อใช้ข้อมูล mock)
# NEXT_PUBLIC_API_URL=http://localhost:3001

# ผู้ให้บริการแผนที่สำรอง (google | apple | osm)
NEXT_PUBLIC_DIRECTIONS_FALLBACK=google

# URL ของเว็บสำหรับ Open Graph metadata (ไม่บังคับ)
# NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

**อธิบาย Environment Variables:**

| ตัวแปร                            | ประเภท | ค่าเริ่มต้น | หน้าที่                                                                       |
| --------------------------------- | ------ | ----------- | ----------------------------------------------------------------------------- |
| `NEXT_PUBLIC_API_URL`             | string | (ว่าง)      | URL ของ Backend API ถ้าไม่ตั้งค่า แอปจะใช้ข้อมูล mock                         |
| `NEXT_PUBLIC_DIRECTIONS_FALLBACK` | string | `google`    | เมื่อไม่มี venue.directionsUrl ให้ใช้ผู้ให้บริการแผนที่นี้ (google/apple/osm) |
| `NEXT_PUBLIC_SITE_URL`            | string | (ไม่บังคับ) | Base URL สำหรับ Open Graph metadata                                           |

**ทำไมต้องใช้ NEXT*PUBLIC*?**

- Prefix `NEXT_PUBLIC_` ทำให้ตัวแปรเข้าถึงได้จาก browser
- ตัวแปรที่ไม่มี prefix จะเป็น server-only
- ช่วยให้ client-side component อ่าน API URL ได้

### ขั้นตอนที่ 4: ตรวจสอบการติดตั้ง

```bash
# ตรวจสอบว่า dependencies ติดตั้งแล้ว
npm list @enroll-website/types

# ควรแสดงเวอร์ชัน (เช่น 1.0.0) ✅
```

---

## ▶️ วิธีรันโปรเจค

### โหมด Development (แนะนำ)

```bash
# รันทุกแอปพร้อมกัน (web + api)
npm run dev

# ผลลัพธ์:
# Next.js dev server: http://localhost:3000
# Express dev server: http://localhost:3001
```

### รันเฉพาะ Frontend

```bash
cd apps/web
npm run dev

# Next.js dev server: http://localhost:3000
```

### รันเฉพาะ Backend

```bash
cd apps/api
npm run dev

# Express dev server: http://localhost:3001
# Watch mode เปิดอยู่ (nodemon)
```

### เข้าใช้งานแอป

1. **หน้าแรก**: http://localhost:3000
2. **กิจกรรมตัวอย่าง**: http://localhost:3000/activities/demo-theater-tech
3. **ตรวจสอบ Backend**: http://localhost:3001/health

### Build สำหรับ Production

```bash
# Build ทุกแอป
npm run build

# ทดสอบ production build
npm run start

# รัน:
# - Next.js production server port 3000
# - Node.js production server port 3001
```

---

## 🧠 สถาปัตยกรรม Frontend

### การไหลของข้อมูล: URL → Server → Client

```
ผู้ใช้พิมพ์ URL
    ↓
http://localhost:3000/activities/demo-theater-tech
    ↓
Next.js router จับคู่: app/activities/[id]/page.tsx
    ↓
page.tsx ดึง { id } จาก URL params
    ↓
เรียก: fetchActivityDetail("demo-theater-tech")
    ↓
ตรวจสอบ: มี NEXT_PUBLIC_API_URL ไหม?
    ├─ มี → ดึงจาก Backend API
    │   ├─ สำเร็จ (200) → ใช้ข้อมูลจาก API
    │   ├─ 404 → return null → notFound()
    │   └─ Error (500, etc) → Throw ActivityApiLoadError → error.tsx
    │
    └─ ไม่มี → ใช้ข้อมูล mock (ไม่มีการเรียกเครือข่าย)
    ↓
แสดงผล UI ด้วยข้อมูล
    ├─ <ActivityHero activity={activity} />
    ├─ <ActivityRegisterSection activity={activity} />
    ├─ <ActivityAbout activity={activity} />
    ├─ <ActivityTimeline activity={activity} />
    └─ <ActivityLocation activity={activity} />
```

### Server vs Client Components

| Component                      | ประเภท     | เหตุผล            | State | ดึงข้อมูล |
| ------------------------------ | ---------- | ----------------- | ----- | --------- |
| `app/activities/[id]/page.tsx` | **Server** | SSR, async data   | ❌    | ✅        |
| `ActivityHero.tsx`             | **Server** | แสดงผลอย่างเดียว  | ❌    | ❌        |
| `ActivityAbout.tsx`            | **Server** | แสดงผลอย่างเดียว  | ❌    | ❌        |
| `ActivityTimeline.tsx`         | **Server** | แสดงผลอย่างเดียว  | ❌    | ❌        |
| `ActivityLocation.tsx`         | **Server** | แสดงผลอย่างเดียว  | ❌    | ❌        |
| `RegisterModal.tsx`            | **Client** | ฟอร์ม interactive | ✅    | ✅ (POST) |

**กฎสำคัญ:**

- Server components = ค่าเริ่มต้น (JS bundle เล็กกว่า)
- Client components = ใช้เมื่อจำเป็นเท่านั้น (directive `"use client"`)
- RegisterModal ต้องการ state สำหรับฟอร์ม จึงเป็น client component

---

## 🧩 อธิบายแต่ละ Component

### 1. ActivityHero.tsx (29 บรรทัด)

**หน้าที่**: แสดงส่วนหัวที่ดึงดูดสายตา

```typescript
export function ActivityHero({ activity }: { activity: ActivityDetail }) {
  return (
    <header className="relative h-[min(52vh,420px)] overflow-hidden">
      {/* รูปหลักพร้อม gradient overlay */}
      <Image
        src={activity.heroImageUrl}
        alt={`${activity.name} hero`}
        fill
        priority                         // โหลดก่อน
        className="object-cover opacity-90"
      />

      {/* Gradient overlay: ดำที่ด้านล่างเพื่อให้อ่านข้อความง่าย */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-black/20" />

      {/* ข้อความทับ: สถานที่ + ชื่อ */}
      <div className="absolute bottom-0 text-white">
        <p className="text-violet-200">{activity.venue.name}</p>
        <h1 className="text-3xl font-semibold">{activity.name}</h1>
      </div>
    </header>
  );
}
```

**Props**: `activity: ActivityDetail` — ข้อมูลกิจกรรมทั้งหมด

**ผลลัพธ์**:

```
┌─────────────────────────────┐
│   [รูปหลัก]                 │
│   (gradient overlay)        │
│                             │
│   The Indigo Grand Hall  ←─ venue.name
│   Navigating to the      ←─ activity.name
│   future of theater      │
└─────────────────────────────┘
```

---

### 2. ActivityAbout.tsx (53 บรรทัด)

**หน้าที่**: ส่วนข้อมูลกิจกรรม ได้แก่ รายละเอียด, highlights, วิทยากร

**ข้อมูลที่ใช้**:

- `activity.description` (string)
- `activity.highlights[]` (array of string)
- `activity.speaker` (object)

**ผลลัพธ์**:

```
┌─ เกี่ยวกับกิจกรรม ─────────────────────┐
│                                        │
│ [รายละเอียดกิจกรรม]                    │
│                                        │
│  ┌──────────────────┐  ┌─────────────┐ │
│  │ สิ่งที่จะได้รับ   │  │ วิทยากร     │ │
│  │ ✓ Highlight 1   │  │ [รูปโปรไฟล์] │ │
│  │ ✓ Highlight 2   │  │ ชื่อ         │ │
│  │ ✓ Highlight 3   │  │ ตำแหน่ง     │ │
│  └──────────────────┘  └─────────────┘ │
└────────────────────────────────────────┘
```

---

### 3. ActivityTimeline.tsx (33 บรรทัด)

**หน้าที่**: แสดง timeline กำหนดการกิจกรรมแบบ visual

**ข้อมูลที่ใช้**: `activity.schedule[]` (array ของรายการกำหนดการ)

**ผลลัพธ์**:

```
┌─ กำหนดการกิจกรรม ──────────────┐
│                                │
│  ● 10:00 - 11:30              │ ← highlight=true (จุดสีม่วง)
│    ดิจิทัลโปรซีเนียม           │
│    [รายละเอียด...]              │
│                                │
│  ○ 11:30 - 13:00              │
│    ช่วงย่อย: เสียงเชิงพื้นที่  │
│    [รายละเอียด...]              │
└────────────────────────────────┘
```

---

### 4. ActivityLocation.tsx (44 บรรทัด)

**หน้าที่**: แสดงสถานที่, ที่อยู่, แผนที่, ปุ่มนำทาง

**ข้อมูลที่ใช้**: `activity.venue` (object ที่มี name, addressLines, directionsUrl)

**Logic การนำทาง** (`directions-url.ts`):

```typescript
export function directionsHref(venue: ActivityVenue): string {
  // ถ้ามี URL ที่ระบุไว้ ให้ใช้เลย
  if (venue.directionsUrl?.trim()) return venue.directionsUrl;

  // ถ้าไม่มี สร้างจากชื่อ + ที่อยู่ + env provider
  const query = [venue.name, ...venue.addressLines].join(", ");

  switch (process.env.NEXT_PUBLIC_DIRECTIONS_FALLBACK) {
    case "apple":
      return `https://maps.apple.com/?q=${encodeURIComponent(query)}`;
    case "osm":
      return `https://www.openstreetmap.org/search?query=${encodeURIComponent(query)}`;
    default: // google
      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  }
}
```

---

### 5. RegisterModal.tsx (395 บรรทัด) ⭐ **ซับซ้อนที่สุด**

**หน้าที่**: ฟอร์มลงทะเบียนหลายขั้นตอนพร้อม validation

#### ภาพรวมโครงสร้าง

```
RegisterModal (parent)
├── ขั้นตอนที่ 1: ข้อมูลส่วนตัว (ชื่อ, นามสกุล, เบอร์โทร)
│   └── Validation: อย่างน้อย 2 ตัวอักษร, เบอร์โทร 10 หลัก
├── ขั้นตอนที่ 2: การชำระเงิน (QR PromptPay + อัปโหลดสลิป)
│   └── Validation: ไฟล์ < 5MB, mime type (PNG/JPG/PDF)
└── ขั้นตอนที่ 3: คำถามเพิ่มเติม (dynamic จาก activity.extraQuestions)
    └── Validation: textarea input
```

#### การจัดการ State

```typescript
const [step, setStep] = useState<1 | 2 | 3>(1); // ขั้นตอนปัจจุบัน
const [firstName, setFirstName] = useState(""); // ฟิลด์ฟอร์ม
const [lastName, setLastName] = useState(""); // ฟิลด์ฟอร์ม
const [phone, setPhone] = useState(""); // ฟิลด์ฟอร์ม
const [slip, setSlip] = useState<File | null>(null); // ไฟล์ที่อัปโหลด
const [extraAnswers, setExtraAnswers] = useState({}); // คำถาม-คำตอบ dynamic
const [submitting, setSubmitting] = useState(false); // สถานะ loading
const [feedback, setFeedback] = useState(null); // ข้อความสำเร็จ/ผิดพลาด
```

#### ฟังก์ชัน Validation

```typescript
function validateFirstName(name: string): string | null {
  const trimmed = name.trim();
  if (!trimmed) return "กรุณากรอกชื่อ";
  if (trimmed.length < 2) return "ชื่อต้องไม่น้อยกว่า 2 ตัวอักษร";
  return null; // ✅ ถูกต้อง
}

function validatePhone(phone: string): string | null {
  const trimmed = phone.trim();
  if (!trimmed) return "กรุณากรอกเบอร์โทร";

  const digits = trimmed.replace(/\D/g, ""); // เอาเฉพาะตัวเลข
  if (digits.length !== 10) return "เบอร์โทรต้องเป็น 10 หลัก";

  // ตรวจสอบ prefix: ตัวเลขที่ 2 ต้องเป็น 6, 8, หรือ 9 (06x, 08x, 09x)
  if (!["6", "8", "9"].includes(digits[1])) {
    return "เบอร์โทรต้องเริ่มด้วย 06, 08 หรือ 09";
  }

  return null; // ✅ ถูกต้อง
}
```

**รูปแบบเบอร์โทรไทย**:

- ความยาว: **10 หลัก**
- ขึ้นต้นด้วย: **06**, **08**, หรือ **09**
- ตัวอย่างที่ถูก: 0812345678 ✅, 0651234567 ✅, 0912345678 ✅
- ตัวอย่างที่ผิด: 0712345678 ❌, 0123456789 ❌

---

## 📊 การไหลของข้อมูลและ State Management

### ขั้นตอนการลงทะเบียน

```
ผู้ใช้กดปุ่ม "ลงทะเบียน"
    ↓
ActivityRegisterSection state: open = true
    ↓
<RegisterModal open={true} activity={activity} />
    ↓
┌─ ขั้นตอนที่ 1: ข้อมูลส่วนตัว ──────────┐
│ กรอก: ชื่อ, นามสกุล, เบอร์โทร          │
│ Validation: อย่างน้อย 2 ตัว, 10 หลัก   │
│ ปุ่ม: ถัดไป (disabled/enabled)          │
└─────────────────────────────────────────┘
    ↓ กด "ถัดไป" (เฉพาะเมื่อผ่าน validation)
    ↓
┌─ ขั้นตอนที่ 2: การชำระเงิน ─────────────┐
│ แสดง: QR PromptPay                      │
│ อัปโหลด: สลิปการชำระเงิน (PNG/JPG/PDF)  │
│ Validation: ขนาดไฟล์, MIME type         │
│ ปุ่ม: ถัดไป (disabled/enabled)          │
└─────────────────────────────────────────┘
    ↓ กด "ถัดไป"
    ↓
┌─ ขั้นตอนที่ 3: คำถามเพิ่มเติม ──────────┐
│ คำถาม dynamic จาก activity.             │
│ extraQuestions[]                        │
│ กรอก: textarea สำหรับแต่ละคำถาม         │
│ ปุ่ม: ยืนยันการลงทะเบียน               │
└─────────────────────────────────────────┘
    ↓ กด "ยืนยันการลงทะเบียน"
    ↓
เรียก: postActivityRegistration()
    ├─ สร้าง FormData พร้อมข้อมูลทั้งหมด
    ├─ POST ไปที่ /activities/{id}/register
    └─ Response: { ok, message, enrollmentId }
    ↓
if (ok) {
  แสดงข้อความสำเร็จ
  หลัง 900ms: ปิด modal
} else {
  แสดงข้อความ error (modal ยังเปิดอยู่)
}
```

### โครงสร้าง FormData (ส่งไป Backend)

```javascript
const form = new FormData();
form.set("firstName", "สมชาย");
form.set("lastName", "ทดสอบ");
form.set("phone", "0812345678");
form.set(
  "extraAnswers",
  JSON.stringify({
    "open-mic": "ตอบว่าสนใจ",
  }),
);
form.set("paymentSlip", file); // ข้อมูลไฟล์แบบ binary

// POST /activities/demo-theater-tech/register
// Content-Type: multipart/form-data (อัตโนมัติกับ FormData)
```

---

## 🔗 API Endpoints

### ภาพรวม

| Method | Endpoint                   | หน้าที่              | สถานะ             |
| ------ | -------------------------- | -------------------- | ----------------- |
| `GET`  | `/activities/:id`          | ดึงรายละเอียดกิจกรรม | ✅ Frontend พร้อม |
| `POST` | `/activities/:id/register` | ส่งการลงทะเบียน      | ✅ Frontend พร้อม |
| `GET`  | `/health`                  | ตรวจสอบสถานะ API     | ✅ พัฒนาแล้ว      |

### 1. GET /activities/:id

**Request**:

```http
GET http://localhost:3001/activities/demo-theater-tech
```

**Response (200 OK)**:

```json
{
  "id": "demo-theater-tech",
  "name": "Navigating to the future of theater design",
  "description": "เวิร์กช็อปเชิงลึกเกี่ยวกับเทคนิคการแสดง...",
  "date": "2026-06-21T09:00:00+07:00",
  "capacity": 80,
  "heroImageUrl": "https://images.unsplash.com/...",
  "venue": {
    "name": "The Indigo Grand Hall",
    "addressLines": ["24 Exhibition Way", "SE1 7PB, London"],
    "mapImageUrl": "https://images.unsplash.com/...",
    "directionsUrl": "https://maps.app.goo.gl/..."
  },
  "highlights": ["..."],
  "speaker": { "name": "Marcus Thorne", "role": "...", "avatarUrl": "..." },
  "schedule": [
    {
      "id": "s1",
      "timeRange": "10:00-11:30",
      "title": "...",
      "highlight": true
    }
  ],
  "priceThb": 150,
  "extraQuestions": [
    { "id": "open-mic", "label": "สนใจ Open Mic?", "placeholder": "..." }
  ]
}
```

**Response (404 Not Found)**:

```json
{ "status": 404, "message": "Activity not found" }
```

**Response (500 Server Error)**:

```json
{ "status": 500, "message": "Database error" }
```

---

### 2. POST /activities/:id/register

**Request**:

```http
POST http://localhost:3001/activities/demo-theater-tech/register
Content-Type: multipart/form-data

firstName=สมชาย
lastName=ทดสอบ
phone=0812345678
extraAnswers={"open-mic":"ตอบว่าสนใจ"}
paymentSlip=<ข้อมูลไฟล์แบบ binary>
```

**ฟิลด์ FormData**:

| ฟิลด์          | ประเภท        | จำเป็น | Validation                | ตัวอย่าง             |
| -------------- | ------------- | ------ | ------------------------- | -------------------- |
| `firstName`    | string        | ✅     | อย่างน้อย 2 ตัวอักษร      | "สมชาย"              |
| `lastName`     | string        | ✅     | อย่างน้อย 2 ตัวอักษร      | "ทดสอบ"              |
| `phone`        | string        | ✅     | 10 หลัก, ขึ้นต้น 06/08/09 | "0812345678"         |
| `extraAnswers` | string (JSON) | ✅     | JSON dict ที่ถูกต้อง      | `{"open-mic":"ตอบ"}` |
| `paymentSlip`  | File          | ✅     | PNG/JPG/PDF, <5MB         | binary               |

**Response (200 OK)**:

```json
{ "ok": true, "enrollmentId": "enrollment-12345", "message": "ลงทะเบียนสำเร็จ" }
```

**Response (400 Bad Request)**:

```json
{ "ok": false, "message": "เบอร์โทรไม่ถูกต้อง" }
```

---

### 3. GET /health

```http
GET http://localhost:3001/health
```

**Response (200 OK)**:

```json
{ "status": "ok", "timestamp": "2026-05-15T10:30:00Z" }
```

**หน้าที่**: ตรวจสอบสถานะสำหรับ deployment monitoring / load balancers

---

## ⚙️ Environment Variables

### อ้างอิงครบถ้วน

#### `apps/web/.env.local`

```bash
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# การตั้งค่า API
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# URL ของ Backend API
# - ปล่อยว่างไว้เพื่อใช้ข้อมูล MOCK (ไม่มีการเรียกเครือข่าย)
# - ตั้งค่าเป็น http://localhost:3001 สำหรับพัฒนากับ backend
# - ตั้งค่าเป็น https://api.example.com สำหรับ production
# - ไม่ต้องใส่ trailing slash
NEXT_PUBLIC_API_URL=http://localhost:3001

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# การตั้งค่าแผนที่
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# ผู้ให้บริการแผนที่สำรองเมื่อไม่มี venue.directionsUrl
# ตัวเลือก: google (ค่าเริ่มต้น) | apple | osm (OpenStreetMap)
NEXT_PUBLIC_DIRECTIONS_FALLBACK=google

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Metadata & SEO
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# URL ของเว็บสำหรับ Open Graph metadata (ใช้ตอนแชร์ social)
# - ปล่อยว่างไว้ให้ auto-detect จาก VERCEL_URL (บน Vercel)
# - ต้องใส่ protocol (https://)
# NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

#### Backend `.env` (apps/api) — _ยังไม่ได้สร้าง_

เมื่อพัฒนา Backend แล้วให้เพิ่ม:

```bash
# ตั้งค่า Server
PORT=3001
NODE_ENV=development

# Database
DATABASE_URL=postgresql://user:pass@localhost/enrollment_db

# Auth (ถ้าต้องการภายหลัง)
JWT_SECRET=your-secret-key-here

# บริการภายนอก
PROMPTPAY_API_KEY=...
EMAIL_SERVICE_KEY=...
```

---

## ✅ กฎการ Validate ข้อมูล

### Validation ฟอร์ม (RegisterModal ขั้นตอนที่ 1)

Validation ทั้งหมดทำ **ฝั่ง client** ก่อนส่งไป backend

#### การ Validate ชื่อ (firstName)

| ข้อมูลที่กรอก | ผ่าน? | เหตุผล              |
| ------------- | ----- | ------------------- |
| "" (ว่าง)     | ❌    | ฟิลด์จำเป็น         |
| "ก"           | ❌    | 1 ตัวอักษรเท่านั้น  |
| "กษ"          | ✅    | 2 ตัวอักษร (ไทย)    |
| "John"        | ✅    | 4 ตัวอักษร (อังกฤษ) |
| "สมชาย"       | ✅    | 5 ตัวอักษร (ไทย)    |

#### การ Validate นามสกุล (lastName)

ใช้กฎเดียวกับชื่อ

#### การ Validate เบอร์โทร (phone)

**Prefix เบอร์โทรไทย**:

- `06` — รองรับหลายผู้ให้บริการ
- `08` — มาตรฐานมือถือไทย
- `09` — มาตรฐานมือถือไทย

| ข้อมูลที่กรอก  | ตัวเลข     | ผ่าน? | เหตุผล              |
| -------------- | ---------- | ----- | ------------------- |
| ""             | N/A        | ❌    | ฟิลด์จำเป็น         |
| "08-1234-5678" | 0812345678 | ✅    | 10 หลัก, prefix 08  |
| "06 51234567"  | 0651234567 | ✅    | 10 หลัก, prefix 06  |
| "0912345678"   | 0912345678 | ✅    | 10 หลัก, prefix 09  |
| "081234567"    | 081234567  | ❌    | แค่ 9 หลัก          |
| "0712345678"   | 0712345678 | ❌    | prefix 07 ไม่รองรับ |

#### การ Validate ไฟล์สลิป (paymentSlip)

```
ขนาดสูงสุด: 5MB
ประเภทไฟล์ที่รองรับ: PNG, JPG, PDF
```

| ไฟล์           | ขนาด | ประเภท          | ผ่าน? | เหตุผล        |
| -------------- | ---- | --------------- | ----- | ------------- |
| receipt.png    | 2MB  | image/png       | ✅    | PNG, ขนาดปกติ |
| receipt.jpg    | 3MB  | image/jpeg      | ✅    | JPG, ขนาดปกติ |
| receipt.pdf    | 1MB  | application/pdf | ✅    | PDF, ขนาดปกติ |
| receipt.pdf    | 6MB  | application/pdf | ❌    | เกิน 5MB      |
| receipt.gif    | 2MB  | image/gif       | ❌    | GIF ไม่รองรับ |
| screenshot.bmp | 4MB  | image/bmp       | ❌    | BMP ไม่รองรับ |

---

## 🚀 คู่มือการ Deploy

### ตัวเลือกที่ 1: Deploy ไปยัง Vercel (แนะนำสำหรับ Next.js)

Vercel คือบริษัทที่อยู่เบื้องหลัง Next.js และ deploy ได้อย่างราบรื่น

#### ขั้นตอนที่ 1: เตรียม Repository

```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

#### ขั้นตอนที่ 2: เชื่อมต่อกับ Vercel

1. ไปที่ https://vercel.com/new
2. คลิก "Import Git Repository"
3. เลือก repo `enroll-website`
4. Vercel ตรวจพบ **Turborepo** อัตโนมัติ

#### ขั้นตอนที่ 3: ตั้งค่า Environment Variables

ใน Vercel dashboard:

```
NEXT_PUBLIC_API_URL = https://api.example.com
NEXT_PUBLIC_DIRECTIONS_FALLBACK = google
NEXT_PUBLIC_SITE_URL = https://your-domain.com
```

#### ขั้นตอนที่ 4: ตั้งค่า Root Settings

- **Framework Preset**: Turborepo (ควร auto-select)
- **Root Directory**: `./` (root)
- **Build Command**: `npm run build` (auto-detected)
- **Output Directory**: `.next` (auto-detected)

#### ขั้นตอนที่ 5: Deploy

กด "Deploy" — Vercel build และ deploy อัตโนมัติ

**ผลลัพธ์**:

- Frontend: `https://your-project.vercel.app/`
- Auto-scale, CDN caching, SSL รวมอยู่แล้ว
- Auto-deploy เมื่อ push ไปที่ main

---

### ตัวเลือกที่ 2: Deploy ผ่าน Docker (Self-hosted)

สำหรับ deploy ไปยัง AWS, GCP, DigitalOcean ฯลฯ

#### สร้าง Dockerfile

```dockerfile
# apps/web/Dockerfile

FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/web ./apps/web
COPY packages/types ./packages/types

RUN npm ci
RUN npm run build --workspace=apps/web

FROM node:20-alpine
WORKDIR /app

COPY --from=builder /app/apps/web/.next ./apps/web/.next
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder /app/apps/web/package.json ./apps/web/

RUN npm ci --omit=dev

EXPOSE 3000
CMD ["npm", "--workspace=apps/web", "start"]
```

#### Build & รันใน Local

```bash
docker build -t enrollment-web:latest -f apps/web/Dockerfile .
docker run -p 3000:3000 -e NEXT_PUBLIC_API_URL=https://api.com enrollment-web:latest
```

---

### ตัวเลือกที่ 3: Deploy บน Linux Server (Self-hosted)

#### SSH เข้า Server

```bash
ssh user@your-server.com
```

#### Clone และ Build

```bash
cd /var/www
git clone https://github.com/your-org/enroll-website.git
cd enroll-website
npm install
npm run build
```

#### ตั้งค่า Process Manager (PM2)

```bash
npm install -g pm2

# Start frontend
pm2 start "npm --workspace=apps/web start" --name "enrollment-web"

# Start backend
pm2 start "npm --workspace=apps/api start" --name "enrollment-api"

# เปิดให้ restart อัตโนมัติเมื่อ reboot
pm2 startup
pm2 save
```

#### ตั้งค่า Nginx Reverse Proxy

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api {
        proxy_pass http://localhost:3001;
    }
}
```

#### ตั้งค่า SSL (Let's Encrypt)

```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

### Checklist ก่อน Deploy

- [ ] ลบ `console.log` ทั้งหมด
- [ ] ตั้งค่า `NEXT_PUBLIC_*` variables ครบ
- [ ] ทดสอบส่งฟอร์มกับ backend จริง
- [ ] ตรวจสอบ responsive บนมือถือ
- [ ] ยืนยันว่ารูปภาพโหลดได้ (CDN domains ถูกต้อง)
- [ ] ทดสอบหน้า error (404, 500)
- [ ] รัน `npm run build` ใน local ก่อน (ต้องไม่มี error)
- [ ] ตั้งค่า security headers (CSP, X-Frame-Options)
- [ ] เปิด CORS ถ้าจำเป็น

---

## 🐛 การแก้ปัญหาที่พบบ่อย

### ปัญหา: "Cannot find module '@enroll-website/types'"

**สาเหตุ**: Monorepo workspace ยังไม่ได้ link

**วิธีแก้**:

```bash
rm -rf node_modules package-lock.json
npm install
```

---

### ปัญหา: "NEXT_PUBLIC_API_URL ไม่ทำงาน"

**สาเหตุ**: Environment variables โหลดแค่ตอน build time ไม่ใช่ runtime

**วิธีแก้**:

```bash
# ตรวจสอบว่า .env.local อยู่ถูกที่
ls apps/web/.env.local

# Restart dev server
npm run dev
```

---

### ปัญหา: "รูปภาพไม่โหลด (จาก unsplash / google maps)"

**สาเหตุ**: Domain ไม่ได้อยู่ใน `next.config.ts` remotePatterns

**วิธีแก้**:

```typescript
// apps/web/next.config.ts
images: {
  remotePatterns: [
    { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
    { protocol: "https", hostname: "*.googleapis.com", pathname: "/**" },
    // เพิ่ม domain ของคุณที่นี่
  ],
}
```

---

### ปัญหา: "Modal ไม่ validate เบอร์โทร"

**วิธีแก้**:

```bash
# Hard refresh browser
Ctrl+Shift+R (Windows/Linux)
Cmd+Shift+R (Mac)

# หรือล้าง cache และ build ใหม่
rm -rf apps/web/.next
npm run build
```

---

### ปัญหา: "ส่งฟอร์มแล้วขึ้น 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้'"

**สาเหตุ**: Backend ไม่ได้รัน หรือ `NEXT_PUBLIC_API_URL` ไม่ถูกต้อง

**วิธีแก้**:

```bash
# ตรวจสอบว่า backend รันอยู่
curl http://localhost:3001/health
# ควรได้: {"status":"ok"}

# ตรวจสอบ .env.local
cat apps/web/.env.local
```

---

### ปัญหา: "ฟอนต์ไทยไม่แสดง (เห็นเป็นกล่องสี่เหลี่ยม)"

**สาเหตุ**: Font ไม่ได้โหลด หรือ subset ไม่ครบ

**วิธีแก้**:

```typescript
// apps/web/app/activities/layout.tsx
const notoThai = Noto_Sans_Thai({
  subsets: ["latin", "thai"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

// ต้อง apply ให้ถูกต้อง:
<div className={`${notoThai.className}`}>...</div>
```

---

## 📚 แหล่งข้อมูลเพิ่มเติม

### เอกสาร

- [Next.js 16 Docs](https://nextjs.org/docs)
- [Tailwind CSS v4](https://tailwindcss.com/docs)
- [Express.js Docs](https://expressjs.com/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

### เอกสารในโปรเจคนี้

- `docs/FRONTEND-GUIDE.md` — เอกสาร Component ระดับลึก
- `docs/activity-page-and-backend-contract.md` — ข้อกำหนด API

### คำสั่งที่ใช้บ่อย

- `npm run dev` — Development server
- `npm run build` — Production build
- `npm run start` — Production server

---

## 📞 ติดต่อและการมีส่วนร่วม

### รายงานข้อบกพร่อง

รายงานได้ที่: https://github.com/your-org/enroll-website/issues

### ทีมพัฒนา

- **Frontend**: ชื่อของคุณ
- **Backend**: (รอดำเนินการ)
- **DevOps**: (รอดำเนินการ)

### สิทธิ์การใช้งาน

MIT © 2026 The Coming of Stages (TCOS)

---

**อัปเดตล่าสุด**: 2026-05-15  
**เวอร์ชัน**: 1.0.0 (Frontend เสร็จสมบูรณ์, Backend รอดำเนินการ)  
**สถานะ**: 🟡 พร้อม Production (เฉพาะ Frontend)
