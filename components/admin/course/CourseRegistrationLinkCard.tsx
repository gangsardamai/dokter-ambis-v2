"use client";

import { useEffect, useState } from "react";

interface CourseRegistrationLinkCardProps {
  registrationPath: string;
}

export default function CourseRegistrationLinkCard({
  registrationPath,
}: CourseRegistrationLinkCardProps) {
  const [registrationUrl, setRegistrationUrl] = useState(registrationPath);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setRegistrationUrl(`${window.location.origin}${registrationPath}`);
  }, [registrationPath]);

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
          className="mt-2 w-full rounded-xl border border-blue-100 bg-white px-4 py-3 text-sm text-slate-700 outline-none"
        />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={copyRegistrationUrl}
          className="inline-flex min-h-11 items-center justify-center rounded-xl bg-gradient-to-r from-[#1769cf] to-[#033b63] px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-300"
        >
          {copied ? "Link Tersalin" : "Salin Link Pendaftaran"}
        </button>

        <a
          href={registrationPath}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center justify-center rounded-xl border border-blue-200 bg-white px-5 py-2.5 text-sm font-bold text-blue-700 transition hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-200"
        >
          Buka Link
        </a>
      </div>
    </div>
  );
}
