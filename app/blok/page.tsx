export default function BlokPage() {
  const blokList = [
    {
      id: 1,
      nama: "Blok Kardiovaskular",
      universitas: "Universitas Indonesia",
      mentor: "Dr. A",
      materi: 32,
      status: "Aktif",
      harga: "Rp 499.000",
    },
    {
      id: 2,
      nama: "Blok Respirasi",
      universitas: "Universitas Gadjah Mada",
      mentor: "Dr. B",
      materi: 28,
      status: "Aktif",
      harga: "Rp 399.000",
    },
    {
      id: 3,
      nama: "Blok Neurologi",
      universitas: "Universitas Airlangga",
      mentor: "Dr. C",
      materi: 35,
      status: "Segera",
      harga: "Rp 599.000",
    },
  ];

  return (
    <div style={{ padding: 24, maxWidth: 1000, margin: "0 auto" }}>
      <h1 style={{ fontSize: 28, fontWeight: "bold" }}>
        Program Blok
      </h1>

      <p style={{ color: "#666", marginTop: 8 }}>
        Pilih blok pembelajaran sesuai universitas kamu
      </p>

      <div style={{ marginTop: 24, display: "grid", gap: 16 }}>
        {blokList.map((blok) => (
          <div
            key={blok.id}
            style={{
              border: "1px solid #ddd",
              borderRadius: 12,
              padding: 16,
            }}
          >
            <h2 style={{ fontSize: 18, fontWeight: 600 }}>
              {blok.nama}
            </h2>

            <p style={{ marginTop: 6, color: "#555" }}>
              {blok.universitas}
            </p>

            <p style={{ marginTop: 6, color: "#555" }}>
              Mentor: {blok.mentor}
            </p>

            <p style={{ marginTop: 6, color: "#555" }}>
              {blok.materi} materi
            </p>

            <div style={{ marginTop: 10, fontWeight: "bold" }}>
              {blok.harga}
            </div>

            <span
              style={{
                display: "inline-block",
                marginTop: 8,
                padding: "4px 10px",
                borderRadius: 8,
                fontSize: 12,
                background:
                  blok.status === "Aktif" ? "#d1fae5" : "#fef3c7",
                color:
                  blok.status === "Aktif" ? "#065f46" : "#92400e",
              }}
            >
              {blok.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}