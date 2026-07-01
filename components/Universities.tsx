export default function Universities() {
  const universities = [
    "Universitas Airlangga",
    "Universitas Brawijaya",
    "Universitas Jember",
    "Universitas Indonesia",
    "Universitas Gadjah Mada",
    "Universitas Padjadjaran",
  ];

  return (
    <section
      id="universitas"
      className="py-20 bg-white"
    >
      <div className="max-w-7xl mx-auto px-6">
        <h2 className="text-4xl font-bold text-center text-slate-900 mb-12">
          Universitas Tersedia
        </h2>

        <div className="grid md:grid-cols-3 gap-6">
          {universities.map((item) => (
            <div
              key={item}
              className="border border-blue-100 bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg transition"
            >
              <h3 className="font-semibold text-slate-900">
                {item}
              </h3>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}