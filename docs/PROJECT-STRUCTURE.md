# 📂 โครงสร้างโปรเจค (Project Structure)

โปรเจคนี้พัฒนาในรูปแบบ **Monorepo** เพื่อให้จัดการ Frontend, Backend และ Shared Types ได้ในที่เดียว

---

## 🏗️ ภาพรวม (Root)
- `apps/` — ที่เก็บแอปพลิเคชันหลัก
- `packages/` — ที่เก็บโมดูลส่วนกลางที่แอปอื่นๆ เรียกใช้
- `docs/` — เอกสารประกอบโปรเจคและการออกแบบ
- `package.json` — การตั้งค่า dependencies ของทั้งโปรเจค

---

## 💻 Frontend (`apps/web`)
สร้างด้วย **Next.js 15 (App Router)**
- `app/` — ระบบ Routing
  - `activities/[id]/` — หน้ารายละเอียดกิจกรรม (Dynamic Route)
    - `page.tsx` — หน้าหลักที่ดึงข้อมูลมาแสดง
    - `layout.tsx` — กำหนด Font ภาษาไทยและโครงสร้างหน้า
  - `globals.css` — Tailwind CSS setup
- `components/activity/` — ส่วนประกอบ UI ของหน้ากิจกรรม
  - `ActivityHero.tsx` — ส่วนหัว (รูปภาพ + ชื่อ)
  - `ActivityTimeline.tsx` — กำหนดการ
  - `RegisterModal.tsx` — **หัวใจสำคัญ:** ฟอร์มลงทะเบียน 3 ขั้นตอน
- `lib/` — ฟังก์ชันเสริม
  - `activity-api.ts` — ตัวเชื่อมต่อ API (ดึงข้อมูล/ส่งฟอร์ม)
  - `mock-activity.ts` — ข้อมูลจำลองสำหรับทดสอบ (Offline Mode)

---

## ⚙️ Backend (`apps/api`)
สร้างด้วย **Node.js + Express**
- `src/`
  - `index.ts` — จุดเริ่มต้นของ Server และการกำหนด Endpoints
- `package.json` — Backend dependencies

---

## 📦 Shared Types (`packages/types`)
- `index.ts` — **สัญญา (Contract)** ระหว่างหน้าบ้านและหลังบ้าน เก็บ Interface ทั้งหมด (เช่น `ActivityDetail`, `RegistrationPayload`) เพื่อให้ทั้งสองฝั่งคุยภาษาเดียวกัน

---

## 📄 Documentation (`docs/`)
- `BACKEND-REQUIREMENTS.md` — สิ่งที่หลังบ้านต้องทำ
- `FRONTEND_API_ALIGNMENT.md` — สรุปการปรับจูนโค้ดให้ตรงตาม Spec
- `project-architecture.canvas` — ผังการทำงาน (ดูผ่าน Obsidian)
- `PROJECT-STRUCTURE.md` — ไฟล์นี้ (แผนที่นำทาง)
