import Link from "next/link";
import { notFound } from "next/navigation";

import MentorAssignmentForm from "./MentorAssignmentForm";
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
  const mentors = mentorDetails.flatMap((mentor) => {
    const profile = profilesById.get(mentor.profile_id);

    if (!profile) {
      return [];
    }

    return [
      {
        id: mentor.id,
        fullName: profile.full_name || "Tanpa nama",
        status: profile.status,
        assigned: assignedMentorIds.has(mentor.id),
      },
    ];
  });
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

      <MentorAssignmentForm
        action={action}
        mentors={mentors}
      />
    </main>
  );
}
