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

type TryoutImageKind = "question" | "explanation";

interface UploadRequestBody {
  tryoutId?: string;
  kind?: TryoutImageKind;
  fileName?: string;
  fileSize?: number;
  contentType?: string;
}

interface DeleteRequestBody {
  tryoutId?: string;
  kind?: TryoutImageKind;
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

function isValidKind(value: string): value is TryoutImageKind {
  return value === "question" || value === "explanation";
}

async function getAuthorizedTryout(tryoutId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase, error: NextResponse.json({ message: "Silakan masuk terlebih dahulu." }, { status: 401 }) };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, status")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile || profile.status !== "active" || !["admin", "mentor"].includes(profile.role)) {
    return { supabase, error: NextResponse.json({ message: "Anda tidak memiliki akses upload gambar Try Out." }, { status: 403 }) };
  }

  const { data: tryout } = await supabase
    .from("tryouts")
    .select("id, course_id, created_by")
    .eq("id", tryoutId)
    .maybeSingle();
  if (!tryout) return { supabase, error: NextResponse.json({ message: "Try Out tidak ditemukan." }, { status: 404 }) };

  if (profile.role === "mentor") {
    if (tryout.created_by !== user.id) {
      return { supabase, error: NextResponse.json({ message: "Mentor hanya dapat mengelola Try Out miliknya." }, { status: 403 }) };
    }
    const { data: mentor } = await supabase.from("mentor_details").select("id").eq("profile_id", user.id).maybeSingle();
    const { data: assignment } = mentor
      ? await supabase.from("course_mentors").select("course_id").eq("course_id", tryout.course_id).eq("mentor_id", mentor.id).maybeSingle()
      : { data: null };
    if (!assignment) return { supabase, error: NextResponse.json({ message: "Anda tidak ditugaskan pada course Try Out ini." }, { status: 403 }) };
  }

  return { supabase, tryout, courseId: tryout.course_id };
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

  const tryoutId = body.tryoutId?.trim() ?? "";
  const kindValue = body.kind?.trim() ?? "";
  const fileName = body.fileName?.trim() ?? "";
  const fileSize = Number(body.fileSize ?? 0);
  const contentType = body.contentType?.trim().toLowerCase() ?? "";

  if (!tryoutId || !fileName || !isValidKind(kindValue)) {
    return NextResponse.json(
      { message: "Tryout, jenis gambar, dan nama file wajib diisi." },
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

  const authorization = await getAuthorizedTryout(tryoutId);

  if (authorization.error) {
    return authorization.error;
  }

  const safeName = sanitizeFileName(fileName) || `gambar.${extension}`;
  const objectName = `${crypto.randomUUID()}-${safeName}`;
  const r2ObjectKey = [
    "courses",
    authorization.courseId,
    "tryout-images",
    tryoutId,
    kindValue,
    objectName,
  ].join("/");
  const supabaseObjectPath = [
    authorization.courseId,
    "tryout-images",
    tryoutId,
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

  const tryoutId = body.tryoutId?.trim() ?? "";
  const kindValue = body.kind?.trim() ?? "";
  const filePath = body.filePath?.trim() ?? "";

  if (!tryoutId || !filePath || !isValidKind(kindValue)) {
    return NextResponse.json(
      { message: "Tryout, jenis gambar, dan path file wajib diisi." },
      { status: 400 },
    );
  }

  const authorization = await getAuthorizedTryout(tryoutId);

  if (authorization.error) {
    return authorization.error;
  }

  const r2Prefix = [
    "courses",
    authorization.courseId,
    "tryout-images",
    tryoutId,
    kindValue,
    "",
  ].join("/");
  const supabasePrefix = [
    authorization.courseId,
    "tryout-images",
    tryoutId,
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
      { message: "Gambar tidak termasuk tryout ini." },
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
