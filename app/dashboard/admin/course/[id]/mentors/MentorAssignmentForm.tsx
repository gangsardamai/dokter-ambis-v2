"use client";

import { useState } from "react";

interface MentorOption {
  id: string;
  fullName: string;
  status: string;
  assigned: boolean;
}

interface MentorAssignmentFormProps {
  action: (formData: FormData) => void | Promise<void>;
  mentors: MentorOption[];
}

export default function MentorAssignmentForm({
  action,
  mentors,
}: MentorAssignmentFormProps) {
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLocaleLowerCase("id-ID");
  const visibleMentorIds = new Set(
    mentors
      .filter((mentor) =>
        mentor.fullName
          .toLocaleLowerCase("id-ID")
          .includes(normalizedQuery),
      )
      .map((mentor) => mentor.id),
  );

  return (
    <form
      action={action}
      className="rounded-3xl border border-blue-100 bg-white p-5 shadow-sm sm:p-6"
    >
      {mentors.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
          <p className="font-black text-slate-900">
            Belum ada akun mentor.
          </p>
          <p className="mt-2 text-sm text-slate-500">
            Buat profil mentor terlebih dahulu sebelum melakukan penugasan.
          </p>
        </div>
      ) : (
        <>
          <div className="mb-5">
            <label
              htmlFor="mentor-search"
              className="block text-sm font-black text-slate-900"
            >
              Cari Mentor
            </label>
            <input
              id="mentor-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Ketik nama mentor..."
              autoComplete="off"
              className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
            <p
              className="mt-2 text-xs font-semibold text-slate-500"
              aria-live="polite"
            >
              {visibleMentorIds.size} dari {mentors.length} mentor ditampilkan.
            </p>
          </div>

          {visibleMentorIds.size === 0 ? (
            <div className="mb-4 border-y border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center">
              <p className="font-black text-slate-900">
                Mentor tidak ditemukan.
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Periksa kembali kata kunci pencarian.
              </p>
            </div>
          ) : null}

          <div className="divide-y divide-slate-200 border-y border-slate-200">
            {mentors.map((mentor) => (
              <label
                key={mentor.id}
                hidden={!visibleMentorIds.has(mentor.id)}
                className="flex min-h-14 cursor-pointer items-center gap-3 px-1 py-3 transition hover:bg-slate-50"
              >
                <input
                  type="checkbox"
                  name="mentor_id"
                  value={mentor.id}
                  defaultChecked={mentor.assigned}
                  disabled={mentor.status !== "active"}
                  className="h-4 w-4 shrink-0 accent-blue-600"
                />
                <span className="min-w-0 flex-1">
                  <span className="block break-words text-sm font-black text-slate-950">
                    {mentor.fullName}
                  </span>
                </span>
                <span
                  className={`shrink-0 text-xs font-semibold ${
                    mentor.status === "active"
                      ? "text-emerald-700"
                      : "text-slate-400"
                  }`}
                >
                  {mentor.status === "active"
                    ? "Aktif"
                    : "Tidak aktif"}
                </span>
              </label>
            ))}
          </div>
        </>
      )}

      <button
        type="submit"
        disabled={mentors.length === 0}
        className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-gradient-to-r from-blue-600 to-[#064a78] px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-900/10 transition hover:from-blue-700 hover:to-[#053b67] focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
      >
        Simpan Penugasan
      </button>
    </form>
  );
}
