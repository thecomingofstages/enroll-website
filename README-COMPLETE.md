# 📋 Enrollment Website — Complete Developer Guide

> A comprehensive monorepo project for activity enrollment system built with **Next.js 16** + **Express** + **TypeScript** + **Tailwind CSS**

**Status**: Frontend ✅ Complete | Backend ⏳ In Progress

---

## 📖 Table of Contents

1. [Project Overview](#-project-overview)
2. [Technology Stack](#-technology-stack)
3. [Project Structure](#-project-structure)
4. [Setup & Installation](#-setup--installation)
5. [Running the Project](#-running-the-project)
6. [Frontend Architecture](#-frontend-architecture)
7. [Component Breakdown](#-component-breakdown)
8. [Data Flow & State Management](#-data-flow--state-management)
9. [API Endpoints](#-api-endpoints)
10. [Environment Variables](#-environment-variables)
11. [Validation Rules](#-validation-rules)
12. [Deployment Guide](#-deployment-guide)
13. [Troubleshooting](#-troubleshooting)

---

## 🎯 Project Overview

### What is This?

**Enrollment Website** is a full-stack web application that allows users to:
- Browse activity/event details
- View complete activity information (hero image, description, speaker, schedule, venue)
- Fill out a 3-step registration form
- Upload payment slips for confirmation
- Answer additional custom questions

### Who Made It?

- **Organization**: The Coming of Stages (TCOS)
- **License**: MIT (2026)
- **Type**: Monorepo (Frontend + Backend + Shared Types)

### Key Features

✅ **Server-Side Rendered Activity Pages** — Fast initial load, SEO-friendly  
✅ **Multi-Step Registration Modal** — UX-optimized form flow  
✅ **Form Validation** — Real-time error messages in Thai  
✅ **Thai Language Support** — Noto Sans Thai font integrated  
✅ **Responsive Design** — Mobile-first Tailwind CSS  
✅ **Mock Data Support** — Develop without backend  
✅ **TypeScript Strict Mode** — Type-safe codebase  
✅ **Error Boundaries** — Graceful error handling  

---

## 🛠 Technology Stack

### Frontend (apps/web)
| Technology | Version | Purpose |
|-----------|---------|---------|
| **Next.js** | 16.2.6 | React App Router, SSR, File-based routing |
| **React** | 19.2.4 | UI library |
| **TypeScript** | 5.x | Type safety |
| **Tailwind CSS** | 4.x | Utility-first CSS framework |
| **PostCSS** | 8.5.10 | CSS processing |
| **next/font** | Built-in | Google Fonts (Geist, Noto Sans Thai) |

### Backend (apps/api)
| Technology | Version | Purpose |
|-----------|---------|---------|
| **Express** | 4.18.2 | HTTP server framework |
| **Node.js** | 16+ | JavaScript runtime |
| **TypeScript** | 6.x | Type safety |
| **nodemon** | 3.1.14 | Dev auto-reload |

### Shared (packages/types)
| Technology | Purpose |
|-----------|---------|
| **TypeScript** | Shared type definitions |
| **npm workspaces** | Monorepo structure |

### Development Tools
| Tool | Purpose |
|------|---------|
| **Turborepo** | Monorepo task orchestration |
| **ESLint** | Code linting |
| **concurrently** | Run multiple dev servers |

---

## 📁 Project Structure

```
enroll-website/                          # Root monorepo
├── README.md                            # Main project readme
├── package.json                         # Root workspace config (npm v9+)
├── package-lock.json                    # Dependency lock file
├── LICENSE                              # MIT License
├── .gitignore                           # Git ignore rules
│
├── apps/
│   ├── web/                             # Next.js Frontend App
│   │   ├── .env.local                   # ⚙️ Environment variables (local)
│   │   ├── .gitignore                   # Ignore patterns
│   │   ├── package.json                 # Dependencies
│   │   ├── tsconfig.json                # TypeScript config (strict mode)
│   │   ├── next.config.ts               # Next.js config (image domains)
│   │   ├── postcss.config.mjs           # PostCSS + Tailwind
│   │   ├── eslint.config.mjs            # ESLint rules
│   │   ├── CLAUDE.md                    # AI context (Next.js version warning)
│   │   ├── AGENTS.md                    # AI agents reference
│   │   │
│   │   ├── app/                         # 📄 Next.js App Router
│   │   │   ├── layout.tsx               # Root layout (Geist fonts, metadata)
│   │   │   ├── page.tsx                 # Home page (index route)
│   │   │   ├── globals.css              # Global styles (Tailwind + CSS vars)
│   │   │   ├── favicon.ico              # Favicon
│   │   │   │
│   │   │   └── activities/              # Activity routes
│   │   │       ├── layout.tsx           # 🇹🇭 Thai font layout (Noto_Sans_Thai)
│   │   │       └── [id]/                # Dynamic segment {id}
│   │   │           ├── page.tsx         # 📄 Activity detail page (Server Component)
│   │   │           ├── error.tsx        # 🚨 Error boundary (500 errors)
│   │   │           └── not-found.tsx    # 404 Not Found page
│   │   │
│   │   ├── components/                  # 🧩 Reusable Components
│   │   │   └── activity/
│   │   │       ├── ActivityHero.tsx     # Hero image + title + venue name
│   │   │       ├── ActivityAbout.tsx    # Description + highlights + speaker
│   │   │       ├── ActivityTimeline.tsx # Schedule timeline with highlights
│   │   │       ├── ActivityLocation.tsx # Map + address + directions button
│   │   │       └── RegisterModal.tsx    # ⭐ 3-step registration modal + validation
│   │   │
│   │   ├── lib/                         # 🔧 Utilities & Helpers
│   │   │   ├── activity-api.ts          # fetchActivityDetail(), postActivityRegistration()
│   │   │   ├── mock-activity.ts         # Sample data (demo-theater-tech)
│   │   │   ├── directions-url.ts        # Maps URL builder (Google/Apple/OSM)
│   │   │   └── site-url.ts              # Metadata base URL resolver
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
│           └── index.ts                 # ⏳ Express server (minimal, WIP)
│
├── packages/
│   └── types/                           # 📦 Shared Type Definitions
│       ├── package.json                 # Type package metadata
│       └── index.ts                     # 🔤 All TypeScript interfaces
│
└── docs/                                # 📚 Documentation
    ├── FRONTEND-GUIDE.md                # Frontend comprehensive guide
    ├── activity-page-and-backend-contract.md # API contract spec
    └── README-COMPLETE.md               # This file (complete guide)
```

### Detailed Folder Explanations

#### `app/` (Next.js App Router)
- **Server Components** by default (all pages are server-rendered)
- **Dynamic Routes**: `[id]` = URL parameter (e.g., `/activities/demo-theater-tech`)
- **Error Handling**: `error.tsx` catches thrown errors; `not-found.tsx` for 404s
- **Layout Nesting**: `activities/layout.tsx` wraps all `/activities/*` routes

#### `components/activity/`
- All components are **co-located** in one folder for easy discovery
- `RegisterModal.tsx` is the largest (395 lines) with 3-step form logic
- Other components are **pure presentational** (no state)

#### `lib/`
- **API Layer**: `activity-api.ts` handles fetch/mock fallback logic
- **Config Helpers**: `directions-url.ts`, `site-url.ts` for URL generation
- **Mock Data**: `mock-activity.ts` provides sample activity (used when API unavailable)

#### `packages/types/`
- **Single source of truth** for all TypeScript interfaces
- Used by both `apps/web` and `apps/api`
- Ensures API contract consistency

---

## 🚀 Setup & Installation

### Prerequisites

Before starting, ensure you have:

```bash
✅ Node.js >= 16 (Check: node --version)
✅ npm >= 9 (Check: npm --version)
✅ Git (Check: git --version)
```

### Step 1: Clone Repository

```bash
git clone https://github.com/your-org/enroll-website.git
cd enroll-website
```

### Step 2: Install Dependencies

```bash
# Install root-level dependencies
npm install

# This automatically installs:
# - apps/web dependencies
# - apps/api dependencies
# - packages/types dependencies
# (because of monorepo workspaces in package.json)
```

### Step 3: Configure Environment Variables

#### Create `.env.local` for Frontend

```bash
# apps/web/.env.local

# API Base URL (leave commented to use mock data)
# NEXT_PUBLIC_API_URL=http://localhost:3001

# Maps fallback provider (google | apple | osm)
NEXT_PUBLIC_DIRECTIONS_FALLBACK=google

# Site URL for Open Graph metadata (optional)
# NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

**Environment Variable Explanations:**

| Variable | Type | Default | Purpose |
|----------|------|---------|---------|
| `NEXT_PUBLIC_API_URL` | string | (commented) | Backend API base URL. If not set, app uses mock data. |
| `NEXT_PUBLIC_DIRECTIONS_FALLBACK` | string | `google` | When venue.directionsUrl is missing, use this maps provider (google/apple/osm). |
| `NEXT_PUBLIC_SITE_URL` | string | (optional) | Base URL for Open Graph metadata. Falls back to VERCEL_URL on Vercel. |

**Why NEXT_PUBLIC?**
- Prefix `NEXT_PUBLIC_` makes variables available to browser
- Non-prefixed variables are server-only
- Allows client-side component to read API URL

### Step 4: Verify Installation

```bash
# Check dependencies installed
npm list @enroll-website/types

# Should output version (e.g., 1.0.0) ✅
```

---

## ▶️ Running the Project

### Development Mode (Recommended)

```bash
# Run all apps concurrently (web + api)
npm run dev

# Output:
# > concurrently "npm --workspace=apps/web run dev" "npm --workspace=apps/api run dev"
# 
# Next.js dev server: http://localhost:3000
# Express dev server: http://localhost:3001
```

### Frontend Only

```bash
cd apps/web
npm run dev

# Next.js dev server: http://localhost:3000
```

### Backend Only

```bash
cd apps/api
npm run dev

# Express dev server: http://localhost:3001
# Watch mode enabled (nodemon)
```

### Access the App

1. **Home Page**: http://localhost:3000
2. **Demo Activity**: http://localhost:3000/activities/demo-theater-tech
3. **Backend Health Check**: http://localhost:3001/health

### Production Build

```bash
# Build all apps
npm run build

# This runs:
# - apps/web: next build
# - apps/api: tsc (TypeScript to JavaScript)

# Test production build
npm run start

# Runs:
# - Next.js production server on port 3000
# - Node.js production server on port 3001
```

---

## 🧠 Frontend Architecture

### Data Flow: URL → Server → Client

```
User enters URL
    ↓
http://localhost:3000/activities/demo-theater-tech
    ↓
Next.js router matches: app/activities/[id]/page.tsx
    ↓
page.tsx extracts { id } from URL params
    ↓
Calls: fetchActivityDetail("demo-theater-tech")
    ↓
Check: Is NEXT_PUBLIC_API_URL set?
    ├─ YES → Fetch from Backend API
    │   ├─ Success (200) → Use API data
    │   ├─ 404 → Return null → notFound()
    │   └─ Error (500, etc) → Throw ActivityApiLoadError → error.tsx
    │
    └─ NO → Use mock data (no network call)
    ↓
Render UI with data
    ├─ <ActivityHero activity={activity} />
    ├─ <ActivityRegisterSection activity={activity} />
    ├─ <ActivityAbout activity={activity} />
    ├─ <ActivityTimeline activity={activity} />
    └─ <ActivityLocation activity={activity} />
```

### Server vs Client Components

| Component | Type | Why | State | Fetches Data |
|-----------|------|-----|-------|--------------|
| `app/activities/[id]/page.tsx` | **Server** | SSR, async data | ❌ | ✅ |
| `ActivityHero.tsx` | **Server** | Display only | ❌ | ❌ |
| `ActivityAbout.tsx` | **Server** | Display only | ❌ | ❌ |
| `ActivityTimeline.tsx` | **Server** | Display only | ❌ | ❌ |
| `ActivityLocation.tsx` | **Server** | Display only | ❌ | ❌ |
| `RegisterModal.tsx` | **Client** | Interactive form | ✅ | ✅ (POST) |

**Key Rules:**
- Server components = default (smaller JS bundle)
- Client components = only when needed (`"use client"` directive)
- RegisterModal needs state for form, so it's a client component

### Rendering Strategy

```typescript
// Server Component (app/activities/[id]/page.tsx)
export default async function ActivityPage({ params }) {
  const { id } = await params;
  const activity = await fetchActivityDetail(id);  // Runs on server
  
  if (!activity) {
    notFound();  // Server-side, no React needed
  }
  
  return (
    <main>
      <ActivityHero activity={activity} />  {/* Server component */}
      <RegisterSection activity={activity} /> {/* Becomes Client component */}
    </main>
  );
}
```

Benefits:
- ✅ No API call on client (faster)
- ✅ Secrets stay on server
- ✅ Direct database access possible
- ✅ Smaller JavaScript bundle

---

## 🧩 Component Breakdown

### 1. ActivityHero.tsx (29 lines)
**Purpose**: Display eye-catching header section

```typescript
export function ActivityHero({ activity }: { activity: ActivityDetail }) {
  return (
    <header className="relative h-[min(52vh,420px)] overflow-hidden">
      {/* Hero image with gradient overlay */}
      <Image
        src={activity.heroImageUrl}      // e.g., unsplash photo
        alt={`${activity.name} hero`}
        fill
        priority                         // Load first
        className="object-cover opacity-90"
      />
      
      {/* Gradient overlay: black at bottom for text contrast */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-black/20" />
      
      {/* Text overlay: venue + title */}
      <div className="absolute bottom-0 text-white">
        <p className="text-violet-200">{activity.venue.name}</p>
        <h1 className="text-3xl font-semibold">{activity.name}</h1>
      </div>
    </header>
  );
}
```

**Props**:
- `activity: ActivityDetail` — Full activity data

**Output**:
```
┌─────────────────────────────┐
│   [Hero Image]              │
│   (gradient overlay)        │
│                             │
│   The Indigo Grand Hall  ←─ venue.name
│   Navigating to the      ←─ activity.name
│   future of theater      │
└─────────────────────────────┘
```

---

### 2. ActivityAbout.tsx (53 lines)
**Purpose**: Info section with description, highlights, speaker

```typescript
export function ActivityAbout({ activity }: { activity: ActivityDetail }) {
  return (
    <section className="rounded-2xl bg-white p-6">
      <h2>เกี่ยวกับกิจกรรม</h2>
      
      {/* Description paragraph */}
      <p>{activity.description}</p>
      
      {/* Two-column grid */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Left: Highlights */}
        <div className="bg-violet-50 p-4 rounded-xl">
          <h3>สิ่งที่จะได้รับ</h3>
          <ul>
            {activity.highlights.map(line => (
              <li key={line}>
                <span className="bg-violet-600 text-white rounded-full">✓</span>
                {line}
              </li>
            ))}
          </ul>
        </div>
        
        {/* Right: Speaker info */}
        <div className="bg-zinc-50 p-4 rounded-xl">
          <h3>วิทยากรรับเชิญ</h3>
          <Image
            src={activity.speaker.avatarUrl}
            alt={activity.speaker.name}
            className="rounded-full"
          />
          <p>{activity.speaker.name}</p>
          <p className="text-sm text-gray-600">{activity.speaker.role}</p>
        </div>
      </div>
    </section>
  );
}
```

**Data Used**:
- `activity.description` (string)
- `activity.highlights[]` (string array)
- `activity.speaker` (object)

**Output**:
```
┌─ เกี่ยวกับกิจกรรม ─────────────────────┐
│                                        │
│ [Long description text]                │
│                                        │
│  ┌──────────────────┐  ┌─────────────┐ │
│  │ สิ่งที่จะได้รับ   │  │ วิทยากร     │ │
│  │ ✓ Highlight 1   │  │ [Avatar]    │ │
│  │ ✓ Highlight 2   │  │ Name        │ │
│  │ ✓ Highlight 3   │  │ Role        │ │
│  └──────────────────┘  └─────────────┘ │
└────────────────────────────────────────┘
```

---

### 3. ActivityTimeline.tsx (33 lines)
**Purpose**: Visual timeline of event schedule

```typescript
export function ActivityTimeline({ activity }: { activity: ActivityDetail }) {
  return (
    <section className="rounded-2xl bg-white p-6">
      <h2>กำหนดการกิจกรรม</h2>
      
      {/* Vertical line */}
      <span className="absolute w-px bg-zinc-200 left-[11px] top-2 bottom-2" />
      
      {/* Timeline items */}
      <ol className="relative space-y-0">
        {activity.schedule.map((item) => (
          <li key={item.id} className="relative flex gap-4 pb-8">
            {/* Dot (colored if highlight) */}
            <span
              className={`h-3 w-3 rounded-full ring-4 ring-white ${
                item.highlight ? "bg-violet-600" : "bg-zinc-300"
              }`}
            />
            
            {/* Content */}
            <div>
              <p className="text-xs text-violet-600">{item.timeRange}</p>
              <p className="font-semibold">{item.title}</p>
              <p className="text-sm text-gray-600">{item.description}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
```

**Data Used**:
- `activity.schedule[]` (array of schedule items)

**Output**:
```
┌─ กำหนดการกิจกรรม ──────────────┐
│                                │
│  ● 10:00 - 11:30              │ ← highlight=true (colored dot)
│    ดิจิทัลโปรซีเนียม           │
│    [Description...]            │
│                                │
│  ○ 11:30 - 13:00              │
│    ช่วงย่อย: เสียงเชิงพื้นที่  │
│    [Description...]            │
│                                │
│  ○ 14:00 - 16:00              │
│    [Title]                     │
│    [Description...]            │
└────────────────────────────────┘
```

---

### 4. ActivityLocation.tsx (44 lines)
**Purpose**: Display venue, address, map, directions button

```typescript
export function ActivityLocation({ activity }: { activity: ActivityDetail }) {
  const { venue } = activity;
  const href = directionsHref(venue);  // ← Builds Google Maps link
  
  return (
    <section className="rounded-2xl bg-white p-6">
      <h2>สถานที่</h2>
      
      {/* Map image (if provided) */}
      {venue.mapImageUrl && (
        <Image
          src={venue.mapImageUrl}
          alt={`Map of ${venue.name}`}
          className="rounded-xl w-full aspect-[16/9]"
        />
      )}
      
      {/* Address + directions button */}
      <div className="mt-4 flex justify-between">
        <div>
          <p className="font-semibold">{venue.name}</p>
          {venue.addressLines.map(line => (
            <p key={line} className="text-sm text-gray-600">{line}</p>
          ))}
        </div>
        
        {/* Opens Google Maps in new tab */}
        <a href={href} target="_blank" className="border border-violet-300 px-4 py-2">
          ↗ ขอเส้นทาง
        </a>
      </div>
    </section>
  );
}
```

**Data Used**:
- `activity.venue` (object with name, addressLines, directionsUrl)

**Directions Logic** (`directions-url.ts`):
```typescript
export function directionsHref(venue: ActivityVenue): string {
  // If explicit URL provided, use it
  if (venue.directionsUrl?.trim()) return venue.directionsUrl;
  
  // Otherwise, build from name + address + env provider
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

**Output**:
```
┌─ สถานที่ ────────────────────────┐
│ [Map Image]                       │
│                                  │
│ The Indigo Grand Hall    ↗ ขอเส้นทาง
│ 24 Exhibition Way                │
│ SE1 7PB, London                  │
└──────────────────────────────────┘
```

---

### 5. RegisterModal.tsx (395 lines) ⭐ **Most Complex**

**Purpose**: 3-step multi-part registration form with validation

#### Architecture Overview

```
RegisterModal (parent)
├── Step 1: Personal Info (firstName, lastName, phone)
│   └── Validation: min 2 chars, phone must be 10 digits
├── Step 2: Payment (PromptPay QR + slip upload)
│   └── Validation: file size < 5MB, mime type (PNG/JPG/PDF)
└── Step 3: Extra Questions (dynamic from activity.extraQuestions)
    └── Validation: textarea input
```

#### State Management

```typescript
const [step, setStep] = useState<1 | 2 | 3>(1);              // Current step
const [firstName, setFirstName] = useState("");               // Form field
const [lastName, setLastName] = useState("");                // Form field
const [phone, setPhone] = useState("");                      // Form field
const [slip, setSlip] = useState<File | null>(null);         // Uploaded file
const [extraAnswers, setExtraAnswers] = useState({});        // Dynamic Q&A
const [submitting, setSubmitting] = useState(false);         // Loading state
const [feedback, setFeedback] = useState(null);              // Success/error message
const [firstNameError, setFirstNameError] = useState(null);  // Error message
const [lastNameError, setLastNameError] = useState(null);    // Error message
const [phoneError, setPhoneError] = useState(null);          // Error message
const [slipError, setSlipError] = useState(null);            // Error message
```

#### Validation Functions

```typescript
function validateFirstName(name: string): string | null {
  const trimmed = name.trim();
  if (!trimmed) return "กรุณากรอกชื่อ";
  if (trimmed.length < 2) return "ชื่อต้องไม่น้อยกว่า 2 ตัวอักษร";
  return null;  // ✅ Valid
}

function validateLastName(name: string): string | null {
  const trimmed = name.trim();
  if (!trimmed) return "กรุณากรอกนามสกุล";
  if (trimmed.length < 2) return "นามสกุลต้องไม่น้อยกว่า 2 ตัวอักษร";
  return null;
}

function validatePhone(phone: string): string | null {
  const trimmed = phone.trim();
  if (!trimmed) return "กรุณากรอกเบอร์โทร";
  
  const digits = trimmed.replace(/\D/g, "");  // Remove non-digits
  if (digits.length !== 10) return "เบอร์โทรต้องเป็น 10 หลัก";
  
  // Check prefix: second digit must be 6, 8, or 9 (06x, 08x, 09x)
  if (!["6", "8", "9"].includes(digits[1])) {
    return "เบอร์โทรต้องเริ่มด้วย 06, 08 หรือ 09";
  }
  
  return null;  // ✅ Valid
}
```

**Thai Phone Number Format**:
- Length: **10 digits**
- Starts with: **06**, **08**, or **09**
- Examples: 0812345678 ✅, 0651234567 ✅, 0912345678 ✅
- Examples: 0712345678 ❌, 0123456789 ❌

#### Step Conditions

```typescript
// Step 1: All personal info must be valid
const canNextFrom1 =
  !validateFirstName(firstName) &&
  !validateLastName(lastName) &&
  !validatePhone(phone);

// Step 2: File must be selected
const canNextFrom2 = slip !== null;

// Step 3: Always can submit (questions optional)
```

#### File Upload Handling

```typescript
onChange={(e) => {
  const file = e.target.files?.[0] ?? null;
  if (!file) {
    setSlip(null);
    setSlipError(null);
    return;
  }
  
  // Check file size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    setSlip(null);
    setSlipError("ไฟล์ใหญ่เกิน 5MB");
    return;
  }
  
  // Check MIME type (PNG, JPG, PDF only)
  const mime = file.type.toLowerCase();
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  
  if (!["image/png", "image/jpeg", "application/pdf"].includes(mime)) {
    setSlip(null);
    setSlipError("ใช้ได้เฉพาะ PNG, JPG หรือ PDF");
    return;
  }
  
  setSlipError(null);
  setSlip(file);  // ✅ Valid file
}}
```

#### Form Submission

```typescript
async function handleSubmit() {
  setSubmitting(true);
  setFeedback(null);
  
  const res = await postActivityRegistration(
    activity.id,                              // Activity ID
    {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone.trim(),
      extraAnswers,                           // Dict: { "open-mic": "answer..." }
    },
    slip                                      // File object
  );
  
  setSubmitting(false);
  
  if (res.ok) {
    setFeedback({
      message: res.message ?? "ลงทะเบียนสำเร็จ",
      variant: "success",
    });
    
    // Close modal after 900ms (show success message)
    setTimeout(() => onClose(), 900);
  } else {
    setFeedback({
      message: res.message ?? "เกิดข้อผิดพลาด",
      variant: "error",
    });
  }
}
```

#### Modal Structure

```tsx
<div role="dialog" aria-modal="true" className="fixed inset-0 z-50">
  {/* Close button + step indicators */}
  <div className="flex items-center justify-between border-b px-5 py-3">
    <h2>ลงทะเบียนเข้าร่วม</h2>
    <button onClick={onClose}>✕</button>
  </div>
  
  {/* Step indicator (1 2 3) */}
  <div className="flex gap-2 px-5 py-3">
    {[1, 2, 3].map(n => (
      <span key={n} className={`${step === n ? "bg-red-800 text-white" : "..."}`}>
        {n}
      </span>
    ))}
  </div>
  
  {/* Form content (scrollable) */}
  <div className="flex-1 overflow-y-auto px-5 py-5">
    {step === 1 && <Step1PersonalInfo />}
    {step === 2 && <Step2Payment />}
    {step === 3 && <Step3Questions />}
    {feedback && <FeedbackMessage />}
  </div>
  
  {/* Navigation buttons */}
  <div className="flex gap-2 border-t px-5 py-4">
    {step > 1 && <button onClick={() => setStep(step - 1)}>ย้อนกลับ</button>}
    {step < 3 ? (
      <button onClick={() => setStep(step + 1)} disabled={!canNext}>
        ถัดไป
      </button>
    ) : (
      <button onClick={handleSubmit} disabled={submitting}>
        ยืนยันการลงทะเบียน
      </button>
    )}
  </div>
</div>
```

---

## 📊 Data Flow & State Management

### Registration Flow

```
User clicks "ลงทะเบียน" button
    ↓
ActivityRegisterSection state: open = true
    ↓
<RegisterModal open={true} activity={activity} />
    ↓
┌─ Step 1: Personal Info ──────────────┐
│ Input: firstName, lastName, phone    │
│ Validation: min 2 chars, 10 digits   │
│ Button state: ถัดไป (disabled/enabled)
└─────────────────────────────────────┘
    ↓ Click "ถัดไป" (only if valid)
    ↓
┌─ Step 2: Payment ────────────────────┐
│ Show: PromptPay QR (placeholder)    │
│ Upload: Payment slip (PNG/JPG/PDF)   │
│ Validation: file size, MIME type     │
│ Button state: ถัดไป (disabled/enabled)
└─────────────────────────────────────┘
    ↓ Click "ถัดไป"
    ↓
┌─ Step 3: Extra Questions ────────────┐
│ Dynamic questions from activity.     │
│ extraQuestions[]                     │
│ Input: textarea for each question    │
│ Button state: ยืนยันการลงทะเบียน     │
└─────────────────────────────────────┘
    ↓ Click "ยืนยันการลงทะเบียน"
    ↓
Call: postActivityRegistration()
    ├─ Build FormData with all fields
    ├─ POST to /activities/{id}/register
    └─ Response: { ok, message, enrollmentId }
    ↓
if (ok) {
  Show success message
  After 900ms: Close modal
} else {
  Show error message (stay open)
}
```

### FormData Structure (Sent to Backend)

```javascript
const form = new FormData();
form.set("firstName", "สมชาย");
form.set("lastName", "ทดสอบ");
form.set("phone", "0812345678");
form.set("extraAnswers", JSON.stringify({ 
  "open-mic": "ตอบว่าสนใจ" 
}));
form.set("paymentSlip", file);  // Binary file data

// POST /activities/demo-theater-tech/register
// Content-Type: multipart/form-data (automatic with FormData)
```

---

## 🔗 API Endpoints

### Overview

| Method | Endpoint | Purpose | Status |
|--------|----------|---------|--------|
| `GET` | `/activities/:id` | Fetch activity details | ✅ Frontend ready |
| `POST` | `/activities/:id/register` | Submit registration | ✅ Frontend ready |
| `GET` | `/health` | API health check | ✅ Implemented |

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
  "heroImageUrl": "https://images.unsplash.com/photo-1503095396549...",
  "venue": {
    "name": "The Indigo Grand Hall",
    "addressLines": ["24 Exhibition Way", "SE1 7PB, London"],
    "mapImageUrl": "https://images.unsplash.com/photo-1524661135...",
    "directionsUrl": "https://maps.app.goo.gl/P1JNUKMa8pvfohaKA"
  },
  "highlights": [
    "การผสมผสาน AI ในการออกแบบแสง",
    "ซาวด์สเคปเชิงพื้นที่แบบเรียลไทม์",
    "เทคนิคการสร้างฉากแบบโมดูลาร์"
  ],
  "speaker": {
    "name": "Marcus Thorne",
    "role": "ผู้อำนวยการฝ่ายสร้างสรรค์, Apex Stages",
    "avatarUrl": "https://images.unsplash.com/photo-1472099645785..."
  },
  "schedule": [
    {
      "id": "s1",
      "timeRange": "10:00 – 11:30",
      "title": "ดิจิทัลโปรซีเนียม",
      "description": "บรรยายพิเศษและเคสสตัดดี้...",
      "highlight": true
    }
  ],
  "priceThb": 150,
  "extraQuestions": [
    {
      "id": "open-mic",
      "label": "สนใจเข้าร่วม Open Mic หรือไม่?",
      "placeholder": "กรอกคำตอบ..."
    }
  ]
}
```

**Response (404 Not Found)**:
```json
{
  "status": 404,
  "message": "Activity not found"
}
```

**Response (500 Internal Server Error)**:
```json
{
  "status": 500,
  "message": "Database error"
}
```

**Type Definition** (TypeScript):
```typescript
interface ActivityDetail extends Activity {
  heroImageUrl: string;
  venue: ActivityVenue;
  highlights: string[];
  speaker: ActivitySpeaker;
  schedule: ActivityScheduleItem[];
  priceThb: number;
  extraQuestions: ActivityExtraQuestion[];
}
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
paymentSlip=<binary file data>
```

**FormData Fields**:

| Field | Type | Required | Validation | Example |
|-------|------|----------|-----------|---------|
| `firstName` | string | ✅ | Min 2 chars | "สมชาย" |
| `lastName` | string | ✅ | Min 2 chars | "ทดสอบ" |
| `phone` | string | ✅ | 10 digits, 06/08/09 | "0812345678" |
| `extraAnswers` | string (JSON) | ✅ | Valid JSON dict | `{"open-mic":"ตอบ"}` |
| `paymentSlip` | File | ✅ | PNG/JPG/PDF, <5MB | binary |

**Response (200 OK)**:
```json
{
  "ok": true,
  "enrollmentId": "enrollment-12345",
  "message": "ลงทะเบียนสำเร็จ"
}
```

**Response (400 Bad Request)**:
```json
{
  "ok": false,
  "message": "เบอร์โทรไม่ถูกต้อง"
}
```

**Response (500 Server Error)**:
```json
{
  "ok": false,
  "message": "ไม่สามารถบันทึกลงทะเบียนได้"
}
```

**Frontend Handling** (`activity-api.ts`):
```typescript
export async function postActivityRegistration(
  activityId: string,
  payload: ActivityRegistrationPayload,
  paymentSlip: File | null
): Promise<ActivityRegistrationResult> {
  const base = apiBase();
  
  const form = new FormData();
  form.set("firstName", payload.firstName);
  form.set("lastName", payload.lastName);
  form.set("phone", payload.phone);
  form.set("extraAnswers", JSON.stringify(payload.extraAnswers));
  if (paymentSlip) {
    form.set("paymentSlip", paymentSlip);
  }
  
  if (base) {
    try {
      const res = await fetch(
        `${base}/activities/${encodeURIComponent(activityId)}/register`,
        { method: "POST", body: form }
      );
      
      const data = await res.json();
      return {
        ok: res.ok,
        enrollmentId: data.enrollmentId,
        message: data.message ?? (res.ok ? "ลงทะเบียนสำเร็จ" : "เกิดข้อผิดพลาด"),
      };
    } catch (e) {
      return { ok: false, message: "เชื่อมต่อเซิร์ฟเวอร์ไม่ได้" };
    }
  }
  
  // Mock mode (no backend)
  await new Promise(r => setTimeout(r, 400));
  return {
    ok: true,
    enrollmentId: `mock-${activityId}-${Date.now()}`,
    message: "โหมดออฟไลน์: บันทึกฝั่งเครื่อง",
  };
}
```

---

### 3. GET /health

**Request**:
```http
GET http://localhost:3001/health
```

**Response (200 OK)**:
```json
{
  "status": "ok",
  "timestamp": "2026-05-15T10:30:00Z"
}
```

**Purpose**: Health check for deployment monitoring / load balancers

---

## ⚙️ Environment Variables

### Complete Reference

#### `apps/web/.env.local`

```bash
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# API CONFIGURATION
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Backend API Base URL
# - Leave commented/unset to use MOCK DATA (no network calls)
# - Set to http://localhost:3001 for local development with backend
# - Set to https://api.example.com for production
# - No trailing slash needed
NEXT_PUBLIC_API_URL=http://localhost:3001

# Alternative: Skip API entirely (always use mock)
# NEXT_PUBLIC_API_URL=

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# MAPS CONFIGURATION
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Fallback maps provider when venue.directionsUrl is not provided
# Options: google (default) | apple | osm (OpenStreetMap)
# Used in /lib/directions-url.ts
NEXT_PUBLIC_DIRECTIONS_FALLBACK=google

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# METADATA & SEO
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Site URL for Open Graph metadata (used in social shares)
# - Leave unset to auto-detect from VERCEL_URL (on Vercel deployments)
# - Set to https://example.com for custom domain
# - Must include protocol (https://)
# NEXT_PUBLIC_SITE_URL=https://your-domain.com

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# NOTES ON NEXT_PUBLIC_ PREFIX
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# NEXT_PUBLIC_* variables are exposed to the browser (not secret!)
# - Use for: API endpoints, feature flags, config
# - Don't use for: API keys, secrets, credentials
# - Build time: Variables baked into .next/ at build time
# - Runtime env: Use /lib/getServerSideProps for runtime secrets
```

#### Backend `.env` (apps/api) - *Not yet created*

When you implement the backend, add:

```bash
# Server config
PORT=3001
NODE_ENV=development

# Database (example)
DATABASE_URL=postgresql://user:pass@localhost/enrollment_db

# Auth (if needed later)
JWT_SECRET=your-secret-key-here

# External services
PROMPTPAY_API_KEY=...
EMAIL_SERVICE_KEY=...
```

---

## ✅ Validation Rules

### Form Validation (RegisterModal Step 1)

All validation happens **client-side** before sending to backend.

#### firstName Validation

```typescript
function validateFirstName(name: string): string | null {
  const trimmed = name.trim();
  if (!trimmed) return "กรุณากรอกชื่อ";
  if (trimmed.length < 2) return "ชื่อต้องไม่น้อยกว่า 2 ตัวอักษร";
  return null;
}
```

| Input | Valid? | Reason |
|-------|--------|--------|
| "" (empty) | ❌ | Required field |
| "ก" | ❌ | Only 1 character |
| "กษ" | ✅ | 2 characters (Thai) |
| "John" | ✅ | 4 characters (English) |
| "สมชาย" | ✅ | 5 characters (Thai) |

#### lastName Validation

Same rules as firstName.

#### phone Validation

```typescript
function validatePhone(phone: string): string | null {
  const trimmed = phone.trim();
  if (!trimmed) return "กรุณากรอกเบอร์โทร";
  
  const digits = trimmed.replace(/\D/g, "");  // Extract only digits
  if (digits.length !== 10) return "เบอร์โทรต้องเป็น 10 หลัก";
  
  // Check second digit (after leading 0)
  // 06x, 08x, 09x are valid Thai mobile prefixes
  if (!["6", "8", "9"].includes(digits[1])) {
    return "เบอร์โทรต้องเริ่มด้วย 06, 08 หรือ 09";
  }
  
  return null;
}
```

**Thai Phone Prefixes**:
- `06` — Supports various carrier
- `08` — Thai mobile standard
- `09` — Thai mobile standard

| Input | Digits | Valid? | Reason |
|-------|--------|--------|--------|
| "" | N/A | ❌ | Required |
| "08-1234-5678" | 0812345678 | ✅ | 10 digits, 08 prefix |
| "06 51234567" | 0651234567 | ✅ | 10 digits, 06 prefix |
| "0912345678" | 0912345678 | ✅ | 10 digits, 09 prefix |
| "081234567" | 081234567 | ❌ | Only 9 digits |
| "0712345678" | 0712345678 | ❌ | 07 prefix invalid |
| "0123456789" | 0123456789 | ❌ | 01 prefix invalid |

#### paymentSlip File Validation

```typescript
// Constraints
const MAX_SIZE = 5 * 1024 * 1024;  // 5MB
const ALLOWED_MIMES = ["image/png", "image/jpeg", "application/pdf"];
const ALLOWED_EXTS = ["png", "jpg", "jpeg", "pdf"];

// In upload handler:
if (file.size > MAX_SIZE) {
  setSlipError("ไฟล์ใหญ่เกิน 5MB");
}

if (!ALLOWED_MIMES.includes(file.type)) {
  setSlipError("ใช้ได้เฉพาะ PNG, JPG หรือ PDF");
}
```

| File | Size | Type | Valid? | Reason |
|------|------|------|--------|--------|
| receipt.png | 2MB | image/png | ✅ | PNG, within size |
| receipt.jpg | 3MB | image/jpeg | ✅ | JPG, within size |
| receipt.pdf | 1MB | application/pdf | ✅ | PDF, within size |
| receipt.pdf | 6MB | application/pdf | ❌ | Exceeds 5MB limit |
| receipt.gif | 2MB | image/gif | ❌ | GIF not supported |
| screenshot.bmp | 4MB | image/bmp | ❌ | BMP not supported |

#### extraQuestions Validation

No validation — text is accepted as-is. But must send JSON string to backend:

```typescript
// Example: activity has 2 extra questions
activity.extraQuestions = [
  { id: "open-mic", label: "สนใจ Open Mic?" },
  { id: "workshop", label: "เนื้อหา workshop ที่สนใจ?" }
];

// User fills in:
extraAnswers = {
  "open-mic": "สนใจครับ",
  "workshop": "AI & design"
};

// Send to backend as:
form.set("extraAnswers", JSON.stringify(extraAnswers));
// → {"open-mic":"สนใจครับ","workshop":"AI & design"}
```

---

## 🚀 Deployment Guide

### Option 1: Deploy to Vercel (Recommended for Next.js)

Vercel is the company behind Next.js and offers seamless deployment.

#### Step 1: Prepare Repository

```bash
# Ensure all changes are committed
git add .
git commit -m "Ready for deployment"
git push origin main
```

#### Step 2: Connect to Vercel

1. Go to https://vercel.com/new
2. Click "Import Git Repository"
3. Select your GitHub repo `enroll-website`
4. Vercel auto-detects **Turborepo** setup

#### Step 3: Configure Environment Variables

In Vercel dashboard:

```
NEXT_PUBLIC_API_URL = https://api.example.com
NEXT_PUBLIC_DIRECTIONS_FALLBACK = google
NEXT_PUBLIC_SITE_URL = https://your-domain.com
```

**Key Points**:
- Vercel auto-detects `NEXT_PUBLIC_` prefix and exposes to browser
- Set separately for **Production**, **Preview**, **Development** environments
- Leave `NEXT_PUBLIC_API_URL` commented in `.env.local` (Vercel overrides)

#### Step 4: Configure Root Settings

- **Framework Preset**: Turborepo (should auto-select)
- **Root Directory**: `./` (root)
- **Build Command**: `npm run build` (auto-detected)
- **Output Directory**: `.next` (auto-detected)

#### Step 5: Deploy

Click "Deploy" — Vercel builds and deploys automatically.

**Result**:
- Frontend: `https://your-project.vercel.app/`
- Auto-scales, CDN caching, SSL included
- Auto-deploys on git push to main

---

### Option 2: Deploy to Docker (Self-hosted)

For deploying to AWS, GCP, DigitalOcean, etc.

#### Step 1: Create Dockerfile

```dockerfile
# apps/web/Dockerfile

FROM node:20-alpine AS builder
WORKDIR /app

# Copy monorepo files
COPY package.json package-lock.json ./
COPY apps/web ./apps/web
COPY packages/types ./packages/types

# Install & build
RUN npm ci
RUN npm run build --workspace=apps/web

# Production image
FROM node:20-alpine
WORKDIR /app

COPY --from=builder /app/apps/web/.next ./apps/web/.next
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder /app/apps/web/package.json ./apps/web/

# Install production dependencies only
RUN npm ci --omit=dev

# Run
EXPOSE 3000
CMD ["npm", "--workspace=apps/web", "start"]
```

#### Step 2: Build & Run Locally

```bash
docker build -t enrollment-web:latest -f apps/web/Dockerfile .
docker run -p 3000:3000 -e NEXT_PUBLIC_API_URL=https://api.com enrollment-web:latest
```

#### Step 3: Push to Registry

```bash
# Login to Docker Hub
docker login

# Tag image
docker tag enrollment-web:latest myusername/enrollment-web:latest

# Push
docker push myusername/enrollment-web:latest
```

#### Step 4: Deploy to Cloud

**AWS ECS Example**:
```bash
aws ecs run-task \
  --cluster my-cluster \
  --task-definition enrollment-web:1 \
  --launch-type FARGATE
```

**DigitalOcean App Platform**:
1. Connect Docker Hub account
2. Create app from image
3. Set environment variables
4. Deploy

---

### Option 3: Deploy to Netlify

Similar to Vercel but with different UI.

1. Go to https://app.netlify.com/
2. "Add new site" → "Import an existing project"
3. Select GitHub repo
4. Set Build command: `npm run build`
5. Set Publish directory: `apps/web/.next`
6. Add environment variables
7. Deploy

---

### Option 4: Self-hosted on Linux Server

#### SSH to Server

```bash
ssh user@your-server.com
```

#### Clone Repo

```bash
cd /var/www
git clone https://github.com/your-org/enroll-website.git
cd enroll-website
```

#### Install Node

```bash
curl -sL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

#### Build

```bash
npm install
npm run build
```

#### Setup Process Manager (PM2)

```bash
npm install -g pm2

# Start frontend
pm2 start "npm --workspace=apps/web start" --name "enrollment-web"

# Start backend
pm2 start "npm --workspace=apps/api start" --name "enrollment-api"

# Enable auto-restart on reboot
pm2 startup
pm2 save
```

#### Setup Nginx Reverse Proxy

```bash
sudo nano /etc/nginx/sites-available/enrollment-web
```

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

Enable & restart:
```bash
sudo ln -s /etc/nginx/sites-available/enrollment-web /etc/nginx/sites-enabled/
sudo systemctl restart nginx
```

#### Setup SSL (Let's Encrypt)

```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

### Pre-Deployment Checklist

Before deploying to production:

- [ ] Remove `console.log` statements
- [ ] Set all `NEXT_PUBLIC_*` variables
- [ ] Test form submission with real backend
- [ ] Check mobile responsiveness
- [ ] Verify all images load (CDN domains correct)
- [ ] Test error pages (404, 500)
- [ ] Run `npm run build` locally (no errors)
- [ ] Check bundle size (`npm run analyze`)
- [ ] Set security headers (CSP, X-Frame-Options)
- [ ] Enable CORS if needed
- [ ] Backup database before deploying

---

## 🐛 Troubleshooting

### Issue: "Cannot find module '@enroll-website/types'"

**Cause**: Monorepo workspace not linked.

**Solution**:
```bash
rm -rf node_modules package-lock.json
npm install
```

---

### Issue: "NEXT_PUBLIC_API_URL not working"

**Cause**: Environment variables only loaded at build time, not runtime.

**Solution**:
```bash
# Make sure .env.local is in the right place
ls apps/web/.env.local

# Restart dev server
npm run dev

# Or rebuild
npm run build
```

---

### Issue: "Image not loading (from unsplash / google maps)"

**Cause**: Domain not in `next.config.ts` remotePatterns.

**Solution**:
```typescript
// apps/web/next.config.ts
images: {
  remotePatterns: [
    { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
    { protocol: "https", hostname: "*.googleapis.com", pathname: "/**" },
    // Add your domain here
  ],
}
```

---

### Issue: "Modal doesn't validate phone number"

**Cause**: validatePhone function not called or old browser cache.

**Solution**:
```bash
# Hard refresh browser
Ctrl+Shift+R (Windows/Linux)
Cmd+Shift+R (Mac)

# Or clear .next cache and rebuild
rm -rf apps/web/.next
npm run build
```

---

### Issue: "Form submission returns 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้'"

**Cause**: Backend not running or `NEXT_PUBLIC_API_URL` incorrect.

**Solution**:
```bash
# Check backend is running
curl http://localhost:3001/health
# Should return: {"status":"ok"}

# Check .env.local has correct URL
cat apps/web/.env.local

# If using mock mode, comment out API URL
# NEXT_PUBLIC_API_URL=http://localhost:3001
```

---

### Issue: "Thai font not showing (showing boxes)"

**Cause**: Font not loaded or font subset incomplete.

**Solution**:
```typescript
// apps/web/app/activities/layout.tsx
// Already has:
const notoThai = Noto_Sans_Thai({
  subsets: ["latin", "thai"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

// Should be applied:
<div className={`${notoThai.className}`}>...</div>
```

---

## 📚 Additional Resources

### Documentation
- [Next.js 16 Docs](https://nextjs.org/docs)
- [Tailwind CSS v4](https://tailwindcss.com/docs)
- [Express.js Docs](https://expressjs.com/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

### Related Docs in This Project
- `docs/FRONTEND-GUIDE.md` — Component-level documentation
- `docs/activity-page-and-backend-contract.md` — API contract

### Tools & CLIs
- `npm run dev` — Development server
- `npm run build` — Production build
- `npm run start` — Production server

---

## 📞 Support & Contributing

### Bug Reports
Report issues at: https://github.com/your-org/enroll-website/issues

### Development Team
- **Frontend**: Your Name
- **Backend**: (Pending)
- **DevOps**: (Pending)

### License
MIT © 2026 The Coming of Stages (TCOS)

---

**Last Updated**: 2026-05-15  
**Version**: 1.0.0 (Frontend Complete, Backend Pending)  
**Status**: 🟡 Production Ready (Frontend Only)
