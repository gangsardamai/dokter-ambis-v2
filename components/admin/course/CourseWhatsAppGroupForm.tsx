"use client";

import { useState, type FormEvent } from "react";

import { PrimaryButton, TextInput } from "@/components/admin";

interface CourseWhatsAppGroupFormProps {
  defaultValue: string;
  action: (formData: FormData) => Promise<void>;
}

export default function CourseWhatsAppGroupForm({
  defaultValue,
  action,
}: CourseWhatsAppGroupFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) return;

    const formData = new FormData(event.currentTarget);
    setIsSubmitting(true);
    setFeedback(null);

    try {
      await action(formData);
      setFeedback({
        type: "success",
        message: "Tersimpan ✓",
      });
    } catch (error) {
      setFeedback({
        type: "error",
        message:
          error instanceof Error && error.message
            ? error.message
            : "Gagal menyimpan link WhatsApp. Silakan coba lagi.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <h2 className="text-xl font-black text-slate-950">
          Grup WhatsApp Peserta
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Masukkan satu link undangan grup untuk course ini. Kosongkan kolom lalu
          simpan untuk menghapus tombol dari halaman peserta.
        </p>
      </div>

      <TextInput
        label="Link Grup WhatsApp"
        name="whatsapp_group_url"
        defaultValue={defaultValue}
        placeholder="https://chat.whatsapp.com/..."
      />

      <p className="text-xs leading-5 text-slate-500">
        Hanya link dengan domain chat.whatsapp.com yang dapat disimpan. Siapa pun
        yang memperoleh link tersebut dapat membukanya dan bergabung sesuai
        pengaturan grup di WhatsApp.
      </p>

      <div className="flex flex-wrap items-center gap-3">
        <PrimaryButton type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Menyimpan..." : "Simpan Link WhatsApp"}
        </PrimaryButton>

        {feedback ? (
          <p
            role={feedback.type === "error" ? "alert" : "status"}
            className={`text-sm font-bold ${
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
  );
}
