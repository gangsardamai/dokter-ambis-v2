import Link from "next/link";

import { getLeaderPermissionForHref } from "@/lib/leader-access";
import {
  courseService,
  enrollmentService,
  leaderAccessService,
  organizationService,
  paymentService,
  profileService,
} from "@/services";

export const dynamic = "force-dynamic";

const quickActions = [
  {
    title: "Kelola Enrollment",
    description: "Tinjau pendaftaran dan status akses peserta.",
    href: "/dashboard/admin/enrollment",
  },
  {
    title: "Tambah Universitas",
    description: "Daftarkan kampus baru ke ekosistem DokterAmbis.",
    href: "/dashboard/admin/organization/create",
  },
  {
    title: "Tambah Program",
    description: "Buat program pembelajaran untuk universitas dalam scope.",
    href: "/dashboard/admin/program/create",
  },
  {
    title: "Tambah Course",
    description: "Susun course baru dan hubungkan dengan program.",
    href: "/dashboard/admin/course/create",
  },
];

export default async function AdminDashboardPage() {
  const profile = await profileService.getCurrentProfile();
  if (!profile) return null;

  const isAdmin = profile.role === "admin";
  const leaderPermissions =
    profile.role === "leader"
      ? await leaderAccessService.getEnabledPermissions(profile.id)
      : [];
  const permissionSet = new Set(leaderPermissions);

  const [
    organizationCount,
    courseCount,
    activeEnrollmentCount,
    pendingEnrollmentCount,
  ] = await Promise.all([
    isAdmin || permissionSet.has("manage_master_data") ? organizationService.countUniversities() : Promise.resolve(0),
    isAdmin || permissionSet.has("manage_master_data") ? courseService.countCourses() : Promise.resolve(0),
    isAdmin || permissionSet.has("manage_enrollment") ? enrollmentService.countEnrollmentsByStatus("active") : Promise.resolve(0),
    isAdmin || permissionSet.has("manage_enrollment") ? enrollmentService.countEnrollmentsByStatus("pending_approval") : Promise.resolve(0),
  ]);

  const adminOnlyStats = isAdmin
    ? await Promise.all([
        profileService.countProfilesByRole("student"),
        paymentService.countPaymentsByStatus("pending"),
      ])
    : null;

  const stats = [
    { label: "Universitas", value: organizationCount },
    { label: "Total Course", value: courseCount },
    { label: "Enrollment Aktif", value: activeEnrollmentCount },
    { label: "Enrollment Menunggu", value: pendingEnrollmentCount },
    ...(adminOnlyStats
      ? [
          { label: "Mahasiswa", value: adminOnlyStats[0] },
          { label: "Pembayaran Menunggu", value: adminOnlyStats[1] },
        ]
      : []),
  ];

  const visibleActions = quickActions.filter((action) => {
    if (isAdmin) return true;
    const permission = getLeaderPermissionForHref(action.href);
    return permission ? permissionSet.has(permission) : false;
  });

  return (
    <main className="w-full max-w-full overflow-x-hidden px-4 py-6 sm:px-6 lg:px-8">
      <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#1769cf] via-[#033b63] to-[#061827] p-6 text-white shadow-[0_24px_70px_rgba(3,59,99,0.22)] sm:p-8">
        <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full border-[42px] border-white/5" />
        <div className="absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-cyan-300/10 blur-3xl" />
        <div className="relative max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-100/80">
            {isAdmin ? "Admin Console" : "Leader Console"}
          </p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-[-0.045em] sm:text-4xl">
            Dashboard {isAdmin ? "Admin" : "Leader"} DokterAmbis
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-blue-50/85 sm:text-base">
            {isAdmin
              ? "Pantau operasional pembelajaran, master data, dan enrollment dari satu ruang kerja yang rapi."
              : "Data pada dashboard ini otomatis dibatasi sesuai scope dan permission yang diberikan Admin."}
          </p>
        </div>
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {stats.map((item) => (
          <div
            key={item.label}
            className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm"
          >
            <p className="text-sm font-semibold text-slate-500">{item.label}</p>
            <p className="mt-3 text-3xl font-extrabold tracking-[-0.04em] text-[#061827]">
              {item.value.toLocaleString("id-ID")}
            </p>
          </div>
        ))}
      </section>

      {visibleActions.length > 0 && (
        <section className="mt-8">
          <div className="mb-4">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#1769cf]">
              Akses Cepat
            </p>
            <h2 className="mt-2 text-2xl font-extrabold tracking-[-0.04em] text-[#061827]">
              {isAdmin ? "Jalankan tugas admin utama" : "Jalankan tugas Leader"}
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {visibleActions.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                prefetch={false}
                className="group rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-950/10"
              >
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-blue-50 text-[#1769cf] transition group-hover:bg-gradient-to-br group-hover:from-[#1769cf] group-hover:to-[#033b63] group-hover:text-white">
                  →
                </span>
                <h3 className="mt-5 text-lg font-extrabold tracking-[-0.03em] text-[#061827]">
                  {action.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {action.description}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
