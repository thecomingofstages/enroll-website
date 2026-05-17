# Backend Requirements — สิ่งที่ Backend ต้องทำ

**เอกสารนี้อธิบายว่า Backend ต้องสร้าง API endpoint ไหนบ้าง เพื่อให้ Frontend ทำงานได้**

---

## 1. Endpoints ที่จำเป็น

### 1.1 `GET /activities/:id` — ดึงรายละเอียดกิจกรรม

| รายละเอียด    | ค่า                           |
| ------------- | ----------------------------- |
| Method        | `GET`                         |
| Path          | `/activities/:id`             |
| Status Code   | `200` (สำเร็จ), `404` (ไม่พบ) |
| Response Type | `application/json`            |

**Response Body (200 OK):**

```json
{
  "id": "demo-theater-tech",
  "name": "Demo Theater Tech Workshop",
  "description": "เรียนรู้เทคโนโลยีการแสดง...",
  "date": "2024-03-15T10:00:00Z",
  "capacity": 50,
  "heroImageUrl": "https://unsplash.com/photos/...",
  "priceThb": 500,
  "venue": {
    "name": "สถานที่จัดงาน",
    "addressLines": ["123 ถนนหลัก", "เขตสาทร", "กรุงเทพมหานคร"],
    "mapImageUrl": "https://maps.googleapis.com/...",
    "directionsUrl": "https://maps.google.com/?q=..."
  },
  "speaker": {
    "name": "ชื่อวิทยากร",
    "role": "บทบาท",
    "avatarUrl": "https://..."
  },
  "highlights": ["สิ่งที่จะได้รับ 1", "สิ่งที่จะได้รับ 2"],
  "schedule": [
    {
      "id": "schedule-1",
      "timeRange": "10:00 – 10:30",
      "title": "การต้อนรับและกล่าวเปิด",
      "description": "...",
      "highlight": true
    }
  ],
  "extraQuestions": [
    {
      "id": "open-mic",
      "label": "คุณสนใจเข้าร่วม Open Mic ไหม?",
      "placeholder": "ใส่ความเห็น..."
    }
  ]
}
```

**กรณี 404 (ไม่พบ):**

```json
{
  "error": "Activity not found"
}
```

---

### 1.2 `POST /activities/:id/register` — ลงทะเบียนเข้าร่วม

| รายละเอียด   | ค่า                                                        |
| ------------ | ---------------------------------------------------------- |
| Method       | `POST`                                                     |
| Path         | `/activities/:id/register`                                 |
| Content-Type | `multipart/form-data`                                      |
| Status Code  | `200` (สำเร็จ), `400` (ข้อมูลไม่ถูก), `404` (ไม่พบกิจกรรม) |

**Request Body (FormData fields):**

| Key            | ประเภท        | บังคับ | คำอธิบาย                                          |
| -------------- | ------------- | ------ | ------------------------------------------------- |
| `firstName`    | string        | ✅     | ชื่อ (min 2 ตัวอักษร)                             |
| `lastName`     | string        | ✅     | นามสกุล (min 2 ตัวอักษร)                          |
| `phone`        | string        | ✅     | เบอร์โทร (10 หลัก, 06/08/09)                      |
| `paymentSlip`  | file          | ✅     | ไฟล์สลิป (image/png, image/jpeg, application/pdf) |
| `extraAnswers` | string (JSON) | ✅     | JSON object เช่น `{"open-mic":"ตอบว่า..."}`       |

**ตัวอย่าง extraAnswers:**

```json
{
  "open-mic": "ใช่ สนใจร่วมเข้า",
  "other-question-id": "คำตอบอื่น"
}
```

**Response Body (200 OK):**

```json
{
  "enrollmentId": "enr-12345",
  "message": "ลงทะเบียนสำเร็จแล้ว",
  "activityId": "demo-theater-tech",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response Body (400 Bad Request):**

```json
{
  "error": "Invalid phone number",
  "details": "Phone must be 10 digits"
}
```

---

## 2. ข้อตกลง / Requirement

### 2.1 Port

- **Frontend:** port `3000` (Next.js)
- **Backend:** port `3001` (หรือตั้งค่าให้ Frontend รู้)
- ⚠️ **ต้องไม่ชนกัน!**

### 2.2 CORS (ถ้า Frontend + Backend คนละ domain)

ถ้า Backend ไม่อยู่ localhost domain เดียวกัน ต้อง enable CORS:

```javascript
// ตัวอย่าง Express
const cors = require("cors");
app.use(cors({ origin: "http://localhost:3000" }));
```

### 2.3 Environment Variable ที่ Frontend ตั้ง

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

Frontend จะเรียก API ไปที่ URL นี้

### 2.4 ActivityDetail Type (ต้องตรงกับ packages/types/index.ts)

ให้ส่ง JSON ที่โครงสร้างตรงกับ type `ActivityDetail` ใน shared types

---

## 3. Checklist สำหรับ Backend

- [ ] สร้าง `GET /activities/:id` endpoint
- [ ] สร้าง `POST /activities/:id/register` endpoint
- [ ] Validate form data (ชื่อ min 2, เบอร์ 10 หลัก)
- [ ] Receive file upload (paymentSlip)
- [ ] Parse JSON extraAnswers
- [ ] Response HTTP status code ถูกต้อง (200/400/404)
- [ ] Response JSON format ถูกต้อง
- [ ] Enable CORS ถ้าต้อง
- [ ] ตั้ง Port 3001 (หรือแจ้ง Frontend ว่าใช้ port ไหน)

---

## 4. ตัวอย่างการใช้จาก Frontend

Frontend จะเรียก API ประมาณนี้:

```typescript
// ดึงข้อมูลกิจกรรม
const res = await fetch(`http://localhost:3001/activities/demo-theater-tech`);
const data = await res.json();

// ส่งฟอร์มลงทะเบียน
const formData = new FormData();
formData.append("firstName", "John");
formData.append("lastName", "Doe");
formData.append("phone", "0812345678");
formData.append("paymentSlip", fileObject);
formData.append("extraAnswers", JSON.stringify({ "open-mic": "ใช่" }));

const registerRes = await fetch(
  `http://localhost:3001/activities/demo-theater-tech/register`,
  { method: "POST", body: formData },
);
const result = await registerRes.json();
```

---

## 5. References

- Frontend ดึง/ส่ง API: `apps/web/lib/activity-api.ts`
- Shared type definitions: `packages/types/index.ts`
- Mock data ที่ Frontend ใช้ทดสอบ: `apps/web/lib/mock-activity.ts`
- เอกสารเต็ม: `docs/activity-page-and-backend-contract.md`

---

**ถ้ามีข้อสงสัย ให้อ้างอิง `activity-page-and-backend-contract.md` ครับ**
