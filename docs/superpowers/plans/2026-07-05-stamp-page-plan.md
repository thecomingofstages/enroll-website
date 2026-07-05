# Stamp Page Feature Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a Stamp Page at `/stamp` with a centralized input for redeeming stamps, listing all stores, and adding a toggleable "Stamp" link in the global Navbar.

**Architecture:** We will create mock data for stores and stamps first. The `/stamp` route will handle local state for redeemed stamps based on entered codes. `Header.tsx` will read `NEXT_PUBLIC_SHOW_STAMP_MENU` to show the navigation link.

**Tech Stack:** Next.js, React, Tailwind CSS

## Global Constraints
- Use mock data until the backend API is ready.
- Must read `NEXT_PUBLIC_SHOW_STAMP_MENU` from `.env.local` to show/hide the Stamp navigation link.
- 1 stamp per store max.

---

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

### Task 2: Create the Stamp Page UI
**Files:**
- Create: `apps/web/app/stamp/page.tsx`

**Interfaces:**
- Consumes: `mockStores` from `apps/web/lib/mock-stamps.ts`

- [ ] **Step 1: Write the stamp page UI**
```tsx
// apps/web/app/stamp/page.tsx
"use client";

import { useState } from "react";
import { mockStores } from "@/lib/mock-stamps";

export default function StampPage() {
  const [inputCode, setInputCode] = useState("");
  const [collectedStoreIds, setCollectedStoreIds] = useState<string[]>([]);
  const [message, setMessage] = useState({ text: "", type: "" });

  const handleRedeem = (e: React.FormEvent) => {
    e.preventDefault();
    const code = inputCode.trim().toUpperCase();
    if (!code) return;

    const store = mockStores.find((s) => s.code.toUpperCase() === code);
    
    if (!store) {
      setMessage({ text: "รหัสไม่ถูกต้อง (Invalid Code)", type: "error" });
      return;
    }

    if (collectedStoreIds.includes(store.id)) {
      setMessage({ text: `คุณได้รับสแตมป์จากร้าน ${store.name} ไปแล้ว`, type: "error" });
      return;
    }

    setCollectedStoreIds((prev) => [...prev, store.id]);
    setMessage({ text: `รับสแตมป์จากร้าน ${store.name} สำเร็จ!`, type: "success" });
    setInputCode("");
  };

  return (
    <div className="min-h-screen bg-[#111111] py-12 px-4 sm:px-6 lg:px-8 text-white">
      <div className="max-w-3xl mx-auto space-y-8">
        <h1 className="text-4xl font-bold text-center text-gold font-prompt">สะสมสแตมป์ (Stamp Collection)</h1>
        
        <form onSubmit={handleRedeem} className="bg-white/5 p-6 rounded-xl border border-white/10 space-y-4">
          <label className="block text-lg font-medium text-stone-200">กรอกรหัสจากร้านค้า (Enter Store Code)</label>
          <div className="flex gap-4">
            <input 
              type="text" 
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value)}
              className="flex-1 bg-black/50 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gold uppercase"
              placeholder="เช่น TEA123"
            />
            <button type="submit" className="bg-gold text-black font-bold px-6 py-3 rounded-lg hover:bg-yellow-500 transition-colors">
              Redeem
            </button>
          </div>
          {message.text && (
            <div className={`p-3 rounded-md text-sm font-semibold ${message.type === 'error' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-green-500/20 text-green-400 border border-green-500/30'}`}>
              {message.text}
            </div>
          )}
        </form>

        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-stone-200">ร้านค้าทั้งหมด ({collectedStoreIds.length}/{mockStores.length})</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {mockStores.map((store) => {
              const isCollected = collectedStoreIds.includes(store.id);
              return (
                <div key={store.id} className={`flex items-center p-4 rounded-xl border transition-all ${isCollected ? 'bg-gold/10 border-gold/50' : 'bg-white/5 border-white/10'}`}>
                  <div className="flex-1">
                    <h3 className={`text-lg font-bold font-prompt ${isCollected ? 'text-gold' : 'text-stone-300'}`}>{store.name}</h3>
                  </div>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2 ${isCollected ? 'bg-gold border-gold text-black' : 'border-stone-500'}`}>
                    {isCollected && (
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
```

### Task 3: Add Stamp Menu to Navbar
**Files:**
- Modify: `apps/web/components/layout/Header.tsx`

- [ ] **Step 1: Add environment variable logic and nav button**
Add `process.env.NEXT_PUBLIC_SHOW_STAMP_MENU` check in `Header.tsx` and the Stamp button before or after the Account button.

```tsx
// Inside Header.tsx (around line 15), add:
const showStampMenu = process.env.NEXT_PUBLIC_SHOW_STAMP_MENU === 'true';

// Add isStampActive near line 58
const isStampActive = pathname === "/stamp";

// Add the Stamp button block next to Account button block (around line 150)
{showStampMenu && (
  <button
    onClick={() => {
      if (activeModal) closeModals();
      router.push("/stamp");
    }}
    className={`${baseNavLinkClass} ${isStampActive ? activeNavClass : inactiveNavClass} ${isStampActive ? activeUnderlineClass : ""}`}
  >
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-80 group-hover:cursor-pointer hover:opacity-100">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
      <polyline points="14 2 14 8 20 8"></polyline>
      <path d="M16 13H8"></path>
      <path d="M16 17H8"></path>
      <path d="M10 9H8"></path>
    </svg>
    <span className="hidden sm:inline">Stamp</span>
  </button>
)}
```
