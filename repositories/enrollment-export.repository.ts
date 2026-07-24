import type {
  EnrollmentDetail,
  EnrollmentProfile,
} from "@/repositories/enrollment.repository";

import { BaseRepository } from "./base.repository";

export type EnrollmentExportProfile =
  EnrollmentProfile & {
    university_origin: string | null;
  };

export type EnrollmentExportDetail =
  Omit<EnrollmentDetail, "profiles"> & {
    profiles: EnrollmentExportProfile | null;
  };

export class EnrollmentExportRepository extends BaseRepository {
  async getAll(): Promise<EnrollmentExportDetail[]> {
    const supabase = await this.db();

    const { data, error } = await supabase
      .from("enrollments")
      .select(`
        *,
        profiles (
          id,
          full_name,
          phone,
          university_origin,
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

    return (
      data as EnrollmentExportDetail[] | null
    ) ?? [];
  }
}

export const enrollmentExportRepository =
  new EnrollmentExportRepository();
