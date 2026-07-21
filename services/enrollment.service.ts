import type { Database } from "@/supabase/types/database.types";

import {
  enrollmentRepository,
} from "@/repositories";

import type {
  EnrollmentDetail,
  StudentActiveEnrollment,
} from "@/repositories/enrollment.repository";

type Enrollment =
  Database["public"]["Tables"]["enrollments"]["Row"];

type EnrollmentInsert =
  Database["public"]["Tables"]["enrollments"]["Insert"];

type EnrollmentUpdate =
  Database["public"]["Tables"]["enrollments"]["Update"];

type EnrollmentStatus =
  Database["public"]["Enums"]["enrollment_status"];

type EnrollmentCategory =
  Database["public"]["Enums"]["enrollment_category"];

export class EnrollmentService {
  /* ========================================
     READ
  ======================================== */

  async getEnrollments(): Promise<EnrollmentDetail[]> {
    return enrollmentRepository.getAllDetails();
  }

  async getEnrollmentById(
    id: string,
  ): Promise<Enrollment | null> {
    if (!id) {
      throw new Error(
        "ID enrollment wajib diisi.",
      );
    }

    return enrollmentRepository.getById(id);
  }

  async getEnrollmentDetail(
    id: string,
  ): Promise<EnrollmentDetail | null> {
    if (!id) {
      throw new Error(
        "ID enrollment wajib diisi.",
      );
    }

    return enrollmentRepository.getDetail(id);
  }

  async getEnrollmentsByProfile(
    profileId: string,
  ): Promise<Enrollment[]> {
    if (!profileId) {
      throw new Error(
        "Profile tidak ditemukan.",
      );
    }

    return enrollmentRepository.getByProfile(
      profileId,
    );
  }

  async getActiveCourseEnrollments(
    profileId: string,
  ): Promise<StudentActiveEnrollment[]> {
    if (!profileId) {
      throw new Error(
        "Profile tidak ditemukan.",
      );
    }

    const enrollments =
      await enrollmentRepository
        .getActiveDetailsByProfile(
          profileId,
        );

    const currentTime = Date.now();

    return enrollments.filter(
      (enrollment) =>
        !enrollment.expired_at ||
        new Date(
          enrollment.expired_at,
        ).getTime() > currentTime,
    );
  }

  async getActiveCourseEnrollment(
    profileId: string,
    courseId: string,
  ): Promise<StudentActiveEnrollment | null> {
    if (!profileId) {
      throw new Error(
        "Profile tidak ditemukan.",
      );
    }

    if (!courseId) {
      throw new Error(
        "Course tidak ditemukan.",
      );
    }

    const enrollment =
      await enrollmentRepository
        .getActiveDetailByProfileAndCourse(
          profileId,
          courseId,
        );

    if (!enrollment) {
      return null;
    }

    if (
      enrollment.expired_at &&
      new Date(
        enrollment.expired_at,
      ).getTime() <= Date.now()
    ) {
      return null;
    }

    return enrollment;
  }

  async getEnrollmentsByCourse(
    courseId: string,
  ): Promise<Enrollment[]> {
    if (!courseId) {
      throw new Error(
        "Course tidak ditemukan.",
      );
    }

    return enrollmentRepository.getByCourse(
      courseId,
    );
  }

  async getExistingEnrollment(
    profileId: string,
    courseId: string,
  ): Promise<Enrollment | null> {
    if (!profileId) {
      throw new Error(
        "Profile tidak ditemukan.",
      );
    }

    if (!courseId) {
      throw new Error(
        "Course tidak ditemukan.",
      );
    }

    return enrollmentRepository.findExisting(
      profileId,
      courseId,
    );
  }

  async getEnrollmentsByStatus(
    status: EnrollmentStatus,
  ): Promise<Enrollment[]> {
    return enrollmentRepository.getByStatus(
      status,
    );
  }

  async getEnrollmentsByCategory(
    category: EnrollmentCategory,
  ): Promise<Enrollment[]> {
    return enrollmentRepository.getByCategory(
      category,
    );
  }

  async countEnrollments(): Promise<number> {
    return enrollmentRepository.count();
  }

  /* ========================================
     CREATE
  ======================================== */

  async createEnrollment(
    data: EnrollmentInsert,
  ): Promise<Enrollment> {
    if (!data.profile_id) {
      throw new Error(
        "Profile wajib diisi.",
      );
    }

    if (!data.course_id) {
      throw new Error(
        "Course wajib diisi.",
      );
    }

    if (
      data.price_snapshot === undefined ||
      data.price_snapshot === null
    ) {
      throw new Error(
        "Harga enrollment wajib diisi.",
      );
    }

    const existing =
      await enrollmentRepository.findExisting(
        data.profile_id,
        data.course_id,
      );

    if (
      existing &&
      existing.status !== "cancelled" &&
      existing.status !== "expired"
    ) {
      throw new Error(
        "Mahasiswa sudah memiliki enrollment aktif atau masih diproses untuk course ini.",
      );
    }

    return enrollmentRepository.create({
      ...data,
      category:
        data.category ?? "regular",
      status:
        data.status ?? "pending_payment",
      discount_amount:
        data.discount_amount ?? 0,
    });
  }

  /* ========================================
     UPDATE
  ======================================== */

  async updateEnrollment(
    id: string,
    data: EnrollmentUpdate,
  ): Promise<Enrollment> {
    if (!id) {
      throw new Error(
        "ID enrollment wajib diisi.",
      );
    }

    const existing =
      await enrollmentRepository.getById(id);

    if (!existing) {
      throw new Error(
        "Enrollment tidak ditemukan.",
      );
    }

    return enrollmentRepository.update(
      id,
      data,
    );
  }

  async updateStatus(
    id: string,
    status: EnrollmentStatus,
  ): Promise<Enrollment> {
    const payload: EnrollmentUpdate = {
      status,
    };

    if (status === "active") {
      payload.activated_at =
        new Date().toISOString();
    }

    if (
      status === "pending_payment" ||
      status === "pending_approval" ||
      status === "cancelled"
    ) {
      payload.activated_at = null;
    }

    return this.updateEnrollment(
      id,
      payload,
    );
  }

  async updateCategory(
    id: string,
    category: EnrollmentCategory,
  ): Promise<Enrollment> {
    return this.updateEnrollment(
      id,
      {
        category,
      },
    );
  }

  async markPendingPayment(
    id: string,
  ): Promise<Enrollment> {
    return this.updateStatus(
      id,
      "pending_payment",
    );
  }

  async markPendingApproval(
    id: string,
  ): Promise<Enrollment> {
    return this.updateStatus(
      id,
      "pending_approval",
    );
  }

  async activateEnrollment(
    id: string,
    expiredAt?: string | null,
  ): Promise<Enrollment> {
    return this.updateEnrollment(
      id,
      {
        status: "active",
        activated_at:
          new Date().toISOString(),
        expired_at:
          expiredAt ?? null,
      },
    );
  }

  async expireEnrollment(
    id: string,
  ): Promise<Enrollment> {
    return this.updateEnrollment(
      id,
      {
        status: "expired",
      },
    );
  }

  async cancelEnrollment(
    id: string,
  ): Promise<Enrollment> {
    return this.updateEnrollment(
      id,
      {
        status: "cancelled",
        activated_at: null,
      },
    );
  }

  async approveAllPendingEnrollments(): Promise<
    Enrollment[]
  > {
    return enrollmentRepository
      .activateAllPendingApproval();
  }

  /* ========================================
     DELETE
  ======================================== */

  async deleteEnrollment(
    id: string,
  ): Promise<void> {
    if (!id) {
      throw new Error(
        "ID enrollment wajib diisi.",
      );
    }

    const existing =
      await enrollmentRepository.getById(id);

    if (!existing) {
      throw new Error(
        "Enrollment tidak ditemukan.",
      );
    }

    await enrollmentRepository.delete(id);
  }
}

export const enrollmentService =
  new EnrollmentService();