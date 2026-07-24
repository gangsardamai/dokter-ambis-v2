"use client";

type LessonFormProps = {
  defaultValues: {
    course_id: string;
    folder_id?: string | null;
    title?: string;
    slug?: string;
    description?: string;
    lesson_order?: number;
    duration?: number;
    is_free?: boolean;
    is_required?: boolean;
    publication_status?: string;
  };
  submitLabel: string;
  action: (
    formData: FormData,
  ) => Promise<void>;
  showOrder?: boolean;
};

const inputClass =
  "min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100";

export function LessonForm({
  defaultValues,
  submitLabel,
  action,
  showOrder = true,
}: LessonFormProps) {
  return (
    <form
      action={action}
      className="space-y-5 rounded-3xl border border-blue-100 bg-white p-5 shadow-sm sm:p-6"
    >
      <input
        type="hidden"
        name="course_id"
        value={defaultValues.course_id}
      />
      <input
        type="hidden"
        name="folder_id"
        value={defaultValues.folder_id ?? ""}
      />

      <label className="block">
        <span className="mb-2 block text-sm font-bold text-slate-700">
          Judul Lesson
        </span>
        <input
          type="text"
          name="title"
          required
          defaultValue={defaultValues.title}
          className={inputClass}
        />
      </label>

      <label className="block">
        <span className="mb-2 block text-sm font-bold text-slate-700">
          Slug
        </span>
        <input
          type="text"
          name="slug"
          required
          defaultValue={defaultValues.slug}
          className={inputClass}
        />
      </label>

      <label className="block">
        <span className="mb-2 block text-sm font-bold text-slate-700">
          Deskripsi
        </span>
        <textarea
          name="description"
          rows={4}
          defaultValue={defaultValues.description ?? ""}
          className={`${inputClass} resize-y`}
        />
      </label>

      <div
        className={`grid gap-4 ${
          showOrder
            ? "sm:grid-cols-3"
            : "sm:grid-cols-2"
        }`}
      >
        {showOrder ? (
          <label className="block">
            <span className="mb-2 block text-sm font-bold text-slate-700">
              Urutan
            </span>
            <input
              type="number"
              name="lesson_order"
              min={1}
              required
              defaultValue={
                defaultValues.lesson_order ?? 1
              }
              className={inputClass}
            />
          </label>
        ) : null}

        <label className="block">
          <span className="mb-2 block text-sm font-bold text-slate-700">
            Durasi (menit)
          </span>
          <input
            type="number"
            name="duration"
            min={1}
            required
            defaultValue={
              defaultValues.duration ?? 10
            }
            className={inputClass}
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-bold text-slate-700">
            Status Publikasi
          </span>
          <select
            name="publication_status"
            defaultValue={
              defaultValues.publication_status ?? "draft"
            }
            className={inputClass}
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700">
          <input
            type="checkbox"
            name="is_free"
            defaultChecked={
              defaultValues.is_free ?? false
            }
            className="h-4 w-4 accent-blue-600"
          />
          Lesson Gratis
        </label>

        <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700">
          <input
            type="checkbox"
            name="is_required"
            defaultChecked={
              defaultValues.is_required ?? true
            }
            className="h-4 w-4 accent-blue-600"
          />
          Lesson Wajib
        </label>
      </div>

      <button
        type="submit"
        className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-gradient-to-r from-blue-600 to-[#064a78] px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-900/10 transition hover:from-blue-700 hover:to-[#053b67] focus:outline-none focus:ring-2 focus:ring-blue-300 sm:w-auto"
      >
        {submitLabel}
      </button>
    </form>
  );
}