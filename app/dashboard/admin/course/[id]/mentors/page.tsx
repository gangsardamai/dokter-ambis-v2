import Link from "next/link";
import { notFound } from "next/navigation";

import { updateCourseMentorsAction } from "./actions";

import { createClient } from "@/lib/supabase/server";

interface CourseMentorsPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function CourseMentorsPage({
  params,
}: CourseMentorsPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const [
    courseResult,
    mentorDetailsResult,
    assignmentsResult,
  ] = await Promise.all([
    supabase
      .from("courses")
      .select("id, title")
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("mentor_details")
      .select("id, profile_id")
      .order("created_at"),
    supabase
      .from("course_mentors")
      .select("mentor_id")
      .eq("course_id", id),
  ]);

  if (
    courseResult.error ||
    !courseResult.data ||
    mentorDetailsResult.error ||
    assignmentsResult.error
  ) {
    notFound();
  }

  const mentorDetails = mentorDetailsResult.data ?? [];
  const profileIds = mentorDetails.map(
    (mentor) => mentor.profile_id,
  );
  const { data: profiles, error: profilesError } =
    profileIds.length > 0
      ? await supabase
          .from("profiles")
          .select("id, full_name, status")
          .in("id", profileIds)
          .eq("role", "mentor")
      : {
          data: [],
          error: null,
        };

  if (profilesError) {
    notFound();
  }

  const profilesById = new Map(
    (profiles ?? []).map((profile) => [
      profile.id,
      profile,
    ]),
  );
  const assignedMentorIds = new Set(
    (assignmentsResult.data ?? []).map(
      (assignment) => assignment.mentor_id,
    ),
  );
  const action =
    updateCourseMentorsAction.bind(null, id);

  return (
    <main className="mx-auto w-full max-w-4xl space-y-6 p-4 sm:p-6 lg:p-8">
      <Link
        href={`/dashboard/admin/course/${id}`}
        className="inline-flex min-h-10 items-center rounded-xl bg-white px-4 py-2 text-sm font-black text-blue-700 shadow-sm ring-1 ring-blue-100 transition hover:bg-blue-50"
      >
        ← Kembali ke Course
      </Link>

      <div>
        <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-700">
          Penugasan Mentor
        </p>
        <h1 className="mt-2 break-words text-3xl font-black text-slate-950">
          {courseResult.data.title}
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Mentor yang dipilih dapat mengelola Folder, Lesson, File, Video, dan Quiz pada Course ini.
        </p>
      </div>

      <form
        action={action}
        className="rounded-3xl border border-blue-100 bg-white p-5 shadow-sm sm:p-6"
      >
        {mentorDetails.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
            <p className="font-black text-slate-900">
              Belum ada akun mentor.
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Buat profil mentor terlebih dahulu sebelum melakukan penugasan.
            </p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {mentorDetails.map((mentor) => {
              const profile =
                profilesById.get(mentor.profile_id);

              if (!profile) {
                return null;
              }

              return (
                <label
                  key={mentor.id}
                  className="flex min-h-16 cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 transition hover:border-blue-200 hover:bg-blue-50/50"
                >
                  <input
                    type="checkbox"
                    name="mentor_id"
                    value={mentor.id}
                    defaultChecked={assignedMentorIds.has(
                      mentor.id,
                    )}
                    disabled={profile.status !== "active"}
                    className="h-4 w-4 accent-blue-600"
                  />
                  <span className="min-w-0">
                    <span className="block break-words text-sm font-black text-slate-950">
                      {profile.full_name}
                    </span>
                    <span className="mt-1 block text-xs font-semibold text-slate-500">
                      {profile.status === "active"
                        ? "Mentor aktif"
                        : "Mentor tidak aktif"}
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
        )}

        <button
          type="submit"
          className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-gradient-to-r from-blue-600 to-[#064a78] px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-900/10 transition hover:from-blue-700 hover:to-[#053b67] focus:outline-none focus:ring-2 focus:ring-blue-300 sm:w-auto"
        >
          Simpan Penugasan
        </button>
      </form>
    </main>
  );
}
