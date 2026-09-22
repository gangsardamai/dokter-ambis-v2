import {
  announcementRepository,
  type AnnouncementInsert,
  type AnnouncementUpdate,
  type AnnouncementWithTargets,
} from "@/repositories";

export interface AnnouncementWriteInput {
  title: string;
  content: string;
  allStudents: boolean;
  isPublished: boolean;
  startsAt: string;
  endsAt: string | null;
  showOnDashboard: boolean;
  organizationIds: string[];
  courseIds: string[];
}

function uniqueIds(values: string[]): string[] {
  return Array.from(
    new Set(values.map((value) => value.trim()).filter(Boolean)),
  );
}

export class AnnouncementService {
  async getAdminAnnouncements(): Promise<AnnouncementWithTargets[]> {
    return announcementRepository.getAdminAll();
  }

  async getAdminAnnouncementById(
    id: string,
  ): Promise<AnnouncementWithTargets | null> {
    if (!id) return null;
    return announcementRepository.getByIdAdmin(id);
  }

  async getStudentDashboardAnnouncements() {
    return announcementRepository.getStudentAnnouncements(true);
  }

  async getStudentAnnouncementArchive() {
    return announcementRepository.getStudentAnnouncements(false);
  }

  async create(
    createdBy: string,
    input: AnnouncementWriteInput,
  ): Promise<AnnouncementWithTargets> {
    const normalized = this.validateInput(input);
    const displayOrder =
      await announcementRepository.getNextDisplayOrder();

    const data: AnnouncementInsert = {
      created_by: createdBy,
      title: normalized.title,
      content: normalized.content,
      all_students: normalized.allStudents,
      is_published: normalized.isPublished,
      starts_at: normalized.startsAt,
      ends_at: normalized.endsAt,
      show_on_dashboard: normalized.showOnDashboard,
      display_order: displayOrder,
    };

    return announcementRepository.create(
      data,
      normalized.organizationIds,
      normalized.courseIds,
    );
  }

  async update(
    id: string,
    input: AnnouncementWriteInput,
  ): Promise<AnnouncementWithTargets> {
    const existing = await announcementRepository.getByIdAdmin(id);
    if (!existing) {
      throw new Error("Pengumuman tidak ditemukan.");
    }

    const normalized = this.validateInput(input);
    const data: AnnouncementUpdate = {
      title: normalized.title,
      content: normalized.content,
      all_students: normalized.allStudents,
      is_published: normalized.isPublished,
      starts_at: normalized.startsAt,
      ends_at: normalized.endsAt,
      show_on_dashboard: normalized.showOnDashboard,
    };

    return announcementRepository.update(
      id,
      data,
      normalized.organizationIds,
      normalized.courseIds,
    );
  }

  async move(
    id: string,
    direction: "up" | "down",
  ): Promise<void> {
    await announcementRepository.moveDashboard(id, direction);
  }

  async delete(id: string): Promise<void> {
    await announcementRepository.delete(id);
  }

  private validateInput(input: AnnouncementWriteInput) {
    const title = input.title.trim();
    const content = input.content.trim();
    const organizationIds = uniqueIds(input.organizationIds);
    const courseIds = uniqueIds(input.courseIds);

    if (!title) {
      throw new Error("Judul pengumuman wajib diisi.");
    }

    if (title.length > 200) {
      throw new Error("Judul pengumuman maksimal 200 karakter.");
    }

    if (!content) {
      throw new Error("Isi pengumuman wajib diisi.");
    }

    const startsAt = new Date(input.startsAt);
    if (Number.isNaN(startsAt.getTime())) {
      throw new Error("Tanggal mulai tidak valid.");
    }

    let endsAt: Date | null = null;
    if (input.endsAt) {
      endsAt = new Date(input.endsAt);
      if (Number.isNaN(endsAt.getTime())) {
        throw new Error("Tanggal berakhir tidak valid.");
      }

      if (endsAt.getTime() < startsAt.getTime()) {
        throw new Error(
          "Tanggal berakhir tidak boleh lebih awal dari tanggal mulai.",
        );
      }
    }

    if (
      !input.allStudents &&
      organizationIds.length === 0 &&
      courseIds.length === 0
    ) {
      throw new Error(
        "Pilih Semua Peserta atau minimal satu universitas/course.",
      );
    }

    return {
      title,
      content,
      allStudents: input.allStudents,
      isPublished: input.isPublished,
      startsAt: startsAt.toISOString(),
      endsAt: endsAt?.toISOString() ?? null,
      showOnDashboard: input.showOnDashboard,
      organizationIds: input.allStudents ? [] : organizationIds,
      courseIds: input.allStudents ? [] : courseIds,
    };
  }
}

export const announcementService = new AnnouncementService();
