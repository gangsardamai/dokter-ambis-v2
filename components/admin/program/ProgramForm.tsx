"use client";

import { FormCard, TextInput, TextAreaInput, SelectInput, PrimaryButton } from "@/components/admin";

import type { Database } from "@/supabase/types/database.types";

type ProgramInsert = Database["public"]["Tables"]["programs"]["Insert"];

interface SelectOption { label: string; value: string; }

interface ProgramFormProps {
  defaultValues?: Partial<ProgramInsert>;
  organizationOptions: SelectOption[];
  submitLabel: string;
  action: (formData: FormData) => Promise<void>;
}

export default function ProgramForm({ defaultValues, organizationOptions, submitLabel, action }: ProgramFormProps) {
  return (
    <FormCard>
      <form action={action} className="space-y-6">
        <SelectInput label="Organization" name="organization_id" defaultValue={defaultValues?.organization_id ?? ""} options={organizationOptions} />
        <TextInput label="Nama Program" name="title" required defaultValue={defaultValues?.title ?? ""} />
        <TextInput label="Slug" name="slug" required defaultValue={defaultValues?.slug ?? ""} />
        <TextAreaInput label="Deskripsi" name="description" defaultValue={defaultValues?.description ?? ""} />
        <TextInput label="Thumbnail Path" name="thumbnail_path" defaultValue={defaultValues?.thumbnail_path ?? ""} />
        <SelectInput
          label="Status"
          name="status"
          defaultValue={defaultValues?.status ?? "active"}
          options={[{ label: "Active", value: "active" }, { label: "Coming Soon", value: "coming_soon" }, { label: "Inactive", value: "inactive" }]}
        />
        <PrimaryButton type="submit">{submitLabel}</PrimaryButton>
      </form>
    </FormCard>
  );
}
