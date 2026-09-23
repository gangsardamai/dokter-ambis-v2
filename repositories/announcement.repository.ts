import { callDynamicRpc } from "@/lib/supabase/dynamic-rpc";
import type { Database } from "@/supabase/types/database.extended.types";

import { BaseRepository } from "./base.repository";

export type Announcement =
  Database["public"]["Tables"]["announcements"]["Row"];
export type AnnouncementInsert =
  Database["public"]["Tables"]["announcements"]["Insert"];
export type AnnouncementUpdate =
  Database["public"]["Tables"]["announcements"]["Update"];

export type AnnouncementWithTargets = Announcement & {
  organizationIds: string[];
  courseIds: string[];
};

type AnnouncementOrganizationTarget = Pick<
  Database["public"]["Tables"]["announcement_organizations"]["Row"],
  "announcement_id" | "organization_id"
>;
type AnnouncementCourseTarget = Pick<
  Database["public"]["Tables"]["announcement_courses"]["Row"],
  "announcement_id" | "course_id"
>;

export class AnnouncementRepository extends BaseRepository {
  private async attachTargets(
    announcements: Announcement[],
  ): Promise<AnnouncementWithTargets[]> {
    if (announcements.length === 0) return [];

    const supabase = await this.db();
    const ids = announcements.map((announcement) => announcement.id);

    const [organizationResult, courseResult] = await Promise.all([
      supabase
        .from("announcement_organizations")
        .select("announcement_id, organization_id")
        .in("announcement_id", ids),
      supabase
        .from("announcement_courses")
        .select("announcement_id, course_id")
        .in("announcement_id", ids),
    ]);

    if (organizationResult.error) {
      this.handleError(organizationResult.error);
    }
    if (courseResult.error) {
      this.handleError(courseResult.error);
    }

    const organizationTargets =
      (organizationResult.data ?? []) as AnnouncementOrganizationTarget[];
    const courseTargets =
      (courseResult.data ?? []) as AnnouncementCourseTarget[];

    return announcements.map((announcement) => ({
      ...announcement,
      organizationIds: organizationTargets
        .filter((target) => target.announcement_id === announcement.id)
        .map((target) => target.organization_id),
      courseIds: courseTargets
        .filter((target) => target.announcement_id === announcement.id)
        .map((target) => target.course_id),
    }));
  }

  async getAdminAll(): Promise<AnnouncementWithTargets[]> {
    const supabase = await this.db();
    const { data, error } = await supabase
      .from("announcements")
      .select("*")
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) this.handleError(error);
    return this.attachTargets(data ?? []);
  }

  async getByIdAdmin(id: string): Promise<AnnouncementWithTargets | null> {
    const supabase = await this.db();
    const { data, error } = await supabase
      .from("announcements")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) this.handleError(error);
    if (!data) return null;

    const [announcement] = await this.attachTargets([data]);
    return announcement ?? null;
  }

  async getStudentAnnouncements(
    dashboardOnly: boolean,
  ): Promise<Announcement[]> {
    const supabase = await this.db();
    const now = new Date().toISOString();

    let query = supabase
      .from("announcements")
      .select("*")
      .eq("is_published", true)
      .lte("starts_at", now)
      .order("display_order", { ascending: true })
      .order("starts_at", { ascending: false });

    if (dashboardOnly) {
      query = query
        .eq("show_on_dashboard", true)
        .or(`ends_at.is.null,ends_at.gte.${now}`);
    }

    const { data, error } = await query;

    if (error) this.handleError(error);
    return data ?? [];
  }

  async getNextDisplayOrder(): Promise<number> {
    const supabase = await this.db();
    const { data, error } = await supabase
      .from("announcements")
      .select("display_order")
      .eq("show_on_dashboard", true)
      .order("display_order", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) this.handleError(error);
    return (data?.display_order ?? 0) + 10;
  }

  async create(data: AnnouncementInsert, organizationIds: string[], courseIds: string[]): Promise<AnnouncementWithTargets> {
    return this.save(null, data, organizationIds, courseIds);
  }

  async update(id: string, data: AnnouncementUpdate, organizationIds: string[], courseIds: string[]): Promise<AnnouncementWithTargets> {
    return this.save(id, data, organizationIds, courseIds);
  }

  private async save(id: string | null, data: AnnouncementUpdate, organizationIds: string[], courseIds: string[]): Promise<AnnouncementWithTargets> {
    const supabase = await this.db();
    const saved = await callDynamicRpc<Announcement>(supabase, "staff_save_announcement", {
      target_id: id, payload: data, organization_ids: organizationIds, course_ids: courseIds,
    });
    return { ...saved, organizationIds: saved.all_students ? [] : organizationIds, courseIds: saved.all_students ? [] : courseIds };
  }

  async moveDashboard(
    id: string,
    direction: "up" | "down",
  ): Promise<void> {
    const supabase = await this.db();
    const { data, error } = await supabase
      .from("announcements")
      .select("id, display_order")
      .eq("show_on_dashboard", true)
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) this.handleError(error);

    const items = data ?? [];
    const index = items.findIndex((item) => item.id === id);
    if (index < 0) return;

    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return;

    [items[index], items[targetIndex]] = [
      items[targetIndex],
      items[index],
    ];

    for (let position = 0; position < items.length; position += 1) {
      const { error: updateError } = await supabase
        .from("announcements")
        .update({ display_order: (position + 1) * 10 })
        .eq("id", items[position].id);

      if (updateError) this.handleError(updateError);
    }
  }

  async delete(id: string): Promise<void> {
    const supabase = await this.db();
    const { error } = await supabase
      .from("announcements")
      .delete()
      .eq("id", id);

    if (error) this.handleError(error);
  }
}

export const announcementRepository = new AnnouncementRepository();
