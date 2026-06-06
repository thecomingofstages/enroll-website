"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/auth";

interface MemberData {
  memberId: string;
  firstName: string;
  lastName: string;
  nickname: string;
  phone: string;
  email: string;
  qrCodeUrl: string;
}

const MOCK: MemberData = {
  memberId: "MBR-019e97ba",
  firstName: "Alex",
  lastName: "Chen",
  nickname: "Alex",
  phone: "+66 81-234-5678",
  email: "alex.chen@example.com",
  qrCodeUrl: "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=MBR-019e97ba&color=000000&bgcolor=ffffff",
};

export default function MemberQRPage() {
  const [member, setMember] = useState<MemberData>(MOCK);
  const [loading, setLoading] = useState(false);
  const [isBright, setIsBright] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [qrUrl, setQrUrl] = useState(MOCK.qrCodeUrl);

  useEffect(() => {
    apiFetch("/users/me/qr")
      .then(r => r.ok ? r.json() : Promise.reject())
      .then((data: MemberData) => { setMember(data); setQrUrl(data.qrCodeUrl); })
      .catch(() => {}); // fallback to mock
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const r = await apiFetch("/users/me/qr/refresh", { method: "POST" });
      if (r.ok) { const d = await r.json(); setQrUrl(d.qrCodeUrl); }
    } finally { setIsRefreshing(false); }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;0,700;1,400&family=Sarabun:wght@300;400;500;600&family=Inter:wght@300;400;500&display=swap');
        :root {
          --gold: #d8b85a; --gold-dim: rgba(216,184,90,0.15);
          --black: #0e0e0c; --gray: #131311; --card: #1a1916;
          --border: rgba(216,184,90,0.22); --cream: #f0ead6;
          --muted: rgba(240,234,214,0.45);
          --font-display: 'Playfair Display','Sarabun',serif;
          --font-th: 'Sarabun',sans-serif;
          --font-body: 'Inter','Sarabun',sans-serif;
        }
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        body{background:var(--black);color:var(--cream);font-family:var(--font-body);min-height:100dvh}

        .page{min-height:100dvh;background:var(--black);display:flex;flex-direction:column;align-items:center;padding-bottom:60px;transition:filter 0.4s}
        .page.bright{filter:brightness(1.7)}

        .topbar{width:100%;display:flex;align-items:center;justify-content:space-between;padding:13px 18px;background:var(--gray);border-bottom:1px solid var(--border)}
        .back-link{font-family:var(--font-th);font-size:13px;color:var(--gold);text-decoration:none;transition:opacity 0.2s}
        .back-link:hover{opacity:0.7}
        .topbar-label{font-family:var(--font-display);font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:var(--muted)}

        .wrap{width:100%;max-width:360px;padding:20px 16px 0}
        .card{background:var(--card);border-radius:16px;border:1px solid var(--border);overflow:hidden;position:relative;box-shadow:0 20px 50px rgba(0,0,0,0.6)}
        .glow{position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,var(--gold),#e8ce7a,var(--gold),transparent)}

        .card-header{padding:13px 16px 11px;display:flex;align-items:center;gap:8px;border-bottom:1px solid rgba(216,184,90,0.1);background:rgba(216,184,90,0.04)}
        .logo{width:28px;height:28px;border-radius:5px;background:var(--gold);display:flex;align-items:center;justify-content:center;font-size:5.5px;font-weight:700;color:var(--black);text-align:center;line-height:1.3;font-family:var(--font-display);flex-shrink:0}
        .org-name{font-family:var(--font-display);font-size:11px;font-weight:600;color:var(--cream)}
        .org-sub{font-size:8px;letter-spacing:0.1em;text-transform:uppercase;color:var(--muted)}

        .qr-section{padding:20px 16px;display:flex;flex-direction:column;align-items:center;gap:14px;background:radial-gradient(ellipse at 50% 0%,rgba(216,184,90,0.06) 0%,transparent 65%)}

        .member-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;width:100%}
        .mg label{font-size:9px;letter-spacing:0.09em;text-transform:uppercase;color:var(--muted);display:block;margin-bottom:2px}
        .mg span{font-size:13px;color:var(--cream);font-weight:500}
        .mg span.gold{color:var(--gold)}
        .mg.full{grid-column:1/-1}

        .divider-line{width:100%;height:1px;background:rgba(216,184,90,0.1)}

        .qr-outer{width:150px;height:150px;border-radius:12px;padding:3px;background:linear-gradient(135deg,var(--gold),rgba(216,184,90,0.3),var(--gold));box-shadow:0 0 22px rgba(216,184,90,0.15)}
        .qr-inner{width:100%;height:100%;border-radius:10px;background:#fff;display:flex;align-items:center;justify-content:center;overflow:hidden;transition:opacity 0.3s;position:relative}
        .qr-inner img{width:90%;height:90%;object-fit:contain}
        .qr-inner.refreshing img{opacity:0.2}
        .spinner-overlay{position:absolute;inset:0;display:flex;align-items:center;justify-content:center}
        .spinner{width:26px;height:26px;border:2px solid rgba(216,184,90,0.2);border-top-color:var(--gold);border-radius:50%;animation:spin 0.7s linear infinite}
        @keyframes spin{to{transform:rotate(360deg)}}

        .member-id{font-size:9px;letter-spacing:0.08em;color:var(--muted);text-align:center}
        .member-id span{color:var(--gold)}

        .perf{display:flex;align-items:center;overflow:visible}
        .perf-c{width:16px;height:16px;border-radius:50%;background:var(--black);border:1px solid var(--border);flex-shrink:0;margin:0 -8px;z-index:2}
        .perf-l{flex:1;border-top:1px dashed rgba(216,184,90,0.18);margin:0 10px}

        .actions{padding:13px 16px 16px;display:flex;gap:8px}
        .btn-border{flex:1;background:transparent;color:var(--gold);border:1px solid var(--gold);border-radius:8px;padding:10px;font-family:var(--font-th);font-size:12px;font-weight:500;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;transition:background 0.2s}
        .btn-border:hover{background:var(--gold-dim)}
        .btn-border:disabled{opacity:0.4;cursor:not-allowed}
        .btn-border.on{background:var(--gold-dim);border-color:var(--gold)}
      `}</style>

      <div className={`page${isBright ? " bright" : ""}`}>
        <div className="topbar">
          <Link href="/account" className="back-link">← กลับ</Link>
          <span className="topbar-label">Member QR</span>
          <div style={{ width: 50 }} />
        </div>

        <div className="wrap">
          <div className="card">
            <div className="glow" />

            {/* Header */}
            <div className="card-header">
              <div className="logo">THE<br />COMING<br />STAGES</div>
              <div style={{ flex: 1, marginLeft: 6 }}>
                <div className="org-name">The Coming of Stages</div>
                <div className="org-sub">Member ID</div>
              </div>
            </div>

            {/* Member info + QR */}
            <div className="qr-section">
              {/* Member info — ชื่อ/นามสกุล/ชื่อเล่น/เบอร์/อีเมล เท่านั้น ไม่มีข้อมูลกิจกรรม */}
              <div className="member-grid">
                <div className="mg"><label>ชื่อ</label><span>{member.firstName}</span></div>
                <div className="mg"><label>นามสกุล</label><span>{member.lastName}</span></div>
                <div className="mg"><label>ชื่อเล่น</label><span className="gold">{member.nickname}</span></div>
                <div className="mg"><label>เบอร์ติดต่อ</label><span>{member.phone}</span></div>
                <div className="mg full"><label>อีเมล</label><span>{member.email}</span></div>
              </div>

              <div className="divider-line" />

              {/* QR code */}
              <div className="qr-outer">
                <div className={`qr-inner${isRefreshing ? " refreshing" : ""}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={qrUrl} alt="Member QR" />
                  {isRefreshing && (
                    <div className="spinner-overlay"><div className="spinner" /></div>
                  )}
                </div>
              </div>

              <div className="member-id">Member ID: <span>{member.memberId}</span></div>
            </div>

            <div className="perf">
              <div className="perf-c" />
              <div className="perf-l" />
              <div className="perf-c" />
            </div>

            {/* Buttons */}
            <div className="actions">
              <button
                className={`btn-border${isBright ? " on" : ""}`}
                onClick={() => setIsBright(p => !p)}
              >
                ☀ {isBright ? "ลดความสว่าง" : "Maximize Brightness"}
              </button>
              <button
                className="btn-border"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                ↻ Refresh QR
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
