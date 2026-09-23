import {
  leaderAccessRepository,
  type LeaderScopeType,
} from "@/repositories/leader-access.repository";
import {
  LEADER_PERMISSIONS,
  type LeaderPermission,
} from "@/lib/leader-access";
import { profileService } from "./profile.service";

export class LeaderAccessService {
  async getEnabledPermissions(leaderId: string) {
    return leaderAccessRepository.getEnabledPermissions(leaderId);
  }

  async requireStaffPermission(permission: LeaderPermission) {
    const profile = await profileService.getCurrentProfile();

    if (!profile || profile.status !== "active") {
      throw new Error("Akun aktif diperlukan.");
    }

    if (profile.role === "admin") {
      return profile;
    }

    if (
      profile.role === "leader" &&
      await leaderAccessRepository.hasPermission(profile.id, permission)
    ) {
      return profile;
    }

    throw new Error("Anda tidak memiliki izin untuk fitur ini.");
  }

  async requireAdmin() {
    const profile = await profileService.getCurrentProfile();

    if (
      !profile ||
      profile.role !== "admin" ||
      profile.status !== "active"
    ) {
      throw new Error("Akses Admin diperlukan.");
    }

    return profile;
  }

  async getManagementData() {
    await this.requireAdmin();

    const [leaders, scopes, permissions] = await Promise.all([
      leaderAccessRepository.getLeaders(),
      leaderAccessRepository.getAllScopes(),
      leaderAccessRepository.getAllPermissions(),
    ]);

    return { leaders, scopes, permissions };
  }

  async findStudentForEnrollmentByPhone(phone: string) {
    await this.requireStaffPermission("manage_enrollment");
    return leaderAccessRepository.findStudentByPhone(phone);
  }

  async promoteStudentByPhone(phone: string) {
    await this.requireAdmin();

    const student = await leaderAccessRepository.findStudentByPhone(phone);
    if (!student) {
      throw new Error("Peserta aktif dengan nomor WhatsApp tersebut tidak ditemukan.");
    }

    return leaderAccessRepository.promoteStudentToLeader(student.id);
  }

  async setLeaderStatus(
    leaderId: string,
    status: "active" | "inactive",
  ) {
    await this.requireAdmin();
    if (!leaderId) throw new Error("Leader tidak ditemukan.");
    return leaderAccessRepository.setLeaderStatus(leaderId, status);
  }

  async setPermissions(
    leaderId: string,
    permissions: LeaderPermission[],
  ) {
    const admin = await this.requireAdmin();
    if (!leaderId) throw new Error("Leader tidak ditemukan.");

    const validPermissions = permissions.filter((permission) =>
      (LEADER_PERMISSIONS as readonly string[]).includes(permission),
    );

    await leaderAccessRepository.setPermissions(
      leaderId,
      validPermissions,
      admin.id,
    );
  }

  async addScope(
    leaderId: string,
    scopeType: LeaderScopeType,
    scopeId: string,
  ) {
    const admin = await this.requireAdmin();

    if (!leaderId || !scopeId) {
      throw new Error("Leader dan scope wajib dipilih.");
    }

    if (!["organization", "program", "course"].includes(scopeType)) {
      throw new Error("Jenis scope tidak valid.");
    }

    await leaderAccessRepository.addScope(
      leaderId,
      scopeType,
      scopeId,
      admin.id,
    );
  }

  async removeScope(scopeId: string) {
    await this.requireAdmin();
    if (!scopeId) throw new Error("Scope tidak ditemukan.");
    await leaderAccessRepository.removeScope(scopeId);
  }
}

export const leaderAccessService = new LeaderAccessService();
