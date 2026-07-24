import { NextResponse } from "next/server";

import {
  createR2PresignedUrl,
  getR2BucketName,
  isR2Configured,
  parseR2FilePath,
} from "@/lib/cloudflare/r2";
import { createClient } from "@/lib/supabase/server";

const MATERIAL_BUCKET = "course-materials";

type QuizImageKind = "question" | "explanation";

interface AttemptQuestionImage {
  id: string;
  image_path: string | null;
}

interface AttemptPayload {
  questions?: AttemptQuestionImage[];
}

interface ReviewQuestionImage extends AttemptQuestionImage {
  explanation_image_path: string | null;
}

interface ReviewPayload {
  questions?: ReviewQuestionImage[];
}

interface QuizImageRouteContext {
  params: Promise<{
    quizId: string;
    questionId: string;
  }>;
}

function isQuizImageKind(value: string | null): value is QuizImageKind {
  return value === "question" || value === "explanation";
}

export async function GET(
  request: Request,
  context: QuizImageRouteContext,
) {
  const { quizId, questionId } = await context.params;
  const kindValue = new URL(request.url).searchParams.get("kind");

  if (!isQuizImageKind(kindValue)) {
    return NextResponse.json(
      { message: "Jenis gambar quiz tidak valid." },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  let filePath: string | null = null;

  if (kindValue === "question") {
    const { data, error } = await supabase.rpc(
      "get_quiz_for_attempt",
      { target_quiz_id: quizId },
    );

    if (error || !data) {
      return NextResponse.json(
        {
          message:
            error?.message ?? "Gambar soal tidak dapat diakses.",
        },
        { status: 403 },
      );
    }

    const payload = data as unknown as AttemptPayload;
    filePath =
      payload.questions?.find(
        (question) => question.id === questionId,
      )?.image_path ?? null;
  } else {
    const { data, error } = await supabase.rpc(
      "get_quiz_review",
      { target_quiz_id: quizId },
    );

    if (error || !data) {
      return NextResponse.json(
        {
          message:
            error?.message ??
            "Gambar pembahasan tidak dapat diakses.",
        },
        { status: 403 },
      );
    }

    const payload = data as unknown as ReviewPayload;
    filePath =
      payload.questions?.find(
        (question) => question.id === questionId,
      )?.explanation_image_path ?? null;
  }

  if (!filePath) {
    return NextResponse.json(
      { message: "Gambar quiz tidak ditemukan." },
      { status: 404 },
    );
  }

  const r2File = parseR2FilePath(filePath);

  if (r2File) {
    if (
      !isR2Configured() ||
      r2File.bucket !== getR2BucketName()
    ) {
      return NextResponse.json(
        { message: "Konfigurasi bucket gambar tidak tersedia." },
        { status: 503 },
      );
    }

    const signed = createR2PresignedUrl({
      method: "GET",
      key: r2File.key,
      expiresIn: 60,
    });

    return NextResponse.redirect(signed.url);
  }

  const objectPath = filePath.startsWith(
    `${MATERIAL_BUCKET}/`,
  )
    ? filePath.slice(`${MATERIAL_BUCKET}/`.length)
    : filePath;
  const { data, error } = await supabase.storage
    .from(MATERIAL_BUCKET)
    .createSignedUrl(objectPath, 60);

  if (error || !data?.signedUrl) {
    return NextResponse.json(
      {
        message:
          error?.message ?? "Tautan gambar quiz gagal dibuat.",
      },
      { status: 500 },
    );
  }

  return NextResponse.redirect(data.signedUrl);
}
