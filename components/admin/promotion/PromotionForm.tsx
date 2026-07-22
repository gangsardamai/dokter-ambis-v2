"use client";

import FormCard from "@/components/admin/card/FormCard";
import PrimaryButton from "@/components/admin/button/PrimaryButton";
import TextInput from "@/components/admin/form/TextInput";
import NumberInput from "@/components/admin/form/NumberInput";
import SelectInput from "@/components/admin/form/SelectInput";
import CheckboxInput from "@/components/admin/form/CheckboxInput";
import DateTimeInput from "@/components/admin/form/DateTimeInput";
import TextAreaInput from "@/components/admin/form/TextAreaInput";

import type { Database } from "@/supabase/types/database.types";

type PromotionInsert =
  Database["public"]["Tables"]["promotions"]["Insert"];

interface PromotionFormProps {
  defaultValues?: Partial<PromotionInsert>;
  submitLabel: string;
  action: (formData: FormData) => Promise<void>;
}

export default function PromotionForm({
  defaultValues,
  submitLabel,
  action,
}: PromotionFormProps) {
  return (
    <FormCard>
      <form
        action={action}
        className="space-y-6"
      >
        <TextInput
          label="Nama Promosi"
          name="name"
          required
          defaultValue={defaultValues?.name ?? ""}
        />

        <TextInput
          label="Kode Voucher"
          name="code"
          defaultValue={defaultValues?.code ?? ""}
        />

        <SelectInput
          label="Jenis Promosi"
          name="type"
          defaultValue={defaultValues?.type}
          options={[
            {
              label: "Percentage",
              value: "percentage",
            },
            {
              label: "Fixed Amount",
              value: "fixed_amount",
            },
            {
              label: "Special Price",
              value: "special_price",
            },
            {
              label: "Free",
              value: "free",
            },
          ]}
        />

        <NumberInput
          label="Value"
          name="value"
          required
          defaultValue={defaultValues?.value}
        />

        <NumberInput
          label="Priority"
          name="priority"
          defaultValue={defaultValues?.priority ?? 1}
        />

        <NumberInput
          label="Quota"
          name="quota"
          defaultValue={defaultValues?.quota ?? undefined}
        />

        <DateTimeInput
          label="Mulai"
          name="start_at"
          required
          defaultValue={
            defaultValues?.start_at
              ? defaultValues.start_at.slice(0, 16)
              : undefined
          }
        />

        <DateTimeInput
          label="Berakhir"
          name="end_at"
          defaultValue={
            defaultValues?.end_at
              ? defaultValues.end_at.slice(0, 16)
              : undefined
          }
        />

        <CheckboxInput
          label="Menggunakan kode voucher"
          name="requires_code"
          defaultChecked={defaultValues?.requires_code ?? true}
        />

        <TextAreaInput
          label="Deskripsi"
          name="description"
          defaultValue={defaultValues?.description ?? ""}
        />

        <TextAreaInput
          label="Catatan Internal"
          name="notes"
          defaultValue={defaultValues?.notes ?? ""}
        />

        <PrimaryButton
          type="submit"
          className="w-full sm:w-auto"
        >
          {submitLabel}
        </PrimaryButton>
      </form>
    </FormCard>
  );
}
