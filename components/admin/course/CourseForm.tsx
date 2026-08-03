"use client";

import { useState } from "react";

import {
  CheckboxInput,
  FormCard,
  NumberInput,
  PrimaryButton,
  SelectInput,
  TextAreaInput,
  TextInput,
} from "@/components/admin";
import type { Database } from "@/supabase/types/database.extended.types";

type CourseInsert = Database["public"]["Tables"]["courses"]["Insert"];

interface SelectOption {
  label: string;
  value: string;
  organizationId?: string;
}

interface CourseFormProps {
  defaultValues?: Partial<CourseInsert>;
  organizationOptions: SelectOption[];
  programOptions: SelectOption[];
  paymentAccountOptions: SelectOption[];
  submitLabel: string;
  action: (formData: FormData) => Promise<void>;
}

export default function CourseForm({
  defaultValues,
  organizationOptions,
  programOptions,
  paymentAccountOptions,
  submitLabel,
  action,
}: CourseFormProps) {
  const [organizationId, setOrganizationId] = useState(
    defaultValues?.organization_id ?? "",
  );
  const [programId, setProgramId] = useState(
    defaultValues?.program_id ?? "",
  );

  const filteredPrograms = organizationId
    ? programOptions.filter(
        (program) => program.organizationId === organizationId,
      )
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

            const selectedProgram = programOptions.find(
              (program) => program.value === programId,
            );

            if (selectedProgram?.organizationId !== nextOrganizationId) {
              setProgramId("");
            }
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
          placeholder={
            organizationId
              ? "Pilih Program"
              : "Pilih Organization terlebih dahulu"
          }
          required
          disabled={!organizationId}
        />

        <SelectInput
          label="Rekening Pembayaran"
          name="payment_account_id"
          defaultValue={defaultValues?.payment_account_id ?? ""}
          options={paymentAccountOptions}
          placeholder="Pilih rekening pembayaran"
          required
        />

        <SelectInput
          label="Kategori Pembayaran"
          name="payment_policy"
          defaultValue={defaultValues?.payment_policy ?? "upfront_only"}
          options={[
            { label: "Pembayaran di awal", value: "upfront_only" },
            {
              label: "Pembayaran di awal dan di akhir",
              value: "upfront_or_deferred",
            },
          ]}
          required
        />

        <TextInput
          label="Nama Blok"
          name="title"
          required
          defaultValue={defaultValues?.title ?? ""}
        />

        <TextAreaInput
          label="Deskripsi"
          name="description"
          defaultValue={defaultValues?.description ?? ""}
        />

        <TextInput
          label="Thumbnail Path"
          name="thumbnail_path"
          defaultValue={defaultValues?.thumbnail_path ?? ""}
        />

        <NumberInput
          label="Harga"
          name="price"
          required
          defaultValue={Number(defaultValues?.price ?? 0)}
        />

        <CheckboxInput
          label="Gratis"
          name="is_free"
          defaultChecked={defaultValues?.is_free ?? false}
        />

        <SelectInput
          label="Status"
          name="status"
          defaultValue={defaultValues?.status ?? "draft"}
          options={[
            { label: "Draft", value: "draft" },
            { label: "Active", value: "active" },
            { label: "Archived", value: "archived" },
          ]}
        />

        <PrimaryButton type="submit">{submitLabel}</PrimaryButton>
      </form>
    </FormCard>
  );
}
