export default function UniversitasPage() {
  const data = [
    { id: 1, nama: "Universitas Indonesia", blok: 5 },
    { id: 2, nama: "Universitas Gadjah Mada", blok: 4 },
    { id: 3, nama: "Universitas Airlangga", blok: 6 },
  ];

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ fontSize: 28, fontWeight: "bold" }}>
        Universitas
      </h1>

      <p style={{ color: "#666", marginTop: 8 }}>
        Pilih universitas sesuai kurikulum kamu
      </p>

      <div style={{ marginTop: 24, display: "grid", gap: 16 }}>
        {data.map((u) => (
          <div
            key={u.id}
            style={{
              border: "1px solid #ddd",
              padding: 16,
              borderRadius: 12,
            }}
          >
            <h2 style={{ fontSize: 18, fontWeight: 600 }}>
              {u.nama}
            </h2>

            <p style={{ marginTop: 6, color: "#555" }}>
              {u.blok} blok tersedia
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}