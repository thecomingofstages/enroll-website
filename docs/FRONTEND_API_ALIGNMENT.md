# สรุปการปรับปรุง Frontend ให้สอดคล้องกับ API Specification v1.0

**Branch:** `feature/align-frontend-to-backend-spec`
**อ้างอิงเอกสาร:** `API_Spec_17526.pdf`
**สถานะ:** อัปเดตและทดสอบ Build ผ่านเรียบร้อยแล้ว (รอเชื่อมต่อกับ Backend จริง)

เอกสารฉบับนี้สรุปการเปลี่ยนแปลงทั้งหมดในฝั่ง Frontend (Next.js) เพื่อให้โครงสร้างข้อมูลและการเรียกใช้งาน API ตรงกับมาตรฐานที่ทีม Backend กำหนดไว้ในเอกสาร PDF

---

## 1. การปรับปรุงโครงสร้างข้อมูล (Types/Interfaces)

**ไฟล์ที่แก้ไข:** `packages/types/index.ts`

- **ปรับเป็น Snake Case:** เปลี่ยนชื่อตัวแปรทั้งหมดจาก `camelCase` เป็น `snake_case` เพื่อให้ตรงกับโครงสร้าง Database และ API ของ Backend
  - _ตัวอย่าง:_ `priceThb` ➡️ `price`, `heroImageUrl` ➡️ `hero_image_url`, `extraQuestions` ➡️ `extra_questions`
- **เพิ่มตัวแปรควบคุมสถานะ:** เพิ่ม `is_registration_open`, `seat_capacity`, และ `enrolled_count` ใน `Activity` interface สำหรับจัดการ UI ฝั่งหน้าเว็บ
- **รองรับ Standard API Envelope:** เพิ่ม Interface `ApiResponse<T>` เพื่อรองรับ Response ที่ห่อหุ้มด้วยรูปแบบ `{ success: boolean, data: T, error?: any }` เสมอ

## 2. การปรับปรุง Flow การลงทะเบียน (API Caller)

**ไฟล์ที่แก้ไข:** `apps/web/lib/activity-api.ts`

เดิมที Frontend ใช้การยิง API แบบรวบยอดครั้งเดียว (1-Step) แต่เพื่อให้สอดคล้องกับ PDF ได้ปรับรื้อใหม่เป็นการยิงแบบ **2-Steps** โดยซ่อน Logic ไว้ใต้ฟังก์ชัน `postActivityRegistration` ดังนี้:

- **Step 1: สร้าง Registration (`POST /registrations`)**
  - ส่งข้อมูลเป็น `application/json`
  - ประกอบด้วย `activity_id` และแปลง `extraAnswers` เป็น Array ของ `custom_answers` (`[{ question_id, answer }]`)
  - **หมายเหตุ:** เพิ่มการจำลอง Object `new_user` (email, password, gender) เพื่อให้ API ทำงานได้โดยไม่ต้องเพิ่มขั้นตอนบังคับกรอกในหน้าเว็บ ณ ตอนนี้
- **Step 2: อัปโหลดสลิป (`POST /registrations/:registration_id/payment`)**
  - ถ้าระบบตอบรับ Step 1 สำเร็จ จะดึง `registration_id` ไปเรียก API ตรวจสลิปด้วยรูปแบบ `multipart/form-data` ทันที

## 3. การปรับปรุง UI และเงื่อนไขการสมัคร (React Components & Utilities)

**ไฟล์ที่แก้ไข:** `RegisterModal.tsx`, `ActivityHero.tsx`, `ActivityAbout.tsx`, `ActivityTimeline.tsx`, `ActivityLocation.tsx`, `apps/web/lib/directions-url.ts`, `apps/web/lib/mock-activity.ts`

- **อัปเดต Data Binding:** เปลี่ยนแปลงโค้ดแสดงผลในทุก Component ให้เรียกใช้ตัวแปร `snake_case` ใหม่
- **อัปเดตฟังก์ชันแปลงแผนที่:** ปรับปรุงยูทิลิตี้ขอเส้นทางใน `directions-url.ts` ให้รับข้อมูลจากฟิลด์ `address_lines` และ `directions_url` ของสเปคใหม่
- **ปรับปรุงข้อมูลจำลอง (Mock Data):** แก้ไขข้อมูลใน `mock-activity.ts` ให้มีประเภทและฟิลด์ตรงกับ Interface ใหม่ทั้งหมด เพื่อให้ระบบทำงานในโหมด Offline และทดสอบได้ปกติ
- **เพิ่มระบบล็อคปุ่ม (Capacity Check):**
  - ประเมินจาก `activity.is_registration_open` หากเป็น `false` ปุ่มจะขึ้นว่า **"ปิดรับสมัครแล้ว"** และกดไม่ได้
  - ประเมินจาก `activity.enrolled_count >= activity.seat_capacity` หากยอดคนเต็ม ปุ่มจะขึ้นว่า **"ที่นั่งเต็มแล้ว"** และกดไม่ได้

---

## 📢 Note ถึงทีม Backend

- **Endpoint ที่ Frontend เรียกใช้:**
  1. `GET /activities/:id` (คาดหวังรูปแบบ `success: true, data: {...}`)
  2. `POST /registrations` (คาดหวังคืนค่า `registration_id`)
  3. `POST /registrations/:registration_id/payment`
- **สถานะปัจจุบัน:** Frontend พร้อมยิง API เข้าเส้นทางจริงทั้งหมดแล้ว โค้ดถูกจัดเก็บแยกไว้ใน Branch `feature/align-frontend-to-backend-spec` อย่างปลอดภัย
- ฝั่ง Frontend จะรออัปเดตความคืบหน้าเรื่อง **API ตรวจสอบยอดเงิน PromptPay** หากมีอะไรเปลี่ยนแปลงในสเปค สามารถแจ้งเพื่อให้ปรับปรุง Frontend เพิ่มเติมได้ทันที
