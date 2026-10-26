"use client";

import { useEffect, useState } from "react";

type Course = { id: string; title: string };
type StatusResponse = {
  ok?: boolean;
  configured?: boolean;
  courses?: Course[];
  message?: string;
};
type ActionResult = {
  ok?: boolean;
  message?: string;
  sourceId?: string;
  newId?: string;
  name?: string;
  files?: number;
  videos?: number;
  filesUpdated?: number;
  videosUpdated?: number;
  deletedOriginal?: boolean;
  skipped?: boolean;
};

const PILOT_COURSES: Course[] = [
  { id: "aa4a2839-c6d1-4afb-8c2c-7732bb0e446d", title: "UNEJ Blok 2 2026" },
  { id: "50b4ef9e-e572-494c-ae81-e22a8c2c47ea", title: "UNEJ Blok 8 2026" },
  { id: "b575f68c-8bcb-4f98-ab0f-0f51b96a5207", title: "UNEJ Blok 14 2026" },
];

export default function DriveOwnershipPilot() {
  const [courseId, setCourseId] = useState(PILOT_COURSES[0].id);
  const [oldDriveId, setOldDriveId] = useState("");
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [busy, setBusy] = useState<"preview" | "migrate" | null>(null);
  const [preview, setPreview] = useState<ActionResult | null>(null);
  const [result, setResult] = useState<ActionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/admin/drive-ownership", { cache: "no-store" })
      .then((res) => res.json() as Promise<StatusResponse>)
      .then((status) => {
        if (!active) return;
        setConfigured(Boolean(status.ok && status.configured));
        if (!status.ok) setError(status.message ?? "Tidak dapat memeriksa konfigurasi.");
      })
      .catch(() => {
        if (active) {
          setConfigured(false);
          setError("Gagal menghubungi layanan migrasi.");
        }
      });
    return () => { active = false; };
  }, []);

  async function run(action: "preview" | "migrate") {
    setBusy(action);
    setError(null);
    setResult(null);
    if (action === "preview") setPreview(null);
    try {
      const response = await fetch("/api/admin/drive-ownership", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, courseId, oldDriveId: oldDriveId.trim() }),
      });
      const payload = (await response.json()) as ActionResult;
      if (!response.ok || !payload.ok) {
        throw new Error(payload.message ?? "Permintaan gagal.");
      }
      if (action === "preview") setPreview(payload);
      else {
        setResult(payload);
        setPreview(null);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Terjadi kesalahan.");
    } finally {
      setBusy(null);
    }
  }

  const inputValid = /^[A-Za-z0-9_-]{10,}$/.test(oldDriveId.trim());
  const canStart = configured === true && !busy && inputValid;
  const canMigrate = canStart && preview?.sourceId === oldDriveId.trim() && !preview.skipped;

  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6">
      <header>
        <p className="text-xs font-bold uppercase tracking-widest text-blue-600">Admin / Pilot UNEJ</p>
        <h1 className="mt-2 text-2xl font-extrabold text-slate-900">Migrasi Kepemilikan Google Drive</h1>
        <p className="mt-2 text-sm text-slate-600">
          Uji satu file materi 2026. Salin sebagai akun utama, cek izin,
          ganti seluruh referensi website dalam satu transaksi, lalu coba hapus file lama.
        </p>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-semibold text-slate-700">
          OAuth akun utama: {configured === null ? "Memeriksa..." : configured ? "Siap" : "Belum dikonfigurasi"}
        </p>
        {configured === false && (
          <p className="mt-2 text-sm text-amber-800">
            Migrasi dinonaktifkan sampai koneksi OAuth Google Drive ditambahkan ke Vercel.
            Kunci OAuth harus tetap rahasia di sisi server.
          </p>
        )}
      </section>

      <form onSubmit={(event) => { event.preventDefault(); if (canStart) void run("preview"); }}
        className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <label className="block text-sm font-semibold text-slate-800">
          Course UNEJ
          <select value={courseId} onChange={(e) => { setCourseId(e.target.value); setPreview(null); }}
            className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2">
            {PILOT_COURSES.map(course => <option key={course.id} value={course.id}>{course.title}</option>)}
          </select>
        </label>
        <label className="block text-sm font-semibold text-slate-800">
          ID file Google Drive lama
          <input value={oldDriveId}
            onChange={(e) => { setOldDriveId(e.target.value); setPreview(null); }}
            placeholder="Masukkan ID dari URL Google Drive"
            autoComplete="off" spellCheck={false}
            className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm" />
        </label>
        <div className="flex flex-wrap gap-3">
          <button type="submit" disabled={!canStart} aria-busy={busy === "preview"}
            className="rounded-xl bg-blue-700 px-5 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">
            {busy === "preview" ? "Memeriksa..." : "Periksa File"}
          </button>
          <button type="button" disabled={!canMigrate} aria-busy={busy === "migrate"}
            onClick={() => { if (canMigrate) void run("migrate"); }}
            className="rounded-xl bg-slate-800 px-5 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">
            {busy === "migrate" ? "Memigrasikan..." : "Salin, Sinkronkan, Hapus Sumber"}
          </button>
        </div>
      </form>

      {error && <section role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{error}</section>}
      {preview && (
        <section className="space-y-1 rounded-2xl border border-blue-200 bg-blue-50 p-5 text-sm text-blue-950">
          <h2 className="font-bold">Pratinjau terverifikasi</h2>
          <p>{preview.name ?? preview.message}</p>
          <p>File lesson: {preview.files ?? 0} · Video: {preview.videos ?? 0}</p>
          <p>Belum ada file atau referensi yang diubah.</p>
        </section>
      )}
      {result && (
        <section role="status" className="space-y-1 rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-800">
          <h2 className="font-bold">Hasil migrasi</h2>
          <p>{result.message}</p>
          {result.newId && <p className="break-all">ID baru: <code>{result.newId}</code></p>}
          <p>Referensi file: {result.filesUpdated ?? 0} · Referensi video: {result.videosUpdated ?? 0}</p>
          <p>File sumber dihapus: {result.deletedOriginal ? "Ya" : "Tidak"}</p>
        </section>
      )}
      <p className="text-xs leading-6 text-slate-500">
        Uji manual pemutaran video/PDF dinonaktifkan sesuai instruksi. Sistem tetap mengharuskan
        pemeriksaan izin Drive dan keberhasilan transaksi database sebelum menghapus file lama.
        File milik akun tentor dapat gagal dihapus karena izin Google.
      </p>
    </main>
  );
}
