export default function StudentDashboardLoading() {
  return (
    <main
      className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="overflow-hidden rounded-full bg-blue-100">
        <div className="h-1 w-full animate-pulse bg-blue-600" />
      </div>

      <section className="flex min-h-24 items-center gap-4 rounded-3xl border border-blue-100 bg-white p-5 shadow-sm sm:p-6">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-blue-50 text-blue-700">
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="h-6 w-6 animate-spin"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <circle cx="12" cy="12" r="9" className="opacity-25" />
            <path
              d="M21 12a9 9 0 0 0-9-9"
              className="opacity-90"
              strokeLinecap="round"
            />
          </svg>
        </span>
        <div>
          <p className="text-base font-black text-slate-950">Memuat halaman...</p>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            Mohon tunggu, data sedang disiapkan.
          </p>
        </div>
      </section>

      <section className="grid animate-pulse gap-5 md:grid-cols-2 xl:grid-cols-3">
        {[0, 1, 2].map((item) => (
          <div
            key={item}
            className="overflow-hidden rounded-3xl border border-blue-100 bg-white"
          >
            <div className="h-32 bg-blue-100" />
            <div className="space-y-4 p-5 sm:p-6">
              <div className="h-4 w-2/3 rounded bg-slate-200" />
              <div className="h-16 rounded-2xl bg-slate-100" />
              <div className="h-12 rounded-2xl bg-blue-100" />
            </div>
          </div>
        ))}
      </section>

      <span className="sr-only">Sedang memuat halaman peserta.</span>
    </main>
  );
}
