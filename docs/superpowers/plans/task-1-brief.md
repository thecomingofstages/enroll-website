### Task 1: Create Mock Data for Stamps

**Files:**
- Create: `apps/web/lib/mock-stamps.ts`

**Interfaces:**
- Produces: `mockStores` (array of objects), `Store` type.

- [ ] **Step 1: Write the mock data file**
```typescript
// apps/web/lib/mock-stamps.ts
export type Store = {
  id: string;
  name: string;
  code: string;
};

export const mockStores: Store[] = [
  { id: "store_1", name: "ร้านน้ำชาคุณยาย", code: "TEA123" },
  { id: "store_2", name: "ร้านปิ้งย่างหม่าล่า", code: "MALA456" },
  { id: "store_3", name: "ซุ้มเกมปาเป้า", code: "GAME789" },
  { id: "store_4", name: "ร้านขายของที่ระลึก", code: "GIFT000" },
];
```
