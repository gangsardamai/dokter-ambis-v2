import type { Json } from "./database.types";
export type LeaderAuditRow = {
  id: string; actor_id: string | null; entity_type: string; entity_id: string | null;
  action: string; changes: Json; created_at: string;
};
export type LeaderAuditTables = {
  leader_audit_events: { Row: LeaderAuditRow; Insert: never; Update: never; Relationships: [] };
};
