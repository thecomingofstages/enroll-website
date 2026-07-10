"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { Activity, INITIAL_ACTIVITIES } from "./mockData";
import { fetchMyRegistrations } from "./activity-api";
import { hasAuthToken, persistAuthToken, getAuthToken, decodeJwtExp } from "./auth";

export interface TCOSAccount {
  id: string; // UUID v7 simulation
  name: string;
  firstName?: string;
  lastName?: string;
  nickname?: string;
  gender?: string;
  gradeLevel?: string;
  avatarUrl?: string;
  email: string;
  phone: string;
  preferences: string[];
}

export interface SignupProfile {
  firstName: string;
  lastName: string;
  nickname: string;
  email: string;
  phone: string;
  gender: string;
  password?: string;
  gradeLevel?: string;
  preferences?: string[];
}

export interface UserRegistration {
  id: string; // UUID v7 simulation
  activityId: string;
  enrolledAt: string;
  status: 'waiting' | 'attended' | 'absent'; // รอเข้าร่วม | เข้าร่วมแล้ว | ไม่ได้เข้าร่วม
  checkedIn: boolean;
  additionalAnswers: Record<string, string>;
  ticketCode: string; // Dynamic code simulation
  paymentStatus: "free" | "paid_verified" | "pending";
  amountPaid: number;
}

interface AppContextType {
  user: TCOSAccount | null;
  activities: Activity[];
  registrations: UserRegistration[];
  activeModal: "login" | "signup" | "register" | "checkin" | "account" | null;
  registerTargetActivity: Activity | null;
  otpRequired: boolean;
  otpSent: boolean;
  openLoginModal: () => void;
  openSignupModal: () => void;
  openRegisterModal: (activity: Activity) => void;
  openCheckinModal: () => void;
  openAccountModal: () => void;
  closeModals: () => void;
  login: (email: string, password: string) => Promise<void>;
  loginWithToken: (user: TCOSAccount, token: string) => void;
  setAuthFromRegistration: (params: {
    token: string;
    user?: Partial<TCOSAccount> & { id?: string };
  }) => void;
  signup: (profile: SignupProfile) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  updateProfile: (profile: Pick<TCOSAccount, "name" | "email" | "phone" | "preferences" | "avatarUrl">) => void;
  logout: () => void;
  refreshRegistrations: () => Promise<void>;
  requestOTP: (phone: string) => Promise<string>;
  verifyOTP: (phone: string, code: string) => Promise<boolean>;
  registerToEvent: (
    activityId: string,
    answers: Record<string, string>,
    paymentDetails?: { slipFile: File | null; slipCode: string }
  ) => Promise<UserRegistration>;
  simulateSlipVerification: (file: File) => Promise<{ success: boolean; code: string; message: string }>;
  exportRegistrationsToCSV: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Initial Mock User matching the screenshot out-of-the-box
const MOCK_PIM_ACCOUNT: TCOSAccount = {
  id: "usr-pim-99",
  name: "พิมพ์ชนก ไชยสิทธิ์",
  email: "pim@email.com",
  phone: "089-234-5678",
  preferences: ["ละคร", "เครื่องแต่งกาย", "สายเขียน"]
};

// Initial Mock Registrations matching the screenshot list
const MOCK_PIM_REGISTRATIONS: UserRegistration[] = [
  {
    id: "reg-001",
    activityId: "act-001", // ละครเวที ทางผ่าน
    enrolledAt: new Date("2025-02-15").toISOString(),
    status: "waiting", // รอเข้าร่วม
    checkedIn: false,
    additionalAnswers: { "shirt-size": "M" },
    ticketCode: "TCOS-TKT-PIM01",
    paymentStatus: "paid_verified",
    amountPaid: 350
  },
  {
    id: "reg-002",
    activityId: "act-002", // Costume & Wardrobe
    enrolledAt: new Date("2025-02-20").toISOString(),
    status: "waiting", // รอเข้าร่วม
    checkedIn: false,
    additionalAnswers: {},
    ticketCode: "TCOS-TKT-PIM02",
    paymentStatus: "paid_verified",
    amountPaid: 200
  },
  {
    id: "reg-003",
    activityId: "act-003", // Spoken Word Open Night
    enrolledAt: new Date("2025-02-25").toISOString(),
    status: "attended", // เข้าร่วมแล้ว
    checkedIn: true,
    additionalAnswers: {},
    ticketCode: "TCOS-TKT-PIM03",
    paymentStatus: "paid_verified",
    amountPaid: 150
  },
  {
    id: "reg-004",
    activityId: "act-004", // Directing Masterclass
    enrolledAt: new Date("2025-02-10").toISOString(),
    status: "absent", // ไม่ได้เข้าร่วม
    checkedIn: false,
    additionalAnswers: {},
    ticketCode: "TCOS-TKT-PIM04",
    paymentStatus: "paid_verified",
    amountPaid: 500
  }
];

function generateUUIDv7(): string {
  const timestamp = Date.now();
  const hexTimestamp = timestamp.toString(16).padStart(12, "0");
  const randomPart = Array.from({ length: 4 }, () => 
    Math.floor(Math.random() * 65536).toString(16).padStart(4, "0")
  ).join("");
  return `${hexTimestamp.slice(0, 8)}-${hexTimestamp.slice(8, 12)}-7${randomPart.slice(1, 4)}-${randomPart.slice(4, 8)}-${randomPart.slice(8)}`;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  // Populate state with default mock session out-of-the-box so the app looks exactly like the screenshot
  const [user, setUser] = useState<TCOSAccount | null>(null);
  const [activities, setActivities] = useState<Activity[]>(INITIAL_ACTIVITIES);
  const [registrations, setRegistrations] = useState<UserRegistration[]>([]);
  const [activeModal, setActiveModal] = useState<"login" | "signup" | "register" | "checkin" | "account" | null>(null);
  const [registerTargetActivity, setRegisterTargetActivity] = useState<Activity | null>(null);
  
  const [otpRequired, setOtpRequired] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [usedSlips, setUsedSlips] = useState<string[]>(["TRX998822110099"]);

  // Load session or defaults on mount (client-side only)
  //
  // Token-gated rehydrate: only restore `user` state if we can actually
  // authenticate requests against the API. If `tcos_user` is in localStorage
  // but no token is anywhere (cookie or localStorage), treat the user as
  // logged out and clear the stale blob. This keeps the Header's "logged in"
  // indicator in sync with what QRCheckinModal / AccountProfile can do.
  useEffect(() => {
    const savedUser = localStorage.getItem("tcos_user");
    const savedRegs = localStorage.getItem("tcos_registrations");

    // Proactive "Session Expired" check.
    //
    // Runs BEFORE the rehydrate so we never briefly set `user` to a
    // logged-in state and then immediately log them out (a visible
    // flicker). If the stored JWT's `exp` is already past, treat the
    // session as dead: clear local state synchronously so the first
    // paint shows the logged-out UI, then queue the alert + login
    // modal on the next macrotask so they pop AFTER React has
    // committed the cleared state.
    //
    // This mirrors the in-session recovery flow (alert + logout +
    // openLoginModal) used by AccountProfile / QRCheckinModal /
    // RegistrationModal when an authed call 401s. The difference is
    // timing: we fire it on page open, before any authed call would
    // have a chance to surface the staleness — which matters because
    // AccountProfile's handler is only registered once the user clicks
    // into the account modal, and QRCheckinModal's only after they
    // open the QR modal. Without this check, a user with a stale
    // token would see the logged-in header until they tried one of
    // those flows.
    //
    // If the token has no `exp` claim (custom opaque-ish token) or
    // can't be decoded, we fall through to the normal rehydrate and
    // rely on the in-session handler to catch it later.
    if (hasAuthToken()) {
      const exp = decodeJwtExp(getAuthToken());
      if (exp !== null && exp * 1000 < Date.now()) {
        // Synchronous cleanup so the first paint shows logged-out.
        setUser(null);
        setRegistrations([]);
        localStorage.removeItem("tcos_user");
        localStorage.setItem("tcos_registrations", "[]");
        persistAuthToken(null);
        // Deferred alert + login modal — after the cleared-state
        // re-render commits, so the user sees the alert over the
        // already-logged-out page, not a stale logged-in one.
        // We don't call logout() here because we just did its work
        // synchronously (and logout() also calls closeModals(), which
        // would close the login modal we then open). openLoginModal
        // alone is enough.
        setTimeout(() => {
          alert("เซสชันหมดอายุ กรุณาเข้าสู่ระบบอีกครั้ง");
          openLoginModal();
        }, 0);
        return;
      }
    }

    if (hasAuthToken() && savedUser && savedUser !== "null") {
      try {
        const parsedUser = JSON.parse(savedUser) as TCOSAccount;
        setUser(parsedUser.id === MOCK_PIM_ACCOUNT.id ? null : parsedUser);
      } catch {
        setUser(null);
        localStorage.removeItem("tcos_user");
      }
    } else {
      // No token, or stale user blob without a token — fully logged out.
      setUser(null);
      if (savedUser && savedUser !== "null") {
        localStorage.removeItem("tcos_user");
      }
      if (!hasAuthToken()) {
        persistAuthToken(null);
      }
    }

    if (savedRegs && savedRegs !== "[]") {
      try {
        const parsedRegs = JSON.parse(savedRegs) as UserRegistration[];
        const hasMockRegistration = parsedRegs.some((reg) =>
          MOCK_PIM_REGISTRATIONS.some((mockReg) => mockReg.id === reg.id)
        );
        setRegistrations(hasMockRegistration ? [] : parsedRegs);
      } catch {
        setRegistrations([]);
      }
    } else {
      setRegistrations([]);
    }

    // Fetch real registrations from API if logged in
    if (hasAuthToken()) {
      fetchMyRegistrations().then(data => {
        if (data && data.length > 0) {
          const mapped = data.map((d: any) => ({
            id: d.id || d._id,
            activityId: d.activity_id?._id || d.activity_id?.id || d.activity_id,
            enrolledAt: d.created_at || new Date().toISOString(),
            status: d.status,
            paymentStatus: d.payment?.status || "pending",
            checkedIn: false,
            ticketCode: d.ticket_code || "",
            amountPaid: d.payment?.amount || 0,
            additionalAnswers: d.custom_answers || {}
          }));
          setRegistrations(mapped);
          localStorage.setItem("tcos_registrations", JSON.stringify(mapped));
        }
      });
    }
  }, []);

  const refreshRegistrations = async () => {
    if (!hasAuthToken()) return;
    const data = await fetchMyRegistrations();
    if (data && data.length > 0) {
      const mapped = data.map((d: any) => ({
        id: d.id || d._id,
        activityId: d.activity_id?._id || d.activity_id?.id || d.activity_id,
        enrolledAt: d.created_at || new Date().toISOString(),
        status: d.status,
        paymentStatus: d.payment?.status || "pending",
        checkedIn: false,
        ticketCode: d.ticket_code || "",
        amountPaid: d.payment?.amount || 0,
        additionalAnswers: d.custom_answers || {}
      }));
      setRegistrations(mapped);
      localStorage.setItem("tcos_registrations", JSON.stringify(mapped));
    }
  };

  const openLoginModal = () => {
    setActiveModal("login");
    setOtpSent(false);
    setOtpRequired(false);
  };

  const openSignupModal = () => {
    setActiveModal("signup");
    setOtpSent(false);
    setOtpRequired(false);
  };

  const openRegisterModal = (activity: Activity) => {
    setRegisterTargetActivity(activity);
    setActiveModal("register");
  };

  const openCheckinModal = () => {
    setActiveModal("checkin");
  };

  const openAccountModal = () => {
    setActiveModal("account");
  };

  const closeModals = () => {
    setActiveModal(null);
    setRegisterTargetActivity(null);
  };

  const login = async (email: string, password: string) => {
    const base = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
    if (!base) throw new Error("API URL is not configured");

    const res = await fetch(`${base}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json().catch(() => ({}));
    
    if (!res.ok || !data.success) {
      throw new Error(data.error?.message || "อีเมลหรือรหัสผ่านไม่ถูกต้อง");
    }

    const { user: userData, access_token } = data.data;

    // Use Backend user data or fallback mock mapping
    const newAccount: TCOSAccount = {
      id: userData.id || userData._id || "user-123",
      name: userData.first_name ? `${userData.first_name} ${userData.last_name}` : (userData.name || email.split("@")[0]),
      email: userData.email || email,
      phone: userData.phone || "-",
      preferences: userData.preferences || [],
      avatarUrl: userData.avatar_url || undefined,
    };

    setUser(newAccount);
    localStorage.setItem("tcos_user", JSON.stringify(newAccount));
    persistAuthToken(access_token);

    fetchMyRegistrations().then(data => {
      if (data && data.length > 0) {
        const mapped = data.map((d: any) => ({
          id: d.id || d._id,
          activityId: d.activity_id?._id || d.activity_id?.id || d.activity_id,
          enrolledAt: d.created_at || new Date().toISOString(),
          status: d.status,
          paymentStatus: d.payment?.status || "pending",
          checkedIn: false,
          ticketCode: d.ticket_code || "",
          amountPaid: d.payment?.amount || 0,
          additionalAnswers: d.custom_answers || {}
        }));
        setRegistrations(mapped);
        localStorage.setItem("tcos_registrations", JSON.stringify(mapped));
      }
    });

    closeModals();
  };

  const loginWithToken = (newUser: TCOSAccount, token: string) => {
    setUser(newUser);
    localStorage.setItem("tcos_user", JSON.stringify(newUser));
    persistAuthToken(token);

    fetchMyRegistrations().then(data => {
      if (data && data.length > 0) {
        const mapped = data.map((d: any) => ({
          id: d.id || d._id,
          activityId: d.activity_id?._id || d.activity_id?.id || d.activity_id,
          enrolledAt: d.created_at || new Date().toISOString(),
          status: d.status,
          paymentStatus: d.payment?.status || "pending",
          checkedIn: false,
          ticketCode: d.ticket_code || "",
          amountPaid: d.payment?.amount || 0,
          additionalAnswers: d.custom_answers || {}
        }));
        setRegistrations(mapped);
        localStorage.setItem("tcos_registrations", JSON.stringify(mapped));
      }
    });
  };

  /**
   * Used after a guest completes registration and the backend returns an
   * access_token for the newly-created user. Decodes the JWT subject as the
   * user id and merges any user fields the registration response provided.
   *
   * The backend's Registration.helper.create returns `access_token` only when
   * `new_user` was sent. The auth API call from this helper is the moment the
   * user becomes "logged in" — same persistence rules as loginWithToken.
   */
  const setAuthFromRegistration = (params: {
    token: string;
    user?: Partial<TCOSAccount> & { id?: string };
  }) => {
    let userId = params.user?.id ?? "user-pending";
    try {
      // Decode JWT payload (no signature verification on the client).
      const payload = JSON.parse(atob(params.token.split(".")[1]));
      if (payload?.sub) userId = String(payload.sub);
    } catch {
      /* keep fallback */
    }

    const account: TCOSAccount = {
      id: userId,
      name: params.user?.name ?? "TCOS Member",
      email: params.user?.email ?? "",
      phone: params.user?.phone ?? "-",
      preferences: params.user?.preferences ?? [],
      avatarUrl: params.user?.avatarUrl,
      firstName: params.user?.firstName,
      lastName: params.user?.lastName,
      nickname: params.user?.nickname,
    };

    loginWithToken(account, params.token);
  };

  const signup = async (profile: SignupProfile) => {
    const base = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
    if (!base) throw new Error("API URL is not configured");

    const res = await fetch(`${base}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        first_name: profile.firstName,
        last_name: profile.lastName,
        nickname: profile.nickname,
        email: profile.email,
        phone: profile.phone,
        gender: profile.gender,
        password: profile.password
      })
    });
    
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.success) {
      throw new Error(data.error?.message || "สมัครสมาชิกไม่สำเร็จ");
    }

    if (profile.password) {
      await login(profile.email, profile.password);
    } else {
      closeModals();
    }
  };

  const forgotPassword = async (email: string) => {
    const base = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
    if (!base) throw new Error("API URL is not configured");

    const res = await fetch(`${base}/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.success) {
      throw new Error(data.error?.message || "ไม่สามารถส่งลิงก์รีเซ็ตรหัสผ่านได้");
    }
  };

  const updateProfile = (profile: Pick<TCOSAccount, "name" | "email" | "phone" | "preferences" | "avatarUrl">) => {
    setUser((current) => {
      if (!current) return current;
      const updatedUser = { ...current, ...profile };
      localStorage.setItem("tcos_user", JSON.stringify(updatedUser));
      return updatedUser;
    });
  };

  const logout = () => {
    setUser(null);
    setRegistrations([]);
    // Remove to simulate fresh guest view
    localStorage.setItem("tcos_user", "null");
    localStorage.setItem("tcos_registrations", "[]");
    persistAuthToken(null);
    closeModals();
  };

  const requestOTP = async (phone: string): Promise<string> => {
    setOtpRequired(true);
    setOtpSent(true);
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const verifyOTP = async (phone: string, code: string): Promise<boolean> => {
    return code.length === 6;
  };

  const registerToEvent = async (
    activityId: string,
    answers: Record<string, string>,
    paymentDetails?: { slipFile: File | null; slipCode: string }
  ): Promise<UserRegistration> => {
    const targetActivity = activities.find(a => a._id === activityId);
    if (!targetActivity) throw new Error("Activity not found");
    
    const regId = generateUUIDv7();
    const newReg: UserRegistration = {
      id: regId,
      activityId,
      enrolledAt: new Date().toISOString(),
      status: "waiting", // Newly registered tickets always wait for entry
      checkedIn: false,
      additionalAnswers: answers,
      ticketCode: `TCOS-TKT-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      paymentStatus: targetActivity.price > 0 ? "paid_verified" : "free",
      amountPaid: targetActivity.price
    };

    setActivities(prev =>
      prev.map(act =>
        act._id === activityId
          ? { ...act, registeredCount: Math.min(act.seat_capacity, act.enrolled_count + 1) }
          : act
      )
    );

    const updatedRegs = [...registrations, newReg];
    setRegistrations(updatedRegs);
    localStorage.setItem("tcos_registrations", JSON.stringify(updatedRegs));

    if (paymentDetails?.slipCode) {
      setUsedSlips(prev => [...prev, paymentDetails.slipCode]);
    }

    return newReg;
  };

  const simulateSlipVerification = async (file: File): Promise<{ success: boolean; code: string; message: string }> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const prefix = "TRX";
        const dateCode = new Date().toISOString().slice(0, 10).replace(/-/g, "");
        const rand = Math.floor(100000 + Math.random() * 900000).toString();
        const extractedSlipCode = `${prefix}${dateCode}${rand}`;
        const isAlreadyUsed = usedSlips.includes(extractedSlipCode);

        if (isAlreadyUsed) {
          resolve({
            success: false,
            code: extractedSlipCode,
            message: "สลิปนี้เคยถูกใช้ลงทะเบียนไปแล้ว กรุณาอัปโหลดสลิปใหม่"
          });
        } else {
          resolve({
            success: true,
            code: extractedSlipCode,
            message: "สแกนสลิปสำเร็จ! พบรหัสธุรกรรม PromptPay ที่ถูกต้อง"
          });
        }
      }, 1500);
    });
  };

  const exportRegistrationsToCSV = () => {
    if (registrations.length === 0) {
      alert("ยังไม่มีข้อมูลการลงทะเบียนสำหรับใช้ Export");
      return;
    }
    const headers = ["Registration ID (UUID v7)", "User Name", "User Email", "User Phone", "Activity Name", "Amount Paid", "Date Enrolled", "Ticket Code", "Checked In", "Status"];
    const rows = registrations.map(reg => {
      const act = activities.find(a => a._id === reg.activityId);
      const userName = user?.name || "Guest";
      const userEmail = user?.email || "N/A";
      const userPhone = user?.phone || "N/A";
      const statusText = reg.status === "waiting" ? "รอเข้าร่วม" : reg.status === "attended" ? "เข้าร่วมแล้ว" : "ไม่ได้เข้าร่วม";
      
      return [
        reg.id,
        userName,
        userEmail,
        userPhone,
        act?.name || "Unknown",
        reg.amountPaid === 0 ? "Free" : `${reg.amountPaid} THB`,
        new Date(reg.enrolledAt).toLocaleString("th-TH"),
        reg.ticketCode,
        reg.checkedIn ? "Yes" : "No",
        statusText
      ];
    });

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
      + [headers.join(","), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))].join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `tcos_registrations_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AppContext.Provider
      value={{
        user,
        activities,
        registrations,
        activeModal,
        registerTargetActivity,
        otpRequired,
        otpSent,
        openLoginModal,
        openSignupModal,
        openRegisterModal,
        openCheckinModal,
        openAccountModal,
        closeModals,
        login,
        loginWithToken,
        setAuthFromRegistration,
        signup,
        forgotPassword,
        updateProfile,
        logout,
        refreshRegistrations,
        requestOTP,
        verifyOTP,
        registerToEvent,
        simulateSlipVerification,
        exportRegistrationsToCSV
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppState() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppState must be used within an AppProvider");
  }
  return context;
}
