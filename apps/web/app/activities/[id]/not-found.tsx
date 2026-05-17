import Link from "next/link";

export default function ActivityNotFound() {
  return (
    <main className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <h1 className="text-xl font-semibold text-zinc-900">ไม่พบกิจกรรม</h1>
      <p className="text-sm leading-relaxed text-zinc-600">
        ไม่มีกิจกรรมตามรหัสนี้ หรือเซิร์ฟเวอร์ไม่สามารถโหลดข้อมูลได้
        {process.env.NEXT_PUBLIC_API_URL
          ? " (กำลังใช้ API จาก NEXT_PUBLIC_API_URL)"
          : null}
      </p>
      <Link
        href="/"
        className="text-sm font-medium text-violet-700 underline underline-offset-4 hover:text-violet-900"
      >
        กลับหน้าแรก
      </Link>
    </main>
  );
}
