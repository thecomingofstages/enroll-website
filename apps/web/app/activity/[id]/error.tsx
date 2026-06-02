"use client";

import { useEffect } from "react";
import { ActivityApiLoadError } from "@/lib/activity-api";

export default function ActivityDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const isApi = error.name === "ActivityApiLoadError";
  const status =
    isApi && typeof (error as ActivityApiLoadError).status === "number"
      ? (error as ActivityApiLoadError).status
      : undefined;

  return (
    <main className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <h1 className="text-xl font-semibold text-zinc-900">โหลดกิจกรรมไม่สำเร็จ</h1>
      <p className="text-sm leading-relaxed text-zinc-600">
        {isApi
          ? "เซิร์ฟเวอร์ไม่พร้อมหรือเกิดข้อผิดพลาดชั่วคราว ลองใหม่อีกครั้ง"
          : "เกิดข้อผิดพลาดระหว่างโหลดข้อมูล"}
        {status != null ? ` (รหัส ${status})` : null}
      </p>
      <button
        type="button"
        onClick={() => reset()}
        className="rounded-xl bg-violet-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-800"
      >
        ลองอีกครั้ง
      </button>
    </main>
  );
}
