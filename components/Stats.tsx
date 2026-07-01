export default function Stats() {
  const stats = [
    {
      value: "25+",
      label: "Universitas",
    },
    {
      value: "100+",
      label: "Blok",
    },
    {
      value: "3000+",
      label: "Materi",
    },
  ];

  return (
    <section className="py-16 bg-white">
      <div className="max-w-5xl mx-auto px-6">
        <div className="grid md:grid-cols-3 gap-6">
          {stats.map((item) => (
            <div
              key={item.label}
              className="bg-white border border-blue-100 rounded-2xl p-8 text-center shadow-sm hover:shadow-lg transition"
            >
              <h3 className="text-4xl font-bold text-blue-600">
                {item.value}
              </h3>

              <p className="mt-3 text-slate-600">
                {item.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
