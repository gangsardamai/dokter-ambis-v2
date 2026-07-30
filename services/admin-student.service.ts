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
  courses: AdminStudentCourseRef[];
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
  student: AdminStudentProfileRow;
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

function uniqueCourses(
  enrollments: AdminStudentEnrollmentRow[],
): AdminStudentCourseRef[] {
  const courses = new Map<string, AdminStudentCourseRef>();

  enrollments.forEach((enrollment) => {
    if (enrollment.courses) {
      courses.set(enrollment.courses.id, enrollment.courses);
    }
  });

  return Array.from(courses.values()).sort((left, right) => {
    const organizationComparison = (
      left.organizations?.title ?? ""
    ).localeCompare(right.organizations?.title ?? "", "id-ID");

    if (organizationComparison !== 0) {
      return organizationComparison;
    }

    return left.title.localeCompare(right.title, "id-ID");
  });
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
    const enrollments = await adminStudentRepository.getEnrollmentsByProfileIds(
      profileIds,
    );
    const enrollmentsByProfile = new Map<string, AdminStudentEnrollmentRow[]>();

    enrollments.forEach((enrollment) => {
      const existing = enrollmentsByProfile.get(enrollment.profile_id) ?? [];
      existing.push(enrollment);
      enrollmentsByProfile.set(enrollment.profile_id, existing);
    });

    const students = profilePage.profiles.map((profile) => ({
      ...profile,
      courses: uniqueCourses(enrollmentsByProfile.get(profile.id) ?? []),
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

    const enrollments = await adminStudentRepository.getEnrollmentsByProfileIds([
      profileId,
    ]);

    return {
      student,
      enrollments,
    };
  }
}

export const adminStudentService = new AdminStudentService();
