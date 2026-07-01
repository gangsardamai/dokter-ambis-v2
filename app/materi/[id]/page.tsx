    export default function MateriDetailPage({ params }: { params: { id: string } }) {
  const materiData: Record<string, any> = {
    "1": {
      judul: "Anatomi Jantung",
      blok: "Blok Kardiovaskular",
      tipe: "Video",
      deskripsi: "Pembahasan struktur jantung, atrium, ventrikel, dan aliran darah.",
      videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    },
    "2": {
      judul: "Fisiologi Jantung",
      blok: "Blok Kardiovaskular",
      tipe: "PDF",
      deskripsi: "Mekanisme kerja jantung dan siklus kardiak.",
    },
    "3": {
      judul: "EKG Dasar",
      blok: "Blok Kardiovaskular",
      tipe: "Video",
      deskripsi: "Interpretasi dasar EKG 12 lead.",
      videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    },
  };

  const materi = materiData[params.id];

  if (!materi) {
    return (
      <div style={{ padding: 24 }}>
        <h1>Materi tidak ditemukan</h1>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ fontSize: 28, fontWeight: "bold" }}>
        {materi.judul}
      </h1>

      <p style={{ color: "#666", marginTop: 6 }}>
        {materi.blok}
      </p>

      <p style={{ marginTop: 10 }}>
        {materi.deskripsi}
      </p>

      <hr style={{ margin: "20px 0" }} />

      {/* CONTENT AREA */}
      {materi.tipe === "Video" && (
        <div>
          <iframe
            width="100%"
            height="400"
            src={materi.videoUrl}
            title="video"
            style={{ borderRadius: 12 }}
            allowFullScreen
          />
        </div>
      )}

      {materi.tipe === "PDF" && (
        <div
          style={{
            border: "1px solid #ddd",
            padding: 20,
            borderRadius: 12,
            textAlign: "center",
          }}
        >
          <p>PDF Module</p>
          <button style={{ marginTop: 10, padding: "8px 12px" }}>
            Download / Buka PDF
          </button>
        </div>
      )}

      {/* ACTION BUTTON */}
      <div style={{ marginTop: 24 }}>
        <button
          style={{
            padding: "10px 16px",
            borderRadius: 8,
            border: "none",
            background: "#111",
            color: "#fff",
            cursor: "pointer",
          }}
        >
          Tandai Selesai
        </button>
      </div>
    </div>
  );
}