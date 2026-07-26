import { NextResponse } from "next/server";

import {
  createR2PresignedUrl,
  getR2BucketName,
  isR2Configured,
  parseR2FilePath,
} from "@/lib/cloudflare/r2";
import { createClient } from "@/lib/supabase/server";
import type {
  TryoutAttemptPayload,
  TryoutReviewPayload,
} from "@/types/tryout";

const MATERIAL_BUCKET = "course-materials";
type ImageKind = "question" | "explanation";

interface Context {
  params: Promise<{ tryoutId: string; questionId: string }>;
}

function validKind(value: string | null): value is ImageKind {
  return value === "question" || value === "explanation";
}

function isScopedObjectPath(
  objectPath: string,
  expectedPrefix: string,
): boolean {
  if (!objectPath.startsWith(expectedPrefix)) return false;

  const fileName = objectPath.slice(expectedPrefix.length);
  return fileName.length > 0 && !fileName.includes("/");
}

export async function GET(request: Request, context: Context) {
  const { tryoutId, questionId } = await context.params;
  const url = new URL(request.url);
  const kind = url.searchParams.get("kind");
  const attemptId = url.searchParams.get("attemptId");

  if (!validKind(kind)) {
    return NextResponse.json(
      { message: "Jenis gambar tidak valid." },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  let filePath: string | null = null;

  const { data: managerQuestion } = await supabase
    .from("tryout_questions")
    .select("image_path, explanation_image_path")
    .eq("id", questionId)
    .eq("tryout_id", tryoutId)
    .maybeSingle();

  if (managerQuestion) {
    filePath =
      kind === "question"
        ? managerQuestion.image_path
        : managerQuestion.explanation_image_path;
  } else if (attemptId && kind === "question") {
    const { data, error } = await supabase.rpc("get_tryout_attempt", {
      target_attempt_id: attemptId,
    });
    if (error || !data) {
      return NextResponse.json(
        { message: error?.message ?? "Gambar tidak dapat diakses." },
        { status: 403 },
      );
    }

    const payload = data as unknown as TryoutAttemptPayload;
    if (payload.tryout_id !== tryoutId) {
      return NextResponse.json(
        { message: "Attempt tidak sesuai Try Out." },
        { status: 403 },
      );
    }
    filePath =
      payload.questions?.find((item) => item.id === questionId)?.image_path ??
      null;
  } else if (attemptId && kind === "explanation") {
    const { data, error } = await supabase.rpc("get_tryout_review", {
      target_attempt_id: attemptId,
    });
    if (error || !data) {
      return NextResponse.json(
        { message: error?.message ?? "Gambar tidak dapat diakses." },
        { status: 403 },
      );
    }

    const payload = data as unknown as TryoutReviewPayload;
    if (!payload.released || payload.tryout_id !== tryoutId) {
      return NextResponse.json(
        { message: "Pembahasan belum dapat diakses." },
        { status: 403 },
      );
    }
    filePath =
      payload.questions?.find((item) => item.id === questionId)
        ?.explanation_image_path ?? null;
  }

  if (!filePath) {
    return NextResponse.json(
      { message: "Gambar tidak ditemukan." },
      { status: 404 },
    );
  }

  const { data: tryout } = await supabase
    .from("tryouts")
    .select("course_id")
    .eq("id", tryoutId)
    .maybeSingle();

  if (!tryout) {
    return NextResponse.json(
      { message: "Course Try Out tidak dapat diverifikasi." },
      { status: 403 },
    );
  }

  const r2 = parseR2FilePath(filePath);
  if (r2) {
    const expectedPrefix = [
      "courses",
      tryout.course_id,
      "tryout-images",
      tryoutId,
      kind,
      "",
    ].join("/");

    if (
      !isR2Configured() ||
      r2.bucket !== getR2BucketName() ||
      !isScopedObjectPath(r2.key, expectedPrefix)
    ) {
      return NextResponse.json(
        { message: "Path gambar tidak valid." },
        { status: 403 },
      );
    }
    return NextResponse.redirect(
      createR2PresignedUrl({
        method: "GET",
        key: r2.key,
        expiresIn: 60,
      }).url,
    );
  }

  const objectPath = filePath.startsWith(`${MATERIAL_BUCKET}/`)
    ? filePath.slice(`${MATERIAL_BUCKET}/`.length)
    : filePath;
  const expectedPrefix = [
    tryout.course_id,
    "tryout-images",
    tryoutId,
    kind,
    "",
  ].join("/");

  if (!isScopedObjectPath(objectPath, expectedPrefix)) {
    return NextResponse.json(
      { message: "Path gambar tidak valid." },
      { status: 403 },
    );
  }

  const { data, error } = await supabase.storage
    .from(MATERIAL_BUCKET)
    .createSignedUrl(objectPath, 60);

  if (error || !data?.signedUrl) {
    return NextResponse.json(
      { message: error?.message ?? "Tautan gambar gagal dibuat." },
      { status: 500 },
    );
  }
  return NextResponse.redirect(data.signedUrl);
}
