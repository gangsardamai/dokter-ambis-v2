export default function MessagesLoading() {
  return (
    <main
      className="mx-auto w-full max-w-6xl space-y-6 p-4 sm:p-6 lg:p-8"
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
          <p className="font-black text-slate-950">Memuat kotak pesan...</p>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            Percakapan sedang disiapkan.
          </p>
        </div>
      </section>
      <section className="space-y-3">
        {[0, 1, 2].map((item) => (
          <div
            key={item}
            className="h-32 animate-pulse rounded-3xl border border-blue-100 bg-white"
          />
        ))}
      </section>
    </main>
  );
}
