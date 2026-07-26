import { BaseRepository } from "./base.repository";

export class MentorCourseAccessRepository extends BaseRepository {
  async getAssignedCourseIds(profileId: string): Promise<string[]> {
    const supabase = await this.db();
    const { data: mentor, error: mentorError } = await supabase
      .from("mentor_details")
      .select("id")
      .eq("profile_id", profileId)
      .maybeSingle();

    if (mentorError) this.handleError(mentorError);
    if (!mentor) return [];

    const { data, error } = await supabase
      .from("course_mentors")
      .select("course_id")
      .eq("mentor_id", mentor.id);

    if (error) this.handleError(error);
    return (data ?? []).map((assignment) => assignment.course_id);
  }

  async isAssigned(profileId: string, courseId: string): Promise<boolean> {
    const assignedCourseIds = await this.getAssignedCourseIds(profileId);
    return assignedCourseIds.includes(courseId);
  }
}

export const mentorCourseAccessRepository =
  new MentorCourseAccessRepository();
