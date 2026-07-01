export default function BlokDetailPage({ params }: { params: { id: string } }) {
  const blokData: Record<string, any> = {
    "1": {
      nama: "Blok Kardiovaskular",
      universitas: "Universitas Indonesia",
      mentor: "Dr. A",
      materi: [
        { id: 1, judul: "Anatomi Jantung", tipe: "Video" },
        { id: 2, judul: "Fisiologi Jantung", tipe: "PDF" },
        { id: 3, judul: "EKG Dasar", tipe: "Video" },
        { id: 4, judul: "Patofisiologi Gagal Jantung", tipe: "Quiz" },
      ],
    },
    "2": {
      nama: "Blok Respirasi",
      universitas: "Universitas Gadjah Mada",
      mentor: "Dr. B",
      materi: [
        { id: 1, judul: "Anatomi Paru", tipe: "Video" },
        { id: 2, judul: "Ventilasi & Perfusi", tipe: "PDF" },
      ],
    },
  };

  const blok = blokData[params.id];

  if (!blok) {
    return (
      <div style={{ padding: 24 }}>
        <h1>Blok tidak ditemukan</h1>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ fontSize: 28, fontWeight: "bold" }}>
        {blok.nama}
      </h1>

      <p style={{ color: "#666", marginTop: 6 }}>
        {blok.universitas}
      </p>

      <p style={{ color: "#666" }}>
        Mentor: {blok.mentor}
      </p>

      <hr style={{ margin: "20px 0" }} />

      <h2 style={{ fontSize: 20, fontWeight: 600 }}>
        Daftar Materi
      </h2>

      <div style={{ marginTop: 16, display: "grid", gap: 12 }}>
        {blok.materi.map((m: any) => (
          <div
            key={m.id}
            style={{
              border: "1px solid #ddd",
              padding: 14,
              borderRadius: 10,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <div style={{ fontWeight: 600 }}>{m.judul}</div>
              <div style={{ fontSize: 12, color: "#666" }}>
                {m.tipe}
              </div>
            </div>

            <button
              style={{
                padding: "6px 12px",
                borderRadius: 8,
                border: "1px solid #ccc",
                cursor: "pointer",
              }}
            >
              Buka
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}