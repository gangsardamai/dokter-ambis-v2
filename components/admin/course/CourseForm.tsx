"use client";

import { useState } from "react";

import {
  FormCard,
  TextInput,
  TextAreaInput,
  SelectInput,
  NumberInput,
  CheckboxInput,
  PrimaryButton,
} from "@/components/admin";

import type { Database } from "@/supabase/types/database.types";

type CourseInsert = Database["public"]["Tables"]["courses"]["Insert"];

interface SelectOption { label: string; value: string; organizationId?: string; }

interface CourseFormProps {
  defaultValues?: Partial<CourseInsert>;
  organizationOptions: SelectOption[];
  programOptions: SelectOption[];
  submitLabel: string;
  action: (formData: FormData) => Promise<void>;
}

export default function CourseForm({
  defaultValues,
  organizationOptions,
  programOptions,
  submitLabel,
  action,
}: CourseFormProps) {
  const [organizationId, setOrganizationId] = useState(defaultValues?.organization_id ?? "");
  const [programId, setProgramId] = useState(defaultValues?.program_id ?? "");

  const filteredPrograms = organizationId
    ? programOptions.filter((program) => program.organizationId === organizationId)
    : [];

  return (
    <FormCard>
      <form action={action} className="space-y-6">
        <SelectInput
          label="Organization"
          name="organization_id"
          value={organizationId}
          onChange={(event) => {
            const nextOrganizationId = event.target.value;
            setOrganizationId(nextOrganizationId);
            const selectedProgram = programOptions.find((program) => program.value === programId);
            if (selectedProgram?.organizationId !== nextOrganizationId) setProgramId("");
          }}
          options={organizationOptions}
          placeholder="Pilih Organization"
          required
        />

        <SelectInput
          label="Program"
          name="program_id"
          value={programId}
          onChange={(event) => setProgramId(event.target.value)}
          options={filteredPrograms}
          placeholder={organizationId ? "Pilih Program" : "Pilih Organization terlebih dahulu"}
          required
          disabled={!organizationId}
        />

        <TextInput label="Nama Blok" name="title" required defaultValue={defaultValues?.title ?? ""} />
        <TextInput label="Slug" name="slug" required defaultValue={defaultValues?.slug ?? ""} />
        <TextAreaInput label="Deskripsi" name="description" defaultValue={defaultValues?.description ?? ""} />
        <TextInput label="Thumbnail Path" name="thumbnail_path" defaultValue={defaultValues?.thumbnail_path ?? ""} />
        <NumberInput label="Harga" name="price" required defaultValue={Number(defaultValues?.price ?? 0)} />
        <CheckboxInput label="Gratis" name="is_free" defaultChecked={defaultValues?.is_free ?? false} />
        <SelectInput
          label="Status"
          name="status"
          defaultValue={defaultValues?.status ?? "draft"}
          options={[{ label: "Draft", value: "draft" }, { label: "Active", value: "active" }, { label: "Archived", value: "archived" }]}
        />
        <PrimaryButton type="submit">{submitLabel}</PrimaryButton>
      </form>
    </FormCard>
  );
}
