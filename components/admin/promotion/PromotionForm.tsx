"use client";

import { useState } from "react";

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

type PromotionType = PromotionInsert["type"];

interface PromotionFormProps {
  defaultValues?: Partial<PromotionInsert>;
  submitLabel: string;
  action: (formData: FormData) => Promise<void>;
}

const valueConfiguration: Record<
  PromotionType,
  {
    label: string;
    helperText: string;
    max?: number;
  }
> = {
  percentage: {
    label: "Persentase Diskon (%)",
    helperText: "Masukkan angka positif. Contoh: 20 berarti diskon 20%.",
    max: 100,
  },
  fixed_amount: {
    label: "Potongan Harga (Rp)",
    helperText: "Masukkan nominal potongan sebagai angka positif, tanpa tanda minus.",
  },
  special_price: {
    label: "Harga Khusus (Rp)",
    helperText: "Masukkan harga akhir setelah promosi, bukan besar potongannya.",
  },
  free: {
    label: "Nilai Promosi",
    helperText: "Promosi gratis otomatis menggunakan nilai 0.",
  },
};

export default function PromotionForm({
  defaultValues,
  submitLabel,
  action,
}: PromotionFormProps) {
  const initialType = defaultValues?.type ?? "percentage";
  const [promotionType, setPromotionType] =
    useState<PromotionType>(initialType);
  const [promotionValue, setPromotionValue] = useState<number | "">(
    initialType === "free"
      ? 0
      : (defaultValues?.value ?? ""),
  );
  const valueConfig = valueConfiguration[promotionType];

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
          value={promotionType}
          onChange={(event) => {
            const nextType = event.target.value as PromotionType;

            setPromotionType(nextType);

            if (nextType === "free") {
              setPromotionValue(0);
            } else if (promotionType === "free") {
              setPromotionValue("");
            }
          }}
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

        {promotionType === "free" ? (
          <>
            <input type="hidden" name="value" value="0" />
            <NumberInput
              label={valueConfig.label}
              name="value_display"
              value={0}
              disabled
              helperText={valueConfig.helperText}
            />
          </>
        ) : (
          <NumberInput
            label={valueConfig.label}
            name="value"
            required
            value={promotionValue}
            onChange={(event) => {
              const rawValue = event.target.value;
              setPromotionValue(
                rawValue === "" ? "" : Number(rawValue),
              );
            }}
            min={0}
            max={valueConfig.max}
            step="any"
            helperText={valueConfig.helperText}
          />
        )}

        <NumberInput
          label="Priority"
          name="priority"
          defaultValue={defaultValues?.priority ?? 1}
          min={1}
          step={1}
          helperText="Angka lebih kecil memiliki prioritas lebih tinggi. Minimal 1."
        />

        <NumberInput
          label="Quota"
          name="quota"
          defaultValue={defaultValues?.quota ?? undefined}
          min={1}
          step={1}
          helperText="Kosongkan bila kuota promosi tidak dibatasi."
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
