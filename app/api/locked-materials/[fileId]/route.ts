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

interface DrivePdfResult {
  bytes: ArrayBuffer;
  contentType: string;
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

function looksLikePdf(bytes: ArrayBuffer): boolean {
  const header = new Uint8Array(bytes.slice(0, 5));

  return (
    header.length >= 5 &&
    header[0] === 0x25 &&
    header[1] === 0x50 &&
    header[2] === 0x44 &&
    header[3] === 0x46 &&
    header[4] === 0x2d
  );
}

function decodeHtml(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function getGoogleConfirmationUrl(
  html: string,
  fallbackFileId: string,
): string | null {
  const formMatch = html.match(
    /<form[^>]+id=["']download-form["'][^>]*action=["']([^"']+)["'][^>]*>/i,
  );

  const action = formMatch?.[1]
    ? decodeHtml(formMatch[1])
    : "https://drive.usercontent.google.com/download";

  const inputPattern =
    /<input[^>]+(?:type=["']hidden["'][^>]+)?name=["']([^"']+)["'][^>]+value=["']([^"']*)["'][^>]*>/gi;

  const params = new URLSearchParams();
  let match: RegExpExecArray | null;

  while ((match = inputPattern.exec(html)) !== null) {
    params.set(decodeHtml(match[1]), decodeHtml(match[2]));
  }

  if (!params.has("id")) {
    params.set("id", fallbackFileId);
  }

  if (!params.has("export")) {
    params.set("export", "download");
  }

  if (
    !params.has("confirm") &&
    !html.toLowerCase().includes("download-form")
  ) {
    return null;
  }

  try {
    const url = new URL(action);
    for (const [key, value] of params.entries()) {
      url.searchParams.set(key, value);
    }
    return url.toString();
  } catch {
    return null;
  }
}

async function fetchDriveCandidate(
  url: string,
): Promise<{
  response: Response;
  bytes: ArrayBuffer;
}> {
  const response = await fetch(url, {
    redirect: "follow",
    cache: "no-store",
    headers: {
      Accept: "application/pdf,application/octet-stream,*/*;q=0.8",
      "User-Agent":
        "Mozilla/5.0 (compatible; DokterAmbisLockedFile/1.0)",
    },
  });

  const bytes = await response.arrayBuffer();

  return { response, bytes };
}

async function fetchDrivePdf(
  fileId: string,
): Promise<DrivePdfResult | null> {
  const urls = [
    getGoogleDriveDownloadUrl(fileId),
    `https://drive.usercontent.google.com/download?id=${encodeURIComponent(
      fileId,
    )}&export=download&confirm=t`,
  ];

  for (const url of urls) {
    const first = await fetchDriveCandidate(url);

    if (!first.response.ok) continue;

    const firstContentType =
      first.response.headers.get("content-type")?.toLowerCase() ?? "";

    // Google Drive sometimes serves a valid PDF as application/octet-stream,
    // so verify the actual bytes instead of relying only on Content-Type.
    if (
      firstContentType.includes("application/pdf") ||
      looksLikePdf(first.bytes)
    ) {
      return {
        bytes: first.bytes,
        contentType: firstContentType || "application/pdf",
      };
    }

    if (
      firstContentType.includes("text/html") ||
      firstContentType.includes("application/xhtml")
    ) {
      const html = new TextDecoder("utf-8").decode(first.bytes);
      const confirmationUrl = getGoogleConfirmationUrl(html, fileId);

      if (!confirmationUrl) continue;

      const confirmed = await fetchDriveCandidate(confirmationUrl);

      if (!confirmed.response.ok) continue;

      const confirmedContentType =
        confirmed.response.headers
          .get("content-type")
          ?.toLowerCase() ?? "";

      if (
        confirmedContentType.includes("application/pdf") ||
        looksLikePdf(confirmed.bytes)
      ) {
        return {
          bytes: confirmed.bytes,
          contentType: confirmedContentType || "application/pdf",
        };
      }
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
    const drivePdf = await fetchDrivePdf(googleDriveFileId);

    if (!drivePdf) {
      return errorResponse(
        502,
        "PDF belum dapat dibaca dari Google Drive. Pastikan file adalah PDF dan dapat diakses Anyone with the link sebagai Viewer.",
      );
    }

    return new Response(drivePdf.bytes, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'inline; filename="dokterambis-locked.pdf"',
        "Content-Length": String(drivePdf.bytes.byteLength),
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
