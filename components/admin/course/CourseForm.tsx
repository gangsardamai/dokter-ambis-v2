"use client";

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

type CourseInsert =
  Database["public"]["Tables"]["courses"]["Insert"];

interface SelectOption {
  label: string;
  value: string;
}

interface CourseFormProps {

  defaultValues?: Partial<CourseInsert>;

  organizationOptions: SelectOption[];

  programOptions: SelectOption[];

  submitLabel: string;

  action: (
    formData: FormData
  ) => Promise<void>;

}

export default function CourseForm({

  defaultValues,

  organizationOptions,

  programOptions,

  submitLabel,

  action,

}: CourseFormProps) {

  return (

    <FormCard>

      <form
        action={action}
        className="space-y-6"
      >

        <SelectInput
          label="Universitas"
          name="organization_id"
          defaultValue={
            defaultValues?.organization_id ?? ""
          }
          options={organizationOptions}
        />

        <SelectInput
          label="Program"
          name="program_id"
          defaultValue={
            defaultValues?.program_id ?? ""
          }
          options={programOptions}
        />

        <TextInput
          label="Nama Blok"
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

        <TextInput
          label="Thumbnail Path"
          name="thumbnail_path"
          defaultValue={
            defaultValues?.thumbnail_path ?? ""
          }
        />

        <NumberInput
          label="Harga"
          name="price"
          required
          defaultValue={
            Number(
              defaultValues?.price ?? 0
            )
          }
        />

        <CheckboxInput
          label="Gratis"
          name="is_free"
          defaultChecked={
            defaultValues?.is_free ?? false
          }
        />

        <SelectInput
          label="Status"
          name="status"
          defaultValue={
            defaultValues?.status ?? "draft"
          }
          options={[
            {
              label: "Draft",
              value: "draft",
            },
            {
              label: "Active",
              value: "active",
            },
            {
              label: "Archived",
              value: "archived",
            },
          ]}
        />

        <PrimaryButton
          type="submit"
        >
          {submitLabel}
        </PrimaryButton>

      </form>

    </FormCard>

  );

}