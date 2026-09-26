"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { apiFetch } from "@/lib/auth";

interface TicketData {
  ticketId: string;
  firstName: string;
  lastName: string;
  nickname: string;
  activityName: string;
  date: string;
  time: string;
  venue: string;
  qrCodeUrl: string;
  isScanned: boolean;
  groupNumber?: string;
  participantInfo?: {
    seatSection?: string;
    role?: string;
    notes?: string;
  };
}

// Mock — replace with real API
const MOCK: TicketData = {
  ticketId: "TKT-123456789",
  firstName: "Eleanor",
  lastName: "Vance",
  nickname: "Ellie",
  activityName: "The Midnight Sonata",
  date: "24 ต.ค. 2567",
  time: "20:00",
  venue: "The Grand Lyric Theatre, Section Orchestra, Row G, Seat 12",
  qrCodeUrl: "https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=TKT-123456789&color=000000&bgcolor=ffffff&format=svg",
  isScanned: false,
  groupNumber: "G-07",
  participantInfo: { seatSection: "Orchestra Row G", role: "Audience", notes: "VIP entry from 19:30" },
};

export default function QRTicketPage() {
  const searchParams = useSearchParams();
  const ticketId = searchParams.get("ticket");

  const [ticket, setTicket] = useState<TicketData>(MOCK);
  const [loading, setLoading] = useState(false);
  const [isBright, setIsBright] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [qrUrl, setQrUrl] = useState(MOCK.qrCodeUrl);
  const [isScanned, setIsScanned] = useState(MOCK.isScanned);

  useEffect(() => {
    if (!ticketId) return;
    setLoading(true);
    apiFetch(`/tickets/${ticketId}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then((data: TicketData) => { setTicket(data); setQrUrl(data.qrCodeUrl); setIsScanned(data.isScanned); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [ticketId]);

  const handleRefresh = async () => {
    if (!ticketId) return;
    setIsRefreshing(true);
    try {
      const r = await apiFetch(`/tickets/${ticketId}/refresh`, { method: "POST" });
      if (r.ok) { const d = await r.json(); setQrUrl(d.qrCodeUrl); }
    } finally { setIsRefreshing(false); }
  };

  if (loading) return (
    <div style={{ minHeight: "100dvh", background: "#0e0e0c", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <span style={{ color: "#d8b85a", fontFamily: "serif", letterSpacing: "0.12em", fontSize: 13 }}>กำลังโหลด…</span>
    </div>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Sarabun:wght@300;400;500;600&family=Inter:wght@300;400;500&display=swap');

        :root {
          --gold: #d8b85a;
          --gold-light: #e8ce7a;
          --gold-dim: rgba(216,184,90,0.15);
          --black: #0e0e0c;
          --gray: #131311;
          --red-tone: #353532;
          --card-bg: #1a1916;
          --border: rgba(216,184,90,0.25);
          --green: #acd8a7;
          --cream: #f0ead6;
          --muted: rgba(240,234,214,0.45);
          --font-display: 'Playfair Display', 'Sarabun', serif;
          --font-th: 'Sarabun', sans-serif;
          --font-body: 'Inter', 'Sarabun', sans-serif;
        }

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          background: var(--black);
          color: var(--cream);
          font-family: var(--font-body);
          min-height: 100dvh;
        }

        /* ── Page wrapper ── */
        .qr-page {
          min-height: 100dvh;
          background: var(--black);
          display: flex;
          flex-direction: column;
          align-items: center;
          transition: filter 0.5s ease;
          padding-bottom: 80px;
        }
        .qr-page.bright { filter: brightness(1.7) saturate(0.5); }

        /* ── Top nav ── */
        .top-nav {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          background: var(--gray);
          border-bottom: 1px solid var(--border);
        }
        .back-link {
          font-family: var(--font-th);
          font-size: 13px;
          color: var(--gold);
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: opacity 0.2s;
        }
        .back-link:hover { opacity: 0.7; }
        .nav-title {
          font-family: var(--font-display);
          font-size: 13px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--muted);
        }
        .nav-right { width: 80px; } /* spacer */

        /* ── Scanned banner ── */
        .scanned-banner {
          width: 100%;
          background: linear-gradient(135deg, rgba(172,216,167,0.12), rgba(172,216,167,0.06));
          border-bottom: 1px solid rgba(172,216,167,0.3);
          padding: 14px 24px;
          display: flex;
          align-items: center;
          gap: 14px;
          animation: slideDown 0.4s cubic-bezier(0.16,1,0.3,1);
        }
        @keyframes slideDown { from { transform: translateY(-100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .pulse-dot {
          width: 10px; height: 10px;
          border-radius: 50%;
          background: var(--green);
          flex-shrink: 0;
          animation: pulse 2s infinite;
        }
        @keyframes pulse { 0%,100% { box-shadow: 0 0 0 0 rgba(172,216,167,0.5); } 50% { box-shadow: 0 0 0 6px rgba(172,216,167,0); } }
        .scanned-text h3 { font-family: var(--font-display); font-size: 15px; color: var(--green); }
        .scanned-text p { font-family: var(--font-th); font-size: 12px; color: rgba(172,216,167,0.65); margin-top: 2px; }

        /* ── Main ticket wrapper ── */
        .ticket-wrap {
          width: 100%;
          max-width: 400px;
          padding: 28px 20px 0;
        }

        /* ── Ticket card ── */
        .ticket-card {
          background: var(--card-bg);
          border-radius: 20px;
          overflow: hidden;
          border: 1px solid var(--border);
          box-shadow:
            0 0 0 1px rgba(216,184,90,0.08),
            0 30px 80px rgba(0,0,0,0.7),
            0 0 120px rgba(216,184,90,0.04);
          position: relative;
        }

        /* Gold gradient top bar */
        .ticket-glow-top {
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 3px;
          background: linear-gradient(90deg, transparent, var(--gold), var(--gold-light), var(--gold), transparent);
        }

        /* ── Ticket header ── */
        .ticket-header {
          padding: 22px 24px 18px;
          display: flex;
          align-items: center;
          gap: 12px;
          border-bottom: 1px solid rgba(216,184,90,0.12);
          background: linear-gradient(180deg, rgba(216,184,90,0.06) 0%, transparent 100%);
        }
        .org-logo {
          width: 38px; height: 38px;
          border-radius: 8px;
          background: var(--gold);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .org-logo-text {
          font-family: var(--font-display);
          font-size: 8px;
          font-weight: 700;
          color: var(--black);
          text-align: center;
          line-height: 1.3;
        }
        .org-info { flex: 1; }
        .org-name {
          font-family: var(--font-display);
          font-size: 13px;
          font-weight: 600;
          color: var(--cream);
          letter-spacing: 0.02em;
        }
        .org-sub {
          font-family: var(--font-body);
          font-size: 9px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--muted);
          margin-top: 1px;
        }
        .admit-badge {
          font-family: var(--font-body);
          font-size: 9px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--gold);
          border: 1px solid var(--border);
          border-radius: 4px;
          padding: 3px 8px;
        }

        /* ── QR section (main focus) ── */
        .qr-section {
          padding: 28px 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          background: radial-gradient(ellipse at 50% 0%, rgba(216,184,90,0.07) 0%, transparent 65%);
        }

        .qr-frame-outer {
          width: 200px; height: 200px;
          border-radius: 16px;
          padding: 3px;
          background: linear-gradient(135deg, var(--gold), rgba(216,184,90,0.3), var(--gold));
          box-shadow: 0 0 40px rgba(216,184,90,0.2), 0 8px 32px rgba(0,0,0,0.5);
        }
        .qr-frame-inner {
          width: 100%; height: 100%;
          border-radius: 14px;
          background: #fff;
          display: flex; align-items: center; justify-content: center;
          overflow: hidden;
          position: relative;
        }
        .qr-frame-inner img { width: 90%; height: 90%; object-fit: contain; transition: opacity 0.3s; }
        .qr-frame-inner.refreshing img { opacity: 0.2; }
        .qr-spinner-overlay {
          position: absolute; inset: 0;
          display: flex; align-items: center; justify-content: center;
        }
        .spinner {
          width: 32px; height: 32px;
          border: 2.5px solid rgba(216,184,90,0.2);
          border-top-color: var(--gold);
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .ticket-id-label {
          font-family: var(--font-body);
          font-size: 10px;
          letter-spacing: 0.1em;
          color: var(--muted);
          text-align: center;
        }
        .ticket-id-label span { color: var(--gold); }

        /* ── Attendee info ── */
        .attendee-section {
          padding: 0 24px 24px;
          text-align: center;
        }
        .attendee-admit {
          font-family: var(--font-body);
          font-size: 9px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--muted);
          margin-bottom: 6px;
        }
        .attendee-name {
          font-family: var(--font-display);
          font-size: 28px;
          font-weight: 700;
          color: var(--cream);
          line-height: 1.1;
          margin-bottom: 4px;
        }
        .attendee-nick {
          font-family: var(--font-th);
          font-size: 13px;
          color: var(--muted);
          margin-bottom: 16px;
        }
        .attendee-nick em { color: var(--gold); font-style: normal; }
        .activity-name {
          font-family: var(--font-display);
          font-size: 17px;
          font-weight: 600;
          color: var(--gold);
          margin-bottom: 20px;
          font-style: italic;
        }

        /* ── Meta grid ── */
        .meta-strip {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          background: rgba(255,255,255,0.03);
          border-radius: 10px;
          padding: 14px;
          border: 1px solid rgba(216,184,90,0.08);
          text-align: left;
        }
        .meta-item { display: flex; flex-direction: column; gap: 3px; }
        .meta-label {
          font-family: var(--font-body);
          font-size: 9px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--muted);
        }
        .meta-val {
          font-family: var(--font-th);
          font-size: 13px;
          color: var(--cream);
          font-weight: 500;
        }
        .meta-full { grid-column: 1 / -1; }

        /* ── Perforation ── */
        .perforation {
          position: relative;
          display: flex;
          align-items: center;
          margin: 0;
          overflow: visible;
        }
        .perf-line {
          flex: 1;
          border-top: 1px dashed rgba(216,184,90,0.2);
          margin: 0 16px;
        }
        .perf-circle-l, .perf-circle-r {
          width: 20px; height: 20px;
          border-radius: 50%;
          background: var(--black);
          flex-shrink: 0;
          border: 1px solid var(--border);
          margin: 0 -10px;
          z-index: 2;
        }

        /* ── Action buttons ── */
        .ticket-actions {
          padding: 18px 20px 22px;
          display: flex;
          gap: 10px;
        }
        .btn-gold {
          flex: 1;
          background: var(--gold);
          color: var(--black);
          border: none;
          border-radius: 10px;
          padding: 13px 12px;
          font-family: var(--font-th);
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 7px;
          transition: opacity 0.2s, transform 0.15s;
        }
        .btn-gold:hover { opacity: 0.88; transform: translateY(-1px); }
        .btn-outline-w {
          flex: 1;
          background: transparent;
          color: var(--cream);
          border: 1px solid rgba(240,234,214,0.2);
          border-radius: 10px;
          padding: 13px 12px;
          font-family: var(--font-th);
          font-size: 13px;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 7px;
          transition: background 0.2s, border-color 0.2s, transform 0.15s;
        }
        .btn-outline-w:hover { background: var(--gold-dim); border-color: var(--gold); transform: translateY(-1px); }
        .btn-outline-w:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }

        /* ── Brightness / Refresh controls ── */
        .controls-bar {
          margin-top: 24px;
          width: 100%;
          max-width: 400px;
          padding: 0 20px;
          display: flex;
          gap: 10px;
        }
        .ctrl-btn {
          flex: 1;
          background: var(--gray);
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 12px;
          color: var(--cream);
          font-family: var(--font-th);
          font-size: 12px;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          transition: background 0.2s, border-color 0.2s;
        }
        .ctrl-btn:hover { background: var(--gold-dim); border-color: var(--gold); color: var(--gold); }
        .ctrl-btn.active { background: var(--gold-dim); border-color: var(--gold); color: var(--gold); }
        .ctrl-btn:disabled { opacity: 0.4; cursor: not-allowed; }

        /* ── Post-scan detail card ── */
        .detail-wrap {
          margin-top: 24px;
          width: 100%;
          max-width: 400px;
          padding: 0 20px;
        }
        .detail-card {
          background: linear-gradient(135deg, rgba(172,216,167,0.08), rgba(172,216,167,0.04));
          border: 1px solid rgba(172,216,167,0.25);
          border-radius: 16px;
          padding: 22px;
          animation: fadeUp 0.4s cubic-bezier(0.16,1,0.3,1);
        }
        @keyframes fadeUp { from { transform: translateY(16px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .detail-title {
          font-family: var(--font-display);
          font-size: 15px;
          font-weight: 600;
          color: var(--green);
          margin-bottom: 16px;
          display: flex; align-items: center; gap: 8px;
        }
        .detail-row {
          display: flex; justify-content: space-between; align-items: flex-start;
          padding: 10px 0;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          font-size: 13px;
          font-family: var(--font-th);
        }
        .detail-row:last-child { border-bottom: none; }
        .dl { color: var(--muted); }
        .dv { color: var(--cream); font-weight: 500; text-align: right; }
        .dv.gold { color: var(--gold); font-family: var(--font-display); font-size: 15px; }

        /* DEV simulate btn */
        .dev-btn {
          margin-top: 16px;
          background: transparent;
          border: 1px dashed rgba(255,255,255,0.1);
          border-radius: 8px;
          padding: 8px 20px;
          color: var(--muted);
          font-size: 11px;
          font-family: var(--font-body);
          cursor: pointer;
          transition: border-color 0.2s, color 0.2s;
        }
        .dev-btn:hover { border-color: var(--green); color: var(--green); }
      `}</style>

      <div className={`qr-page${isBright ? " bright" : ""}`}>
        {/* Top nav */}
        <div className="top-nav">
          <Link href="/account" className="back-link">← กิจกรรมของฉัน</Link>
          <span className="nav-title">e-Ticket</span>
          <div className="nav-right" />
        </div>

        {/* Scanned banner */}
        {isScanned && (
          <div className="scanned-banner">
            <div className="pulse-dot" />
            <div className="scanned-text">
              <h3>เข้าร่วมงานแล้ว</h3>
              <p>ดูรายละเอียดการเข้าร่วมด้านล่าง</p>
            </div>
          </div>
        )}

        {/* Ticket card */}
        <div className="ticket-wrap">
          <div className="ticket-card">
            <div className="ticket-glow-top" />

            {/* Header */}
            <div className="ticket-header">
              <div className="org-logo">
                <div className="org-logo-text">THE<br />COMING<br />STAGES</div>
              </div>
              <div className="org-info">
                <div className="org-name">The Coming of Stages</div>
                <div className="org-sub">Official Admission</div>
              </div>
              <div className="admit-badge">ADMIT ONE</div>
            </div>

            {/* QR Code — main focus */}
            <div className="qr-section">
              <div className="qr-frame-outer">
                <div className={`qr-frame-inner${isRefreshing ? " refreshing" : ""}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={qrUrl} alt="QR Code" />
                  {isRefreshing && (
                    <div className="qr-spinner-overlay">
                      <div className="spinner" />
                    </div>
                  )}
                </div>
              </div>
              <div className="ticket-id-label">
                Ticket ID: <span>{ticket.ticketId}</span>
              </div>
            </div>

            {/* Attendee info */}
            <div className="attendee-section">
              <div className="attendee-admit">ผู้เข้าร่วม</div>
              <div className="attendee-name">{ticket.firstName} {ticket.lastName}</div>
              <div className="attendee-nick">ชื่อเล่น: <em>{ticket.nickname}</em></div>
              <div className="activity-name">{ticket.activityName}</div>

              <div className="meta-strip">
                <div className="meta-item">
                  <span className="meta-label">วันที่</span>
                  <span className="meta-val">{ticket.date}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">เวลา</span>
                  <span className="meta-val">{ticket.time}</span>
                </div>
                <div className="meta-item meta-full">
                  <span className="meta-label">สถานที่</span>
                  <span className="meta-val">{ticket.venue}</span>
                </div>
              </div>
            </div>

            {/* Perforation */}
            <div className="perforation">
              <div className="perf-circle-l" />
              <div className="perf-line" />
              <div className="perf-circle-r" />
            </div>

            {/* Download / Calendar */}
            <div className="ticket-actions">
              <button className="btn-gold" onClick={() => window.print()}>
                ↓ ดาวน์โหลด
              </button>
              <button className="btn-outline-w" onClick={() => alert("เพิ่มในปฏิทินแล้ว")}>
                🗓 ปฏิทิน
              </button>
            </div>
          </div>
        </div>

        {/* Brightness + Refresh controls */}
        <div className="controls-bar">
          <button className={`ctrl-btn${isBright ? " active" : ""}`} onClick={() => setIsBright(p => !p)}>
            ☀ {isBright ? "ลดความสว่าง" : "Maximize Brightness"}
          </button>
          <button className="ctrl-btn" onClick={handleRefresh} disabled={isRefreshing}>
            ↻ Refresh QR Code
          </button>
        </div>

        {/* Post-scan detail */}
        {isScanned && ticket.participantInfo && (
          <div className="detail-wrap">
            <div className="detail-card">
              <div className="detail-title">✓ ข้อมูลผู้เข้าร่วม</div>
              {ticket.groupNumber && (
                <div className="detail-row">
                  <span className="dl">หมายเลขกลุ่ม</span>
                  <span className="dv gold">{ticket.groupNumber}</span>
                </div>
              )}
              {ticket.participantInfo.seatSection && (
                <div className="detail-row">
                  <span className="dl">ที่นั่ง / Zone</span>
                  <span className="dv">{ticket.participantInfo.seatSection}</span>
                </div>
              )}
              {ticket.participantInfo.role && (
                <div className="detail-row">
                  <span className="dl">บทบาท</span>
                  <span className="dv">{ticket.participantInfo.role}</span>
                </div>
              )}
              {ticket.participantInfo.notes && (
                <div className="detail-row">
                  <span className="dl">หมายเหตุ</span>
                  <span className="dv">{ticket.participantInfo.notes}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* DEV only */}
        {!isScanned && (
          <button className="dev-btn" onClick={() => setIsScanned(true)}>
            [DEV] จำลองการ scan
          </button>
        )}
      </div>
    </>
  );
}
