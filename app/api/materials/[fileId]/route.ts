import { NextResponse } from "next/server";

import {
  createR2PresignedUrl,
  getR2BucketName,
  parseR2FilePath,
} from "@/lib/cloudflare/r2";
import {
  getGoogleDriveDownloadUrl,
  parseGoogleDriveFilePath,
} from "@/lib/file/file-source";
import { createClient } from "@/lib/supabase/server";

interface MaterialRouteContext {
  params: Promise<{
    fileId: string;
  }>;
}

function downloadErrorResponse(
  status: number,
  detail: string,
): Response {
  const html = `<!doctype html>
<html lang="id">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>File tidak dapat diunduh</title>
    <style>
      body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #f8fafc; color: #0f172a; font-family: Arial, sans-serif; }
      main { width: min(92vw, 560px); border: 1px solid #e2e8f0; border-radius: 20px; background: white; padding: 28px; box-shadow: 0 18px 50px rgba(15, 23, 42, .08); }
      h1 { margin: 0 0 12px; font-size: 24px; }
      p { margin: 8px 0; line-height: 1.65; color: #475569; }
      .detail { border-radius: 12px; background: #fff7ed; padding: 12px 14px; color: #9a3412; font-weight: 700; }
    </style>
  </head>
  <body>
    <main>
      <h1>File tidak dapat diunduh</h1>
      <p class="detail">${detail}</p>
      <p>Link mungkin sudah tidak aktif atau izin file telah berubah. Silakan hubungi Admin Dokter Ambis.</p>
      <p>Anda dapat menutup tab ini dan kembali ke halaman materi.</p>
    </main>
  </body>
</html>`;

  return new Response(html, {
    status,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "private, no-store, max-age=0",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export async function GET(
  _request: Request,
  context: MaterialRouteContext,
) {
  const { fileId } = await context.params;
  const supabase = await createClient();

  const { data: file, error } = await supabase
    .from("lesson_files")
    .select("file_path, title")
    .eq("id", fileId)
    .maybeSingle();

  if (error || !file) {
    return downloadErrorResponse(
      404,
      "File tidak ditemukan atau Anda tidak memiliki akses.",
    );
  }

  const googleDriveFileId =
    parseGoogleDriveFilePath(file.file_path);

  if (googleDriveFileId) {
    return NextResponse.redirect(
      getGoogleDriveDownloadUrl(googleDriveFileId),
    );
  }

  const r2File = parseR2FilePath(file.file_path);

  if (r2File) {
    if (r2File.bucket !== getR2BucketName()) {
      return downloadErrorResponse(
        500,
        "Lokasi penyimpanan file tidak valid.",
      );
    }

    try {
      const signed = createR2PresignedUrl({
        method: "GET",
        key: r2File.key,
        expiresIn: 60,
        downloadName: file.title,
      });

      return NextResponse.redirect(signed.url);
    } catch {
      return downloadErrorResponse(
        500,
        "Tautan unduhan sementara gagal dibuat.",
      );
    }
  }

  if (/^https?:\/\//i.test(file.file_path)) {
    return downloadErrorResponse(
      400,
      "Sumber file eksternal tidak diizinkan.",
    );
  }

  const objectPath = file.file_path.startsWith(
    "course-materials/",
  )
    ? file.file_path.slice("course-materials/".length)
    : file.file_path;

  const { data, error: signedUrlError } =
    await supabase.storage
      .from("course-materials")
      .createSignedUrl(objectPath, 60, {
        download: file.title,
      });

  if (signedUrlError || !data?.signedUrl) {
    return downloadErrorResponse(
      500,
      "Tautan unduhan sementara gagal dibuat.",
    );
  }

  return NextResponse.redirect(data.signedUrl);
}
