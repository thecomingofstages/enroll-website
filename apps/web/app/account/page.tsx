"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiFetch, logout as authLogout } from "@/lib/auth";

interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  nickname: string;
  username: string;
  email: string;
  phone: string;
  avatarUrl?: string;
  interests: string[];
}

interface Activity {
  id: string;
  title: string;
  date: string;
  time: string;
  venue: string;
  imageUrl?: string;
  status: "upcoming" | "past";
  joined: boolean;
  ticketId: string;
}

type Tab = "all" | "upcoming" | "past";

const INTEREST_OPTIONS = [
  "Stage Play","Music","Indie","Classical","Jazz","Dance",
  "Experimental","Opera","Comedy","Drama","Puppetry","Spoken Word",
];

// ── Edit Profile Modal ────────────────────────────────────────────────────────
function EditModal({ user, onClose, onSave }: {
  user: UserProfile;
  onClose: () => void;
  onSave: (u: UserProfile) => void;
}) {
  const [form, setForm] = useState({ ...user });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleInterest = (i: string) =>
    setForm(p => ({
      ...p,
      interests: p.interests.includes(i)
        ? p.interests.filter(x => x !== i)
        : [...p.interests, i],
    }));

  const handleSave = async () => {
    setSaving(true); setError(null);
    try {
      const r = await apiFetch("/users/me", {
        method: "PATCH",
        body: JSON.stringify({
          firstName: form.firstName, lastName: form.lastName,
          nickname: form.nickname, phone: form.phone, interests: form.interests,
        }),
      });
      if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e?.message ?? "Failed"); }
      onSave(await r.json());
    } catch (e: any) { setError(e.message ?? "เกิดข้อผิดพลาด"); }
    finally { setSaving(false); }
  };

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-header">
          <h2 className="modal-title">Edit Profile</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          {(["firstName","lastName","nickname","phone"] as const).map(k => (
            <div className="form-group" key={k}>
              <label className="form-label">
                {k==="firstName"?"ชื่อจริง":k==="lastName"?"นามสกุล":k==="nickname"?"ชื่อเล่น":"เบอร์โทร"}
              </label>
              <input className="form-input" value={form[k]} onChange={e => setForm({...form,[k]:e.target.value})} />
            </div>
          ))}
          <div className="form-group">
            <label className="form-label">Interests</label>
            <div className="interest-grid">
              {INTEREST_OPTIONS.map(i => (
                <button key={i} type="button"
                  className={`chip${form.interests.includes(i)?" sel":""}`}
                  onClick={() => toggleInterest(i)}>{i}</button>
              ))}
            </div>
          </div>
          {error && <div className="form-error">{error}</div>}
        </div>
        <div className="modal-footer">
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-gold-fill" onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Activity Card ─────────────────────────────────────────────────────────────
function ActivityCard({ act }: { act: Activity }) {
  const bgs = ["linear-gradient(160deg,#1e1b12,#2a2510)","linear-gradient(160deg,#181816,#221e0e)","linear-gradient(160deg,#14140f,#1c180a)"];
  const bg = bgs[parseInt(act.id.split("-")[1]||"0") % bgs.length];
  return (
    <div className="act-card">
      <div className="act-img" style={{ background: bg }}>
        {act.joined && <span className="badge-joined">JOINED</span>}
        <span className="act-img-title">{act.title}</span>
      </div>
      <div className="act-body">
        <div className="act-meta-group">
          <div className="act-meta">🗓 {act.date} • {act.time}</div>
          <div className="act-meta">📍 {act.venue}</div>
        </div>
        {act.joined && act.ticketId && (
          <Link href={`/tickets/demo?ticket=${act.ticketId}`} className="view-ticket-btn">
            View Ticket →
          </Link>
        )}
      </div>
    </div>
  );
}

// ── Account Page ──────────────────────────────────────────────────────────────
export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [tab, setTab] = useState<Tab>("all");
  const [showEdit, setShowEdit] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const pr = await apiFetch("/users/me");
        if (pr.status === 401) { router.replace("/login"); return; }
        if (!pr.ok) throw new Error("Failed to load profile");
        setUser(await pr.json());
        const ar = await apiFetch("/users/me/activities");
        if (ar.ok) setActivities(await ar.json());
      } catch (e: any) { setError(e.message); }
      finally { setLoading(false); }
    })();
  }, [router]);

  const filtered = activities.filter(a => tab === "all" || a.status === tab);

  const handleLogout = async () => { await authLogout(); router.push("/login"); };

  if (loading) return (
    <div style={{minHeight:"100dvh",background:"#0e0e0c",display:"flex",alignItems:"center",justifyContent:"center"}}>
      <span style={{color:"#d8b85a",fontFamily:"serif",letterSpacing:"0.12em",fontSize:13}}>กำลังโหลด…</span>
    </div>
  );
  if (error || !user) return (
    <div style={{minHeight:"100dvh",background:"#0e0e0c",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:16}}>
      <span style={{color:"#e07070",fontSize:14}}>{error ?? "ไม่พบข้อมูล"}</span>
      <button onClick={() => router.push("/login")} style={{color:"#d8b85a",background:"transparent",border:"1px solid #d8b85a",borderRadius:8,padding:"8px 20px",cursor:"pointer"}}>กลับหน้า Login</button>
    </div>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;0,700;1,400&family=Sarabun:wght@300;400;500;600&family=Inter:wght@300;400;500&display=swap');
        :root{
          --gold:#d8b85a;--gold-dim:rgba(216,184,90,0.15);
          --black:#0e0e0c;--gray:#131311;--red-tone:#353532;--card:#1a1916;
          --border:rgba(216,184,90,0.2);--green:#acd8a7;
          --cream:#f0ead6;--muted:rgba(240,234,214,0.45);
          --font-display:'Playfair Display','Sarabun',serif;
          --font-th:'Sarabun',sans-serif;
          --font-body:'Inter','Sarabun',sans-serif;
        }
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        body{background:var(--black);color:var(--cream);font-family:var(--font-body);min-height:100dvh}

        .page{min-height:100dvh;background:var(--black);padding-bottom:100px}

        /* topbar */
        .topbar{display:flex;align-items:center;justify-content:space-between;padding:15px 18px;background:var(--gray);border-bottom:1px solid var(--border)}
        .topbar-title{font-family:var(--font-display);font-size:16px;color:var(--cream);letter-spacing:0.04em}
        .logout-btn{background:transparent;border:none;color:var(--muted);font-family:var(--font-body);font-size:13px;cursor:pointer;transition:color 0.2s}
        .logout-btn:hover{color:#e07070}

        /* profile card */
        .profile-section{padding:22px 18px 0;max-width:480px;margin:0 auto}
        .profile-card{background:var(--card);border:1px solid var(--border);border-radius:16px;padding:24px 20px 20px;display:flex;flex-direction:column;align-items:center;box-shadow:0 0 60px rgba(216,184,90,0.04),0 20px 40px rgba(0,0,0,0.5)}
        .avatar{width:68px;height:68px;border-radius:50%;border:2px solid var(--gold);background:var(--red-tone);display:flex;align-items:center;justify-content:center;margin-bottom:12px;font-family:var(--font-display);font-size:22px;font-weight:700;color:var(--gold);overflow:hidden;flex-shrink:0}
        .avatar img{width:100%;height:100%;object-fit:cover;border-radius:50%}
        .profile-name{font-family:var(--font-display);font-size:21px;font-weight:700;color:var(--cream);margin-bottom:2px}
        .profile-nick{font-size:13px;color:var(--gold);margin-bottom:2px}
        .profile-username{font-size:12px;color:var(--muted);margin-bottom:16px}
        .divider{width:100%;height:1px;background:var(--border);margin-bottom:14px}
        .field-row{display:flex;align-items:center;gap:10px;font-size:13px;color:var(--cream);margin-bottom:9px;width:100%}
        .field-icon{color:var(--muted);font-size:14px;width:16px;text-align:center;flex-shrink:0}
        .interests-label{font-size:9px;letter-spacing:0.12em;text-transform:uppercase;color:var(--muted);margin-bottom:8px;width:100%}
        .interest-tags{display:flex;flex-wrap:wrap;gap:6px;width:100%;margin-bottom:18px}
        .itag{background:var(--gold-dim);border:1px solid rgba(216,184,90,0.3);border-radius:20px;padding:3px 12px;font-size:11px;color:var(--gold)}

        /* profile action buttons — gold border */
        .profile-actions{display:flex;gap:8px;width:100%}
        .btn-gold-outline{flex:1;background:transparent;border:1px solid var(--gold);border-radius:8px;padding:10px 8px;color:var(--gold);font-family:var(--font-th);font-size:12px;font-weight:500;cursor:pointer;text-align:center;text-decoration:none;display:flex;align-items:center;justify-content:center;gap:6px;transition:background 0.2s}
        .btn-gold-outline:hover{background:var(--gold-dim)}

        /* activities */
        .activities-section{max-width:480px;margin:26px auto 0;padding:0 18px}
        .section-title{font-family:var(--font-display);font-size:18px;font-weight:700;color:var(--cream);margin-bottom:13px}

        /* tabs — gold border on active */
        .tab-bar{display:flex;border-bottom:1px solid var(--border);margin-bottom:13px}
        .tab-btn{background:transparent;border:1px solid transparent;padding:7px 16px;font-family:var(--font-th);font-size:12px;color:var(--muted);cursor:pointer;border-radius:6px 6px 0 0;transition:color 0.2s;position:relative}
        .tab-btn.active{color:var(--gold);border-color:rgba(216,184,90,0.3) rgba(216,184,90,0.3) transparent rgba(216,184,90,0.3);background:var(--card)}
        .tab-btn.active::after{content:'';position:absolute;bottom:-1px;left:0;right:0;height:1px;background:var(--card)}

        /* activity card — compact */
        .act-card{background:var(--card);border:1px solid var(--border);border-radius:10px;overflow:hidden;margin-bottom:10px;transition:border-color 0.2s}
        .act-card:hover{border-color:var(--gold)}
        .act-img{height:80px;display:flex;align-items:flex-end;padding:8px 12px;position:relative;overflow:hidden}
        .act-img-title{font-family:var(--font-display);font-size:14px;font-weight:700;color:var(--cream)}
        .badge-joined{position:absolute;top:8px;right:8px;background:rgba(172,216,167,0.15);border:1px solid rgba(172,216,167,0.4);border-radius:4px;padding:2px 7px;font-size:9px;letter-spacing:0.08em;color:var(--green)}
        .act-body{padding:9px 12px;display:flex;align-items:center;justify-content:space-between;gap:10px}
        .act-meta-group{display:flex;flex-direction:column;gap:2px}
        .act-meta{font-size:11px;color:rgba(240,234,214,0.55)}

        /* view ticket — gold border */
        .view-ticket-btn{background:transparent;border:1px solid var(--gold);color:var(--gold);border-radius:6px;padding:5px 11px;font-size:11px;font-weight:600;cursor:pointer;font-family:var(--font-th);white-space:nowrap;flex-shrink:0;text-decoration:none;transition:background 0.2s;display:inline-block}
        .view-ticket-btn:hover{background:var(--gold-dim)}

        .empty-state{padding:40px 0;text-align:center;color:var(--muted);font-size:14px}

        /* modal */
        .modal-backdrop{position:fixed;inset:0;background:rgba(0,0,0,0.75);display:flex;align-items:flex-end;justify-content:center;z-index:1000;backdrop-filter:blur(4px);animation:fadeIn 0.2s}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        .modal-box{background:var(--gray);border:1px solid var(--border);border-radius:20px 20px 0 0;width:100%;max-width:520px;max-height:90dvh;display:flex;flex-direction:column;animation:slideUp 0.3s cubic-bezier(0.16,1,0.3,1)}
        @keyframes slideUp{from{transform:translateY(60px);opacity:0}to{transform:translateY(0);opacity:1}}
        .modal-header{display:flex;align-items:center;justify-content:space-between;padding:18px 20px 14px;border-bottom:1px solid var(--border);flex-shrink:0}
        .modal-title{font-family:var(--font-display);font-size:17px;font-weight:700;color:var(--cream)}
        .modal-close{background:transparent;border:none;color:var(--muted);font-size:16px;cursor:pointer;padding:4px;transition:color 0.2s}
        .modal-close:hover{color:var(--cream)}
        .modal-body{padding:20px;overflow-y:auto;flex:1;display:flex;flex-direction:column;gap:15px}
        .form-group{display:flex;flex-direction:column;gap:5px}
        .form-label{font-size:10px;letter-spacing:0.1em;text-transform:uppercase;color:var(--muted)}
        .form-input{background:var(--card);border:1px solid var(--border);border-radius:8px;padding:10px 13px;color:var(--cream);font-family:var(--font-body);font-size:14px;outline:none;transition:border-color 0.2s;width:100%}
        .form-input:focus{border-color:var(--gold)}
        .form-input::placeholder{color:var(--muted)}
        .interest-grid{display:flex;flex-wrap:wrap;gap:7px;margin-top:4px}
        .chip{background:transparent;border:1px solid var(--border);border-radius:20px;padding:5px 13px;font-family:var(--font-body);font-size:11px;color:var(--muted);cursor:pointer;transition:all 0.2s}
        .chip:hover{border-color:var(--gold);color:var(--gold)}
        .chip.sel{background:var(--gold-dim);border-color:var(--gold);color:var(--gold)}
        .form-error{background:rgba(220,80,80,0.1);border:1px solid rgba(220,80,80,0.3);border-radius:8px;padding:9px 13px;font-size:13px;color:#e07070}
        .modal-footer{padding:14px 20px 22px;border-top:1px solid var(--border);display:flex;gap:8px;flex-shrink:0}
        .btn-ghost{flex:1;background:transparent;border:1px solid var(--border);border-radius:8px;padding:11px;color:var(--muted);font-family:var(--font-body);font-size:13px;cursor:pointer;transition:border-color 0.2s,color 0.2s}
        .btn-ghost:hover{border-color:var(--muted);color:var(--cream)}
        .btn-gold-fill{flex:1;background:var(--gold);color:var(--black);border:none;border-radius:8px;padding:11px;font-family:var(--font-body);font-size:13px;font-weight:600;cursor:pointer;transition:opacity 0.2s}
        .btn-gold-fill:hover:not(:disabled){opacity:0.85}
        .btn-gold-fill:disabled{opacity:0.5;cursor:not-allowed}
      `}</style>

      <div className="page">
        {/* Topbar */}
        <div className="topbar">
          <span className="topbar-title">Account</span>
          <button className="logout-btn" onClick={handleLogout}>Sign out</button>
        </div>

        {/* Profile */}
        <div className="profile-section">
          <div className="profile-card">
            <div className="avatar">
              {user.avatarUrl
                ? <img src={user.avatarUrl} alt={user.firstName} />
                : `${user.firstName[0]}${user.lastName[0]}`}
            </div>
            <div className="profile-name">{user.firstName} {user.lastName}</div>
            <div className="profile-nick">{user.nickname}</div>
            <div className="profile-username">@{user.username}</div>
            <div className="divider" />
            <div className="field-row"><span className="field-icon">✉</span>{user.email}</div>
            <div className="field-row"><span className="field-icon">☎</span>{user.phone}</div>
            {user.interests.length > 0 && (
              <>
                <div className="interests-label">Interests</div>
                <div className="interest-tags">
                  {user.interests.map(i => <span key={i} className="itag">{i}</span>)}
                </div>
              </>
            )}
            <div className="profile-actions">
              <button className="btn-gold-outline" onClick={() => setShowEdit(true)}>✏ Edit Profile</button>
              <Link href="/member-qr" className="btn-gold-outline">⊞ My QR Code</Link>
            </div>
          </div>
        </div>

        {/* Activities */}
        <div className="activities-section">
          <div className="section-title">My Activities</div>
          <div className="tab-bar">
            {(["all","upcoming","past"] as Tab[]).map(t => (
              <button key={t} className={`tab-btn${tab===t?" active":""}`} onClick={() => setTab(t)}>
                {t.charAt(0).toUpperCase()+t.slice(1)}
              </button>
            ))}
          </div>
          {filtered.length === 0
            ? <div className="empty-state">ไม่มีกิจกรรมในหมวดนี้</div>
            : filtered.map(a => <ActivityCard key={a.id} act={a} />)
          }
        </div>
      </div>

      {showEdit && (
        <EditModal user={user} onClose={() => setShowEdit(false)} onSave={u => { setUser(u); setShowEdit(false); }} />
      )}
    </>
  );
}
