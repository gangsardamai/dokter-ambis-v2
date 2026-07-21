import type { Database } from "@/supabase/types/database.types";

import { BaseRepository } from "./base.repository";

export type DeviceSession =
  Database["public"]["Tables"]["device_sessions"]["Row"];

export type DeviceSessionInsert =
  Database["public"]["Tables"]["device_sessions"]["Insert"];

export type DeviceSessionUpdate =
  Database["public"]["Tables"]["device_sessions"]["Update"];

export class DeviceRepository extends BaseRepository {
  async getActiveByProfile(
    profileId: string,
  ): Promise<DeviceSession[]> {
    const supabase =
      await this.db();

    const { data, error } =
      await supabase
        .from("device_sessions")
        .select("*")
        .eq(
          "profile_id",
          profileId,
        )
        .eq(
          "is_active",
          true,
        )
        .order(
          "created_at",
          {
            ascending: true,
          },
        );

    if (error) {
      this.handleError(error);
    }

    return data ?? [];
  }

  async getByProfileAndIdentifier(
    profileId: string,
    deviceIdentifier: string,
  ): Promise<DeviceSession | null> {
    const supabase =
      await this.db();

    const { data, error } =
      await supabase
        .from("device_sessions")
        .select("*")
        .eq(
          "profile_id",
          profileId,
        )
        .eq(
          "device_identifier",
          deviceIdentifier,
        )
        .maybeSingle();

    if (error) {
      this.handleError(error);
    }

    return data;
  }

  async create(
    data: DeviceSessionInsert,
  ): Promise<DeviceSession> {
    const supabase =
      await this.db();

    const {
      data: created,
      error,
    } = await supabase
      .from("device_sessions")
      .insert(data)
      .select()
      .single();

    if (error) {
      this.handleError(error);
    }

    return created;
  }

  async update(
    id: string,
    data: DeviceSessionUpdate,
  ): Promise<DeviceSession> {
    const supabase =
      await this.db();

    const {
      data: updated,
      error,
    } = await supabase
      .from("device_sessions")
      .update(data)
      .eq(
        "id",
        id,
      )
      .select()
      .single();

    if (error) {
      this.handleError(error);
    }

    return updated;
  }

  async deactivate(
    id: string,
  ): Promise<DeviceSession> {
    return this.update(
      id,
      {
        is_active: false,
        updated_at:
          new Date().toISOString(),
      },
    );
  }
}

export const deviceRepository =
  new DeviceRepository();