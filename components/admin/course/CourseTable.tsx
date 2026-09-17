import Link from "next/link";

import { EmptyState } from "@/components/admin";
import {
  setCourseRatingMentorsAction,
  setMentorRatingEnabledAction,
} from "@/app/actions/mentor-rating.actions";
import { deleteCourseFormAction } from "@/app/dashboard/admin/course/actions";
import PendingSubmitButton from "@/components/mentor/PendingSubmitButton";
import { callDynamicRpc } from "@/lib/supabase/dynamic-rpc";
import { createClient } from "@/lib/supabase/server";
import CourseStatusBadge from "./CourseStatusBadge";
import type { CourseDetails } from "@/repositories/course.repository";

interface CourseTableProps {
  courses: CourseDetails[];
}

interface MentorDirectoryAssignment {
  id: string;
  isActive: boolean;
  showInRating?: boolean;
}

interface MentorDirectoryItem {
  mentorId: string;
  fullName: string;
  courses: MentorDirectoryAssignment[];
}

interface MentorDirectory {
  mentors: MentorDirectoryItem[];
}

interface CourseRatingMentor {
  mentorId: string;
  fullName: string;
  showInRating: boolean;
}

function formatRupiah(value: number | null) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value ?? 0);
}

export default async function CourseTable({ courses }: CourseTableProps) {
  if (courses.length === 0) {
    return (
      <EmptyState
        title="Course tidak ditemukan"
        description="Ubah kata kunci atau filter untuk melihat course yang sesuai."
      />
    );
  }

  const supabase = await createClient();
  const directory = await callDynamicRpc<MentorDirectory>(
    supabase,
    "admin_get_mentor_directory",
  );
  const visibleCourseIds = new Set(courses.map((course) => course.id));
  const ratingMentorsByCourse = new Map<string, CourseRatingMentor[]>();

  directory.mentors.forEach((mentor) => {
    mentor.courses.forEach((assignment) => {
      if (!assignment.isActive || !visibleCourseIds.has(assignment.id)) return;

      const current = ratingMentorsByCourse.get(assignment.id) ?? [];
      current.push({
        mentorId: mentor.mentorId,
        fullName: mentor.fullName,
        showInRating: assignment.showInRating !== false,
      });
      ratingMentorsByCourse.set(assignment.id, current);
    });
  });

  ratingMentorsByCourse.forEach((items) =>
    items.sort((a, b) => a.fullName.localeCompare(b.fullName, "id")),
  );

  return (
    <div className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {courses.map((course) => {
        const assignedMentors = ratingMentorsByCourse.get(course.id) ?? [];
        const selectedMentorCount = assignedMentors.filter(
          (mentor) => mentor.showInRating,
        ).length;

        return (
          <article
            key={course.id}
            className="min-w-0 rounded-3xl border border-blue-100/80 bg-white p-5 shadow-sm transition hover:border-blue-200 hover:shadow-xl hover:shadow-blue-950/10"
          >
            <div className="min-w-0 space-y-3">
              <h2 className="break-words text-lg font-extrabold tracking-[-0.03em] text-[#061827]">
                {course.title}
              </h2>
              <div className="flex flex-wrap gap-2">
                {course.organization?.is_general ? (
                  <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-extrabold text-cyan-700">
                    Umum / Nasional
                  </span>
                ) : null}
                <CourseStatusBadge status={course.status} />
                <span
                  className={`rounded-full px-3 py-1 text-xs font-extrabold ${
                    course.mentor_rating_enabled
                      ? "bg-amber-100 text-amber-700"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  Penilaian mentor {course.mentor_rating_enabled ? "aktif" : "nonaktif"}
                </span>
              </div>
            </div>

            <div className="mt-5 grid gap-3 rounded-2xl bg-gradient-to-br from-blue-50 to-slate-50 p-4 text-sm">
              <p className="min-w-0 break-words">
                <span className="font-bold text-slate-500">Organization:</span>{" "}
                <span className="font-extrabold text-[#061827]">
                  {course.organization?.title ?? "-"}
                </span>
              </p>
              <p className="min-w-0 break-words">
                <span className="font-bold text-slate-500">Program:</span>{" "}
                <span className="font-extrabold text-[#061827]">
                  {course.program?.title ?? "-"}
                </span>
              </p>
              <p className="min-w-0 break-all">
                <span className="font-bold text-slate-500">Slug:</span>{" "}
                <span className="font-extrabold text-[#1769cf]">{course.slug}</span>
              </p>
              <p>
                <span className="font-bold text-slate-500">Harga:</span>{" "}
                <span className="font-extrabold text-[#061827]">
                  {course.is_free ? "Gratis" : formatRupiah(course.price)}
                </span>
              </p>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <Link
                href={`/dashboard/admin/course/${course.id}/explorer`}
                className="inline-flex min-h-10 items-center rounded-xl bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-700 hover:bg-emerald-100"
              >
                Explorer
              </Link>

              <form action={setMentorRatingEnabledAction}>
                <input type="hidden" name="courseId" value={course.id} />
                <input
                  type="hidden"
                  name="enabled"
                  value={course.mentor_rating_enabled ? "false" : "true"}
                />
                <PendingSubmitButton
                  className={`inline-flex min-h-10 items-center rounded-xl px-4 py-2 text-sm font-bold ${
                    course.mentor_rating_enabled
                      ? "bg-amber-50 text-amber-700 hover:bg-amber-100"
                      : "bg-violet-50 text-violet-700 hover:bg-violet-100"
                  }`}
                  label={
                    course.mentor_rating_enabled
                      ? "Nonaktifkan Penilaian Mentor"
                      : "Aktifkan Penilaian Mentor"
                  }
                  pendingLabel="Menyimpan..."
                />
              </form>

              <details className="w-full">
                <summary className="inline-flex min-h-10 cursor-pointer list-none items-center rounded-xl bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700 hover:bg-blue-100">
                  Atur Penilaian Mentor
                </summary>
                <form
                  action={setCourseRatingMentorsAction}
                  className="mt-2 rounded-2xl border border-blue-100 bg-slate-50 p-3 shadow-sm"
                >
                  <input type="hidden" name="courseId" value={course.id} />
                  <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                    Mentor yang ditampilkan
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Centang mentor yang ingin muncul pada penilaian peserta.
                  </p>

                  {assignedMentors.length === 0 ? (
                    <p className="mt-3 rounded-xl bg-white px-3 py-2 text-xs font-semibold text-slate-500">
                      Belum ada mentor aktif yang ditugaskan pada course ini.
                    </p>
                  ) : (
                    <div className="mt-3 space-y-2">
                      {assignedMentors.map((mentor) => (
                        <label
                          key={mentor.mentorId}
                          className="flex cursor-pointer items-start gap-2 rounded-xl bg-white px-3 py-2 text-sm font-semibold text-slate-700 ring-1 ring-slate-200"
                        >
                          <input
                            type="checkbox"
                            name="mentorId"
                            value={mentor.mentorId}
                            defaultChecked={mentor.showInRating}
                            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600"
                          />
                          <span className="min-w-0 break-words">{mentor.fullName}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {assignedMentors.length > 0 && (
                    <>
                      <p className="mt-3 text-xs font-bold text-blue-700">
                        {selectedMentorCount} dari {assignedMentors.length} mentor saat ini ditampilkan.
                      </p>
                      <PendingSubmitButton
                        className="mt-3 min-h-10 w-full rounded-xl bg-[#1769cf] px-4 text-sm font-black text-white"
                        label="Simpan Pilihan"
                        pendingLabel="Menyimpan..."
                      />
                    </>
                  )}
                </form>
              </details>

              <Link
                href={`/dashboard/admin/course/${course.id}/edit`}
                className="inline-flex min-h-10 items-center rounded-xl bg-blue-50 px-4 py-2 text-sm font-bold text-[#1769cf] hover:bg-blue-100"
              >
                Edit
              </Link>
              <form action={deleteCourseFormAction}>
                <input type="hidden" name="id" value={course.id} />
                <button
                  type="submit"
                  className="inline-flex min-h-10 items-center rounded-xl bg-red-50 px-4 py-2 text-sm font-bold text-red-700 hover:bg-red-100"
                >
                  Hapus
                </button>
              </form>
            </div>
          </article>
        );
      })}
    </div>
  );
}
