"use client";

import { useState, useEffect, useCallback } from "react";
import { fetchStampStores, redeemStampCode } from "@/lib/stamp-api";
import { useAppState } from "@/lib/context";
import { Header } from "@/components/layout/Header";
import StickyFooter from "@/components/StickyFooter";
import SiteFooter from "@/components/SiteFooter";

export default function StampPage() {
  const { user, openLoginModal } = useAppState();
  const [inputCode, setInputCode] = useState("");
  const [stores, setStores] = useState<{ name: string, count: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  const loadStores = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const data = await fetchStampStores();
    setStores(data);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadStores();
  }, [loadStores]);

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = inputCode.trim().toUpperCase();
    if (!code) return;

    setRedeeming(true);
    setMessage({ text: "", type: "" });

    const result = await redeemStampCode(code);
    
    if (result.success) {
      setMessage({ text: result.message, type: "success" });
      setInputCode("");
      await loadStores();
    } else {
      setMessage({ text: result.message, type: "error" });
    }
    
    setRedeeming(false);
  };

  const collectedCount = stores.filter(s => s.count === 1).length;

  return (
    <>
      <Header />
      <div className="min-h-[calc(100vh-90px)] bg-[#111111] py-12 px-4 sm:px-6 lg:px-8 text-white">
        <div className="max-w-3xl mx-auto space-y-8">
          <h1 className="text-4xl font-bold text-center text-gold font-prompt">Art Market Stamp</h1>
          
          {!user ? (
            <div className="text-center bg-white/5 p-12 rounded-xl border border-white/10 space-y-6">
              <h2 className="text-2xl font-bold font-prompt text-white">กรุณาเข้าสู่ระบบ</h2>
              <p className="text-stone-400">คุณต้องเข้าสู่ระบบก่อนถึงจะสามารถสะสมสแตมป์ได้</p>
              <button 
                onClick={openLoginModal}
                className="bg-gold text-black font-bold px-8 py-3 rounded-lg hover:bg-yellow-500 transition-colors cursor-pointer"
              >
                Login
              </button>
            </div>
          ) : (
            <>
              <form onSubmit={handleRedeem} className="bg-white/5 p-6 rounded-xl border border-white/10 space-y-4">
                <div className="flex gap-4">
                  <input 
                    type="text" 
                    value={inputCode}
                    onChange={(e) => setInputCode(e.target.value)}
                    disabled={redeeming}
                    className="flex-1 bg-black/50 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gold disabled:opacity-50"
                    placeholder="กรอกรหัสจากร้านค้าที่นี่"
                  />
                  <button 
                    type="submit" 
                    disabled={redeeming || !inputCode.trim()}
                    className="bg-gold text-black font-bold px-3 py-3 rounded-lg hover:bg-yellow-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {redeeming ? "Redeeming..." : "Redeem"}
                  </button>
                </div>
                {message.text && (
                  <div className={`p-3 rounded-md text-sm font-semibold ${message.type === 'error' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-green-500/20 text-green-400 border border-green-500/30'}`}>
                    {message.text}
                  </div>
                )}
              </form>

              <div className="space-y-4 pb-24 md:pb-12">
                <h2 className="text-2xl font-semibold font-prompt text-stone-200">
                  ร้านค้าทั้งหมด
                </h2>
                <h3 className="font-prompt">คุณสะสมสแตมป์ครบ <span className="font-bold text-gold">{loading ? "" : `${collectedCount}`}</span> จาก {loading ? "" : `${stores.length} ร้านค้าแล้ว`}</h3>
                
                {loading ? (
                  <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold"></div>
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {stores.map((store, index) => {
                      const isCollected = store.count === 1;
                      return (
                        <div key={index} className={`flex items-center p-4 rounded-xl border transition-all ${isCollected ? 'bg-gold/10 border-gold/50' : 'bg-white/5 border-white/10'}`}>
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
                    {stores.length === 0 && (
                      <div className="col-span-full text-center py-8 text-stone-400">
                        ไม่พบข้อมูลร้านค้า (No stores found)
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
      <SiteFooter />
      <StickyFooter />
    </>
  );
}

