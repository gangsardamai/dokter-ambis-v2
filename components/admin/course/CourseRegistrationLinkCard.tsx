"use client";

import { useState } from "react";

interface CourseRegistrationLinkCardProps {
  registrationUrl?: string;
  canGenerate?: boolean;
  isGenerating?: boolean;
  generateMessage?: string | null;
  onGenerate?: () => void;
}

export default function CourseRegistrationLinkCard({
  registrationUrl = "",
  canGenerate = false,
  isGenerating = false,
  generateMessage = null,
  onGenerate,
}: CourseRegistrationLinkCardProps) {
  const [copied, setCopied] = useState(false);

  async function copyRegistrationUrl() {
    try {
      await navigator.clipboard.writeText(registrationUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      const textArea = document.createElement("textarea");
      textArea.value = registrationUrl;
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-black text-slate-950">
          Link Pendaftaran Langsung
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Bagikan link ini kepada mahasiswa agar mereka langsung menuju course
          yang dipilih tanpa mencarinya di katalog.
        </p>
      </div>

      {onGenerate ? (
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onGenerate}
            disabled={!canGenerate || isGenerating}
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-gradient-to-r from-[#1769cf] to-[#033b63] px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
          >
            {isGenerating ? "Membuat Link..." : "Generate Link"}
          </button>

          <p className="text-xs font-semibold text-slate-500">
            Tombol aktif setelah Nama Blok diisi.
          </p>
        </div>
      ) : null}

      {generateMessage ? (
        <p
          role="status"
          className="rounded-xl bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-600"
        >
          {generateMessage}
        </p>
      ) : null}

      <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
        <label
          htmlFor="course_registration_url"
          className="text-xs font-black uppercase tracking-[0.14em] text-blue-700"
        >
          URL Pendaftaran
        </label>
        <input
          id="course_registration_url"
          type="text"
          readOnly
          value={registrationUrl}
          placeholder="Klik Generate Link untuk membuat preview."
          className="mt-2 w-full rounded-xl border border-blue-100 bg-white px-4 py-3 text-sm text-slate-700 outline-none"
        />
      </div>

      {registrationUrl ? (
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={copyRegistrationUrl}
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-gradient-to-r from-[#1769cf] to-[#033b63] px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-300"
          >
            {copied ? "Link Tersalin" : "Salin Link Pendaftaran"}
          </button>

          <a
            href={registrationUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-blue-200 bg-white px-5 py-2.5 text-sm font-bold text-blue-700 transition hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            Buka Link
          </a>
        </div>
      ) : null}
    </div>
  );
}
