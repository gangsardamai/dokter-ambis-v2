import type { Database } from "@/supabase/types/database.types";

import { BaseRepository } from "./base.repository";

export type DeviceSession =
  Database["public"]["Tables"]["device_sessions"]["Row"];

export type DeviceSessionInsert =
  Database["public"]["Tables"]["device_sessions"]["Insert"];

export type DeviceSessionUpdate =
  Database["public"]["Tables"]["device_sessions"]["Update"];

type DeviceType =
  Database["public"]["Enums"]["device_type"];

interface RegisterOrRefreshStudentDeviceData {
  deviceIdentifier: string;
  deviceName: string;
  deviceType: DeviceType;
  userAgent?: string | null;
  ipAddress?: string | null;
}

export class DeviceRepository extends BaseRepository {
  async registerOrRefreshStudentDevice(
    data: RegisterOrRefreshStudentDeviceData,
  ): Promise<void> {
    const supabase =
      await this.db();

    /*
     * Registration, stale-device cleanup, and the 2-device limit are
     * intentionally handled in one database transaction. The cast is
     * temporary compatibility for generated types that may lag migrations.
     */
    const { error } = await supabase.rpc(
      "register_or_refresh_student_device" as never,
      {
        p_device_identifier:
          data.deviceIdentifier,
        p_device_name:
          data.deviceName,
        p_device_type:
          data.deviceType,
        p_user_agent:
          data.userAgent ?? null,
        p_ip_address:
          data.ipAddress ?? null,
      } as never,
    );

    if (error) {
      throw new Error(
        error.message ||
          "Perangkat tidak dapat didaftarkan.",
      );
    }
  }

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
