import type { Database } from "@/supabase/types/database.extended.types";

import { BaseRepository } from "./base.repository";
import type {
  EnrollmentDetail,
  PaymentStatus,
} from "./enrollment.repository";

export type EnrollmentListSort =
  | "date_desc"
  | "date_asc"
  | "name_asc"
  | "name_desc";

export interface EnrollmentListFilters {
  q?: string;
  enrollmentStatus?: Database["public"]["Enums"]["enrollment_status"];
  paymentStatus?: PaymentStatus | "none";
  paymentTiming?: Database["public"]["Enums"]["payment_timing"];
  courseId?: string;
  programId?: string;
  sort?: EnrollmentListSort;
  page?: number;
}

export interface PaginatedEnrollments {
  data: EnrollmentDetail[];
  total: number;
  page: number;
  perPage: number;
}

const COURSE_RELATION_SELECT = `
  id,
  title,
  slug,
  price,
  status,
  payment_policy,
  organizations (
    id,
    title
  ),
  programs!fk_courses_program (
    id,
    title
  )
`;

const PAYMENT_RELATION_SELECT = `
  id,
  amount,
  status,
  payment_method,
  payment_proof_path,
  notes,
  paid_at,
  verified_at,
  verified_by,
  created_at
`;

export class EnrollmentListRepository extends BaseRepository {
  async getList(filters: EnrollmentListFilters): Promise<PaginatedEnrollments> {
    const supabase = await this.db();
    const requestedPage = filters.page ?? 1;
    const page = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
    const perPage = 20;
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;

    const paymentsSelect =
      filters.paymentStatus && filters.paymentStatus !== "none"
        ? `payments!inner (${PAYMENT_RELATION_SELECT})`
        : `payments (${PAYMENT_RELATION_SELECT})`;

    let query = supabase.from("enrollments").select(
      `
        *,
        profiles (
          id,
          full_name,
          phone,
          role,
          status
        ),
        courses (${COURSE_RELATION_SELECT}),
        ${paymentsSelect}
      `,
      { count: "exact" },
    );

    if (filters.enrollmentStatus) {
      query = query.eq("status", filters.enrollmentStatus);
    }

    if (filters.paymentTiming) {
      query = query.eq("payment_timing", filters.paymentTiming);
    }

    if (filters.courseId) {
      query = query.eq("course_id", filters.courseId);
    }

    if (filters.programId) {
      const courseIds = await this.getCourseIdsByProgram(filters.programId);
      if (courseIds.length === 0) {
        return { data: [], total: 0, page, perPage };
      }
      query = query.in("course_id", courseIds);
    }

    if (filters.paymentStatus === "none") {
      query = query.filter("payments", "is", "null");
    } else if (filters.paymentStatus) {
      query = query.eq("payments.status", filters.paymentStatus);
    }

    const q = filters.q?.trim();
    if (q) {
      const { profileIds, courseIds } = await this.findSearchTargets(q);
      const searchFilters: string[] = [];

      if (profileIds.length > 0) {
        searchFilters.push(`profile_id.in.(${profileIds.join(",")})`);
      }
      if (courseIds.length > 0) {
        searchFilters.push(`course_id.in.(${courseIds.join(",")})`);
      }

      if (searchFilters.length === 0) {
        return { data: [], total: 0, page, perPage };
      }

      query = query.or(searchFilters.join(","));
    }

    if (filters.sort === "date_asc") {
      query = query.order("enrolled_at", { ascending: true });
    } else if (filters.sort === "name_asc") {
      query = query.order("profiles(full_name)", { ascending: true });
    } else if (filters.sort === "name_desc") {
      query = query.order("profiles(full_name)", { ascending: false });
    } else {
      query = query.order("enrolled_at", { ascending: false });
    }

    query = query.order("id", { ascending: true });

    const { data, error, count } = await query.range(from, to);
    if (error) this.handleError(error);

    return {
      data: ((data ?? []) as unknown) as EnrollmentDetail[],
      total: count ?? 0,
      page,
      perPage,
    };
  }

  private async getCourseIdsByProgram(programId: string): Promise<string[]> {
    const supabase = await this.db();
    const { data, error } = await supabase
      .from("courses")
      .select("id")
      .eq("program_id", programId);

    if (error) this.handleError(error);
    return (data ?? []).map((item) => item.id);
  }

  private async findSearchTargets(q: string): Promise<{
    profileIds: string[];
    courseIds: string[];
  }> {
    const supabase = await this.db();
    const escapedQuery = q.replace(/[\\%_]/g, (character) => `\\${character}`);
    const pattern = `%${escapedQuery}%`;

    const [
      profileNameResult,
      profilePhoneResult,
      courseTitleResult,
      courseSlugResult,
      organizationTitleResult,
      programTitleResult,
    ] = await Promise.all([
      supabase.from("profiles").select("id").ilike("full_name", pattern),
      supabase.from("profiles").select("id").ilike("phone", pattern),
      supabase.from("courses").select("id").ilike("title", pattern),
      supabase.from("courses").select("id").ilike("slug", pattern),
      supabase.from("organizations").select("id").ilike("title", pattern),
      supabase.from("programs").select("id").ilike("title", pattern),
    ]);

    const lookupResults = [
      profileNameResult,
      profilePhoneResult,
      courseTitleResult,
      courseSlugResult,
      organizationTitleResult,
      programTitleResult,
    ];

    for (const result of lookupResults) {
      if (result.error) this.handleError(result.error);
    }

    const profileIds = new Set<string>([
      ...(profileNameResult.data ?? []).map((item) => item.id),
      ...(profilePhoneResult.data ?? []).map((item) => item.id),
    ]);
    const courseIds = new Set<string>([
      ...(courseTitleResult.data ?? []).map((item) => item.id),
      ...(courseSlugResult.data ?? []).map((item) => item.id),
    ]);
    const organizationIds = (organizationTitleResult.data ?? []).map(
      (item) => item.id,
    );
    const programIds = (programTitleResult.data ?? []).map((item) => item.id);

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

    return {
      profileIds: Array.from(profileIds),
      courseIds: Array.from(courseIds),
    };
  }
}

export const enrollmentListRepository = new EnrollmentListRepository();
