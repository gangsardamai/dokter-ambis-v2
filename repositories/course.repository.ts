import type { Database } from "@/supabase/types/database.types";

import { BaseRepository } from "./base.repository";

type Course = Database["public"]["Tables"]["courses"]["Row"];
type CourseInsert = Database["public"]["Tables"]["courses"]["Insert"];
type CourseUpdate = Database["public"]["Tables"]["courses"]["Update"];
type CourseStatus = Database["public"]["Enums"]["course_status"];

type OrganizationSummary = Pick<
  Database["public"]["Tables"]["organizations"]["Row"],
  "id" | "title" | "short_name" | "slug" | "status" | "is_general"
>;

type ProgramSummary = Pick<
  Database["public"]["Tables"]["programs"]["Row"],
  "id" | "title" | "slug" | "status" | "organization_id"
>;

export type CourseDetails = Course & {
  organization: OrganizationSummary | null;
  program: ProgramSummary | null;
};

export type CourseSort = "newest" | "oldest" | "title_asc" | "title_desc";
export type CoursePriceFilter = "all" | "free" | "paid";

export interface CourseListFilters {
  q?: string;
  organizationId?: string;
  programId?: string;
  status?: CourseStatus;
  price?: CoursePriceFilter;
  sort?: CourseSort;
  page?: number;
  perPage?: number;
}

export interface PaginatedCourses {
  data: CourseDetails[];
  total: number;
  page: number;
  perPage: number;
}

const COURSE_DETAIL_SELECT = `
  *,
  organization:organizations!fk_courses_organization (
    id,
    title,
    short_name,
    slug,
    status,
    is_general
  ),
  program:programs!fk_courses_program (
    id,
    title,
    slug,
    status,
    organization_id
  )
`;

export class CourseRepository extends BaseRepository {
  async getAll(): Promise<Course[]> {
    const supabase = await this.db();
    const { data, error } = await supabase.from("courses").select("*").order("title");
    if (error) this.handleError(error);
    return data ?? [];
  }

  async getList(filters: CourseListFilters): Promise<PaginatedCourses> {
    const supabase = await this.db();
    const requestedPage = filters.page ?? 1;
    const requestedPerPage = filters.perPage ?? 14;
    const page = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
    const perPage = Number.isInteger(requestedPerPage)
      ? Math.max(1, Math.min(requestedPerPage, 14))
      : 14;
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;

    let query = supabase
      .from("courses")
      .select(COURSE_DETAIL_SELECT, { count: "exact" });

    if (filters.organizationId) query = query.eq("organization_id", filters.organizationId);
    if (filters.programId) query = query.eq("program_id", filters.programId);
    if (filters.status) query = query.eq("status", filters.status);
    if (filters.price === "free") query = query.eq("is_free", true);
    if (filters.price === "paid") query = query.eq("is_free", false).gt("price", 0);

    const q = filters.q?.trim();
    if (q) {
      const matchingCourseIds = await this.findSearchCourseIds(q);

      if (matchingCourseIds.length === 0) {
        return { data: [], total: 0, page, perPage };
      }

      query = query.in("id", matchingCourseIds);
    }

    if (filters.sort === "oldest") query = query.order("created_at", { ascending: true });
    else if (filters.sort === "title_asc") query = query.order("title", { ascending: true });
    else if (filters.sort === "title_desc") query = query.order("title", { ascending: false });
    else query = query.order("created_at", { ascending: false });

    const { data, error, count } = await query.range(from, to);
    if (error) this.handleError(error);

    return { data: (data ?? []) as CourseDetails[], total: count ?? 0, page, perPage };
  }

  private async findSearchCourseIds(q: string): Promise<string[]> {
    const supabase = await this.db();
    const escapedQuery = q.replace(/[\\%_]/g, (character) => `\\${character}`);
    const pattern = `%${escapedQuery}%`;

    const [
      courseTitleResult,
      courseSlugResult,
      organizationTitleResult,
      organizationShortNameResult,
      programTitleResult,
      programSlugResult,
    ] = await Promise.all([
      supabase.from("courses").select("id").ilike("title", pattern),
      supabase.from("courses").select("id").ilike("slug", pattern),
      supabase.from("organizations").select("id").ilike("title", pattern),
      supabase.from("organizations").select("id").ilike("short_name", pattern),
      supabase.from("programs").select("id").ilike("title", pattern),
      supabase.from("programs").select("id").ilike("slug", pattern),
    ]);

    const lookupResults = [
      courseTitleResult,
      courseSlugResult,
      organizationTitleResult,
      organizationShortNameResult,
      programTitleResult,
      programSlugResult,
    ];

    for (const result of lookupResults) {
      if (result.error) this.handleError(result.error);
    }

    const courseIds = new Set<string>([
      ...(courseTitleResult.data ?? []).map((item) => item.id),
      ...(courseSlugResult.data ?? []).map((item) => item.id),
    ]);
    const organizationIds = Array.from(new Set([
      ...(organizationTitleResult.data ?? []).map((item) => item.id),
      ...(organizationShortNameResult.data ?? []).map((item) => item.id),
    ]));
    const programIds = Array.from(new Set([
      ...(programTitleResult.data ?? []).map((item) => item.id),
      ...(programSlugResult.data ?? []).map((item) => item.id),
    ]));

    if (organizationIds.length > 0) {
      const { data, error } = await supabase
        .from("courses")
        .select("id")
        .in("organization_id", organizationIds);

      if (error) this.handleError(error);
      for (const item of data ?? []) courseIds.add(item.id);
    }

    if (programIds.length > 0) {
      const { data, error } = await supabase
        .from("courses")
        .select("id")
        .in("program_id", programIds);

      if (error) this.handleError(error);
      for (const item of data ?? []) courseIds.add(item.id);
    }

    return Array.from(courseIds);
  }

  async getAvailableCourses(): Promise<Course[]> {
    const supabase = await this.db();
    const { data, error } = await supabase.from("courses").select("*").eq("status", "active").order("title");
    if (error) this.handleError(error);
    return data ?? [];
  }

  async getAvailableCourseDetails(): Promise<CourseDetails[]> {
    const supabase = await this.db();
    const { data, error } = await supabase.from("courses").select(COURSE_DETAIL_SELECT).eq("status", "active").order("title");
    if (error) this.handleError(error);
    return (data ?? []) as CourseDetails[];
  }

  async getAvailableCourseDetailById(id: string): Promise<CourseDetails | null> {
    const supabase = await this.db();
    const { data, error } = await supabase.from("courses").select(COURSE_DETAIL_SELECT).eq("id", id).eq("status", "active").maybeSingle();
    if (error) this.handleError(error);
    return data as CourseDetails | null;
  }

  async getById(id: string): Promise<Course | null> {
    const supabase = await this.db();
    const { data, error } = await supabase.from("courses").select("*").eq("id", id).maybeSingle();
    if (error) this.handleError(error);
    return data;
  }

  async getBySlug(slug: string): Promise<Course | null> {
    const supabase = await this.db();
    const { data, error } = await supabase.from("courses").select("*").eq("slug", slug.toLowerCase()).maybeSingle();
    if (error) this.handleError(error);
    return data;
  }

  async getByOrganizationAndSlug(
    organizationId: string,
    slug: string,
  ): Promise<Course | null> {
    const supabase = await this.db();
    const { data, error } = await supabase
      .from("courses")
      .select("*")
      .eq("organization_id", organizationId)
      .eq("slug", slug.toLowerCase())
      .maybeSingle();

    if (error) this.handleError(error);
    return data;
  }

  async getByOrganization(organizationId: string): Promise<Course[]> {
    const supabase = await this.db();
    const { data, error } = await supabase.from("courses").select("*").eq("organization_id", organizationId).order("title");
    if (error) this.handleError(error);
    return data ?? [];
  }

  async findByOrganizationAndSlug(organizationId: string, slug: string, excludeId?: string): Promise<Course | null> {
    const supabase = await this.db();
    let query = supabase.from("courses").select("*").eq("organization_id", organizationId).eq("slug", slug.toLowerCase()).limit(1);
    if (excludeId) query = query.neq("id", excludeId);
    const { data, error } = await query.maybeSingle();
    if (error) this.handleError(error);
    return data;
  }

  async count(): Promise<number> {
    const supabase = await this.db();
    const { count, error } = await supabase.from("courses").select("*", { count: "exact", head: true });
    if (error) this.handleError(error);
    return count ?? 0;
  }

  async create(data: CourseInsert): Promise<Course> {
    const supabase = await this.db();
    const { data: created, error } = await supabase.from("courses").insert({ ...data, slug: data.slug.toLowerCase() }).select().single();
    if (error) this.handleError(error);
    return created;
  }

  async update(id: string, data: CourseUpdate): Promise<Course> {
    const supabase = await this.db();
    const payload = data.slug ? { ...data, slug: data.slug.toLowerCase() } : data;
    const { data: updated, error } = await supabase.from("courses").update(payload).eq("id", id).select().single();
    if (error) this.handleError(error);
    return updated;
  }

  async delete(id: string): Promise<void> {
    const supabase = await this.db();
    const { error } = await supabase.from("courses").delete().eq("id", id);
    if (error) this.handleError(error);
  }
}

export const courseRepository = new CourseRepository();
