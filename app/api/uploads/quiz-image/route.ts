import { NextResponse } from "next/server";

import {
  createR2FilePath,
  createR2PresignedUrl,
  getR2BucketName,
  isR2Configured,
  parseR2FilePath,
} from "@/lib/cloudflare/r2";
import { createClient } from "@/lib/supabase/server";

const MATERIAL_BUCKET = "course-materials";
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_CONTENT_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);
const ALLOWED_EXTENSIONS = new Set([
  "jpg",
  "jpeg",
  "png",
  "webp",
]);

type QuizImageKind = "question" | "explanation";

interface UploadRequestBody {
  quizId?: string;
  kind?: QuizImageKind;
  fileName?: string;
  fileSize?: number;
  contentType?: string;
}

interface DeleteRequestBody {
  quizId?: string;
  kind?: QuizImageKind;
  filePath?: string;
}

function sanitizeFileName(fileName: string): string {
  return fileName
    .normalize("NFKD")
    .replace(/[^\w.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

function getExtension(fileName: string): string {
  return fileName.split(".").pop()?.toLowerCase() ?? "";
}

function isValidKind(value: string): value is QuizImageKind {
  return value === "question" || value === "explanation";
}

async function getAuthorizedQuiz(quizId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      supabase,
      error: NextResponse.json(
        { message: "Silakan masuk terlebih dahulu." },
        { status: 401 },
      ),
    };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, status")
    .eq("id", user.id)
    .maybeSingle();

  if (
    !profile ||
    profile.status !== "active" ||
    !["admin", "mentor"].includes(profile.role)
  ) {
    return {
      supabase,
      error: NextResponse.json(
        { message: "Anda tidak memiliki akses upload gambar quiz." },
        { status: 403 },
      ),
    };
  }

  const { data: quiz } = await supabase
    .from("quizzes")
    .select("id, lesson_id")
    .eq("id", quizId)
    .maybeSingle();

  if (!quiz) {
    return {
      supabase,
      error: NextResponse.json(
        { message: "Quiz tidak ditemukan atau tidak dapat Anda kelola." },
        { status: 404 },
      ),
    };
  }

  const { data: lesson } = await supabase
    .from("lessons")
    .select("course_id")
    .eq("id", quiz.lesson_id)
    .maybeSingle();

  if (!lesson) {
    return {
      supabase,
      error: NextResponse.json(
        { message: "Course quiz tidak ditemukan." },
        { status: 404 },
      ),
    };
  }

  if (profile.role === "mentor") {
    const { data: mentor } = await supabase
      .from("mentor_details")
      .select("id")
      .eq("profile_id", user.id)
      .maybeSingle();

    if (!mentor) {
      return {
        supabase,
        error: NextResponse.json(
          { message: "Data mentor tidak ditemukan." },
          { status: 403 },
        ),
      };
    }

    const { data: assignment } = await supabase
      .from("course_mentors")
      .select("course_id")
      .eq("course_id", lesson.course_id)
      .eq("mentor_id", mentor.id)
      .maybeSingle();

    if (!assignment) {
      return {
        supabase,
        error: NextResponse.json(
          { message: "Anda tidak ditugaskan pada course quiz ini." },
          { status: 403 },
        ),
      };
    }
  }

  return {
    supabase,
    quiz,
    courseId: lesson.course_id,
  };
}

export async function POST(request: Request) {
  let body: UploadRequestBody;

  try {
    body = (await request.json()) as UploadRequestBody;
  } catch {
    return NextResponse.json(
      { message: "Permintaan upload gambar tidak valid." },
      { status: 400 },
    );
  }

  const quizId = body.quizId?.trim() ?? "";
  const kindValue = body.kind?.trim() ?? "";
  const fileName = body.fileName?.trim() ?? "";
  const fileSize = Number(body.fileSize ?? 0);
  const contentType = body.contentType?.trim().toLowerCase() ?? "";

  if (!quizId || !fileName || !isValidKind(kindValue)) {
    return NextResponse.json(
      { message: "Quiz, jenis gambar, dan nama file wajib diisi." },
      { status: 400 },
    );
  }

  if (!Number.isFinite(fileSize) || fileSize < 1) {
    return NextResponse.json(
      { message: "Ukuran gambar tidak valid." },
      { status: 400 },
    );
  }

  if (fileSize > MAX_IMAGE_SIZE) {
    return NextResponse.json(
      { message: "Ukuran gambar maksimal 5 MB." },
      { status: 413 },
    );
  }

  const extension = getExtension(fileName);

  if (
    !ALLOWED_EXTENSIONS.has(extension) ||
    !ALLOWED_CONTENT_TYPES.has(contentType)
  ) {
    return NextResponse.json(
      { message: "Gambar harus berformat JPG, PNG, atau WebP." },
      { status: 415 },
    );
  }

  const authorization = await getAuthorizedQuiz(quizId);

  if (authorization.error) {
    return authorization.error;
  }

  const safeName = sanitizeFileName(fileName) || `gambar.${extension}`;
  const objectName = `${crypto.randomUUID()}-${safeName}`;
  const r2ObjectKey = [
    "courses",
    authorization.courseId,
    "quiz-images",
    quizId,
    kindValue,
    objectName,
  ].join("/");
  const supabaseObjectPath = [
    authorization.courseId,
    "quiz-images",
    quizId,
    kindValue,
    objectName,
  ].join("/");

  if (!isR2Configured()) {
    return NextResponse.json({
      provider: "supabase",
      bucket: MATERIAL_BUCKET,
      objectPath: supabaseObjectPath,
      filePath: supabaseObjectPath,
    });
  }

  try {
    const signed = createR2PresignedUrl({
      method: "PUT",
      key: r2ObjectKey,
      expiresIn: 300,
      contentType,
    });

    return NextResponse.json({
      provider: "r2",
      uploadUrl: signed.url,
      headers: signed.headers,
      objectPath: r2ObjectKey,
      filePath: createR2FilePath(r2ObjectKey),
    });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "URL upload gambar gagal dibuat.",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  let body: DeleteRequestBody;

  try {
    body = (await request.json()) as DeleteRequestBody;
  } catch {
    return NextResponse.json(
      { message: "Permintaan penghapusan gambar tidak valid." },
      { status: 400 },
    );
  }

  const quizId = body.quizId?.trim() ?? "";
  const kindValue = body.kind?.trim() ?? "";
  const filePath = body.filePath?.trim() ?? "";

  if (!quizId || !filePath || !isValidKind(kindValue)) {
    return NextResponse.json(
      { message: "Quiz, jenis gambar, dan path file wajib diisi." },
      { status: 400 },
    );
  }

  const authorization = await getAuthorizedQuiz(quizId);

  if (authorization.error) {
    return authorization.error;
  }

  const r2Prefix = [
    "courses",
    authorization.courseId,
    "quiz-images",
    quizId,
    kindValue,
    "",
  ].join("/");
  const supabasePrefix = [
    authorization.courseId,
    "quiz-images",
    quizId,
    kindValue,
    "",
  ].join("/");
  const parsedR2Path = parseR2FilePath(filePath);

  if (parsedR2Path) {
    if (
      !isR2Configured() ||
      parsedR2Path.bucket !== getR2BucketName() ||
      !parsedR2Path.key.startsWith(r2Prefix)
    ) {
      return NextResponse.json(
        { message: "Path gambar R2 tidak valid." },
        { status: 400 },
      );
    }

    try {
      const signed = createR2PresignedUrl({
        method: "DELETE",
        key: parsedR2Path.key,
        expiresIn: 120,
      });
      const deleteResponse = await fetch(signed.url, {
        method: "DELETE",
        cache: "no-store",
      });

      if (!deleteResponse.ok && deleteResponse.status !== 404) {
        throw new Error("Gambar R2 gagal dihapus.");
      }

      return new NextResponse(null, { status: 204 });
    } catch (error) {
      return NextResponse.json(
        {
          message:
            error instanceof Error
              ? error.message
              : "Gambar R2 gagal dihapus.",
        },
        { status: 500 },
      );
    }
  }

  if (!filePath.startsWith(supabasePrefix)) {
    return NextResponse.json(
      { message: "Gambar tidak termasuk quiz ini." },
      { status: 403 },
    );
  }

  const { error: removeError } = await authorization.supabase.storage
    .from(MATERIAL_BUCKET)
    .remove([filePath]);

  if (removeError) {
    return NextResponse.json(
      { message: removeError.message },
      { status: 500 },
    );
  }

  return new NextResponse(null, { status: 204 });
}
