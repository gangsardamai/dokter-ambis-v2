export default function Loading() {
  return (
    <main className="mx-auto max-w-7xl p-8">
      <div className="mb-6">
        <div className="mb-3 h-8 w-64 animate-pulse rounded bg-gray-200" />
        <div className="h-4 w-96 animate-pulse rounded bg-gray-200" />
      </div>

      <div className="mb-6 flex items-center justify-between">
        <div className="h-10 w-40 animate-pulse rounded-lg bg-gray-200" />
        <div className="h-10 w-32 animate-pulse rounded-lg bg-gray-200" />
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="space-y-4">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="flex items-center gap-3"
            >
              <div className="h-6 w-6 animate-pulse rounded bg-gray-200" />

              <div className="flex-1">
                <div className="mb-2 h-4 w-56 animate-pulse rounded bg-gray-200" />
                <div className="h-3 w-80 animate-pulse rounded bg-gray-100" />
              </div>

              <div className="h-8 w-20 animate-pulse rounded bg-gray-200" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}