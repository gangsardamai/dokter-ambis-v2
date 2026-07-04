export default function BlokPage() {
  const courseList = [
    {
      id: 1,
      title: "Blok Kardiovaskular",
      organization: "Universitas Indonesia",
      mentor: "Dr. A",
      totalLessons: 32,
      status: "active",
      price: "Rp 499.000",
    },
    {
      id: 2,
      title: "Blok Respirasi",
      organization: "Universitas Gadjah Mada",
      mentor: "Dr. B",
      totalLessons: 28,
      status: "active",
      price: "Rp 399.000",
    },
    {
      id: 3,
      title: "Blok Neurologi",
      organization: "Universitas Airlangga",
      mentor: "Dr. C",
      totalLessons: 35,
      status: "coming_soon",
      price: "Rp 599.000",
    },
  ];

  return (
    <div style={{ padding: 24, maxWidth: 1000, margin: "0 auto" }}>
      <h1 style={{ fontSize: 28, fontWeight: "bold" }}>
        Program Blok
      </h1>

      <p style={{ color: "#666", marginTop: 8 }}>
        Pilih blok pembelajaran sesuai universitas kamu
      </p>

      <div style={{ marginTop: 24, display: "grid", gap: 16 }}>
        {courseList.map((course) => (
          <div
            key={course.id}
            style={{
              border: "1px solid #ddd",
              borderRadius: 12,
              padding: 16,
            }}
          >
            <h2 style={{ fontSize: 18, fontWeight: 600 }}>
              {course.title}
            </h2>

            <p style={{ marginTop: 6, color: "#555" }}>
              {course.organization}
            </p>

            <p style={{ marginTop: 6, color: "#555" }}>
              Mentor: {course.mentor}
            </p>

            <p style={{ marginTop: 6, color: "#555" }}>
              {course.totalLessons} materi
            </p>

            <div style={{ marginTop: 10, fontWeight: "bold" }}>
              {course.price}
            </div>

            <span
              style={{
                display: "inline-block",
                marginTop: 8,
                padding: "4px 10px",
                borderRadius: 8,
                fontSize: 12,
                background:
                  course.status === "active"
                    ? "#d1fae5"
                    : "#fef3c7",
                color:
                  course.status === "active"
                    ? "#065f46"
                    : "#92400e",
              }}
            >
              {course.status === "active"
                ? "Aktif"
                : "Segera Hadir"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}