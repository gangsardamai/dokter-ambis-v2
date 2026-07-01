export default function Programs() {
  const programs = [
    {
      title: "Sistem Kardiovaskular",
      materi: "30 Materi",
    },
    {
      title: "Sistem Respirasi",
      materi: "28 Materi",
    },
    {
      title: "Sistem Gastrointestinal",
      materi: "25 Materi",
    },
  ];

  return (
    <section
      id="program"
      className="bg-gray-50 py-20"
    >
      <div className="max-w-7xl mx-auto px-6">
        <h2 className="text-4xl font-bold text-center mb-12">
          Program Belajar Sesuai Blok
        </h2>

        <div className="grid md:grid-cols-3 gap-6">
          {programs.map((item) => (
            <div
              key={item.title}
              className="bg-white rounded-2xl border p-6"
            >
              <h3 className="text-xl font-semibold mb-2">
                {item.title}
              </h3>

              <p className="text-gray-600">
                {item.materi}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}