"use client";

import React from "react";
import { useAppState } from "../lib/context";
// import { formatActivityDate } from "../lib/mockData";

export default function HomeSidebar() {
  const { user, activities, registrations, openCheckinModal } = useAppState();

  if (!user) return null;

  const primaryTicket = registrations[0]?.ticketCode ?? "TCOS-MOCK-TICKET";

  return (
    <aside className="sidebar-curtain sticky top-0 z-30 hidden h-screen w-[360px] shrink-0 flex-col overflow-y-auto border-r border-[#b31412]/15 p-5 select-none lg:flex">
      <div className="mb-4 rounded-2xl border border-zinc-200/50 bg-white p-5 text-zinc-800 shadow-lg">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-[#9e7f2a]/20 bg-[#9e7f2a]/15 text-xl font-bold text-[#9e7f2a] shadow-inner">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex min-w-0 flex-col">
            <h3 className="truncate text-base font-extrabold text-zinc-900">
              {user.name}
            </h3>
            <span className="mt-0.5 text-[11px] font-semibold text-zinc-500">
              {user.name.split(" ")[0]} • สมาชิก TCOS
            </span>
          </div>
        </div>



        {user.preferences.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5 border-t border-zinc-100 pt-3">
            {user.preferences.map((pref) => (
              <span
                key={pref}
                className="inline-block rounded-full border border-[#d8b85a]/40 bg-[#fcf0d3] px-3 py-0.5 text-[10px] font-bold text-[#705615]"
              >
                {pref}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="mb-5 rounded-2xl border border-zinc-200/50 bg-white p-5 text-center text-zinc-800 shadow-lg">
        <h4 className="mb-3 text-xs font-extrabold uppercase tracking-widest text-zinc-500">
          QR สำหรับเช็คชื่อ
        </h4>

        <div className="mx-auto mb-3 w-fit rounded-xl border border-zinc-100 bg-zinc-50 p-3">
          <div className="flex h-32 w-32 items-center justify-center rounded-lg border-2 border-dashed border-zinc-300 bg-zinc-100 text-center text-[10px] font-semibold text-zinc-400">
            QR Code
          </div>
        </div>

        <button
          type="button"
          onClick={openCheckinModal}
          className="w-full rounded-lg border border-zinc-300 bg-white py-2 text-xs font-bold text-zinc-700 shadow-sm transition-colors hover:border-zinc-400 active:scale-[0.98]"
        >
          แสดงรหัส
        </button>
      </div>

      <div className="flex-1 text-zinc-100">
        <h4 className="mb-3 flex items-center gap-2 text-sm font-extrabold uppercase tracking-wider text-white">
          <span className="text-primary-red">🎬</span> กิจกรรมของฉัน
        </h4>

        <div className="space-y-2.5">
          {registrations.length === 0 ? (
            <p className="text-xs text-zinc-500">ยังไม่มีกิจกรรมที่ลงทะเบียน</p>
          ) : (
            registrations.map((reg) => {
              const act = activities.find((a) => a._id === reg.activityId);
              if (!act) return null;

              const statusColors =
                reg.status === "waiting"
                  ? "bg-[#fcecc4]/20 border-[#d8b85a]/30 text-[#fcecc4]"
                  : reg.status === "attended"
                    ? "bg-[#e0f2e9]/20 border-light-green/30 text-light-green"
                    : "bg-red-500/10 border-red-500/20 text-red-400";

              const statusText =
                reg.status === "waiting"
                  ? "รอเข้าร่วม"
                  : reg.status === "attended"
                    ? "เข้าร่วมแล้ว"
                    : "ไม่ได้เข้าร่วม";

              return (
                <div
                  key={reg.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-muted-charcoal/50 bg-zinc-950/80 p-3.5 shadow-inner"
                >
                  <div className="flex min-w-0 flex-col">
                    <h5 className="truncate text-xs font-bold text-zinc-100">
                      {act.name}
                    </h5>
                    <span className="mt-1 text-[10px] text-zinc-500">
                      {/*{formatActivityDate(act.date)} •{" "}*/}
                      {act.location.split(",")[0]}
                    </span>
                  </div>

                  <span
                    className={`inline-block shrink-0 rounded-full border px-2.5 py-0.5 text-[9px] font-bold tracking-wide ${statusColors}`}
                  >
                    {statusText}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </aside>
  );
}
