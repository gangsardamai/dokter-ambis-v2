import { callDynamicRpc } from "@/lib/supabase/dynamic-rpc";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ReviewPayload = {
  courseId?: string;
  mentorId?: string;
  rating?: number;
  suggestion?: string | null;
};

export async function POST(request: Request): Promise<Response> {
  try {
    const body = (await request.json()) as ReviewPayload;
    const courseId = body.courseId?.trim() ?? "";
    const mentorId = body.mentorId?.trim() ?? "";
    const rating = Number(body.rating);
    const suggestion = typeof body.suggestion === "string" ? body.suggestion.trim() : "";

    if (!courseId || !mentorId) {
      return Response.json({ message: "Data course atau mentor tidak lengkap." }, { status: 400 });
    }

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return Response.json({ message: "Pilih bintang 1 sampai 5." }, { status: 400 });
    }

    if (suggestion.length > 500) {
      return Response.json({ message: "Saran maksimal 500 karakter." }, { status: 400 });
    }

    const supabase = await createClient();
    await callDynamicRpc<void>(supabase, "save_mentor_review", {
      target_course_id: courseId,
      target_mentor_id: mentorId,
      target_rating: rating,
      target_suggestion: suggestion || null,
    });

    return Response.json({
      ok: true,
      rating,
      suggestion: suggestion || null,
      message: "Penilaian berhasil disimpan.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Penilaian gagal disimpan.";
    console.error("Gagal menyimpan penilaian mentor:", error);

    const status = /tidak dapat|diperlukan|dinonaktifkan|tidak sedang ditugaskan|masuk terlebih dahulu/i.test(message)
      ? 403
      : 500;

    return Response.json({ message }, { status });
  }
}
