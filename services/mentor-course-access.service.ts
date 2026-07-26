import {
  courseRepository,
  mentorCourseAccessRepository,
} from "@/repositories";

export class MentorCourseAccessService {
  async getAssignedCourseIds(profileId: string): Promise<string[]> {
    return mentorCourseAccessRepository.getAssignedCourseIds(profileId);
  }

  async getAssignedCourses(profileId: string) {
    const assignedCourseIds = new Set(
      await mentorCourseAccessRepository.getAssignedCourseIds(profileId),
    );
    const courses = await courseRepository.getAll();
    return courses.filter((course) => assignedCourseIds.has(course.id));
  }

  async isAssigned(profileId: string, courseId: string): Promise<boolean> {
    return mentorCourseAccessRepository.isAssigned(profileId, courseId);
  }

  async requireAssigned(profileId: string, courseId: string): Promise<void> {
    if (!(await this.isAssigned(profileId, courseId))) {
      throw new Error("Anda tidak ditugaskan pada course ini.");
    }
  }
}

export const mentorCourseAccessService = new MentorCourseAccessService();
