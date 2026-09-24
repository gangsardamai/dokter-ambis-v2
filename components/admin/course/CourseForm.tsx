"use client";

import { useState, type FormEvent } from "react";

import {
  CheckboxInput,
  FormCard,
  NumberInput,
  PrimaryButton,
  SelectInput,
  TextAreaInput,
  TextInput,
} from "@/components/admin";
import CourseRegistrationLinkCard from "./CourseRegistrationLinkCard";
import CourseWhatsAppGroupFields from "./CourseWhatsAppGroupFields";
import type { Database } from "@/supabase/types/database.extended.types";

type CourseInsert = Database["public"]["Tables"]["courses"]["Insert"];

interface SelectOption {
  label: string;
  value: string;
  organizationId?: string;
}

interface RegistrationPreviewResult {
  success: boolean;
  message: string;
  registrationUrl?: string;
}

interface CourseFormProps {
  defaultValues?: Partial<CourseInsert>;
  organizationOptions: SelectOption[];
  programOptions: SelectOption[];
  paymentAccountOptions: SelectOption[];
  submitLabel: string;
  action: (formData: FormData) => Promise<void>;
  showCreationSetup?: boolean;
  generateRegistrationLink?: (
    organizationId: string,
    title: string,
  ) => Promise<RegistrationPreviewResult>;
}

export default function CourseForm({
  defaultValues,
  organizationOptions,
  programOptions,
  paymentAccountOptions,
  submitLabel,
  action,
  showCreationSetup = false,
  generateRegistrationLink,
}: CourseFormProps) {
  const [organizationId, setOrganizationId] = useState(
    defaultValues?.organization_id ?? "",
  );
  const [programId, setProgramId] = useState(
    defaultValues?.program_id ?? "",
  );
  const [title, setTitle] = useState(
    String(defaultValues?.title ?? ""),
  );
  const [registrationUrl, setRegistrationUrl] = useState("");
  const [registrationMessage, setRegistrationMessage] =
    useState<string | null>(null);
  const [isGeneratingRegistrationLink, setIsGeneratingRegistrationLink] =
    useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const filteredPrograms = organizationId
    ? programOptions.filter(
        (program) => program.organizationId === organizationId,
      )
    : [];

  async function handleGenerateRegistrationLink() {
    if (!generateRegistrationLink || !title.trim()) {
      return;
    }

    if (!organizationId) {
      setRegistrationUrl("");
      setRegistrationMessage("Pilih Organization terlebih dahulu.");
      return;
    }

    setIsGeneratingRegistrationLink(true);
    setRegistrationMessage(null);

    try {
      const result = await generateRegistrationLink(
        organizationId,
        title.trim(),
      );

      if (!result.success || !result.registrationUrl) {
        setRegistrationUrl("");
        setRegistrationMessage(result.message);
        return;
      }

      setRegistrationUrl(result.registrationUrl);
      setRegistrationMessage(
        "Preview link dibuat. Link final mengikuti slug saat Course disimpan.",
      );
    } catch (error) {
      setRegistrationUrl("");
      setRegistrationMessage(
        error instanceof Error
          ? error.message
          : "Link pendaftaran gagal dibuat.",
      );
    } finally {
      setIsGeneratingRegistrationLink(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const formData = new FormData(event.currentTarget);

    setIsSubmitting(true);
    setFeedback(null);

    try {
      await action(formData);
      setFeedback({
        type: "success",
        message: "Kelas berhasil tersimpan.",
      });
    } catch (error) {
      setFeedback({
        type: "error",
        message:
          error instanceof Error && error.message
            ? error.message
            : "Kelas gagal disimpan. Silakan coba lagi.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <FormCard>
      <form onSubmit={handleSubmit} className="space-y-6">
        <SelectInput
          label="Organization"
          name="organization_id"
          value={organizationId}
          onChange={(event) => {
            const nextOrganizationId = event.target.value;
            setOrganizationId(nextOrganizationId);
            setRegistrationUrl("");
            setRegistrationMessage(null);

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
          value={title}
          onChange={(event) => {
            setTitle(event.target.value);
            setRegistrationUrl("");
            setRegistrationMessage(null);
          }}
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

        {showCreationSetup ? (
          <div className="space-y-6 border-t border-slate-200 pt-6">
            <section className="rounded-3xl border border-blue-100 bg-white p-5 shadow-sm sm:p-6">
              <CourseRegistrationLinkCard
                registrationUrl={registrationUrl}
                canGenerate={Boolean(title.trim())}
                isGenerating={isGeneratingRegistrationLink}
                generateMessage={registrationMessage}
                onGenerate={handleGenerateRegistrationLink}
              />
            </section>

            <section className="rounded-3xl border border-blue-100 bg-white p-5 shadow-sm sm:p-6">
              <CourseWhatsAppGroupFields />
            </section>
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-3">
          <PrimaryButton type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Loading..." : submitLabel}
          </PrimaryButton>

          {feedback ? (
            <p
              role={feedback.type === "error" ? "alert" : "status"}
              className={`text-sm font-semibold ${
                feedback.type === "success"
                  ? "text-emerald-700"
                  : "text-red-600"
              }`}
            >
              {feedback.message}
            </p>
          ) : null}
        </div>
      </form>
    </FormCard>
  );
}
