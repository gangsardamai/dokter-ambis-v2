export default function Navbar() {
  return (
    <nav className="bg-white border-b shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-blue-600">
          Dokter Ambis
        </h1>

        <div className="flex items-center gap-8">
          <a href="#universitas">Universitas</a>
          <a href="#program">Program</a>
          <a href="#mentor">Mentor</a>

          <button className="text-blue-600 font-medium">
            Masuk
          </button>

          <button className="bg-blue-600 text-white px-5 py-2 rounded-lg">
            Daftar
          </button>
        </div>
      </div>
    </nav>
  );
}