"use client";

import { useActionState } from "react";

import {
  createStudentCourseQuestionAction,
  type LessonMessageActionResult,
} from "@/app/actions/lesson-message.actions";
import {
  PendingFormControls,
  PendingSubmitButton,
} from "@/components/forms/PendingForm";

interface CourseOption {
  id: string;
  title: string;
  context: string;
}

interface StudentQuestionFormProps {
  courses: CourseOption[];
}

const initialState: LessonMessageActionResult = {
  success: false,
  message: "",
};

export default function StudentQuestionForm({
  courses,
}: StudentQuestionFormProps) {
  const [state, formAction] = useActionState(
    createStudentCourseQuestionAction,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-5">
      <PendingFormControls
        className="space-y-5"
        pendingMessage="Pertanyaan sedang dikirim. Mohon tunggu."
      >
        <div>
          <label
            htmlFor="courseId"
            className="mb-2 block text-sm font-black text-slate-700"
          >
            Course
          </label>
          <select
            id="courseId"
            name="courseId"
            required
            defaultValue=""
            className="min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          >
            <option value="" disabled>
              Pilih course yang ingin ditanyakan
            </option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.title} — {course.context}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="message"
            className="mb-2 block text-sm font-black text-slate-700"
          >
            Pertanyaan
          </label>
          <textarea
            id="message"
            name="message"
            required
            maxLength={2000}
            rows={7}
            placeholder="Tuliskan pertanyaan Anda dengan jelas..."
            className="w-full resize-y rounded-2xl border border-slate-200 px-4 py-3 text-sm leading-6 text-slate-800 outline-none placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          />
          <p className="mt-2 text-xs font-semibold text-slate-400">
            Maksimal 2.000 karakter.
          </p>
        </div>

        {state.message && !state.success && (
          <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
            {state.message}
          </p>
        )}

        <div className="flex justify-end">
          <PendingSubmitButton
            pendingLabel="Mengirim..."
            className="inline-flex min-h-12 items-center justify-center rounded-xl bg-blue-600 px-6 py-3 text-sm font-black text-white transition hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60"
          >
            Kirim Pertanyaan
          </PendingSubmitButton>
        </div>
      </PendingFormControls>
    </form>
  );
}
