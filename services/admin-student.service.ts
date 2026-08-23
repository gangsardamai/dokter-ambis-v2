import {
  adminStudentRepository,
  type AdminStudentCourseRef,
  type AdminStudentEnrollmentRow,
  type AdminStudentOrganizationRef,
  type AdminStudentProfileRow,
} from "@/repositories";

export interface AdminStudentDirectoryFilters {
  search?: string;
  organizationId?: string;
  courseId?: string;
  page?: number;
  pageSize?: number;
}

export interface AdminStudentDirectoryItem extends AdminStudentProfileRow {
  email: string;
  enrollments: AdminStudentEnrollmentRow[];
}

export interface AdminStudentDirectoryResult {
  students: AdminStudentDirectoryItem[];
  courses: AdminStudentCourseRef[];
  organizations: AdminStudentOrganizationRef[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface AdminStudentDetailResult {
  student: AdminStudentProfileRow & {
    email: string;
  };
  enrollments: AdminStudentEnrollmentRow[];
}

function normalizePositiveInteger(
  value: number | undefined,
  fallback: number,
): number {
  if (!value || !Number.isFinite(value)) {
    return fallback;
  }

  return Math.max(1, Math.floor(value));
}

function getOrganizationOptions(
  courses: AdminStudentCourseRef[],
): AdminStudentOrganizationRef[] {
  const organizations = new Map<string, AdminStudentOrganizationRef>();

  courses.forEach((course) => {
    if (course.organizations) {
      organizations.set(course.organizations.id, course.organizations);
    }
  });

  return Array.from(organizations.values()).sort((left, right) =>
    left.title.localeCompare(right.title, "id-ID"),
  );
}

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export class AdminStudentService {
  async getDirectory(
    filters: AdminStudentDirectoryFilters = {},
  ): Promise<AdminStudentDirectoryResult> {
    const page = normalizePositiveInteger(filters.page, 1);
    const pageSize = Math.min(
      normalizePositiveInteger(filters.pageSize, 25),
      100,
    );

    const [profilePage, courseOptions] = await Promise.all([
      adminStudentRepository.getStudentsPage({
        search: filters.search,
        organizationId: filters.organizationId,
        courseId: filters.courseId,
        page,
        pageSize,
      }),
      adminStudentRepository.getCourseOptions(),
    ]);

    const profileIds = profilePage.profiles.map((profile) => profile.id);
    const [enrollments, emailRows] = await Promise.all([
      adminStudentRepository.getEnrollmentsByProfileIds(profileIds),
      adminStudentRepository.getStudentEmails(profileIds),
    ]);

    const enrollmentsByProfile = new Map<string, AdminStudentEnrollmentRow[]>();
    const emailsByProfile = new Map(
      emailRows.map((row) => [row.profile_id, row.email]),
    );

    enrollments.forEach((enrollment) => {
      const existing = enrollmentsByProfile.get(enrollment.profile_id) ?? [];
      existing.push(enrollment);
      enrollmentsByProfile.set(enrollment.profile_id, existing);
    });

    const students = profilePage.profiles.map((profile) => ({
      ...profile,
      email: emailsByProfile.get(profile.id) ?? "",
      enrollments: enrollmentsByProfile.get(profile.id) ?? [],
    }));

    return {
      students,
      courses: courseOptions.sort((left, right) => {
        const organizationComparison = (
          left.organizations?.title ?? ""
        ).localeCompare(right.organizations?.title ?? "", "id-ID");

        if (organizationComparison !== 0) {
          return organizationComparison;
        }

        return left.title.localeCompare(right.title, "id-ID");
      }),
      organizations: getOrganizationOptions(courseOptions),
      total: profilePage.total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(profilePage.total / pageSize)),
    };
  }

  async getDetail(
    profileId: string,
  ): Promise<AdminStudentDetailResult | null> {
    if (!profileId) {
      return null;
    }

    const student = await adminStudentRepository.getStudentById(profileId);

    if (!student) {
      return null;
    }

    const [enrollments, emailRows] = await Promise.all([
      adminStudentRepository.getEnrollmentsByProfileIds([profileId]),
      adminStudentRepository.getStudentEmails([profileId]),
    ]);

    return {
      student: {
        ...student,
        email: emailRows[0]?.email ?? "",
      },
      enrollments,
    };
  }

  async resetStudentDevices(profileId: string): Promise<number> {
    if (!profileId) {
      throw new Error("Akun mahasiswa tidak ditemukan.");
    }

    return adminStudentRepository.resetStudentDevices(profileId);
  }

  async setStudentPassword(
    profileId: string,
    newPassword: string,
  ): Promise<void> {
    if (!profileId) {
      throw new Error("Akun mahasiswa tidak ditemukan.");
    }

    if (newPassword.trim().length < 6) {
      throw new Error("Password baru minimal 6 karakter.");
    }

    if (new TextEncoder().encode(newPassword).length > 72) {
      throw new Error("Password baru maksimal 72 byte.");
    }

    await adminStudentRepository.setStudentPassword(profileId, newPassword);
  }

  async promoteStudentToMentor(profileId: string): Promise<string> {
    if (!profileId) {
      throw new Error("Akun mahasiswa tidak ditemukan.");
    }

    return adminStudentRepository.promoteStudentToMentor(profileId);
  }

  async deleteStudentAccount(
    profileId: string,
    confirmationEmail: string,
  ): Promise<void> {
    if (!profileId) {
      throw new Error("Akun mahasiswa tidak ditemukan.");
    }

    const normalizedConfirmation = normalizeEmail(confirmationEmail);

    if (!normalizedConfirmation) {
      throw new Error("Email konfirmasi wajib diisi.");
    }

    const student = await adminStudentRepository.getStudentById(profileId);

    if (!student) {
      throw new Error("Akun mahasiswa tidak ditemukan.");
    }

    const [emailRows, enrollments] = await Promise.all([
      adminStudentRepository.getStudentEmails([profileId]),
      adminStudentRepository.getEnrollmentsByProfileIds([profileId]),
    ]);
    const actualEmail = emailRows[0]?.email ?? "";

    if (!actualEmail || normalizeEmail(actualEmail) !== normalizedConfirmation) {
      throw new Error("Email konfirmasi tidak sesuai.");
    }

    const paymentProofPaths = enrollments
      .map((enrollment) => enrollment.payments?.payment_proof_path ?? null)
      .filter((path): path is string => Boolean(path));

    await adminStudentRepository.removePaymentProofs(paymentProofPaths);
    await adminStudentRepository.deleteStudentAccount(
      profileId,
      confirmationEmail,
    );
  }
}

export const adminStudentService = new AdminStudentService();
