# หน้ารายละเอียดกิจกรรม (`/activities/[id]`) — สรุปงาน Frontend และสัญญา API สำหรับ Backend

เอกสารนี้อธิบายว่า **ฝั่ง Web (Next.js)** ทำอะไรไปแล้ว และ **Backend ควรรองรับ endpoint / รูปแบบข้อมูล** อย่างไรให้ตรงกับที่ Frontend เรียกใช้อยู่

---

## สถานะการทำงาน Frontend (ล่าสุด)

| ส่วน | สถานะ | หมายเหตุ |
|------|-------|----------|
| Hero + About + Timeline + Location | ✅ สมบูรณ์ | UI ทั้งหมดเสร็จแล้ว |
| RegisterModal (3 ขั้นตอน) | ✅ สมบูรณ์ | Form input + validation |
| **Form Validation (Part 1)** | ✅ ทำแล้ว | ชื่อ/นามสกุล min 2 ตัวอักษร, เบอร์ 10 หลัก (06/08/09) |
| **ฟอนต์ไทย** | ✅ ทำแล้ว | Noto_Sans_Thai + `lang="th"` ใน `/activities` |
| **Image domains** | ✅ ทำแล้ว | Unsplash, Google Maps, Apple Maps, OSM |
| **.env.local setup** | ✅ ทำแล้ว | `NEXT_PUBLIC_API_URL` (ตั้ง comment ไว้ default mock) |
| API integration | ✅ พร้อม | รอ Backend ส่ง real endpoint |
| PromptPay QR | ⏳ รอ Backend | ตอนนี้เป็น placeholder "QR Code" |

---

## 1. ขอบเขตงาน Frontend (สรุป)

| ส่วน | รายละเอียด |
|------|------------|
| Route | `GET` หน้าเว็บที่ path **`/activities/:id`** (dynamic segment ชื่อ `id`) |
| Hero | รูปพื้นหลัง (`heroImageUrl`) + ชื่อกิจกรรม + ชื่อสถานที่หลักจาก `venue.name` |
| ปุ่มลงทะเบียน | เปิด **Modal** แบบหลายขั้นตอน |
| Modal ขั้น 1 | ชื่อ (min 2 ตัวอักษร), นามสกุล (min 2 ตัวอักษร), เบอร์โทร (10 หลัก, 06/08/09) — มี real-time error message |
| Modal ขั้น 2 | แสดงช่อง **PromptPay** (UI ตัวอย่าง QR) + อัปโหลด **สลิป** (`paymentSlip`) |
| Modal ขั้น 3 | คำถามเพิ่มเติม — จำนวนและข้อความมาจาก **`extraQuestions`** ใน response ของกิจกรรม |
| เนื้อหาหน้า | เกี่ยวกับกิจกรรม + วิทยากร, Timeline กำหนดการ, สถานที่ (รูปแผนที่ + ที่อยู่ + ลิงก์เส้นทาง) |

โค้ดหลัก:

- หน้า: `apps/web/app/activities/[id]/page.tsx`
- เรียก API / mock: `apps/web/lib/activity-api.ts`
- ข้อมูลตัวอย่าง (เมื่อไม่มี API): `apps/web/lib/mock-activity.ts`
- คอมโพเนนต์ UI: `apps/web/components/activity/`
- Type ที่ใช้ร่วมกัน: `packages/types/index.ts` (`ActivityDetail` และที่เกี่ยวข้อง)

---

## 2. การตั้งค่าสิ่งแวดล้อม (สำหรับเชื่อม Backend จริง)

Frontend อ่าน **base URL** จากตัวแปร:

```env
NEXT_PUBLIC_API_URL=https://your-api.example.com
```

- ไม่มี trailing slash ก็ได้ (ฝั่ง client ตัดทิ้งให้)
- ถ้า **ไม่ตั้งค่า** หรือ **เรียก API แล้วไม่สำเร็จ** → หน้ารายละเอียดกิจกรรมจะใช้ **mock ใน repo** เพื่อพัฒนาต่อได้โดยไม่ต้องรอ Backend

**ปุ่ม “ขอเส้นทาง” (เมื่อ API ไม่ส่ง `venue.directionsUrl`)** — เลือกผู้ให้บริการ fallback ด้วยตัวแปร (ไม่ตั้ง = Google):

```env
# ค่าที่รองรับ: google | apple | osm (หรือ openstreetmap)
NEXT_PUBLIC_DIRECTIONS_FALLBACK=google
```

- ถ้า **`venue.directionsUrl` มีค่า** → ปุ่มเปิด URL นั้นโดยตรง (ไม่บังคับเป็น Google; ใช้ลิงก์ Apple Maps / LINE / อื่นๆ ได้)
- ถ้า **`venue.directionsUrl` ว่างหรือไม่ส่ง** → Frontend สร้างลิงก์ค้นหาจาก `venue.name` + `venue.addressLines` โดยใช้ผู้ให้บริการตาม `NEXT_PUBLIC_DIRECTIONS_FALLBACK`

โค้ดอ้างอิง: `apps/web/lib/directions-url.ts`, คอมโพเนนต์ `apps/web/components/activity/ActivityLocation.tsx`

**URL เว็บไซต์สำหรับ metadata / Open Graph (ไม่บังคับ):**

```env
# ตัวอย่าง: https://your-domain.com (ใช้กับ metadataBase และลิงก์สัมพัทธ์ใน OG)
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

- บน Vercel ถ้าไม่ตั้ง อาจใช้ `VERCEL_URL` เป็น fallback ใน [`apps/web/lib/site-url.ts`](apps/web/lib/site-url.ts)

---

## 3. Endpoint ที่ Frontend คาดหวัง (สัญญาปัจจุบัน)

### 3.1 ดึงรายละเอียดกิจกรรม

| รายการ | ค่า |
|--------|-----|
| Method | `GET` |
| Path | `{NEXT_PUBLIC_API_URL}/activities/:id` |
| `id` | string (URL-encoded ได้) |

**ความสำเร็จ:** HTTP `200` และ body เป็น **JSON** ที่โครงสร้างสอดคล้องกับ type **`ActivityDetail`** (ดูมาตรฐานใน `packages/types/index.ts`)

**กรณีไม่พบกิจกรรม:** แนะนำ HTTP **`404`** เมื่อไม่มีรายการ → แสดงหน้า **ไม่พบกิจกรรม** (`app/activities/[id]/not-found.tsx`)

**กรณี API ผิดพลาด (ไม่ใช่ 404):** เช่น **500 / 502 / เครือข่ายล้มเหลว / JSON ไม่ถูกต้อง** → แสดงหน้า **ข้อผิดพลาด** พร้อมปุ่มลองใหม่ (`app/activities/[id]/error.tsx`) โดยโยน `ActivityApiLoadError` จาก [`apps/web/lib/activity-api.ts`](apps/web/lib/activity-api.ts)

- ถ้ามี **`NEXT_PUBLIC_API_URL`** และ `GET` ได้ **200** → ใช้ข้อมูลจริง
- ถ้ามี **`NEXT_PUBLIC_API_URL`** และ `GET` ได้ **404** → ไม่พบกิจกรรม (ไม่ใช้ mock)
- ถ้ามี **`NEXT_PUBLIC_API_URL`** และ `GET` ล้มเหลวแบบอื่น → หน้า error ตามด้านบน
- ถ้า **ไม่ตั้ง** `NEXT_PUBLIC_API_URL` → ใช้ข้อมูล **mock** ใน repo เพื่อพัฒนา

**แคช (Server-side fetch):** ใช้ `revalidate: 60` วินาที (ข้อมูลอาจดูค้างได้สูงสุด ~1 นาที)

---

### 3.2 ลงทะเบียนเข้าร่วมกิจกรรม

| รายการ | ค่า |
|--------|-----|
| Method | `POST` |
| Path | `{NEXT_PUBLIC_API_URL}/activities/:id/register` |
| Content-Type | **`multipart/form-data`** (ส่งเป็น `FormData` จากเบราว์เซอร์) |

**ฟิลด์ใน FormData (ชื่อ key ต้องตรงกับนี้ถ้าไม่แก้ Frontend)**

| Key | ประเภท | บังคับ | คำอธิบาย |
|-----|--------|--------|----------|
| `firstName` | string | ใช่ | ชื่อ |
| `lastName` | string | ใช่ | นามสกุล |
| `phone` | string | ใช่ | เบอร์โทร |
| `extraAnswers` | string (JSON) | ใช่ | อ็อบเจ็กต์ **questionId → คำตอบข้อความ** เช่น `{"open-mic":"สนใจครับ"}` — key ต้องตรงกับ `extraQuestions[].id` ที่ส่งมาจาก GET |
| `paymentSlip` | file | แนะนำให้บังคับ | ไฟล์สลิป — Frontend ส่ง key นี้เมื่อผู้ใช้เลือกไฟล์แล้ว (MIME: รูปหรือ PDF ตามที่ UI จำกัด) |

**ตัวอย่างค่า `extraAnswers`:**  
ถ้า GET ส่ง `extraQuestions: [{ "id": "open-mic", "label": "..." }]` แล้วผู้ใช้ตอบในช่องนั้น ค่าที่ส่งอาจเป็น:

```json
{"open-mic":"ตอบว่าสนใจ / ไม่สนใจ / อื่นๆ"}
```

**Response ที่ Frontend พยายามอ่าน (JSON, เมื่อ `res.ok`)**

โครงสร้างใกล้เคียง type `ActivityRegistrationResult`:

- ควรมีอย่างน้อยข้อมูลที่ UI ใช้แสดงผลสำเร็จ เช่น `enrollmentId` (string, optional) และ `message` (string, optional)
- โค้ดปัจจุบันตรวจแค่ `res.ok` แล้ว parse JSON แบบ best-effort

**กรณีผิดพลาด:** HTTP ไม่ใช่ 2xx — Frontend จะแสดงข้อความจาก body ถ้ามี field `message` ไม่เช่นนั้นใช้ข้อความทั่วไปพร้อม status code

---

## 4. โครงสร้าง JSON ของ `ActivityDetail` (ให้ Backend map ให้ตรง)

รายการนี้สอดคล้องกับ **`ActivityDetail`** ใน `packages/types/index.ts` (สืบทอดจาก `Activity`)

### 4.1 ฟิลด์จาก `Activity` (ฐาน)

| Field | Type | หมายเหตุ |
|-------|------|----------|
| `id` | string | ควรตรงกับ `:id` ใน URL |
| `name` | string | ชื่อกิจกรรม (หัวข้อใหญ่) |
| `description` | string | คำอธิบายยาว (ใช้ในส่วน “เกี่ยวกับกิจกรรม”) |
| `date` | string | ISO 8601 แนะนำ (แสดงผลละเอียดอาจขยายในรอบถัดไป) |
| `capacity` | number | จำนวนที่นั่ง/โควตา (ยังไม่บังคับใช้บนหน้านี้ทุกจุด แต่มีใน type) |

### 4.2 ฟิลด์เพิ่มของรายละเอียดหน้า

| Field | Type | หมายเหตุ |
|-------|------|----------|
| `heroImageUrl` | string | URL รูป hero (ต้องอนุญาตใน `next/image` หรือเป็น URL ที่โหลดได้) |
| `venue` | object | ดู 4.3 |
| `highlights` | string[] | รายการ bullet “สิ่งที่จะได้รับ” |
| `speaker` | object | ดู 4.4 |
| `schedule` | array | ดู 4.5 |
| `priceThb` | number | ราคาเป็นบาท — แสดงบนปุ่มและใน Modal |
| `extraQuestions` | array | ดู 4.6 — **กำหนดคำถามขั้นที่ 3 ของฟอร์ม** |

### 4.3 `venue`

| Field | Type | บังคับ |
|-------|------|--------|
| `name` | string | ใช่ |
| `addressLines` | string[] | ใช่ (หลายบรรทัด) |
| `mapImageUrl` | string | ไม่ — ถ้าไม่มี ส่วนแผนที่อาจว่าง |
| `directionsUrl` | string | ไม่ — ลิงก์เต็มสำหรับปุ่ม “ขอเส้นทาง” (Google / Apple / อื่นๆ ตามที่ต้องการ); **ถ้ามีค่า จะใช้แทนการคำนวณอัตโนมัติ** |

### 4.4 `speaker`

| Field | Type |
|-------|------|
| `name` | string |
| `role` | string |
| `avatarUrl` | string (optional) |

### 4.5 `schedule[]` (`ActivityScheduleItem`)

| Field | Type | หมายเหตุ |
|-------|------|----------|
| `id` | string | unique ต่อรายการ |
| `timeRange` | string | แสดงเป็นข้อความ เช่น `"10:00 – 11:30"` |
| `title` | string | หัวข้อช่วงเวลา |
| `description` | string | รายละเอียด |
| `highlight` | boolean (optional) | ถ้า `true` จุด timeline เน้นสี |

### 4.6 `extraQuestions[]` (`ActivityExtraQuestion`)

| Field | Type | หมายเหตุ |
|-------|------|----------|
| `id` | string | **ใช้เป็น key ใน `extraAnswers`** เมื่อ POST ลงทะเบียน |
| `label` | string | ข้อความคำถามบน UI |
| `placeholder` | string (optional) | placeholder ใน textarea |

---

## 5. สิ่งที่ Backend อาจอยากตกลงเพิ่มกับทีม

1. **Authentication** — ตอนนี้ Modal ไม่ส่ง `Authorization` header; ถ้าต้องล็อกอินก่อนลงทะเบียน ต้องตกลงวิธีส่ง token (cookie vs Bearer) แล้วค่อยแก้ `postActivityRegistration`
2. **ผู้ใช้ล็อกอินแล้ว** — prefill ชื่อ/เบอร์จากบัญชี (ตามสเปกโปรเจกต์) ยังไม่ได้ผูกกับ API user ในโค้ดชุดนี้
3. **PromptPay จริง** — QR / เลขพร้อมเพย์ / reference อาจมาจาก Backend แทน placeholder ใน UI
4. **ชื่อ path** — ถ้าทีมใช้เช่น `POST /enrollments` แทน `POST /activities/:id/register` แจ้ง Frontend เพื่อเปลี่ยน URL ใน `activity-api.ts` ให้ตรงจุดเดียว

---

## 6. อ้างอิงไฟล์ใน repo

| หน้าที่ | Path |
|---------|------|
| สัญญา type ร่วม | `packages/types/index.ts` |
| GET/POST จาก Web | `apps/web/lib/activity-api.ts` |
| ลิงก์เส้นทาง (fallback + `directionsUrl`) | `apps/web/lib/directions-url.ts` |
| ตัวอย่างข้อมูล | `apps/web/lib/mock-activity.ts` |
| หน้า Next.js | `apps/web/app/activities/[id]/page.tsx` |
| ไม่พบกิจกรรม (เมื่อไม่มีข้อมูล / API ล้ม) | `apps/web/app/activities/[id]/not-found.tsx` |
| โหลดกิจกรรมไม่สำเร็จ (API ไม่ใช่ 404) | `apps/web/app/activities/[id]/error.tsx` |
| metadata / OG base URL | `apps/web/lib/site-url.ts` |
| ฟอนต์ไทยใต้ `/activities` | `apps/web/app/activities/layout.tsx` |
| สถานที่ + ปุ่มขอเส้นทาง | `apps/web/components/activity/ActivityLocation.tsx` |

หาก Backend เปลี่ยน schema แนะนำให้อัปเดต **`ActivityDetail` / response ของ register`** ใน `packages/types` และแจ้ง Frontend ให้ sync UI กับฟิลด์ใหม่
