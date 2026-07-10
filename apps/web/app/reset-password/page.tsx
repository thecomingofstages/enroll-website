import { Suspense } from "react";
import ResetPasswordClient from "./ResetPasswordClient";

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-zinc-950 px-4 py-16 text-zinc-100">
          <div className="mx-auto flex w-full max-w-md flex-col items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900/80 p-6 shadow-2xl shadow-black/40">
            <p className="text-sm text-zinc-400">Loading reset form…</p>
          </div>
        </main>
      }
    >
      <ResetPasswordClient />
    </Suspense>
  );
}
