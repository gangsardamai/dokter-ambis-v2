import Link from "next/link";
import { redirect } from "next/navigation";

import TryoutAttemptClient from "@/components/tryout/TryoutAttemptClient";
import { profileService, tryoutService } from "@/services";

interface TryoutAttemptPageProps {
  params: Promise<{ attemptId: string }>;
}

export default async function TryoutAttemptPage({
  params,
}: TryoutAttemptPageProps) {
  const { attemptId } = await params;
  const profile = await profileService.getCurrentProfile();

  if (!profile) redirect("/login");
  if (profile.role !== "student") redirect("/dashboard");

  const attempt = await tryoutService.getAttempt(attemptId);

  if (attempt.status !== "in_progress") {
    redirect(`/dashboard/student/tryout/result/${attemptId}`);
  }

  const payload = {
    ...attempt,
    attempt_id: attempt.attempt_id || attemptId,
  };

  return (
    <main className="mx-auto w-full max-w-7xl space-y-5 p-3 sm:p-5 lg:p-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/dashboard/student"
          className="text-sm font-black text-blue-700 hover:underline"
        >
          ← Dashboard
        </Link>
        <p className="text-xs font-bold text-slate-500">
          Jawaban tersimpan otomatis. Jangan membuka attempt yang sama pada dua tab.
        </p>
      </div>

      <TryoutAttemptClient payload={payload} />
    </main>
  );
}
