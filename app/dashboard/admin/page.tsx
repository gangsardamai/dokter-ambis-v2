import Link from "next/link";

import {
  courseService,
  enrollmentService,
  organizationService,
  paymentService,
  profileService,
} from "@/services";

const statisticCards = [
  {
    label: "Universitas",
    valueKey: "organizationCount",
    href: "/dashboard/admin/organization",
  },
  {
    label: "Total Course",
    valueKey: "courseCount",
    href: "/dashboard/admin/course",
  },
  {
    label: "Mahasiswa",
    valueKey: "studentCount",
    href: "/dashboard/admin/enrollment",
  },
  {
    label: "Enrollment Aktif",
    valueKey: "activeEnrollmentCount",
    href: "/dashboard/admin/enrollment",
  },
  {
    label: "Enrollment Menunggu",
    valueKey: "pendingApprovalEnrollmentCount",
    href: "/dashboard/admin/enrollment",
  },
  {
    label: "Pembayaran Menunggu",
    valueKey: "pendingPaymentCount",
    href: "/dashboard/admin/enrollment",
  },
] as const;

type StatisticValueKey = (typeof statisticCards)[number]["valueKey"];

type StatisticValues = Record<StatisticValueKey, number>;

export default async function AdminDashboardPage() {
  const [
    organizationCount,
    courseCount,
    studentCount,
    activeEnrollmentCount,
    pendingApprovalEnrollmentCount,
    pendingPaymentCount,
  ] = await Promise.all([
    organizationService.countOrganizations(),
    courseService.countCourses(),
    profileService.countProfilesByRole("student"),
    enrollmentService.countEnrollmentsByStatus("active"),
    enrollmentService.countEnrollmentsByStatus("pending_approval"),
    paymentService.countPaymentsByStatus("pending"),
  ]);

  const statisticValues: StatisticValues = {
    organizationCount,
    courseCount,
    studentCount,
    activeEnrollmentCount,
    pendingApprovalEnrollmentCount,
    pendingPaymentCount,
  };

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Dashboard Admin</h1>
        <p className="text-gray-500">
          Selamat datang di Dashboard Admin Dokter Ambis.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {statisticCards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
          >
            <p className="text-sm font-medium text-gray-500">{card.label}</p>
            <p className="mt-3 text-3xl font-bold text-gray-950">
              {statisticValues[card.valueKey].toLocaleString("id-ID")}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
