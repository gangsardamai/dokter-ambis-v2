"use client";

import { useState } from "react";

import {
  TextInput,
  TextArea,
  SelectField,
} from "@/components/ui";

import type { Database } from "@/supabase/types/database.types";

export type CourseStatus =
  Database["public"]["Enums"]["course_status"];

export type CourseFormData = {
  program_id: string;
  organization_id: string;
  title: string;
  slug: string;
  description: string;
  thumbnail_path: string;
  status: CourseStatus;
};

interface SelectOption {
  value: string;
  label: string;
}

interface CourseFormProps {
  initialData?: CourseFormData;

  programOptions: SelectOption[];

  organizationOptions: SelectOption[];

  submitLabel?: string;

  onSubmit: (
    data: CourseFormData
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

export default function CourseForm({
  initialData,
  programOptions,
  organizationOptions,
  submitLabel = "Simpan",
  onSubmit,
}: CourseFormProps) {

  const [programId, setProgramId] =
    useState(
      initialData?.program_id ?? ""
    );

  const [organizationId, setOrganizationId] =
    useState(
      initialData?.organization_id ?? ""
    );

  const [title, setTitle] =
    useState(
      initialData?.title ?? ""
    );

  const [slug, setSlug] =
    useState(
      initialData?.slug ?? ""
    );

  const [description, setDescription] =
    useState(
      initialData?.description ?? ""
    );

  const [thumbnailPath, setThumbnailPath] =
    useState(
      initialData?.thumbnail_path ?? ""
    );

  const [status, setStatus] =
    useState<CourseStatus>(
      initialData?.status ?? "draft"
    );

  const [loading, setLoading] =
    useState(false);

  const [slugEdited, setSlugEdited] =
    useState(
      Boolean(initialData?.slug)
    );

  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>
  ) {

    e.preventDefault();

    setLoading(true);

    try {

      await onSubmit({

        program_id:
          programId,

        organization_id:
          organizationId,

        title:
          title.trim(),

        slug:
          slug.trim(),

        description:
          description.trim(),

        thumbnail_path:
          thumbnailPath.trim(),

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

      <SelectField
        label="Program"
        value={programId}
        options={[
          {
            value: "",
            label: "Pilih Program",
          },
          ...programOptions,
        ]}
        onChange={setProgramId}
      />

      <SelectField
        label="Universitas"
        value={organizationId}
        options={[
          {
            value: "",
            label: "Pilih Universitas",
          },
          ...organizationOptions,
        ]}
        onChange={setOrganizationId}
      />

      <TextInput
        label="Nama Blok"
        value={title}
        required
        onChange={(value) => {

          setTitle(value);

          if (!slugEdited) {
            setSlug(
              slugify(value)
            );
          }

        }}
      />

      <TextInput
        label="Slug"
        value={slug}
        required
        onChange={(value) => {

          setSlugEdited(true);

          setSlug(value);

        }}
      />

      <TextArea
        label="Deskripsi"
        value={description}
        onChange={setDescription}
      />

      <TextInput
        label="Thumbnail Path"
        value={thumbnailPath}
        onChange={setThumbnailPath}
      />

      <SelectField
        label="Status"
        value={status}
        onChange={(value) =>
          setStatus(
            value as CourseStatus
          )
        }
        options={[
          {
            value: "draft",
            label: "Draft",
          },
          {
            value: "active",
            label: "Active",
          },
          {
            value: "archived",
            label: "Archived",
          },
        ]}
      />

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