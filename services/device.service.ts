import type { Database } from "@/supabase/types/database.types";

import {
  deviceRepository,
} from "@/repositories/device.repository";

type DeviceType =
  Database["public"]["Enums"]["device_type"];

interface RegisterStudentDeviceData {
  profileId: string;
  deviceIdentifier: string;
  deviceName: string;
  deviceType: DeviceType;
  userAgent?: string | null;
  ipAddress?: string | null;
}

const MAX_ACTIVE_DEVICES = 2;

export class DeviceService {
  async registerOrRefreshStudentDevice(
    data: RegisterStudentDeviceData,
  ) {
    if (!data.profileId) {
      throw new Error(
        "Profile peserta tidak ditemukan.",
      );
    }

    if (!data.deviceIdentifier) {
      throw new Error(
        "Identitas perangkat tidak ditemukan. Silakan muat ulang halaman login.",
      );
    }

    const existingDevice =
      await deviceRepository
        .getByProfileAndIdentifier(
          data.profileId,
          data.deviceIdentifier,
        );

    const now =
      new Date().toISOString();

    if (existingDevice) {
      if (!existingDevice.is_active) {
        throw new Error(
          "Perangkat ini telah dinonaktifkan. Silakan hubungi administrator.",
        );
      }

      return deviceRepository.update(
        existingDevice.id,
        {
          device_name:
            data.deviceName,
          device_type:
            data.deviceType,
          user_agent:
            data.userAgent ?? null,
          last_login_at:
            now,
          last_activity_at:
            now,
          updated_at:
            now,
          ...(data.ipAddress
            ? {
                ip_address:
                  data.ipAddress,
              }
            : {}),
        },
      );
    }

    const activeDevices =
      await deviceRepository
        .getActiveByProfile(
          data.profileId,
        );

    if (
      activeDevices.length >=
      MAX_ACTIVE_DEVICES
    ) {
      throw new Error(
        "Batas maksimal 2 perangkat telah tercapai. Silakan hubungi administrator untuk mengganti perangkat.",
      );
    }

    return deviceRepository.create({
      profile_id:
        data.profileId,
      device_identifier:
        data.deviceIdentifier,
      device_name:
        data.deviceName,
      device_type:
        data.deviceType,
      user_agent:
        data.userAgent ?? null,
      is_active:
        true,
      last_login_at:
        now,
      last_activity_at:
        now,
      ...(data.ipAddress
        ? {
            ip_address:
              data.ipAddress,
          }
        : {}),
    });
  }

  async getActiveDevices(
    profileId: string,
  ) {
    if (!profileId) {
      throw new Error(
        "Profile tidak ditemukan.",
      );
    }

    return deviceRepository
      .getActiveByProfile(
        profileId,
      );
  }

  async deactivateDevice(
    id: string,
  ) {
    if (!id) {
      throw new Error(
        "Perangkat tidak ditemukan.",
      );
    }

    return deviceRepository
      .deactivate(id);
  }
}

export const deviceService =
  new DeviceService();