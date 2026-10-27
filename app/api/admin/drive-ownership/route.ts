import { NextResponse } from "next/server";

import { DriveAdminClient, isDriveAdminConfigured, isUneJCourse, validateDriveId } from "@/lib/drive/google-drive-admin";
import { callDynamicRpc } from "@/lib/supabase/dynamic-rpc";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Payload {
  action?: "preview" | "migrate";
  courseId?: string;
  oldDriveId?: string;
  existingCopyId?: string;
}

interface ReferenceFile {
  id: string;
  lesson_id: string;
  file_path: string;
}

interface ReferenceVideo {
  id: string;
  lesson_id: string;
  provider_video_id: string;
}

async function authorizedClient() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return { status: 401 as const };
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id,role,status")
    .eq("id", user.id)
    .maybeSingle();
  if (profileError || !profile || profile.role !== "admin" || profile.status !== "active") {
    return { status: 403 as const };
  }
  return { supabase, status: 200 as const };
}

type ServerClient = Awaited<ReturnType<typeof createClient>>;

async function getReferences(supabase: ServerClient, oldDriveId: string) {
  // UUID-shaped Drive IDs can contain underscores; filter exact matches in JS,
  // while SQL RPC independently enforces the same ID on the entire database.
  const [filesResult, videosResult] = await Promise.all([
    supabase.from("lesson_files").select("id,lesson_id,file_path").ilike("file_path", `%${oldDriveId}%`).limit(1000),
    supabase.from("videos").select("id,lesson_id,provider_video_id").eq("provider", "google_drive").eq("provider_video_id", oldDriveId).limit(1000),
  ]);
  if (filesResult.error || videosResult.error) {
    throw new Error("Tidak dapat membaca semua referensi file/video dalam database.");
  }
  const files = (filesResult.data ?? []).filter((f) =>
    typeof f.file_path === "string" && f.file_path.includes(oldDriveId),
  ) as ReferenceFile[];
  const videos = (videosResult.data ?? []) as ReferenceVideo[];
  if (files.length >= 1000 || videos.length >= 1000) {
    throw new Error("Referensi terlalu banyak untuk pilot; pemeriksaan tidak lengkap.");
  }
  for (const file of files) {
    const allowed =
      file.file_path === `google-drive://${oldDriveId}` ||
      ((file.file_path.startsWith("https://drive.google.com/") ||
        file.file_path.startsWith("https://www.drive.google.com/")) &&
        file.file_path.includes(oldDriveId));
    if (!allowed) throw new Error("Format referensi file belum didukung untuk migrasi otomatis.");
  }
  return { files, videos };
}

async function assertConnectedToCourse(
  supabase: ServerClient,
  courseId: string,
  lessonIds: string[],
): Promise<void> {
  if (!lessonIds.length) throw new Error("ID file belum terhubung ke lesson website.");
  const { data, error } = await supabase
    .from("lessons")
    .select("id,course_id")
    .in("id", lessonIds);
  if (error || (data ?? []).length !== lessonIds.length) {
    throw new Error("Sebagian relasi lesson tidak dapat diverifikasi.");
  }
  if (!(data ?? []).some((lesson) => lesson.course_id === courseId)) {
    throw new Error("File tidak terhubung dengan course UNEJ yang dipilih.");
  }
}

function errorResponse(message: string, status: number): NextResponse {
  return NextResponse.json({ ok: false, message }, { status, headers: { "Cache-Control": "no-store" } });
}

export async function GET() {
  const auth = await authorizedClient();
  if (!auth.supabase) return errorResponse("Hanya Admin aktif yang boleh mengakses migrasi.", auth.status);
  return NextResponse.json({
    ok: true,
    configured: isDriveAdminConfigured(),
    courses: [
      { id: "aa4a2839-c6d1-4afb-8c2c-7732bb0e446d", title: "UNEJ Blok 2 2026" },
      { id: "50b4ef9e-e572-494c-ae81-e22a8c2c47ea", title: "UNEJ Blok 8 2026" },
      { id: "b575f68c-8bcb-4f98-ab0f-0f51b96a5207", title: "UNEJ Blok 14 2026" },
    ],
  }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  // Even with SameSite cookies, require same-origin JSON for this privileged action.
  if (request.headers.get("origin") !== new URL(request.url).origin) {
    return errorResponse("Origin permintaan tidak sesuai.", 403);
  }
  const auth = await authorizedClient();
  if (!auth.supabase) return errorResponse("Hanya Admin aktif yang boleh memigrasikan file.", auth.status);
  if (!isDriveAdminConfigured()) {
    return errorResponse("OAuth Google Drive akun utama belum dikonfigurasi pada server.", 503);
  }

  let body: Payload;
  try {
    body = (await request.json()) as Payload;
  } catch {
    return errorResponse("Format JSON tidak valid.", 400);
  }
  const courseId = typeof body.courseId === "string" ? body.courseId : "";
  const oldDriveId = typeof body.oldDriveId === "string" ? body.oldDriveId.trim() : "";
  if (!["preview", "migrate"].includes(body.action ?? "") || !isUneJCourse(courseId)) {
    return errorResponse("Aksi/course di luar pilot UNEJ.", 400);
  }
  try {
    validateDriveId(oldDriveId);
    const existingCopyId = typeof body.existingCopyId === "string" ? body.existingCopyId.trim() : "";
    if (existingCopyId) {
      validateDriveId(existingCopyId);
      if (existingCopyId === oldDriveId) throw new Error("ID salinan harus berbeda dari sumber.");
    }
    const drive = await DriveAdminClient.create();
    const source = await drive.getFile(oldDriveId);
    await drive.assertInUneJ2026(source, courseId);
    if (source.mimeType === "application/vnd.google-apps.folder") {
      throw new Error("Migrasi hanya mendukung file, bukan folder.");
    }
    if (source.owners?.[0]?.emailAddress?.toLowerCase() === "ambitious.premium@gmail.com") {
      return NextResponse.json({ ok: true, skipped: true, message: "File sudah dimiliki akun utama." });
    }
    if (!source.owners?.[0]?.emailAddress) {
      throw new Error("Pemilik file sumber tidak dapat diverifikasi.");
    }

    const previous = await getReferences(auth.supabase, oldDriveId);
    const lessonIds = [...new Set([...previous.files, ...previous.videos].map((ref) => ref.lesson_id))];
    await assertConnectedToCourse(auth.supabase, courseId, lessonIds);
    if (existingCopyId) {
      const copy = await drive.getFile(existingCopyId);
      await drive.assertEquivalentCopy(source, copy);
    }
    if (body.action === "preview") {
      return NextResponse.json({
        ok: true, sourceId: oldDriveId, name: source.name,
        files: previous.files.length, videos: previous.videos.length,
        message: "File sumber dan seluruh referensi yang terlihat sudah cocok. Belum ada perubahan.",
      });
    }

    // Reuse an existing verified copy when supplied; never create an unnecessary duplicate.
    // A newly created copy is not deleted on verification failure: preserve it for audit.
    const copy = existingCopyId
      ? await drive.getFile(existingCopyId)
      : await drive.copyFile(source);
    await drive.assertEquivalentCopy(source, await drive.getFile(copy.id));

    // 3. Use ONE PostgreSQL function so all reused lesson/video refs swap atomically.
    // If RPC fails ambiguously, retain both files for recovery: NEVER delete source.
    let counts: { files_updated: number; videos_updated: number }[];
    try {
      counts = await callDynamicRpc<{ files_updated: number; videos_updated: number }[]>(
        auth.supabase,
        "admin_replace_drive_references",
        { p_course_id: courseId, p_old_id: oldDriveId, p_new_id: copy.id },
      );
    } catch {
      return errorResponse(
        `Salinan ${copy.id} sudah dibuat, tetapi transaksi database gagal atau belum terpasang. File asli tetap dipertahankan. Periksa migration SQL dan log admin.`,
        409,
      );
    }
    const changes = counts?.[0];
    if (!changes || changes.files_updated + changes.videos_updated < 1) {
      return errorResponse(
        "Hasil pembaruan database tidak meyakinkan; file lama dipertahankan.",
        409,
      );
    }

    // 4. Minimal automatic verification only (manual video/PDF tests disabled by user).
    const remaining = await getReferences(auth.supabase, oldDriveId);
    if (remaining.files.length || remaining.videos.length) {
      return errorResponse(
        "Referensi lama masih terdeteksi; file asli tidak dihapus.",
        409,
      );
    }

    // Keep the source for independent student-access audit and explicit deletion later.
    const deletedOriginal = false;
    const deletionMessage = "Referensi diperbarui; file sumber dipertahankan sampai audit akses mahasiswa selesai.";
    return NextResponse.json({
      ok: true,
      sourceId: oldDriveId,
      newId: copy.id,
      filesUpdated: changes.files_updated,
      videosUpdated: changes.videos_updated,
      deletedOriginal,
      message: deletionMessage,
    });
  } catch (error) {
    console.error("[admin-drive-ownership] Migration stopped:", error);
    return errorResponse(
      error instanceof Error ? error.message : "Migrasi dihentikan karena error.",
      409,
    );
  }
}
