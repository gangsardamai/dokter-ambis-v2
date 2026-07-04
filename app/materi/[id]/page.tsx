export default function MateriDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { course?: string };
}) {
  const lessonData: Record<string, any> = {
    "1-1": {
      title: "Anatomi Jantung",
      type: "video",
      description: "Struktur jantung dan aliran darah",
    },
    "1-2": {
      title: "Fisiologi Jantung",
      type: "pdf",
      description: "Cara kerja siklus jantung",
    },
    "1-3": {
      title: "EKG Dasar",
      type: "video",
      description: "Interpretasi EKG dasar",
    },
    "2-1": {
      title: "Anatomi Paru",
      type: "video",
      description: "Struktur sistem respirasi",
    },
  };

  const lesson = lessonData[params.id];

  if (!lesson) {
    return (
      <div style={{ padding: 24 }}>
        Materi tidak ditemukan
      </div>
    );
  }

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
      <p style={{ color: "#666" }}>
        Course ID: {searchParams.course}
      </p>

      <h1 style={{ fontSize: 28, fontWeight: "bold" }}>
        {lesson.title}
      </h1>

      <p style={{ marginTop: 10 }}>
        {lesson.description}
      </p>

      <hr style={{ margin: "20px 0" }} />

      {lesson.type === "video" && (
        <div>
          <iframe
            width="100%"
            height="400"
            src="https://www.youtube.com/embed/dQw4w9WgXcQ"
            style={{ borderRadius: 12 }}
            allowFullScreen
          />
        </div>
      )}

      {lesson.type === "pdf" && (
        <div
          style={{
            padding: 20,
            border: "1px solid #ddd",
            borderRadius: 12,
          }}
        >
          <p>PDF Materi</p>
          <button>Buka PDF</button>
        </div>
      )}
    </div>
  );
}