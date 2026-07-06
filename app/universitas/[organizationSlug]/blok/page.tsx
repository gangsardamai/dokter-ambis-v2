import Link from "next/link";
import { notFound } from "next/navigation";

import {
  organizationService,
  courseService,
} from "@/services";

type PageProps = {
  params: Promise<{
    organizationSlug: string;
  }>;
};

export default async function BlokByUniversitas({
  params,
}: PageProps) {
  const { organizationSlug } = await params;

  const organization =
    await organizationService.getOrganizationBySlug(
      organizationSlug
    );

  if (!organization) {
    notFound();
  }

  const courses =
    await courseService.getCoursesByOrganization(
      organization.id
    );

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
        {courses.length === 0 && (
          <p>
            Belum ada blok pembelajaran.
          </p>
        )}

        {courses.map((course) => (
          <Link
            key={course.id}
            href={`/universitas/${organization.slug}/blok/${course.slug}`}
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
              {course.status}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}