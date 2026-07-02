import Link from "next/link";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function BlokByUniversitas({ params }: PageProps) {
  const { id } = await params;

  const dataBlok: Record<string, any> = {
    ui: {
      nama: "Universitas Indonesia",
      blok: [
        { id: 1, nama: "Blok Kardiovaskular", materi: 32 },
        { id: 2, nama: "Blok Respirasi", materi: 28 },
      ],
    },
    ugm: {
      nama: "Universitas Gadjah Mada",
      blok: [
        { id: 3, nama: "Blok Neurologi", materi: 35 },
      ],
    },
    ua: {
      nama: "Universitas Airlangga",
      blok: [
        { id: 4, nama: "Blok Gastrointestinal", materi: 30 },
      ],
    },
  };

  const universitas = dataBlok[id];

  if (!universitas) {
    return <div style={{ padding: 24 }}>Universitas tidak ditemukan</div>;
  }

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ fontSize: 28, fontWeight: "bold" }}>
        {universitas.nama}
      </h1>

      <p style={{ color: "#666", marginTop: 6 }}>
        Pilih blok pembelajaran
      </p>

      <div style={{ marginTop: 24, display: "grid", gap: 16 }}>
        {universitas.blok.map((b: any) => (
          <Link
            key={b.id}
            href={`/blok/${b.id}`}
            style={{
              border: "1px solid #ddd",
              padding: 16,
              borderRadius: 12,
              display: "block",
              textDecoration: "none",
              color: "inherit",
            }}
          >
            <h2 style={{ fontSize: 18, fontWeight: 600 }}>
              {b.nama}
            </h2>

            <p style={{ marginTop: 6, color: "#555" }}>
              {b.materi} materi
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}