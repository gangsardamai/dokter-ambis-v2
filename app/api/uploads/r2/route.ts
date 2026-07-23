import { NextResponse } from "next/server";

import {
  createR2FilePath,
  createR2PresignedUrl,
  getR2BucketName,
  parseR2FilePath,
} from "@/lib/cloudflare/r2";
import { createClient } from "@/lib/supabase/server";

const MAX_FILE_SIZE = 50 * 1024 * 1024;
const ALLOWED_EXTENSIONS = new Set([
  "pdf",
  "ppt",
  "pptx",
  "doc",
  "docx",
  "xls",
  "xlsx",
  "zip",
  "mp3",
]);

interface UploadRequestBody {
  lessonId?: string;
  fileName?: string;
  fileSize?: number;
  contentType?: string;
}

interface DeleteRequestBody {
  lessonId?: string;
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
  const extension = fileName.split(".").pop();
  return extension?.toLowerCase() ?? "";
}

async function getAuthorizedLesson(lessonId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
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
      error: NextResponse.json(
        { message: "Anda tidak memiliki akses upload." },
        { status: 403 },
      ),
    };
  }

  const { data: lesson } = await supabase
    .from("lessons")
    .select("id, course_id, folder_id")
    .eq("id", lessonId)
    .maybeSingle();

  if (!lesson) {
    return {
      error: NextResponse.json(
        {
          message:
            "Lesson tidak ditemukan atau tidak termasuk course yang Anda kelola.",
        },
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
        error: NextResponse.json(
          {
            message:
              "Anda belum ditugaskan sebagai mentor pada course ini.",
          },
          { status: 403 },
        ),
      };
    }
  }

  return { lesson };
}

export async function POST(request: Request) {
  let body: UploadRequestBody;

  try {
    body = (await request.json()) as UploadRequestBody;
  } catch {
    return NextResponse.json(
      { message: "Permintaan upload tidak valid." },
      { status: 400 },
    );
  }

  const lessonId = body.lessonId?.trim() ?? "";
  const originalFileName = body.fileName?.trim() ?? "";
  const fileSize = Number(body.fileSize ?? 0);
  const contentType =
    body.contentType?.trim().toLowerCase() ||
    "application/octet-stream";

  if (!lessonId || !originalFileName) {
    return NextResponse.json(
      { message: "Lesson dan nama file wajib diisi." },
      { status: 400 },
    );
  }

  if (!Number.isFinite(fileSize) || fileSize < 1) {
    return NextResponse.json(
      { message: "Ukuran file tidak valid." },
      { status: 400 },
    );
  }

  if (fileSize > MAX_FILE_SIZE) {
    return NextResponse.json(
      { message: "Ukuran file maksimal 50 MB." },
      { status: 413 },
    );
  }

  const extension = getExtension(originalFileName);

  if (!ALLOWED_EXTENSIONS.has(extension)) {
    return NextResponse.json(
      { message: "Tipe file tidak diizinkan." },
      { status: 415 },
    );
  }

  const authorization = await getAuthorizedLesson(lessonId);

  if (authorization.error) {
    return authorization.error;
  }

  const { lesson } = authorization;
  const safeName = sanitizeFileName(originalFileName) ||
    `materi.${extension}`;
  const folderSegment = lesson.folder_id ?? "ungrouped";
  const objectKey = [
    "courses",
    lesson.course_id,
    "folders",
    folderSegment,
    "lessons",
    lesson.id,
    `${crypto.randomUUID()}-${safeName}`,
  ].join("/");

  try {
    const signed = createR2PresignedUrl({
      method: "PUT",
      key: objectKey,
      expiresIn: 300,
      contentType,
    });

    return NextResponse.json({
      uploadUrl: signed.url,
      headers: signed.headers,
      objectKey,
      filePath: createR2FilePath(objectKey),
    });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "URL upload R2 gagal dibuat.",
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
      { message: "Permintaan penghapusan tidak valid." },
      { status: 400 },
    );
  }

  const lessonId = body.lessonId?.trim() ?? "";
  const filePath = body.filePath?.trim() ?? "";

  if (!lessonId || !filePath) {
    return NextResponse.json(
      { message: "Lesson dan path file wajib diisi." },
      { status: 400 },
    );
  }

  const authorization = await getAuthorizedLesson(lessonId);

  if (authorization.error) {
    return authorization.error;
  }

  const parsed = parseR2FilePath(filePath);

  if (!parsed || parsed.bucket !== getR2BucketName()) {
    return NextResponse.json(
      { message: "Path file R2 tidak valid." },
      { status: 400 },
    );
  }

  const { lesson } = authorization;
  const folderSegment = lesson.folder_id ?? "ungrouped";
  const allowedPrefix = [
    "courses",
    lesson.course_id,
    "folders",
    folderSegment,
    "lessons",
    lesson.id,
    "",
  ].join("/");

  if (!parsed.key.startsWith(allowedPrefix)) {
    return NextResponse.json(
      { message: "File tidak termasuk lesson ini." },
      { status: 403 },
    );
  }

  try {
    const signed = createR2PresignedUrl({
      method: "DELETE",
      key: parsed.key,
      expiresIn: 120,
    });
    const deleteResponse = await fetch(signed.url, {
      method: "DELETE",
      cache: "no-store",
    });

    if (!deleteResponse.ok && deleteResponse.status !== 404) {
      throw new Error("Object R2 gagal dihapus.");
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Object R2 gagal dihapus.",
      },
      { status: 500 },
    );
  }
}
