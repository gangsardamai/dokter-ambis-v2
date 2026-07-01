export default function MateriDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { blok?: string };
}) {
  const materiData: Record<string, any> = {
    "1-1": {
      judul: "Anatomi Jantung",
      tipe: "Video",
      deskripsi: "Struktur jantung dan aliran darah",
    },
    "1-2": {
      judul: "Fisiologi Jantung",
      tipe: "PDF",
      deskripsi: "Cara kerja siklus jantung",
    },
    "1-3": {
      judul: "EKG Dasar",
      tipe: "Video",
      deskripsi: "Interpretasi EKG dasar",
    },
    "2-1": {
      judul: "Anatomi Paru",
      tipe: "Video",
      deskripsi: "Struktur sistem respirasi",
    },
  };

  const materi = materiData[params.id];

  if (!materi) {
    return <div style={{ padding: 24 }}>Materi tidak ditemukan</div>;
  }

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
      <p style={{ color: "#666" }}>
        Blok ID: {searchParams.blok}
      </p>

      <h1 style={{ fontSize: 28, fontWeight: "bold" }}>
        {materi.judul}
      </h1>

      <p style={{ marginTop: 10 }}>{materi.deskripsi}</p>

      <hr style={{ margin: "20px 0" }} />

      {materi.tipe === "Video" && (
        <div>
          <iframe
            width="100%"
            height="400"
            src="https://www.youtube.com/embed/dQw4w9WgXcQ"
            style={{ borderRadius: 12 }}
          />
        </div>
      )}

      {materi.tipe === "PDF" && (
        <div style={{ padding: 20, border: "1px solid #ddd" }}>
          <p>PDF Material</p>
          <button>Buka PDF</button>
        </div>
      )}
    </div>
  );
}