export default function Hero() {
  return (
    <section className="bg-blue-50 py-28">
      <div className="max-w-5xl mx-auto px-6 text-center">
        <h1 className="text-5xl font-bold text-slate-900 mb-6">
          Belajar Sesuai Sistem Universitasmu
        </h1>

        <p className="text-lg text-slate-600 max-w-3xl mx-auto">
          Platform belajar kedokteran berbasis blok yang disusun
          sesuai kurikulum masing-masing fakultas kedokteran.
        </p>

        <div className="flex justify-center gap-4 mt-10">
          <button className="px-8 py-4 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition">
            Mulai Belajar
          </button>

          <button className="px-8 py-4 rounded-xl border border-blue-600 text-blue-600 font-semibold hover:bg-blue-50 transition">
            Lihat Program
          </button>
        </div>
      </div>
    </section>
  );
}