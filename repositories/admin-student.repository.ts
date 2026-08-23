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

export interface AdminStudentEmailRow {
  profile_id: string;
  email: string;
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
    payment_proof_path: string | null;
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

  async getStudentEmails(
    profileIds: string[],
  ): Promise<AdminStudentEmailRow[]> {
    if (profileIds.length === 0) {
      return [];
    }

    const supabase = await this.db();
    const { data, error } = await supabase.rpc(
      "admin_get_student_emails",
      {
        target_profile_ids: profileIds,
      },
    );

    if (error) {
      this.handleError(error);
    }

    return (data as AdminStudentEmailRow[] | null) ?? [];
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
          status,
          payment_proof_path
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

  async removePaymentProofs(paths: string[]): Promise<void> {
    const uniquePaths = Array.from(
      new Set(paths.map((path) => path.trim()).filter(Boolean)),
    );

    if (uniquePaths.length === 0) {
      return;
    }

    const supabase = await this.db();
    const { error } = await supabase.storage
      .from("payment-proofs")
      .remove(uniquePaths);

    if (error) {
      this.handleError(error);
    }
  }

  async resetStudentDevices(profileId: string): Promise<number> {
    const supabase = await this.db();
    const { data, error } = await supabase.rpc(
      "admin_reset_student_devices",
      {
        target_profile_id: profileId,
      },
    );

    if (error) {
      this.handleError(error);
    }

    return data ?? 0;
  }

  async setStudentPassword(
    profileId: string,
    newPassword: string,
  ): Promise<void> {
    const supabase = await this.db();
    const { data, error } = await supabase.rpc(
      "admin_set_student_password",
      {
        target_profile_id: profileId,
        new_password: newPassword,
      },
    );

    if (error) {
      this.handleError(error);
    }

    if (!data) {
      throw new Error("Password mahasiswa gagal diubah.");
    }
  }

  async promoteStudentToMentor(profileId: string): Promise<string> {
    const supabase = await this.db();
    const { data, error } = await supabase.rpc(
      "admin_promote_student_to_mentor",
      {
        target_profile_id: profileId,
      },
    );

    if (error) {
      this.handleError(error);
    }

    if (!data) {
      throw new Error("Akun mahasiswa gagal dijadikan mentor.");
    }

    return data;
  }

  async deleteStudentAccount(
    profileId: string,
    confirmationEmail: string,
  ): Promise<void> {
    const supabase = await this.db();
    const { data, error } = await supabase.rpc(
      "admin_delete_student_account",
      {
        target_profile_id: profileId,
        confirmation_email: confirmationEmail,
      },
    );

    if (error) {
      this.handleError(error);
    }

    if (!data) {
      throw new Error("Akun mahasiswa gagal dihapus.");
    }
  }
}

export const adminStudentRepository = new AdminStudentRepository();
