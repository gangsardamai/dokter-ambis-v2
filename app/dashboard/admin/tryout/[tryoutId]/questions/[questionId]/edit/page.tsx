import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/admin";
import TryoutQuestionForm from "@/components/tryout/TryoutQuestionForm";
import { tryoutService } from "@/services";

import { updateTryoutQuestionAction } from "../../../../actions";

interface Props {
  params: Promise<{ tryoutId: string; questionId: string }>;
}

export default async function EditTryoutQuestionPage({ params }: Props) {
  const { tryoutId, questionId } = await params;
  const payload = await tryoutService.getEditorPayload(tryoutId);
  const question = payload?.questions.find((item) => item.id === questionId);
  if (!payload || !question) notFound();

  return (
    <main className="mx-auto w-full max-w-4xl space-y-7 p-4 sm:p-6 lg:p-8">
      <Link href={`/dashboard/admin/tryout/${tryoutId}/questions`} className="text-sm font-black text-blue-700 hover:underline">
        ← Kembali ke daftar soal
      </Link>
      <PageHeader title={`Edit Soal ${question.question_order}`} description={payload.tryout.title} />
      <section className="rounded-3xl border border-blue-100 bg-white p-5 shadow-sm sm:p-7">
        <TryoutQuestionForm
          tryoutId={tryoutId}
          question={question}
          action={updateTryoutQuestionAction.bind(null, tryoutId, questionId)}
          afterSaveHref={`/dashboard/admin/tryout/${tryoutId}/questions?saved=true`}
        />
      </section>
    </main>
  );
}
