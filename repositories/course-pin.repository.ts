import { BaseRepository } from "./base.repository";

export interface CoursePin {
  profile_id: string;
  course_id: string;
  pinned_at: string;
}

export class CoursePinRepository extends BaseRepository {
  async getPinsForProfile(profileId: string): Promise<CoursePin[]> {
    const supabase = await this.db();
    const { data, error } = await supabase
      .from("course_pins")
      .select("profile_id, course_id, pinned_at")
      .eq("profile_id", profileId)
      .order("pinned_at", { ascending: false });

    if (error) this.handleError(error);
    return data ?? [];
  }

  async pin(profileId: string, courseId: string): Promise<void> {
    const supabase = await this.db();
    const { error } = await supabase
      .from("course_pins")
      .upsert(
        {
          profile_id: profileId,
          course_id: courseId,
          pinned_at: new Date().toISOString(),
        },
        {
          onConflict: "profile_id,course_id",
        },
      );

    if (error) this.handleError(error);
  }

  async unpin(profileId: string, courseId: string): Promise<void> {
    const supabase = await this.db();
    const { error } = await supabase
      .from("course_pins")
      .delete()
      .eq("profile_id", profileId)
      .eq("course_id", courseId);

    if (error) this.handleError(error);
  }
}

export const coursePinRepository = new CoursePinRepository();
