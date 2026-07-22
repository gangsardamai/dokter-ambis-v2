import Link from "next/link";

import { PageHeader, PrimaryButton } from "@/components/admin";
import CourseTable from "@/components/admin/course/CourseTable";
import { courseService, organizationService, programService } from "@/services";
import type { CoursePriceFilter, CourseSort } from "@/repositories/course.repository";
import type { Database } from "@/supabase/types/database.types";

type CourseStatus = Database["public"]["Enums"]["course_status"];

interface CoursePageProps { searchParams: Promise<Record<string, string | string[] | undefined>>; }

function valueOf(params: Record<string, string | string[] | undefined>, key: string) {
  const value = params[key];
  return Array.isArray(value) ? value[0] : value;
}

function hrefWith(params: URLSearchParams, updates: Record<string, string | null>) {
  const next = new URLSearchParams(params);
  Object.entries(updates).forEach(([key, value]) => {
    if (!value) next.delete(key);
    else next.set(key, value);
  });
  return `/dashboard/admin/course?${next.toString()}`;
}

export default async function CoursePage({ searchParams }: CoursePageProps) {
  const rawParams = await searchParams;
  const q = valueOf(rawParams, "q") ?? "";
  const organization = valueOf(rawParams, "organization") ?? "";
  const program = valueOf(rawParams, "program") ?? "";
  const status = valueOf(rawParams, "status") as CourseStatus | undefined;
  const price = (valueOf(rawParams, "price") ?? "all") as CoursePriceFilter;
  const sort = (valueOf(rawParams, "sort") ?? "newest") as CourseSort;
  const page = Number(valueOf(rawParams, "page") ?? 1);

  const [organizations, programs, result] = await Promise.all([
    organizationService.getOrganizations(),
    programService.getPrograms(),
    courseService.getCourseList({ q, organizationId: organization || undefined, programId: program || undefined, status, price, sort, page, perPage: 14 }),
  ]);

  const currentParams = new URLSearchParams();
  Object.entries(rawParams).forEach(([key, value]) => {
    if (typeof value === "string") currentParams.set(key, value);
  });
  const totalPages = Math.max(Math.ceil(result.total / result.perPage), 1);
  const programChoices = organization ? programs.filter((item) => item.organization_id === organization) : programs;

  return (
    <main className="mx-auto w-full max-w-7xl space-y-8 p-4 sm:p-6 lg:p-8">
      <PageHeader title="Blok Pembelajaran" description="Kelola seluruh blok pembelajaran." actions={<PrimaryButton href="/dashboard/admin/course/create" className="w-full sm:w-auto">+ Tambah Blok</PrimaryButton>} />

      <form className="grid gap-3 rounded-3xl border border-blue-100 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-6">
        <input name="q" defaultValue={q} placeholder="Cari course, slug, organization, program" className="min-w-0 rounded-xl border border-slate-200 px-4 py-2 text-sm lg:col-span-2" />
        <select name="organization" defaultValue={organization} className="min-w-0 rounded-xl border border-slate-200 px-4 py-2 text-sm">
          <option value="">Semua Organization</option>
          {organizations.map((item) => <option key={item.id} value={item.id}>{item.is_general ? "Umum / Nasional" : item.title}</option>)}
        </select>
        <select name="program" defaultValue={program} className="min-w-0 rounded-xl border border-slate-200 px-4 py-2 text-sm">
          <option value="">Semua Program</option>
          {programChoices.map((item) => <option key={item.id} value={item.id}>{organization ? item.title : `${organizations.find((org) => org.id === item.organization_id)?.short_name ?? "Org"} — ${item.title}`}</option>)}
        </select>
        <select name="status" defaultValue={status ?? ""} className="min-w-0 rounded-xl border border-slate-200 px-4 py-2 text-sm">
          <option value="">Semua Status</option>
          <option value="active">Active</option>
          <option value="draft">Draft</option>
        </select>
        <select name="price" defaultValue={price} className="min-w-0 rounded-xl border border-slate-200 px-4 py-2 text-sm">
          <option value="all">Semua Harga</option>
          <option value="free">Gratis</option>
          <option value="paid">Berbayar</option>
        </select>
        <select name="sort" defaultValue={sort} className="min-w-0 rounded-xl border border-slate-200 px-4 py-2 text-sm">
          <option value="newest">Terbaru</option>
          <option value="oldest">Terlama</option>
          <option value="title_asc">Nama A–Z</option>
          <option value="title_desc">Nama Z–A</option>
        </select>
        <input type="hidden" name="page" value="1" />
        <button className="rounded-xl bg-[#1769cf] px-4 py-2 text-sm font-bold text-white lg:col-span-6">Terapkan Filter</button>
      </form>

      <div className="flex flex-wrap items-center justify-between gap-3 text-sm font-bold text-slate-600">
        <p>{result.total.toLocaleString("id-ID")} course ditemukan</p>
        <div className="flex gap-2">
          <Link aria-disabled={result.page <= 1} href={hrefWith(currentParams, { page: String(Math.max(result.page - 1, 1)) })} className="rounded-xl border border-slate-200 px-4 py-2 aria-disabled:pointer-events-none aria-disabled:opacity-50">Sebelumnya</Link>
          <Link aria-disabled={result.page >= totalPages} href={hrefWith(currentParams, { page: String(Math.min(result.page + 1, totalPages)) })} className="rounded-xl border border-slate-200 px-4 py-2 aria-disabled:pointer-events-none aria-disabled:opacity-50">Berikutnya</Link>
        </div>
      </div>

      <CourseTable courses={result.data} />
    </main>
  );
}
