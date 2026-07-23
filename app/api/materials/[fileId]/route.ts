import { NextResponse } from "next/server";

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
