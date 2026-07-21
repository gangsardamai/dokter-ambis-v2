"use client";

type LessonFormProps = {
  defaultValues: {
    course_id: string;
    folder_id: string;

    title?: string;
    slug?: string;
    description?: string;

    lesson_order?: number;
    duration?: number;

    is_free?: boolean;
  };

  submitLabel: string;

  action: (
    formData: FormData,
  ) => Promise<void>;
};

export function LessonForm({
  defaultValues,
  submitLabel,
  action,
}: LessonFormProps) {

  return (

    <form
      action={action}
      className="space-y-5"
    >

      <input
        type="hidden"
        name="course_id"
        value={defaultValues.course_id}
      />

      <input
        type="hidden"
        name="folder_id"
        value={defaultValues.folder_id}
      />

      <div>

        <label className="mb-1 block text-sm font-medium">
          Judul Lesson
        </label>

        <input
          type="text"
          name="title"
          required
          defaultValue={defaultValues.title}
          className="w-full rounded border p-2"
        />

      </div>

      <div>

        <label className="mb-1 block text-sm font-medium">
          Slug
        </label>

        <input
          type="text"
          name="slug"
          required
          defaultValue={defaultValues.slug}
          className="w-full rounded border p-2"
        />

      </div>

      <div>

        <label className="mb-1 block text-sm font-medium">
          Deskripsi
        </label>

        <textarea
          name="description"
          rows={4}
          defaultValue={defaultValues.description ?? ""}
          className="w-full rounded border p-2"
        />

      </div>

      <div className="grid grid-cols-2 gap-4">

        <div>

          <label className="mb-1 block text-sm font-medium">
            Urutan
          </label>

          <input
            type="number"
            name="lesson_order"
            min={1}
            required
            defaultValue={
              defaultValues.lesson_order ?? 1
            }
            className="w-full rounded border p-2"
          />

        </div>

        <div>

          <label className="mb-1 block text-sm font-medium">
            Durasi (menit)
          </label>

          <input
            type="number"
            name="duration"
            min={1}
            required
            defaultValue={
              defaultValues.duration ?? 10
            }
            className="w-full rounded border p-2"
          />

        </div>

      </div>

      <label className="flex items-center gap-2">

        <input
          type="checkbox"
          name="is_free"
          defaultChecked={
            defaultValues.is_free ?? false
          }
        />

        Lesson Gratis

      </label>

      <button
        type="submit"
        className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
      >
        {submitLabel}
      </button>

    </form>

  );

}