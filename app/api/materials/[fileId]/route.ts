import { NextResponse } from "next/server";

import {
  createR2PresignedUrl,
  getR2BucketName,
  parseR2FilePath,
} from "@/lib/cloudflare/r2";
import {
  getGoogleSheetsViewUrl,
  parseGoogleDriveFilePath,
  parseGoogleSheetsFilePath,
} from "@/lib/file/file-source";
import { createClient } from "@/lib/supabase/server";

interface MaterialRouteContext {
  params: Promise<{
    fileId: string;
  }>;
}

const FILE_MIME_TYPES: Record<string, string> = {
  pdf: "application/pdf",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  zip: "application/zip",
  mp3: "audio/mpeg",
};

function materialErrorResponse(
  status: number,
  detail: string,
): Response {
  const html = `<!doctype html>
<html lang="id">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Materi tidak dapat dibuka</title>
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
      <h1>Materi tidak dapat dibuka</h1>
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

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&#x27;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function getHtmlAttribute(
  tag: string,
  attribute: string,
): string | null {
  const pattern = new RegExp(
    `${attribute}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`,
    "i",
  );
  const match = tag.match(pattern);
  const value = match?.[1] ?? match?.[2] ?? match?.[3];

  return value ? decodeHtmlEntities(value) : null;
}

function getGoogleDriveConfirmationUrl(
  html: string,
  fileId: string,
): string | null {
  const formMatch = html.match(
    /<form\b[^>]*action\s*=\s*(?:"([^"]+)"|'([^']+)')[^>]*>([\s\S]*?)<\/form>/i,
  );

  if (formMatch) {
    const action = decodeHtmlEntities(
      formMatch[1] ?? formMatch[2] ?? "",
    );
    const body = formMatch[3] ?? "";

    try {
      const url = new URL(
        action,
        "https://drive.usercontent.google.com",
      );

      for (const inputTag of body.match(/<input\b[^>]*>/gi) ?? []) {
        const name = getHtmlAttribute(inputTag, "name");
        const value = getHtmlAttribute(inputTag, "value");

        if (name && value !== null) {
          url.searchParams.set(name, value);
        }
      }

      if (
        url.protocol === "https:" &&
        url.hostname === "drive.usercontent.google.com" &&
        url.pathname === "/download" &&
        url.searchParams.get("id") === fileId &&
        url.searchParams.has("confirm")
      ) {
        return url.toString();
      }
    } catch {
      // Continue to the link fallback below.
    }
  }

  for (const anchorTag of html.match(/<a\b[^>]*>/gi) ?? []) {
    const href = getHtmlAttribute(anchorTag, "href");

    if (!href) {
      continue;
    }

    try {
      const url = new URL(
        href,
        "https://drive.usercontent.google.com",
      );

      if (
        url.protocol === "https:" &&
        url.hostname === "drive.usercontent.google.com" &&
        url.pathname === "/download" &&
        url.searchParams.get("id") === fileId &&
        url.searchParams.has("confirm")
      ) {
        return url.toString();
      }
    } catch {
      // Ignore malformed links from the warning page.
    }
  }

  return null;
}

function getResponseCookies(response: Response): string | null {
  const headers = response.headers as Headers & {
    getSetCookie?: () => string[];
  };
  const setCookies = headers.getSetCookie?.() ?? [];

  if (setCookies.length > 0) {
    return setCookies
      .map((cookie) => cookie.split(";", 1)[0])
      .filter(Boolean)
      .join("; ");
  }

  const setCookie = response.headers.get("set-cookie");
  return setCookie ? setCookie.split(";", 1)[0] : null;
}

async function fetchGoogleDriveFile(
  fileId: string,
  range: string | null,
): Promise<Response> {
  const initialUrl = new URL(
    "https://drive.usercontent.google.com/download",
  );
  initialUrl.searchParams.set("id", fileId);
  initialUrl.searchParams.set("export", "download");
  initialUrl.searchParams.set("confirm", "t");

  const headers = new Headers({
    Accept: "application/octet-stream,*/*",
    "User-Agent": "DokterAmbis/1.0",
  });

  if (range) {
    headers.set("Range", range);
  }

  let response = await fetch(initialUrl, {
    headers,
    redirect: "follow",
    cache: "no-store",
  });

  const contentType = response.headers.get("content-type") ?? "";

  if (!contentType.toLowerCase().includes("text/html")) {
    return response;
  }

  const cookies = getResponseCookies(response);
  const html = await response.text();
  const confirmationUrl = getGoogleDriveConfirmationUrl(
    html,
    fileId,
  );

  if (!confirmationUrl) {
    throw new Error("Google Drive confirmation link was not found.");
  }

  const confirmedHeaders = new Headers(headers);

  if (cookies) {
    confirmedHeaders.set("Cookie", cookies);
  }

  response = await fetch(confirmationUrl, {
    headers: confirmedHeaders,
    redirect: "follow",
    cache: "no-store",
  });

  const confirmedContentType =
    response.headers.get("content-type") ?? "";

  if (confirmedContentType.toLowerCase().includes("text/html")) {
    throw new Error("Google Drive returned an HTML page instead of the file.");
  }

  return response;
}

function getDownloadFileName(
  title: string,
  fileType: string,
): string {
  const cleanTitle = title
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/[\\/:*?"<>|]/g, "-")
    .trim() || "materi";
  const extension = `.${fileType.toLowerCase()}`;

  return cleanTitle.toLowerCase().endsWith(extension)
    ? cleanTitle
    : `${cleanTitle}${extension}`;
}

function getContentDisposition(fileName: string): string {
  const asciiName = fileName
    .normalize("NFKD")
    .replace(/[^\x20-\x7E]/g, "_")
    .replace(/["\\]/g, "_");

  return `attachment; filename="${asciiName}"; filename*=UTF-8''${encodeURIComponent(fileName)}`;
}

function createGoogleDriveDownloadResponse(
  upstream: Response,
  title: string,
  fileType: string,
): Response {
  if (!upstream.body) {
    return materialErrorResponse(
      502,
      "File Google Drive tidak mengembalikan data.",
    );
  }

  const headers = new Headers({
    "Content-Type":
      FILE_MIME_TYPES[fileType] ?? "application/octet-stream",
    "Content-Disposition": getContentDisposition(
      getDownloadFileName(title, fileType),
    ),
    "Cache-Control": "private, no-store, max-age=0",
    "X-Content-Type-Options": "nosniff",
  });

  for (const headerName of [
    "accept-ranges",
    "content-length",
    "content-range",
    "etag",
    "last-modified",
  ]) {
    const value = upstream.headers.get(headerName);

    if (value) {
      headers.set(headerName, value);
    }
  }

  return new Response(upstream.body, {
    status: upstream.status,
    headers,
  });
}

export async function GET(
  request: Request,
  context: MaterialRouteContext,
) {
  const { fileId } = await context.params;
  const supabase = await createClient();

  const { data: file, error } = await supabase
    .from("lesson_files")
    .select("file_path, title, file_type")
    .eq("id", fileId)
    .maybeSingle();

  if (error || !file) {
    return materialErrorResponse(
      404,
      "File tidak ditemukan atau Anda tidak memiliki akses.",
    );
  }

  const googleSheetsFileId =
    parseGoogleSheetsFilePath(file.file_path);

  if (googleSheetsFileId) {
    return NextResponse.redirect(
      getGoogleSheetsViewUrl(googleSheetsFileId),
    );
  }

  const googleDriveFileId =
    parseGoogleDriveFilePath(file.file_path);

  if (googleDriveFileId) {
    try {
      const upstream = await fetchGoogleDriveFile(
        googleDriveFileId,
        request.headers.get("range"),
      );

      if (!upstream.ok && upstream.status !== 206) {
        return materialErrorResponse(
          upstream.status === 404 ? 404 : 502,
          "File Google Drive tidak dapat diunduh. Pastikan file masih tersedia dan izin berbagi tidak berubah.",
        );
      }

      return createGoogleDriveDownloadResponse(
        upstream,
        file.title,
        file.file_type,
      );
    } catch {
      return materialErrorResponse(
        502,
        "File Google Drive gagal diproses untuk diunduh. Silakan coba lagi atau hubungi Admin Dokter Ambis.",
      );
    }
  }

  const r2File = parseR2FilePath(file.file_path);

  if (r2File) {
    if (r2File.bucket !== getR2BucketName()) {
      return materialErrorResponse(
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
      return materialErrorResponse(
        500,
        "Tautan unduhan sementara gagal dibuat.",
      );
    }
  }

  if (/^https?:\/\//i.test(file.file_path)) {
    return materialErrorResponse(
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
    return materialErrorResponse(
      500,
      "Tautan unduhan sementara gagal dibuat.",
    );
  }

  return NextResponse.redirect(data.signedUrl);
}
