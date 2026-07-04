import Link from "next/link";

const courseData: Record<string, any> = {
  "1": {
    title: "Blok Kardiovaskular",
    lessons: [
      { id: "1-1", title: "Anatomi Jantung" },
      { id: "1-2", title: "Fisiologi Jantung" },
      { id: "1-3", title: "EKG Dasar" },
    ],
  },
  "2": {
    title: "Blok Respirasi",
    lessons: [
      { id: "2-1", title: "Anatomi Paru" },
      { id: "2-2", title: "Ventilasi & Perfusi" },
    ],
  },
};

export default function BlokDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const course = courseData[params.id];

  if (!course) {
    return (
      <div style={{ padding: 24 }}>
        Blok tidak ditemukan
      </div>
    );
  }

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ fontSize: 28, fontWeight: "bold" }}>
        {course.title}
      </h1>

      <p style={{ color: "#666", marginTop: 6 }}>
        Daftar materi pembelajaran
      </p>

      <div style={{ marginTop: 24, display: "grid", gap: 12 }}>
        {course.lessons.map((lesson: any) => (
          <Link
            key={lesson.id}
            href={`/materi/${lesson.id}?course=${params.id}`}
            style={{
              border: "1px solid #ddd",
              padding: 14,
              borderRadius: 10,
              display: "block",
              textDecoration: "none",
              color: "inherit",
            }}
          >
            {lesson.title}
          </Link>
        ))}
      </div>
    </div>
  );
}