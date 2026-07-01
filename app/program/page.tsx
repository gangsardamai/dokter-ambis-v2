export default function ProgramPage() {
  const programs = [
    {
      id: 1,
      title: "Program Belajar Sesuai Blok",
      description: "Belajar sistematis berdasarkan blok universitas",
      status: "Aktif",
    },
    {
      id: 2,
      title: "Try Out UKMPPD (Coming Soon)",
      description: "Simulasi ujian UKMPPD dengan sistem CAT",
      status: "Segera",
    },
  ];

  return (
    <div style={{ padding: "24px", maxWidth: "900px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "28px", fontWeight: "bold" }}>
        Program Dokter Ambis
      </h1>

      <p style={{ marginTop: "8px", color: "#666" }}>
        Pilih program belajar sesuai kebutuhan kamu
      </p>

      <div style={{ marginTop: "24px", display: "grid", gap: "16px" }}>
        {programs.map((program) => (
          <div
            key={program.id}
            style={{
              border: "1px solid #ddd",
              borderRadius: "12px",
              padding: "16px",
            }}
          >
            <h2 style={{ fontSize: "20px", fontWeight: "600" }}>
              {program.title}
            </h2>

            <p style={{ marginTop: "8px", color: "#555" }}>
              {program.description}
            </p>

            <div style={{ marginTop: "12px" }}>
              <span
                style={{
                  padding: "4px 10px",
                  borderRadius: "8px",
                  fontSize: "12px",
                  background:
                    program.status === "Aktif" ? "#d1fae5" : "#fef3c7",
                  color: program.status === "Aktif" ? "#065f46" : "#92400e",
                }}
              >
                {program.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}