import Link from "next/link";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function BlokByUniversitas({
  params,
}: PageProps) {
  const { id } = await params;

  const organizationCourses: Record<string, any> = {
    ui: {
      title: "Universitas Indonesia",
      courses: [
        {
          id: 1,
          title: "Blok Kardiovaskular",
          totalLessons: 32,
        },
        {
          id: 2,
          title: "Blok Respirasi",
          totalLessons: 28,
        },
      ],
    },

    ugm: {
      title: "Universitas Gadjah Mada",
      courses: [
        {
          id: 3,
          title: "Blok Neurologi",
          totalLessons: 35,
        },
      ],
    },

    unair: {
      title: "Universitas Airlangga",
      courses: [
        {
          id: 4,
          title: "Blok Gastrointestinal",
          totalLessons: 30,
        },
      ],
    },
  };

  const organization = organizationCourses[id];

  if (!organization) {
    return (
      <div style={{ padding: 24 }}>
        Universitas tidak ditemukan
      </div>
    );
  }

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
        {organization.title}
      </h1>

      <p
        style={{
          color: "#666",
          marginTop: 6,
        }}
      >
        Pilih blok pembelajaran
      </p>

      <div
        style={{
          marginTop: 24,
          display: "grid",
          gap: 16,
        }}
      >
        {organization.courses.map((course: any) => (
          <Link
            key={course.id}
            href={`/blok/${course.id}`}
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
              {course.title}
            </h2>

            <p
              style={{
                marginTop: 6,
                color: "#555",
              }}
            >
              {course.totalLessons} materi
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}