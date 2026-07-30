import type { Database } from "@/supabase/types/database.types";

import { BaseRepository } from "./base.repository";

type ProfileStatus = Database["public"]["Enums"]["profile_status"];
type EnrollmentStatus = Database["public"]["Enums"]["enrollment_status"];
type EnrollmentCategory = Database["public"]["Enums"]["enrollment_category"];
type PaymentStatus = Database["public"]["Enums"]["payment_status"];
type CourseStatus = Database["public"]["Enums"]["course_status"];

export interface AdminStudentProfileRow {
  id: string;
  full_name: string;
  phone: string;
  university_origin: string | null;
  status: ProfileStatus;
  created_at: string;
}

export interface AdminStudentOrganizationRef {
  id: string;
  title: string;
  short_name: string;
}

export interface AdminStudentCourseRef {
  id: string;
  title: string;
  status: CourseStatus;
  organization_id: string;
  organizations: AdminStudentOrganizationRef | null;
}

export interface AdminStudentEnrollmentRow {
  id: string;
  profile_id: string;
  course_id: string;
  status: EnrollmentStatus;
  category: EnrollmentCategory;
  price_snapshot: number;
  discount_amount: number;
  enrolled_at: string;
  activated_at: string | null;
  expired_at: string | null;
  created_at: string;
  courses: AdminStudentCourseRef | null;
  payments: {
    id: string;
    status: PaymentStatus;
  } | null;
}

export interface AdminStudentListQuery {
  search?: string;
  organizationId?: string;
  courseId?: string;
  page: number;
  pageSize: number;
}

export interface AdminStudentProfilePage {
  profiles: AdminStudentProfileRow[];
  total: number;
}

function normalizeSearch(value: string): string {
  return value
    .replace(/[,%()]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export class AdminStudentRepository extends BaseRepository {
  private async getFilteredProfileIds(
    organizationId?: string,
    courseId?: string,
  ): Promise<string[] | null> {
    if (!organizationId && !courseId) {
      return null;
    }

    const supabase = await this.db();
    let query = supabase
      .from("enrollments")
      .select(`
        profile_id,
        courses!inner (
          id,
          organization_id
        )
      `);

    if (courseId) {
      query = query.eq("course_id", courseId);
    }

    if (organizationId) {
      query = query.eq("courses.organization_id", organizationId);
    }

    const { data, error } = await query;

    if (error) {
      this.handleError(error);
    }

    return Array.from(
      new Set((data ?? []).map((row) => row.profile_id)),
    );
  }

  async getStudentsPage(
    queryInput: AdminStudentListQuery,
  ): Promise<AdminStudentProfilePage> {
    const supabase = await this.db();
    const filteredProfileIds = await this.getFilteredProfileIds(
      queryInput.organizationId,
      queryInput.courseId,
    );

    if (filteredProfileIds && filteredProfileIds.length === 0) {
      return {
        profiles: [],
        total: 0,
      };
    }

    const offset = (queryInput.page - 1) * queryInput.pageSize;
    const end = offset + queryInput.pageSize - 1;

    let query = supabase
      .from("profiles")
      .select(
        "id, full_name, phone, university_origin, status, created_at",
        {
          count: "exact",
        },
      )
      .eq("role", "student")
      .order("full_name", {
        ascending: true,
      })
      .range(offset, end);

    const search = normalizeSearch(queryInput.search ?? "");

    if (search) {
      const pattern = `%${search}%`;
      query = query.or(
        `full_name.ilike.${pattern},phone.ilike.${pattern},university_origin.ilike.${pattern}`,
      );
    }

    if (filteredProfileIds) {
      query = query.in("id", filteredProfileIds);
    }

    const { data, count, error } = await query;

    if (error) {
      this.handleError(error);
    }

    return {
      profiles: (data as AdminStudentProfileRow[] | null) ?? [],
      total: count ?? 0,
    };
  }

  async getEnrollmentsByProfileIds(
    profileIds: string[],
  ): Promise<AdminStudentEnrollmentRow[]> {
    if (profileIds.length === 0) {
      return [];
    }

    const supabase = await this.db();
    const { data, error } = await supabase
      .from("enrollments")
      .select(`
        id,
        profile_id,
        course_id,
        status,
        category,
        price_snapshot,
        discount_amount,
        enrolled_at,
        activated_at,
        expired_at,
        created_at,
        courses (
          id,
          title,
          status,
          organization_id,
          organizations (
            id,
            title,
            short_name
          )
        ),
        payments (
          id,
          status
        )
      `)
      .in("profile_id", profileIds)
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      this.handleError(error);
    }

    return (data as AdminStudentEnrollmentRow[] | null) ?? [];
  }

  async getStudentById(
    profileId: string,
  ): Promise<AdminStudentProfileRow | null> {
    const supabase = await this.db();
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, phone, university_origin, status, created_at")
      .eq("id", profileId)
      .eq("role", "student")
      .maybeSingle();

    if (error) {
      this.handleError(error);
    }

    return data as AdminStudentProfileRow | null;
  }

  async getCourseOptions(): Promise<AdminStudentCourseRef[]> {
    const supabase = await this.db();
    const { data, error } = await supabase
      .from("courses")
      .select(`
        id,
        title,
        status,
        organization_id,
        organizations (
          id,
          title,
          short_name
        )
      `)
      .order("title", {
        ascending: true,
      });

    if (error) {
      this.handleError(error);
    }

    return (data as AdminStudentCourseRef[] | null) ?? [];
  }
}

export const adminStudentRepository = new AdminStudentRepository();
