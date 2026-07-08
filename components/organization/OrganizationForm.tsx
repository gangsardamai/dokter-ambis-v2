"use client";

import { useState } from "react";

import {
  TextInput,
  SelectField,
} from "@/components/ui";

import type { Database } from "@/supabase/types/database.types";

export type OrganizationStatus =
  Database["public"]["Enums"]["organization_status"];

export type OrganizationFormData = {
  title: string;
  short_name: string;
  slug: string;
  logo_path: string;
  status: OrganizationStatus;
};

interface OrganizationFormProps {
  initialData?: OrganizationFormData;
  submitLabel?: string;
  onSubmit: (
    data: OrganizationFormData
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

export default function OrganizationForm({
  initialData,
  submitLabel = "Simpan",
  onSubmit,
}: OrganizationFormProps) {

  const [title, setTitle] =
    useState(initialData?.title ?? "");

  const [shortName, setShortName] =
    useState(initialData?.short_name ?? "");

  const [slug, setSlug] =
    useState(initialData?.slug ?? "");

  const [logoPath, setLogoPath] =
    useState(initialData?.logo_path ?? "");

  const [status, setStatus] =
    useState<OrganizationStatus>(
      initialData?.status ?? "active"
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
        title: title.trim(),
        short_name: shortName.trim(),
        slug: slug.trim(),
        logo_path: logoPath.trim(),
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

      <TextInput
        label="Nama Universitas"
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
        label="Nama Singkat"
        value={shortName}
        required
        onChange={setShortName}
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

      <TextInput
        label="Logo Path"
        value={logoPath}
        onChange={setLogoPath}
      />

      <SelectField
        label="Status"
        value={status}
        onChange={(value) =>
          setStatus(
            value as OrganizationStatus
          )
        }
        options={[
          {
            value: "active",
            label: "Active",
          },
          {
            value: "inactive",
            label: "Inactive",
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