import type { Database } from "@/supabase/types/database.extended.types";

import { BaseRepository } from "./base.repository";

type CourseCommunityLink =
  Database["public"]["Tables"]["course_community_links"]["Row"];

export class CourseCommunityLinkRepository extends BaseRepository {
  async getByCourseId(courseId: string): Promise<CourseCommunityLink | null> {
    const supabase = await this.db();
    const { data, error } = await supabase
      .from("course_community_links")
      .select("course_id, whatsapp_group_url, created_at, updated_at")
      .eq("course_id", courseId)
      .maybeSingle();

    if (error) this.handleError(error);

    return data;
  }

  async upsert(
    courseId: string,
    whatsappGroupUrl: string,
  ): Promise<CourseCommunityLink> {
    const supabase = await this.db();
    const { data, error } = await supabase
      .from("course_community_links")
      .upsert(
        {
          course_id: courseId,
          whatsapp_group_url: whatsappGroupUrl,
        },
        { onConflict: "course_id" },
      )
      .select("course_id, whatsapp_group_url, created_at, updated_at")
      .single();

    if (error) this.handleError(error);

    return data;
  }

  async deleteByCourseId(courseId: string): Promise<void> {
    const supabase = await this.db();
    const { error } = await supabase
      .from("course_community_links")
      .delete()
      .eq("course_id", courseId);

    if (error) this.handleError(error);
  }
}

export const courseCommunityLinkRepository =
  new CourseCommunityLinkRepository();
