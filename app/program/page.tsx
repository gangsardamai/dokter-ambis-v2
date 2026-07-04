export default function ProgramPage() {
  const programs = [
    {
      id: 1,
      slug: "belajar-sesuai-blok",
      title: "Program Belajar Sesuai Blok",
      description: "Belajar sistematis berdasarkan blok universitas.",
      thumbnail: "",
      status: "active",
      isActive: true,
    },
    {
      id: 2,
      slug: "tryout-ukmppd",
      title: "Try Out UKMPPD",
      description: "Simulasi ujian UKMPPD dengan sistem CAT.",
      thumbnail: "",
      status: "coming_soon",
      isActive: false,
    },
  ];

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ fontSize: 28, fontWeight: "bold" }}>
        Program Dokter Ambis
      </h1>

      <p style={{ marginTop: 8, color: "#666" }}>
        Pilih program belajar sesuai kebutuhan kamu
      </p>

      <div style={{ marginTop: 24, display: "grid", gap: 16 }}>
        {programs.map((program) => (
          <div
            key={program.id}
            style={{
              border: "1px solid #ddd",
              borderRadius: 12,
              padding: 16,
            }}
          >
            <h2 style={{ fontSize: 20, fontWeight: 600 }}>
              {program.title}
            </h2>

            <p style={{ marginTop: 8, color: "#555" }}>
              {program.description}
            </p>

            <div style={{ marginTop: 12 }}>
              <span
                style={{
                  padding: "4px 10px",
                  borderRadius: 8,
                  fontSize: 12,
                  background:
                    program.status === "active"
                      ? "#d1fae5"
                      : "#fef3c7",
                  color:
                    program.status === "active"
                      ? "#065f46"
                      : "#92400e",
                }}
              >
                {program.status === "active"
                  ? "Aktif"
                  : "Segera Hadir"}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}