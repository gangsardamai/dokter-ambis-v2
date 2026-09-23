import type { Database } from "@/supabase/types/database.types";

import { BaseRepository } from "./base.repository";
import {
  LEADER_PERMISSIONS,
  isLeaderPermission,
  type LeaderPermission,
} from "@/lib/leader-access";

type ProfileStatus = Database["public"]["Enums"]["profile_status"];

export type LeaderScopeType = "organization" | "program" | "course";

export class LeaderAccessRepository extends BaseRepository {
  async getAuditEvents(page: number) {
    const supabase = await this.db();
    const start = (page - 1) * 50;
    const { data, error } = await supabase.from("leader_audit_events")
      .select("id, actor_id, entity_type, entity_id, action, changes, created_at")
      .order("created_at", { ascending: false }).order("id", { ascending: false })
      .range(start, start + 50);
    if (error) this.handleError(error);
    return { events: (data ?? []).slice(0, 50), hasMore: (data?.length ?? 0) > 50 };
  }

  async getScopes(leaderId: string) {
    const supabase = await this.db();
    const { data, error } = await supabase.from("leader_scopes")
      .select("organization_id, program_id, course_id").eq("leader_id", leaderId);
    if (error) this.handleError(error);
    return data ?? [];
  }

  async getEnabledPermissions(leaderId: string): Promise<LeaderPermission[]> {
    const supabase = await this.db();
    const { data, error } = await supabase
      .from("leader_permissions")
      .select("permission")
      .eq("leader_id", leaderId)
      .eq("enabled", true);

    if (error) this.handleError(error);

    return (data ?? [])
      .map((item) => item.permission)
      .filter(isLeaderPermission);
  }

  async hasPermission(
    leaderId: string,
    permission: LeaderPermission,
  ): Promise<boolean> {
    const supabase = await this.db();
    const { data, error } = await supabase
      .from("leader_permissions")
      .select("leader_id")
      .eq("leader_id", leaderId)
      .eq("permission", permission)
      .eq("enabled", true)
      .maybeSingle();

    if (error) this.handleError(error);
    return Boolean(data);
  }

  async getLeaders() {
    const supabase = await this.db();
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, phone, university_origin, role, status, created_at")
      .eq("role", "leader")
      .order("full_name", { ascending: true });

    if (error) this.handleError(error);
    return data ?? [];
  }

  async getAllScopes() {
    const supabase = await this.db();
    const { data, error } = await supabase
      .from("leader_scopes")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) this.handleError(error);
    return data ?? [];
  }

  async getAllPermissions() {
    const supabase = await this.db();
    const { data, error } = await supabase
      .from("leader_permissions")
      .select("*")
      .order("permission", { ascending: true });

    if (error) this.handleError(error);
    return data ?? [];
  }

  async findStudentByPhone(phone: string) {
    const supabase = await this.db();
    const { data, error } = await supabase.rpc(
      "staff_find_student_by_phone",
      { submitted_phone: phone },
    );

    if (error) this.handleError(error);
    return data?.[0] ?? null;
  }

  async promoteStudentToLeader(profileId: string) {
    const supabase = await this.db();
    const { data, error } = await supabase
      .from("profiles")
      .update({ role: "leader", status: "active" })
      .eq("id", profileId)
      .eq("role", "student")
      .select("id, full_name, phone, status, role")
      .single();

    if (error) this.handleError(error);
    return data;
  }

  async setLeaderStatus(
    leaderId: string,
    status: Extract<ProfileStatus, "active" | "inactive">,
  ) {
    const supabase = await this.db();
    const { data, error } = await supabase
      .from("profiles")
      .update({ status })
      .eq("id", leaderId)
      .eq("role", "leader")
      .select("id, full_name, status")
      .single();

    if (error) this.handleError(error);
    return data;
  }

  async setPermissions(
    leaderId: string,
    permissions: LeaderPermission[],
    actorId: string,
  ): Promise<void> {
    const supabase = await this.db();
    const enabled = new Set(permissions);

    const { error } = await supabase.from("leader_permissions").upsert(
      LEADER_PERMISSIONS.map((permission) => ({
        leader_id: leaderId,
        permission,
        enabled: enabled.has(permission),
        created_by: actorId,
      })),
      { onConflict: "leader_id,permission" },
    );

    if (error) this.handleError(error);
  }

  async addScope(
    leaderId: string,
    scopeType: LeaderScopeType,
    scopeId: string,
    actorId: string,
  ): Promise<void> {
    const supabase = await this.db();
    const payload = {
      leader_id: leaderId,
      organization_id: scopeType === "organization" ? scopeId : null,
      program_id: scopeType === "program" ? scopeId : null,
      course_id: scopeType === "course" ? scopeId : null,
      created_by: actorId,
    };

    const { error } = await supabase
      .from("leader_scopes")
      .insert(payload);

    if (error) {
      if ((error as { code?: string }).code === "23505") return;
      this.handleError(error);
    }
  }

  async removeScope(scopeId: string): Promise<void> {
    const supabase = await this.db();
    const { error } = await supabase
      .from("leader_scopes")
      .delete()
      .eq("id", scopeId);

    if (error) this.handleError(error);
  }
}

export const leaderAccessRepository = new LeaderAccessRepository();
