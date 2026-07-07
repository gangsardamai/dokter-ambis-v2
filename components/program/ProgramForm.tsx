"use client";

import { useState } from "react";

export type ProgramStatus =
  | "active"
  | "inactive"
  | "coming_soon";

export type ProgramFormData = {
  title: string;
  slug: string;
  description: string;
  status: ProgramStatus;
};

interface ProgramFormProps {
  initialData?: ProgramFormData;
  submitLabel?: string;
  onSubmit: (
    data: ProgramFormData
  ) => Promise<void>;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export default function ProgramForm({
  initialData,
  submitLabel = "Simpan",
  onSubmit,
}: ProgramFormProps) {
  const [title, setTitle] = useState(
    initialData?.title ?? ""
  );

  const [slug, setSlug] = useState(
    initialData?.slug ?? ""
  );

  const [description, setDescription] =
    useState(
      initialData?.description ?? ""
    );

  const [status, setStatus] =
    useState<ProgramStatus>(
      initialData?.status ?? "active"
    );

  const [loading, setLoading] =
    useState(false);

  const [slugEdited, setSlugEdited] =
    useState(Boolean(initialData?.slug));

  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    setLoading(true);

    try {
      await onSubmit({
        title: title.trim(),
        slug: slug.trim(),
        description: description.trim(),
        status,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      {/* Nama Program */}
      <div>
        <label className="mb-2 block font-medium">
          Nama Program
        </label>

        <input
          type="text"
          required
          className="w-full rounded-lg border px-4 py-3"
          value={title}
          onChange={(e) => {
            const value = e.target.value;

            setTitle(value);

            if (!slugEdited) {
              setSlug(slugify(value));
            }
          }}
        />
      </div>

      {/* Slug */}
      <div>
        <label className="mb-2 block font-medium">
          Slug
        </label>

        <input
          type="text"
          required
          className="w-full rounded-lg border px-4 py-3"
          value={slug}
          onChange={(e) => {
            setSlugEdited(true);
            setSlug(e.target.value);
          }}
        />
      </div>

      {/* Deskripsi */}
      <div>
        <label className="mb-2 block font-medium">
          Deskripsi
        </label>

        <textarea
          rows={5}
          className="w-full rounded-lg border px-4 py-3"
          value={description}
          onChange={(e) =>
            setDescription(e.target.value)
          }
        />
      </div>

      {/* Status */}
      <div>
        <label className="mb-2 block font-medium">
          Status
        </label>

        <select
          className="w-full rounded-lg border px-4 py-3"
          value={status}
          onChange={(e) =>
            setStatus(
              e.target.value as ProgramStatus
            )
          }
        >
          <option value="active">
            Active
          </option>

          <option value="inactive">
            Inactive
          </option>

          <option value="coming_soon">
            Coming Soon
          </option>
        </select>
      </div>

      {/* Tombol */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading
            ? "Menyimpan..."
            : submitLabel}
        </button>
      </div>
    </form>
  );
}