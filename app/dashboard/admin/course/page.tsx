import Link from "next/link";

import { PageHeader, PrimaryButton } from "@/components/admin";
import CourseTable from "@/components/admin/course/CourseTable";
import { courseService, organizationService, programService } from "@/services";
import type { CoursePriceFilter, CourseSort } from "@/repositories/course.repository";
import type { Database } from "@/supabase/types/database.types";

type CourseStatus = Database["public"]["Enums"]["course_status"];

const COURSE_STATUSES: CourseStatus[] = ["active", "draft", "archived"];
const PRICE_FILTERS: CoursePriceFilter[] = ["all", "free", "paid"];
const COURSE_SORTS: CourseSort[] = ["newest", "oldest", "title_asc", "title_desc"];

function allowedValue<T extends string>(value: string | undefined, allowed: T[]): T | undefined {
  return value && allowed.includes(value as T) ? value as T : undefined;
}

function positiveInteger(value: string | undefined) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
}

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
  const q = (valueOf(rawParams, "q") ?? "").trim();
  const requestedOrganization = valueOf(rawParams, "organization") ?? "";
  const requestedProgram = valueOf(rawParams, "program") ?? "";
  const status = allowedValue(valueOf(rawParams, "status"), COURSE_STATUSES);
  const price = allowedValue(valueOf(rawParams, "price"), PRICE_FILTERS) ?? "all";
  const sort = allowedValue(valueOf(rawParams, "sort"), COURSE_SORTS) ?? "newest";
  const page = positiveInteger(valueOf(rawParams, "page"));

  const [organizations, programs] = await Promise.all([
    organizationService.getOrganizations(),
    programService.getPrograms(),
  ]);

  const organization = organizations.some((item) => item.id === requestedOrganization)
    ? requestedOrganization
    : "";
  const selectedProgram = programs.find((item) => item.id === requestedProgram);
  const program = selectedProgram && (!organization || selectedProgram.organization_id === organization)
    ? selectedProgram.id
    : "";

  const result = await courseService.getCourseList({
    q,
    organizationId: organization || undefined,
    programId: program || undefined,
    status,
    price,
    sort,
    page,
    perPage: 14,
  });

  const currentParams = new URLSearchParams();
  if (q) currentParams.set("q", q);
  if (organization) currentParams.set("organization", organization);
  if (program) currentParams.set("program", program);
  if (status) currentParams.set("status", status);
  if (price !== "all") currentParams.set("price", price);
  if (sort !== "newest") currentParams.set("sort", sort);
  currentParams.set("page", String(result.page));

  const totalPages = Math.max(Math.ceil(result.total / result.perPage), 1);
  const programChoices = organization
    ? programs.filter((item) => item.organization_id === organization)
    : programs;

  return (
    <main className="mx-auto w-full max-w-7xl space-y-8 p-4 sm:p-6 lg:p-8">
      <PageHeader title="Blok Pembelajaran" description="Kelola seluruh blok pembelajaran." actions={<PrimaryButton href="/dashboard/admin/course/create" className="w-full sm:w-auto">+ Tambah Blok</PrimaryButton>} />

      <form className="grid gap-3 rounded-3xl border border-blue-100 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-6">
        <input aria-label="Cari course" name="q" defaultValue={q} placeholder="Cari course, slug, organization, program" className="min-w-0 rounded-xl border border-slate-200 px-4 py-2 text-sm lg:col-span-2" />
        <select aria-label="Filter Organization" name="organization" defaultValue={organization} className="min-w-0 rounded-xl border border-slate-200 px-4 py-2 text-sm">
          <option value="">Semua Organization</option>
          {organizations.map((item) => <option key={item.id} value={item.id}>{item.is_general ? "Umum / Nasional" : item.title}</option>)}
        </select>
        <select aria-label="Filter Program" name="program" defaultValue={program} className="min-w-0 rounded-xl border border-slate-200 px-4 py-2 text-sm">
          <option value="">Semua Program</option>
          {programChoices.map((item) => <option key={item.id} value={item.id}>{organization ? item.title : `${organizations.find((org) => org.id === item.organization_id)?.short_name ?? "Org"} — ${item.title}`}</option>)}
        </select>
        <select aria-label="Filter Status" name="status" defaultValue={status ?? ""} className="min-w-0 rounded-xl border border-slate-200 px-4 py-2 text-sm">
          <option value="">Semua Status</option>
          <option value="active">Active</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </select>
        <select aria-label="Filter Harga" name="price" defaultValue={price} className="min-w-0 rounded-xl border border-slate-200 px-4 py-2 text-sm">
          <option value="all">Semua Harga</option>
          <option value="free">Gratis</option>
          <option value="paid">Berbayar</option>
        </select>
        <select aria-label="Urutkan Course" name="sort" defaultValue={sort} className="min-w-0 rounded-xl border border-slate-200 px-4 py-2 text-sm">
          <option value="newest">Terbaru</option>
          <option value="oldest">Terlama</option>
          <option value="title_asc">Nama A–Z</option>
          <option value="title_desc">Nama Z–A</option>
        </select>
        <input type="hidden" name="page" value="1" />
        <button className="rounded-xl bg-[#1769cf] px-4 py-2 text-sm font-bold text-white lg:col-span-6">Terapkan Filter</button>
      </form>

      <div className="flex flex-wrap items-center justify-between gap-3 text-sm font-bold text-slate-600">
        <p>
          {result.total.toLocaleString("id-ID")} course ditemukan · Halaman {result.page} dari {totalPages}
        </p>
        <div className="flex gap-2">
          <Link aria-disabled={result.page <= 1} href={hrefWith(currentParams, { page: String(Math.max(result.page - 1, 1)) })} className="rounded-xl border border-slate-200 px-4 py-2 aria-disabled:pointer-events-none aria-disabled:opacity-50">Sebelumnya</Link>
          <Link aria-disabled={result.page >= totalPages} href={hrefWith(currentParams, { page: String(Math.min(result.page + 1, totalPages)) })} className="rounded-xl border border-slate-200 px-4 py-2 aria-disabled:pointer-events-none aria-disabled:opacity-50">Berikutnya</Link>
        </div>
      </div>

      <CourseTable courses={result.data} />
    </main>
  );
}
