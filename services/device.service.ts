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

    return deviceRepository
      .registerOrRefreshStudentDevice({
        deviceIdentifier:
          data.deviceIdentifier,
        deviceName:
          data.deviceName,
        deviceType:
          data.deviceType,
        userAgent:
          data.userAgent,
        ipAddress:
          data.ipAddress,
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
