import {
  courseCommunityLinkRepository,
  courseRepository,
} from "@/repositories";

function normalizeWhatsAppGroupUrl(value: string): string | null {
  const trimmed = value.trim();

  if (!trimmed) return null;

  let url: URL;

  try {
    url = new URL(trimmed);
  } catch {
    throw new Error("Link grup WhatsApp tidak valid.");
  }

  if (url.protocol !== "https:" || url.hostname !== "chat.whatsapp.com") {
    throw new Error(
      "Link harus menggunakan format https://chat.whatsapp.com/...",
    );
  }

  const pathParts = url.pathname.split("/").filter(Boolean);
  const inviteCode = pathParts[0] ?? "";

  if (
    pathParts.length !== 1 ||
    !/^[A-Za-z0-9_-]+$/.test(inviteCode)
  ) {
    throw new Error(
      "Link harus menggunakan format https://chat.whatsapp.com/...",
    );
  }

  return `https://chat.whatsapp.com/${inviteCode}`;
}

export class CourseCommunityLinkService {
  async getCourseLink(courseId: string) {
    return courseCommunityLinkRepository.getByCourseId(courseId);
  }

  async getWhatsAppGroupUrl(courseId: string): Promise<string | null> {
    const link = await this.getCourseLink(courseId);
    return link?.whatsapp_group_url ?? null;
  }

  async saveWhatsAppGroupUrl(
    courseId: string,
    rawUrl: string,
  ): Promise<string | null> {
    const course = await courseRepository.getById(courseId);

    if (!course) {
      throw new Error("Course tidak ditemukan.");
    }

    const normalizedUrl = normalizeWhatsAppGroupUrl(rawUrl);

    if (!normalizedUrl) {
      await courseCommunityLinkRepository.deleteByCourseId(courseId);
      return null;
    }

    const saved = await courseCommunityLinkRepository.upsert(
      courseId,
      normalizedUrl,
    );

    return saved.whatsapp_group_url;
  }
}

export const courseCommunityLinkService =
  new CourseCommunityLinkService();
