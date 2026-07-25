import type { Tryout } from "@/types/tryout";

interface CourseOption {
  value: string;
  label: string;
}

interface TryoutAdminFormProps {
  action: (formData: FormData) => void | Promise<void>;
  courses: CourseOption[];
  tryout?: Tryout | null;
  submitLabel: string;
}

function toWibLocal(value: string | null | undefined): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const wib = new Date(date.getTime() + 7 * 60 * 60 * 1000);
  return wib.toISOString().slice(0, 16);
}

const inputClass =
  "min-h-11 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";
const labelClass = "mb-1.5 block text-sm font-black text-slate-700";

export default function TryoutAdminForm({
  action,
  courses,
  tryout,
  submitLabel,
}: TryoutAdminFormProps) {
  return (
    <form action={action} className="space-y-6">
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="lg:col-span-2">
          <label htmlFor="courseId" className={labelClass}>
            Course
          </label>
          <select
            id="courseId"
            name="courseId"
            required
            defaultValue={tryout?.course_id ?? ""}
            className={inputClass}
          >
            <option value="" disabled>
              Pilih course
            </option>
            {courses.map((course) => (
              <option key={course.value} value={course.value}>
                {course.label}
              </option>
            ))}
          </select>
        </div>

        <div className="lg:col-span-2">
          <label htmlFor="title" className={labelClass}>
            Judul Try Out
          </label>
          <input
            id="title"
            name="title"
            required
            maxLength={180}
            defaultValue={tryout?.title ?? ""}
            placeholder="Contoh: Final Try Out Blok 7 Respirasi"
            className={inputClass}
          />
        </div>

        <div className="lg:col-span-2">
          <label htmlFor="description" className={labelClass}>
            Deskripsi
          </label>
          <textarea
            id="description"
            name="description"
            rows={4}
            defaultValue={tryout?.description ?? ""}
            placeholder="Tuliskan petunjuk singkat dan tujuan Try Out."
            className={`${inputClass} py-3`}
          />
        </div>

        <div>
          <label htmlFor="durationMinutes" className={labelClass}>
            Durasi (menit)
          </label>
          <input
            id="durationMinutes"
            name="durationMinutes"
            type="number"
            min={1}
            max={600}
            required
            defaultValue={tryout?.duration_minutes ?? 120}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="maxAttempts" className={labelClass}>
            Maksimal Percobaan
          </label>
          <input
            id="maxAttempts"
            name="maxAttempts"
            type="number"
            min={1}
            max={10}
            required
            defaultValue={tryout?.max_attempts ?? 1}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="passingScore" className={labelClass}>
            Nilai Lulus
          </label>
          <input
            id="passingScore"
            name="passingScore"
            type="number"
            min={0}
            max={100}
            required
            defaultValue={tryout?.passing_score ?? 70}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="publicationStatus" className={labelClass}>
            Status
          </label>
          <select
            id="publicationStatus"
            name="publicationStatus"
            defaultValue={tryout?.publication_status ?? "draft"}
            className={inputClass}
          >
            <option value="draft">Draft</option>
            <option value="scheduled">Scheduled</option>
            <option value="published">Published</option>
            <option value="closed">Closed</option>
          </select>
        </div>

        <div>
          <label htmlFor="openAt" className={labelClass}>
            Waktu Buka (WIB)
          </label>
          <input
            id="openAt"
            name="openAt"
            type="datetime-local"
            defaultValue={toWibLocal(tryout?.open_at)}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="closeAt" className={labelClass}>
            Waktu Tutup (WIB)
          </label>
          <input
            id="closeAt"
            name="closeAt"
            type="datetime-local"
            defaultValue={toWibLocal(tryout?.close_at)}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="resultReleaseMode" className={labelClass}>
            Publikasi Nilai
          </label>
          <select
            id="resultReleaseMode"
            name="resultReleaseMode"
            defaultValue={tryout?.result_release_mode ?? "immediate"}
            className={inputClass}
          >
            <option value="immediate">Langsung setelah submit</option>
            <option value="after_close">Setelah periode berakhir</option>
          </select>
        </div>

        <div>
          <label htmlFor="reviewReleaseMode" className={labelClass}>
            Publikasi Pembahasan
          </label>
          <select
            id="reviewReleaseMode"
            name="reviewReleaseMode"
            defaultValue={tryout?.review_release_mode ?? "after_close"}
            className={inputClass}
          >
            <option value="immediate">Langsung setelah submit</option>
            <option value="after_close">Setelah periode berakhir</option>
            <option value="never">Tidak ditampilkan</option>
          </select>
        </div>
      </div>

      <div className="grid gap-3 rounded-2xl border border-blue-100 bg-blue-50/60 p-4 sm:grid-cols-2">
        <label className="flex cursor-pointer items-center gap-3 text-sm font-bold text-slate-700">
          <input
            name="shuffleQuestions"
            type="checkbox"
            defaultChecked={tryout?.shuffle_questions ?? true}
            className="h-4 w-4 rounded border-slate-300 text-blue-600"
          />
          Acak urutan soal
        </label>
        <label className="flex cursor-pointer items-center gap-3 text-sm font-bold text-slate-700">
          <input
            name="shuffleOptions"
            type="checkbox"
            defaultChecked={tryout?.shuffle_options ?? true}
            className="h-4 w-4 rounded border-slate-300 text-blue-600"
          />
          Acak urutan pilihan
        </label>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          className="inline-flex min-h-11 items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-[#033b63] px-6 py-2.5 text-sm font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-300"
        >
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
