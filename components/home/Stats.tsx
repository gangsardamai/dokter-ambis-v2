interface StatsProps {
  organizationCount: number;
}

export default function Stats({
  organizationCount,
}: StatsProps) {
  const stats = [
    {
      value: "500+",
      label: "Peserta Aktif",
    },
    {
      value: organizationCount.toString(),
      label: "Universitas",
    },
    {
      value: "100+",
      label: "Blok Pembelajaran",
    },
    {
      value: "3000+",
      label: "Materi",
    },
  ];

  return (
    <section className="bg-white py-14 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-r from-[#1769cf] via-[#033b63] to-[#061827] px-5 py-9 shadow-[0_20px_50px_rgba(3,59,99,0.18)] sm:px-8 lg:px-12">
          <div className="absolute -right-16 -top-24 h-56 w-56 rounded-full border-[35px] border-white/5" />

          <div className="absolute -bottom-20 -left-12 h-48 w-48 rounded-full border-[30px] border-blue-300/10" />

          <div className="relative grid grid-cols-2 gap-y-9 lg:grid-cols-4">
            {stats.map((item, index) => (
              <div
                key={item.label}
                className={`px-3 text-center ${
                  index > 0
                    ? "lg:border-l lg:border-white/15"
                    : ""
                }`}
              >
                <p className="text-3xl font-extrabold tracking-[-0.04em] text-white sm:text-4xl">
                  {item.value}
                </p>

                <p className="mt-2 text-xs font-medium text-blue-100 sm:text-sm">
                  {item.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}