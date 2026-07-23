import { NextResponse } from "next/server";

import {
  createR2PresignedUrl,
  getR2BucketName,
  parseR2FilePath,
} from "@/lib/cloudflare/r2";
import { createClient } from "@/lib/supabase/server";

interface MaterialRouteContext {
  params: Promise<{
    fileId: string;
  }>;
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
    return NextResponse.json(
      {
        message:
          "File tidak ditemukan atau Anda tidak memiliki akses.",
      },
      { status: 404 },
    );
  }

  const r2File = parseR2FilePath(file.file_path);

  if (r2File) {
    if (r2File.bucket !== getR2BucketName()) {
      return NextResponse.json(
        { message: "Bucket file tidak valid." },
        { status: 500 },
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
    } catch (r2Error) {
      return NextResponse.json(
        {
          message:
            r2Error instanceof Error
              ? r2Error.message
              : "Tautan unduhan R2 gagal dibuat.",
        },
        { status: 500 },
      );
    }
  }

  if (/^https?:\/\//i.test(file.file_path)) {
    return NextResponse.redirect(file.file_path);
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
    return NextResponse.json(
      {
        message: "Tautan unduhan gagal dibuat.",
      },
      { status: 500 },
    );
  }

  return NextResponse.redirect(data.signedUrl);
}
