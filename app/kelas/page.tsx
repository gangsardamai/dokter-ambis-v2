import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";
import PublicCourseCatalog, {
  type PublicCourseCatalogItem,
  type PublicOrganizationOption,
} from "@/components/public/PublicCourseCatalog";
import {
  authService,
  courseService,
  enrollmentService,
  organizationService,
  profileService,
} from "@/services";

export const dynamic = "force-dynamic";

interface PublicClassCatalogPageProps {
  searchParams: Promise<{
    organization?: string | string[];
  }>;
}

function getParamValue(
  value: string | string[] | undefined,
): string {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

function formatRupiah(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

export default async function PublicClassCatalogPage({
  searchParams,
}: PublicClassCatalogPageProps) {
  const [
    params,
    authenticated,
    availableCourses,
    activeOrganizations,
  ] = await Promise.all([
    searchParams,
    authService.isAuthenticated(),
    courseService.getAvailableCourseDetails(),
    organizationService.getActiveOrganizations(),
  ]);

  const profile = authenticated
    ? await profileService.getCurrentProfile()
    : null;
  const activeEnrollments =
    profile?.role === "student"
      ? await enrollmentService.getActiveCourseEnrollments(profile.id)
      : [];
  const ownedCourseIds = new Set(
    activeEnrollments.map((enrollment) => enrollment.course_id),
  );

  const courses: PublicCourseCatalogItem[] = availableCourses
    .filter(
      (course) =>
        course.organization?.status === "active" &&
        course.program?.status === "active",
    )
    .slice()
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() -
        new Date(a.created_at).getTime(),
    )
    .map((course) => {
      const owned = ownedCourseIds.has(course.id);
      let actionHref = `/kelas/${course.id}`;
      let actionLabel = "Lihat Detail";

      if (!profile) {
        const nextPath = `/dashboard/student/course/${course.id}`;
        actionHref = `/login?next=${encodeURIComponent(nextPath)}`;
        actionLabel = "Daftar";
      } else if (profile.role === "student") {
        actionHref = owned
          ? `/dashboard/student/my-course/${course.id}`
          : `/dashboard/student/course/${course.id}`;
        actionLabel = owned ? "Buka Course" : "Daftar";
      }

      return {
        id: course.id,
        title: course.title,
        description: course.description,
        organizationTitle:
          course.organization?.title ?? "Organization belum tersedia",
        organizationShortName:
          course.organization?.short_name ?? null,
        organizationSlug: course.organization?.slug ?? "",
        programTitle:
          course.program?.title ?? "Program belum tersedia",
        priceLabel: course.is_free
          ? "Gratis"
          : formatRupiah(Number(course.price)),
        createdAt: course.created_at,
        actionHref,
        actionLabel,
        owned,
      };
    });

  const organizationOptions: PublicOrganizationOption[] =
    activeOrganizations.map((organization) => ({
      slug: organization.slug,
      title: organization.title,
      shortName: organization.short_name,
      isGeneral: organization.is_general,
    }));

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#f5f8fd] pb-20 pt-28 sm:pt-32">
        <div className="mx-auto w-full max-w-7xl space-y-8 px-4 sm:px-6">
          <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#1769cf] via-[#0b5ba5] to-[#033b63] p-6 text-white shadow-xl shadow-blue-950/10 sm:p-9">
            <div className="absolute -right-16 -top-20 h-60 w-60 rounded-full bg-cyan-300/20 blur-3xl" />
            <div className="absolute -bottom-24 left-1/3 h-52 w-52 rounded-full bg-white/10 blur-3xl" />

            <div className="relative max-w-3xl">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-100">
                Katalog Publik DokterAmbis
              </p>
              <h1 className="mt-3 text-3xl font-black tracking-[-0.04em] sm:text-5xl">
                Temukan Kelas yang Sesuai dengan Targetmu
              </h1>
              <p className="mt-4 text-sm leading-7 text-blue-100 sm:text-base">
                Jelajahi kelas universitas, kepenulisan ilmiah,
                UKNPDPD, dan program umum lainnya. Semua kelas disusun
                berdasarkan urutan terbaru.
              </p>
            </div>
          </section>

          <PublicCourseCatalog
            courses={courses}
            organizationOptions={organizationOptions}
            initialOrganizationSlug={getParamValue(
              params.organization,
            )}
          />
        </div>
      </main>

      <Footer />
    </>
  );
}
