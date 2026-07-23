import type { Database } from "@/supabase/types/database.types";

import { BaseRepository } from "./base.repository";

/* ========================================
   DATABASE TYPES
======================================== */

export type Enrollment =
  Database["public"]["Tables"]["enrollments"]["Row"];

export type EnrollmentInsert =
  Database["public"]["Tables"]["enrollments"]["Insert"];

export type EnrollmentUpdate =
  Database["public"]["Tables"]["enrollments"]["Update"];

export type EnrollmentStatus =
  Database["public"]["Enums"]["enrollment_status"];

export type EnrollmentCategory =
  Database["public"]["Enums"]["enrollment_category"];

type ProfileRole =
  Database["public"]["Enums"]["profile_role"];

type ProfileStatus =
  Database["public"]["Enums"]["profile_status"];

type CourseStatus =
  Database["public"]["Enums"]["course_status"];

export type PaymentStatus =
  Database["public"]["Enums"]["payment_status"];

type PaymentMethod =
  Database["public"]["Enums"]["payment_method"];

/* ========================================
   RELATION TYPES
======================================== */

export type EnrollmentProfile = {
  id: string;
  full_name: string;
  phone: string;
  role: ProfileRole;
  status: ProfileStatus;
};

export type EnrollmentOrganization = {
  id: string;
  title: string;
};

export type EnrollmentProgram = {
  id: string;
  title: string;
};

export type EnrollmentCourse = {
  id: string;
  title: string;
  slug: string;
  price: number;
  status: CourseStatus;
  organizations: EnrollmentOrganization | null;
  programs: EnrollmentProgram | null;
};

export type EnrollmentPayment = {
  id: string;
  amount: number;
  status: PaymentStatus;
  payment_method: PaymentMethod;
  payment_proof_path: string | null;
  notes: string | null;
  paid_at: string | null;
  verified_at: string | null;
  verified_by: string | null;
  created_at: string;
};

export type EnrollmentDetail = Enrollment & {
  profiles: EnrollmentProfile | null;
  courses: EnrollmentCourse | null;
  payments: EnrollmentPayment | null;
};

export type StudentActiveEnrollment = Enrollment & {
  courses: EnrollmentCourse | null;
};

/* ========================================
   REPOSITORY
======================================== */

export class EnrollmentRepository extends BaseRepository {
  /* ========================================
     BULK UPDATE
  ======================================== */

  async activateAllPendingApproval(): Promise<Enrollment[]> {
    const supabase = await this.db();
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from("enrollments")
      .update({
        status: "active",
        activated_at: now,
        updated_at: now,
      })
      .eq("status", "pending_approval")
      .select();

    if (error) {
      this.handleError(error);
    }

    return data ?? [];
  }

  /* ========================================
     READ WITH RELATIONS
  ======================================== */

  async getAllDetails(): Promise<EnrollmentDetail[]> {
    const supabase = await this.db();

    const { data, error } = await supabase
      .from("enrollments")
      .select(`
        *,
        profiles (
          id,
          full_name,
          phone,
          role,
          status
        ),
        courses (
          id,
          title,
          slug,
          price,
          status,
          organizations (
            id,
            title
          ),
          programs!fk_courses_program (
            id,
            title
          )
        ),
        payments (
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
        )
      `)
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      this.handleError(error);
    }

    return (data as EnrollmentDetail[] | null) ?? [];
  }

  async getDetail(
    id: string,
  ): Promise<EnrollmentDetail | null> {
    const supabase = await this.db();

    const { data, error } = await supabase
      .from("enrollments")
      .select(`
        *,
        profiles (
          id,
          full_name,
          phone,
          role,
          status
        ),
        courses (
          id,
          title,
          slug,
          price,
          status,
          organizations (
            id,
            title
          ),
          programs!fk_courses_program (
            id,
            title
          )
        ),
        payments (
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
        )
      `)
      .eq("id", id)
      .maybeSingle();

    if (error) {
      this.handleError(error);
    }

    return data as EnrollmentDetail | null;
  }

  /* ========================================
     BASIC READ
  ======================================== */

  async getAll(): Promise<Enrollment[]> {
    const supabase = await this.db();

    const { data, error } = await supabase
      .from("enrollments")
      .select("*")
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      this.handleError(error);
    }

    return data ?? [];
  }

  async getById(
    id: string,
  ): Promise<Enrollment | null> {
    const supabase = await this.db();

    const { data, error } = await supabase
      .from("enrollments")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      this.handleError(error);
    }

    return data;
  }

  async getByProfile(
    profileId: string,
  ): Promise<Enrollment[]> {
    const supabase = await this.db();

    const { data, error } = await supabase
      .from("enrollments")
      .select("*")
      .eq("profile_id", profileId)
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      this.handleError(error);
    }

    return data ?? [];
  }

  async getActiveDetailsByProfile(
    profileId: string,
  ): Promise<StudentActiveEnrollment[]> {
    const supabase = await this.db();

    const { data, error } = await supabase
      .from("enrollments")
      .select(`
        *,
        courses (
          id,
          title,
          slug,
          price,
          status,
          organizations (
            id,
            title
          ),
          programs!fk_courses_program (
            id,
            title
          )
        )
      `)
      .eq("profile_id", profileId)
      .eq("status", "active")
      .order("activated_at", {
        ascending: false,
      });

    if (error) {
      this.handleError(error);
    }

    return (data ?? []) as StudentActiveEnrollment[];
  }

  async getActiveDetailByProfileAndCourse(
    profileId: string,
    courseId: string,
  ): Promise<StudentActiveEnrollment | null> {
    const supabase = await this.db();

    const { data, error } = await supabase
      .from("enrollments")
      .select(`
        *,
        courses (
          id,
          title,
          slug,
          price,
          status,
          organizations (
            id,
            title
          ),
          programs!fk_courses_program (
            id,
            title
          )
        )
      `)
      .eq("profile_id", profileId)
      .eq("course_id", courseId)
      .eq("status", "active")
      .order("activated_at", {
        ascending: false,
      })
      .limit(1)
      .maybeSingle();

    if (error) {
      this.handleError(error);
    }

    return data as StudentActiveEnrollment | null;
  }

  async getByCourse(
    courseId: string,
  ): Promise<Enrollment[]> {
    const supabase = await this.db();

    const { data, error } = await supabase
      .from("enrollments")
      .select("*")
      .eq("course_id", courseId)
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      this.handleError(error);
    }

    return data ?? [];
  }

  async getByStatus(
    status: EnrollmentStatus,
  ): Promise<Enrollment[]> {
    const supabase = await this.db();

    const { data, error } = await supabase
      .from("enrollments")
      .select("*")
      .eq("status", status)
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      this.handleError(error);
    }

    return data ?? [];
  }

  async getByCategory(
    category: EnrollmentCategory,
  ): Promise<Enrollment[]> {
    const supabase = await this.db();

    const { data, error } = await supabase
      .from("enrollments")
      .select("*")
      .eq("category", category)
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      this.handleError(error);
    }

    return data ?? [];
  }

  async findExisting(
    profileId: string,
    courseId: string,
  ): Promise<Enrollment | null> {
    const supabase = await this.db();

    const { data, error } = await supabase
      .from("enrollments")
      .select("*")
      .eq("profile_id", profileId)
      .eq("course_id", courseId)
      .order("created_at", {
        ascending: false,
      })
      .limit(1)
      .maybeSingle();

    if (error) {
      this.handleError(error);
    }

    return data;
  }

  async count(): Promise<number> {
    const supabase = await this.db();

    const { count, error } = await supabase
      .from("enrollments")
      .select("*", {
        count: "exact",
        head: true,
      });

    if (error) {
      this.handleError(error);
    }

    return count ?? 0;
  }

  async countByStatus(
    status: EnrollmentStatus,
  ): Promise<number> {
    const supabase = await this.db();

    const { count, error } = await supabase
      .from("enrollments")
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq("status", status);

    if (error) {
      this.handleError(error);
    }

    return count ?? 0;
  }

  /* ========================================
     CREATE
  ======================================== */

  async create(
    data: EnrollmentInsert,
  ): Promise<Enrollment> {
    const supabase = await this.db();

    const { data: created, error } = await supabase
      .from("enrollments")
      .insert(data)
      .select()
      .single();

    if (error) {
      this.handleError(error);
    }

    return created;
  }

  /* ========================================
     UPDATE
  ======================================== */

  async update(
    id: string,
    data: EnrollmentUpdate,
  ): Promise<Enrollment> {
    const supabase = await this.db();

    const { data: updated, error } = await supabase
      .from("enrollments")
      .update(data)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      this.handleError(error);
    }

    return updated;
  }

  /* ========================================
     DELETE
  ======================================== */

  async delete(
    id: string,
  ): Promise<void> {
    const supabase = await this.db();

    const { error } = await supabase
      .from("enrollments")
      .delete()
      .eq("id", id);

    if (error) {
      this.handleError(error);
    }
  }
}

export const enrollmentRepository =
  new EnrollmentRepository();