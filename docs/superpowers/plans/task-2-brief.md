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
