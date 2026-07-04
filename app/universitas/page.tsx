import Link from "next/link";

export default function UniversitasPage() {
  const organizations = [
    {
      id: "ui",
      slug: "universitas-indonesia",
      title: "Universitas Indonesia",
      totalCourses: 5,
      isActive: true,
    },
    {
      id: "ugm",
      slug: "universitas-gadjah-mada",
      title: "Universitas Gadjah Mada",
      totalCourses: 4,
      isActive: true,
    },
    {
      id: "unair",
      slug: "universitas-airlangga",
      title: "Universitas Airlangga",
      totalCourses: 6,
      isActive: true,
    },
  ];

  return (
    <div
      style={{
        padding: 24,
        maxWidth: 900,
        margin: "0 auto",
      }}
    >
      <h1
        style={{
          fontSize: 28,
          fontWeight: "bold",
        }}
      >
        Universitas
      </h1>

      <p
        style={{
          color: "#666",
          marginTop: 8,
        }}
      >
        Pilih universitas untuk melihat daftar blok pembelajaran.
      </p>

      <div
        style={{
          marginTop: 24,
          display: "grid",
          gap: 16,
        }}
      >
        {organizations.map((organization) => (
          <Link
            key={organization.id}
            href={`/universitas/${organization.id}/blok`}
            style={{
              border: "1px solid #ddd",
              padding: 16,
              borderRadius: 12,
              display: "block",
              textDecoration: "none",
              color: "inherit",
            }}
          >
            <h2
              style={{
                fontSize: 18,
                fontWeight: 600,
              }}
            >
              {organization.title}
            </h2>

            <p
              style={{
                marginTop: 6,
                color: "#555",
              }}
            >
              {organization.totalCourses} blok tersedia
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}