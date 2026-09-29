import {
  getGoogleDriveDownloadUrl,
  parseGoogleDriveFilePath,
} from "@/lib/file/file-source";
import { createClient } from "@/lib/supabase/server";

interface LockedMaterialRouteContext {
  params: Promise<{
    fileId: string;
  }>;
}

function errorResponse(status: number, message: string): Response {
  return Response.json(
    { error: message },
    {
      status,
      headers: {
        "Cache-Control": "private, no-store, max-age=0",
      },
    },
  );
}

async function fetchDrivePdf(fileId: string): Promise<Response | null> {
  const urls = [
    getGoogleDriveDownloadUrl(fileId),
    `https://drive.usercontent.google.com/download?id=${encodeURIComponent(
      fileId,
    )}&export=download&confirm=t`,
  ];

  for (const url of urls) {
    const response = await fetch(url, {
      redirect: "follow",
      cache: "no-store",
      headers: {
        Accept: "application/pdf,*/*;q=0.8",
      },
    });

    if (!response.ok) continue;

    const contentType =
      response.headers.get("content-type")?.toLowerCase() ?? "";

    if (contentType.includes("application/pdf")) {
      return response;
    }
  }

  return null;
}

export async function GET(
  _request: Request,
  context: LockedMaterialRouteContext,
) {
  const { fileId } = await context.params;
  const supabase = await createClient();

  const { data: file, error } = await supabase
    .from("lesson_files")
    .select("id, title, file_type, file_path, access_mode")
    .eq("id", fileId)
    .maybeSingle();

  if (error || !file) {
    return errorResponse(
      404,
      "File tidak ditemukan atau Anda tidak memiliki akses.",
    );
  }

  if (file.access_mode !== "locked") {
    return errorResponse(400, "File ini bukan File Locked.");
  }

  if (file.file_type !== "pdf") {
    return errorResponse(
      400,
      "File Locked saat ini hanya mendukung PDF.",
    );
  }

  const googleDriveFileId = parseGoogleDriveFilePath(file.file_path);

  if (!googleDriveFileId) {
    return errorResponse(
      400,
      "File Locked harus menggunakan sumber Google Drive.",
    );
  }

  try {
    const driveResponse = await fetchDrivePdf(googleDriveFileId);

    if (!driveResponse) {
      return errorResponse(
        502,
        "PDF tidak dapat dibaca dari Google Drive. Pastikan file dapat diakses Anyone with the link sebagai Viewer dan tidak diproteksi password.",
      );
    }

    const bytes = await driveResponse.arrayBuffer();

    return new Response(bytes, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'inline; filename="dokterambis-locked.pdf"',
        "Cache-Control": "private, no-store, max-age=0",
        "X-Content-Type-Options": "nosniff",
        "X-Robots-Tag": "noindex, nofollow, noarchive",
      },
    });
  } catch (fetchError) {
    console.error("Locked Drive PDF fetch failed:", fetchError);
    return errorResponse(
      502,
      "PDF gagal dimuat dari Google Drive. Silakan coba lagi.",
    );
  }
}
