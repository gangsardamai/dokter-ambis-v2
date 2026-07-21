"use client";

import {
  FormCard,
  TextInput,
  SelectInput,
  PrimaryButton,
} from "@/components/admin";

import type { Database } from "@/supabase/types/database.types";

type OrganizationInsert =
  Database["public"]["Tables"]["organizations"]["Insert"];

interface OrganizationFormProps {

  defaultValues?: Partial<OrganizationInsert>;

  submitLabel: string;

  action: (
    formData: FormData
  ) => Promise<void>;

}

export default function OrganizationForm({

  defaultValues,

  submitLabel,

  action,

}: OrganizationFormProps) {

  return (

    <FormCard>

      <form
        action={action}
        className="space-y-6"
      >

        <TextInput
          label="Nama Universitas"
          name="title"
          required
          defaultValue={
            defaultValues?.title ?? ""
          }
        />

        <TextInput
          label="Nama Singkat"
          name="short_name"
          required
          defaultValue={
            defaultValues?.short_name ?? ""
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

        <TextInput
          label="Logo Path"
          name="logo_path"
          defaultValue={
            defaultValues?.logo_path ?? ""
          }
        />

        <SelectInput
          label="Status"
          name="status"
          defaultValue={
            defaultValues?.status ?? "active"
          }
          options={[
            {
              label: "Active",
              value: "active",
            },
            {
              label: "Inactive",
              value: "inactive",
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