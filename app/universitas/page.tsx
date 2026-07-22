import Link from "next/link";
import { organizationService } from "@/services";

export default async function UniversitasPage() {
  const organizations = await organizationService.getActiveUniversities();

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
            href={`/universitas/${organization.slug}/blok`}
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
              {organization.short_name}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}