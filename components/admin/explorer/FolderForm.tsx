 "use client";

import {
  FormCard,
  TextInput,
  TextAreaInput,
  NumberInput,
  PrimaryButton,
} from "@/components/admin";

import type { Database } from "@/supabase/types/database.types";

type FolderInsert =
  Database["public"]["Tables"]["lesson_folders"]["Insert"];

interface FolderFormProps {
  defaultValues?: Partial<FolderInsert>;

  submitLabel: string;

  action: (
    formData: FormData
  ) => Promise<void>;
}

export function FolderForm({
  defaultValues,
  submitLabel,
  action,
}: FolderFormProps) {
  return (
    <FormCard>

      <form
        action={action}
        className="space-y-6"
      >
<input
  type="hidden"
  name="id"
  value={defaultValues?.id ?? ""}
/>

<input
  type="hidden"
  name="course_id"
  value={defaultValues?.course_id ?? ""}
/>
        <TextInput
          label="Nama Folder"
          name="title"
          required
          defaultValue={
            defaultValues?.title ?? ""
          }
        />

        <TextInput
          label="Slug"
          name="slug"
          required
          defaultValue={
            defaultValues?.slug ?? ""
          }
        />

        <TextAreaInput
          label="Deskripsi"
          name="description"
          defaultValue={
            defaultValues?.description ?? ""
          }
        />
<NumberInput
  label="Urutan"
  name="folder_order"
  required
  defaultValue={
    Number(
      defaultValues?.folder_order ?? 1
    )
  }
/>

        <label className="block">
          <span className="mb-2 block text-sm font-bold text-slate-700">
            Status Publikasi
          </span>
          <select
            name="publication_status"
            defaultValue={
              defaultValues?.publication_status ?? "draft"
            }
            className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </label>

        <PrimaryButton
          type="submit"
        >
          {submitLabel}
        </PrimaryButton>

      </form>

    </FormCard>
  );
}