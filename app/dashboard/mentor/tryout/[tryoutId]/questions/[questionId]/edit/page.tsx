import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { PageHeader } from "@/components/admin";
import TryoutQuestionForm from "@/components/tryout/TryoutQuestionForm";
import { profileService, tryoutService } from "@/services";

import { updateMentorTryoutQuestionAction } from "../../../../actions";

interface Props {
  params: Promise<{ tryoutId: string; questionId: string }>;
}

export default async function EditMentorTryoutQuestionPage({ params }: Props) {
  const profile = await profileService.getCurrentProfile();
  if (!profile || profile.role !== "mentor") redirect("/dashboard");

  const { tryoutId, questionId } = await params;
  const payload = await tryoutService.getMentorEditorPayload(
    profile.id,
    tryoutId,
  );
  const question = payload?.questions.find((item) => item.id === questionId);
  if (!payload || !question) notFound();

  return (
    <main className="mx-auto w-full max-w-4xl space-y-7 p-4 sm:p-6 lg:p-8">
      <Link href={`/dashboard/mentor/tryout/${tryoutId}/questions`} className="text-sm font-black text-blue-700 hover:underline">
        ← Kembali ke daftar soal
      </Link>
      <PageHeader title={`Edit Soal ${question.question_order}`} description={payload.tryout.title} />
      <section className="rounded-3xl border border-blue-100 bg-white p-5 shadow-sm sm:p-7">
        <TryoutQuestionForm
          tryoutId={tryoutId}
          question={question}
          action={updateMentorTryoutQuestionAction.bind(null, tryoutId, questionId)}
          afterSaveHref={`/dashboard/mentor/tryout/${tryoutId}/questions?saved=true`}
        />
      </section>
    </main>
  );
}
