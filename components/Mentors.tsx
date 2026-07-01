export default function Mentors() {
  const mentors = [
    "dr. Ahmad",
    "dr. Budi",
    "dr. Citra",
  ];

  return (
    <section
      id="mentor"
      className="py-20 max-w-7xl mx-auto px-6"
    >
      <h2 className="text-4xl font-bold text-center mb-12">
        Mentor Dokter Ambis
      </h2>

      <div className="grid md:grid-cols-3 gap-6">
        {mentors.map((mentor) => (
          <div
            key={mentor}
            className="border rounded-2xl p-6 text-center"
          >
            <div className="w-24 h-24 rounded-full bg-gray-200 mx-auto mb-4"></div>

            <h3 className="font-semibold">
              {mentor}
            </h3>

            <p className="text-gray-600">
              Mentor Dokter Ambis
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}