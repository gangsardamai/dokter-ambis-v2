import Link from "next/link";

const blokData: Record<string, any> = {
  "1": {
    nama: "Blok Kardiovaskular",
    materi: [
      { id: "1-1", judul: "Anatomi Jantung" },
      { id: "1-2", judul: "Fisiologi Jantung" },
      { id: "1-3", judul: "EKG Dasar" },
    ],
  },
  "2": {
    nama: "Blok Respirasi",
    materi: [
      { id: "2-1", judul: "Anatomi Paru" },
      { id: "2-2", judul: "Ventilasi & Perfusi" },
    ],
  },
};

export default function BlokDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const blok = blokData[params.id];

  if (!blok) {
    return <div style={{ padding: 24 }}>Blok tidak ditemukan</div>;
  }

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ fontSize: 28, fontWeight: "bold" }}>
        {blok.nama}
      </h1>

      <p style={{ color: "#666", marginTop: 6 }}>
        Daftar materi pembelajaran
      </p>

      <div style={{ marginTop: 24, display: "grid", gap: 12 }}>
        {blok.materi.map((m: any) => (
          <Link
            key={m.id}
            href={`/materi/${m.id}?blok=${params.id}`}
            style={{
              border: "1px solid #ddd",
              padding: 14,
              borderRadius: 10,
              display: "block",
              textDecoration: "none",
              color: "inherit",
            }}
          >
            {m.judul}
          </Link>
        ))}
      </div>
    </div>
  );
}