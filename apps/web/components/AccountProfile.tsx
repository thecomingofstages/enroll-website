"use client";

import React, { useEffect, useState } from "react";
import {
  fetchUserProfile,
  updateUserProfile,
  fetchUserActivities,
} from "@/lib/user-api";
import type { UserProfile, ActivityRegistration } from "@/lib/user-api";

// ---------------------------------------------------------------------------
// Tiny helpers
// ---------------------------------------------------------------------------

function ImageIcon() {
  return (
    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M4 16l4.5-4.5a2 2 0 012.8 0L16 16m-2-2l1.5-1.5a2 2 0 012.8 0L20 14m-1-9H5a2 2 0 00-2 2v10a2 2 0 002 2h14a2 2 0 002-2V7a2 2 0 00-2-2zm-3 4h.01"
      />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// ProfileAvatar
// ---------------------------------------------------------------------------

function ProfileAvatar({
  user,
  isEditing,
  onAvatarChange,
}: {
  user: UserProfile | null;
  isEditing?: boolean;
  onAvatarChange?: (avatarUrl: string) => void;
}) {
  const name =
    user?.nickname ||
    `${user?.first_name ?? ""} ${user?.last_name ?? ""}`.trim() ||
    "User";

  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");

  return (
    <div className="relative mx-auto h-28 w-28">
      <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full border border-gold/30 font-playfair text-4xl font-black text-primary-yellow">
        {user?.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.avatar_url}
            alt={`${name} profile`}
            className="h-full w-full object-cover"
          />
        ) : (
          initials || "TC"
        )}
      </div>

      {isEditing && (
        <label className="absolute bottom-1 right-1 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full border border-primary-yellow bg-base-black text-primary-yellow shadow-lg transition-colors hover:bg-primary-yellow hover:text-base-black">
          <ImageIcon />
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file || !onAvatarChange) return;
              const reader = new FileReader();
              reader.onload = () => {
                if (typeof reader.result === "string") onAvatarChange(reader.result);
              };
              reader.readAsDataURL(file);
            }}
          />
        </label>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// ActivityCard
// ---------------------------------------------------------------------------

function ActivityCard({ activity }: { activity: ActivityRegistration }) {
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <p className="text-m font-semibold mt-1 text-red-300">WAITING FOR PAYMENT</p>;
      case "PAID":
        return <p className="text-m font-semibold mt-1 text-gold">REGISTERED</p>;
      case "JOINED":
        return <p className="text-m font-semibold mt-1 text-green-400">JOINED</p>;
      case "CANCELLED":
        return <p className="text-m font-semibold mt-1 text-gray-500">CANCELLED/MISSED</p>;
      default:
        return <p className="text-m font-semibold mt-1 text-foreground">N/A</p>;
    }
  };

  // The API returns registration_id at the top level (see ActivityRegistration type)
  const registrationId = activity.registration_id;

  return (
    <article className="relative overflow-hidden rounded-xs border border-gold/30 bg-card">
      <div className="relative flex min-h-44 flex-col justify-between gap-3 p-4">
        <h4 className="font-trirong text-xl font-black text-white">
          {activity.activity.name}
        </h4>

        <div className="mt-2 text-left grid grid-cols-3 gap-4">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">status</p>
            {statusBadge(activity.status)}
          </div>
          <div>
            <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">registered at</p>
            <p className="text-m font-semibold text-foreground mt-1">
              {formatDate(activity.registered_at)}
            </p>
          </div>
          <div>
            <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">group name</p>
            {activity.group_name ? (
              <p className="text-m font-semibold text-gold mt-1">{activity.group_name}</p>
            ) : (
              <p className="text-m font-semibold text-foreground mt-1">-</p>
            )}
          </div>
        </div>

        <a
          href={`activity/${activity.activity._id}`}
          className="ml-auto rounded-xs border border-gold/30 px-4 py-2 text-xs font-semibold text-gold transition-colors hover:text-background hover:bg-gold hover:cursor-pointer active:scale-[0.98]"
        >
          𝐢 View Details
        </a>
      </div>
    </article>
  );
}

// ---------------------------------------------------------------------------
// AccountProfile
// ---------------------------------------------------------------------------

export default function AccountProfile({ isOpen }: { isOpen: boolean }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [activities, setActivities] = useState<ActivityRegistration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state — mirrors UserProfile fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [educationLevel, setEducationLevel] = useState("");
  const [institution, setInstitution] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [address, setAddress] = useState("");

  // -------------------------------------------------------------------------
  // Data loading — triggered whenever the modal opens
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (!isOpen) return;

    const load = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Both calls use getAuthToken() internally — same cookie/localStorage
        // resolution order as QRCheckinModal after this fix
        const [profile, userActivities] = await Promise.all([
          fetchUserProfile(),
          fetchUserActivities(),
        ]);

        if (profile) {
          setUser(profile);
          populateForm(profile);
        } else {
          setError("ไม่สามารถโหลดข้อมูลโปรไฟล์ได้");
        }

        setActivities(userActivities ?? []);
      } catch (err) {
        setError("เกิดข้อผิดพลาดในการโหลดข้อมูล");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, [isOpen]);

  function populateForm(profile: UserProfile) {
    setFirstName(profile.first_name);
    setLastName(profile.last_name);
    setNickname(profile.nickname);
    setEmail(profile.email);
    setPhone(profile.phone);
    setEducationLevel(profile.education_level ?? "");
    setInstitution(profile.institution ?? "");
    setAddress(profile.address ?? "");
    setAvatarUrl(profile.avatar_url ?? "");
  }

  // -------------------------------------------------------------------------
  // Save / cancel
  // -------------------------------------------------------------------------
  const handleSaveProfile = async () => {
    setError(null);
    try {
      const result = await updateUserProfile({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        nickname: nickname.trim(),
        email: email.trim(),
        phone: phone.trim(),
        avatar_url: avatarUrl,
        education_level: educationLevel.trim(),
        institution: institution.trim(),
        address: address.trim(),
      });

      if (result.success && result.data) {
        setUser(result.data);
        setIsEditing(false);
      } else {
        setError(result.message || "ไม่สามารถบันทึกโปรไฟล์ได้");
      }
    } catch (err) {
      setError("เกิดข้อผิดพลาดในการบันทึกโปรไฟล์");
      console.error(err);
    }
  };

  const handleCancelEdit = () => {
    if (user) populateForm(user);
    setIsEditing(false);
  };

  // -------------------------------------------------------------------------
  // Loading / unauthenticated states
  // -------------------------------------------------------------------------
  if (isLoading) {
    return (
      <main className="min-h-screen bg-background py-10 px-4">
        <div className="mx-auto max-w-6xl animate-pulse space-y-4">
          <div className="h-12 bg-dark-grey rounded w-1/3" />
          <div className="grid gap-5 md:grid-cols-[320px_1fr]">
            <div className="h-80 bg-dark-grey rounded-lg" />
            <div className="h-80 bg-dark-grey rounded-lg" />
          </div>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-background py-10 px-4">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-lg p-8 text-center">
            <p className="text-primary-yellow font-bold">
              กรุณาเข้าสู่ระบบเพื่อดูข้อมูลโปรไฟล์
            </p>
          </div>
        </div>
      </main>
    );
  }

  const displayFullName = `${user.first_name} ${user.last_name}`.trim();

  // -------------------------------------------------------------------------
  // Main render
  // -------------------------------------------------------------------------
  return (
    <main className="min-h-screen bg-background py-10 px-4">
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-[320px_1fr] md:p-0 p-4">

          {/* ----------------------------------------------------------------
              Sidebar
          ---------------------------------------------------------------- */}
          <aside className="@container rounded-xs border border-gold/30 p-5 bg-card">
            <ProfileAvatar
              user={user}
              isEditing={isEditing}
              onAvatarChange={setAvatarUrl}
            />

            {isEditing ? (
              /* Edit form */
              <div className="mt-5 space-y-3">
                {(
                  [
                    ["nickname", "Nickname", nickname, setNickname, "ทีคอส"],
                    ["first_name", "First name", firstName, setFirstName, "ไทย"],
                    ["last_name", "Last name", lastName, setLastName, "รักเวที"],
                    ["education_level", "Education level", educationLevel, setEducationLevel, "M.6"],
                    ["institution", "Institution", institution, setInstitution, "TCOS Acting School"],
                    ["address", "Address", address, setAddress, "Address"],
                  ] as [string, string, string, (v: string) => void, string][]
                ).map(([key, label, value, setter, placeholder]) => (
                  <React.Fragment key={key}>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 mt-0">
                      {label}
                    </p>
                    <input
                      value={value}
                      onChange={(e) => setter(e.target.value)}
                      className="w-full rounded-xs bg-base-black font-trirong px-3 py-2 text-sm outline-none focus:border-primary-yellow text-white"
                      placeholder={placeholder}
                    />
                  </React.Fragment>
                ))}
              </div>
            ) : (
              /* Display view */
              <div className="mt-5 text-center">
                <h4 className="font-playfair text-2xl font-trirong font-bold text-gold">
                  {displayFullName}
                </h4>
                <p className="text-[14px] text-foreground font-trirong">{user.nickname}</p>

                <div className="grid grid-cols-1 @sm:grid-cols-2 gap-4 mt-5 border-t border-gold/30">
                  <div className="mt-5 text-left space-y-4">
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">Phone</p>
                      <p className="text-m font-semibold text-foreground mt-1">{user.phone}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">Email</p>
                      <p className="text-m font-semibold text-foreground mt-1">{user.email}</p>
                    </div>
                  </div>

                  <div className="mt-0 @sm:mt-5 text-left space-y-4">
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">Education Level</p>
                      <p className="text-m font-semibold text-foreground mt-1">{user.education_level ?? "-"}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">Institution</p>
                      <p className="text-m font-semibold text-foreground mt-1">{user.institution ?? "-"}</p>
                    </div>
                  </div>
                </div>

                {user.preferences && user.preferences.length > 0 && (
                  <div className="mt-5 border-t border-muted-charcoal pt-4 text-left">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                      Interests
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {user.preferences.map((pref) => (
                        <span
                          key={pref}
                          className="rounded border border-muted-charcoal bg-base-black px-2 py-1 text-[10px] font-bold text-zinc-300"
                        >
                          {pref}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Edit / save / cancel buttons */}
            <div className="mt-5 grid gap-3">
              {isEditing ? (
                <>
                  <button
                    type="button"
                    onClick={handleSaveProfile}
                    className="rounded-xs border border-gold/30 px-4 py-2 text-xs font-semibold text-gold transition-colors hover:text-background hover:bg-gold active:scale-[0.98]"
                  >
                    ⎙ Save
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="rounded-xs border border-gold/30 px-4 py-2 text-xs font-semibold text-gold transition-colors hover:text-background hover:bg-gold active:scale-[0.98]"
                  >
                    ⨯ Cancel
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="rounded-xs border border-gold/30 px-4 py-2 text-xs font-semibold text-gold transition-colors hover:text-background hover:bg-gold active:scale-[0.98] hover:cursor-pointer"
                >
                  🖋 Edit Profile
                </button>
              )}
            </div>
          </aside>

          {/* ----------------------------------------------------------------
              Activity list
          ---------------------------------------------------------------- */}
          <section className="space-y-4">
            <div className="mb-5 flex flex-col gap-3 border-b border-gold/30 pb-3 md:flex-row md:items-center md:justify-between">
              <h3 className="font-playfair font-bold text-2xl md:text-3xl text-foreground">
                My Activities
              </h3>
            </div>

            {error && (
              <div className="rounded-lg border border-red-800 bg-red-900/20 p-4 text-sm text-red-300">
                {error}
              </div>
            )}

            {activities.length > 0 ? (
              <div className="grid gap-4">
                {activities.map((activity) => (
                  <ActivityCard
                    key={activity.registration_id}
                    activity={activity}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-muted-charcoal bg-dark-grey p-8 text-center">
                <p className="font-bold text-primary-yellow">ยังไม่มีกิจกรรมที่สมัคร</p>
                <p className="mt-2 text-xs text-zinc-400">
                  เมื่อสมัครกิจกรรมแล้ว รายการจะแสดงในหน้านี้
                </p>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}