import { createUniqueSlug } from "@/lib/slug";
import {
  folderRepository,
  lessonRepository,
} from "@/repositories";

import type { Database } from "@/supabase/types/database.types";

type LessonFolderInsert =
  Database["public"]["Tables"]["lesson_folders"]["Insert"];

type LessonFolderUpdate =
  Database["public"]["Tables"]["lesson_folders"]["Update"];

export class FolderService {
  async getFolders() {
    return await folderRepository.getAll();
  }

  async getFolderById(id: string) {
    return await folderRepository.getById(id);
  }

  async getFoldersByCourse(courseId: string) {
    return await folderRepository.getByCourse(courseId);
  }

  async getRootFolders(courseId: string) {
    return await folderRepository.getRootFolders(courseId);
  }

  async getChildren(parentFolderId: string) {
    return await folderRepository.getChildren(parentFolderId);
  }

  async countFolders() {
    return await folderRepository.count();
  }

  async createFolder(data: LessonFolderInsert) {
    const existingFolders = await folderRepository.getByCourse(
      data.course_id,
    );
    const usedSlugs = new Set(
      existingFolders.map((folder) => folder.slug),
    );
    const slug = await createUniqueSlug(
      data.title,
      async (candidate) => !usedSlugs.has(candidate),
    );

    return await folderRepository.create({
      ...data,
      slug,
    });
  }

  async updateFolder(
    id: string,
    data: LessonFolderUpdate,
  ) {
    const existing = await folderRepository.getById(id);

    if (!existing) {
      throw new Error("Folder tidak ditemukan.");
    }

    return await folderRepository.update(id, {
      ...data,
      slug: existing.slug,
    });
  }

  async deleteFolder(
    id: string,
    expectedCourseId?: string,
  ) {
    const folder = await folderRepository.getById(id);

    if (!folder) {
      throw new Error(
        "Folder tidak ditemukan atau Anda tidak memiliki akses.",
      );
    }

    if (
      expectedCourseId &&
      folder.course_id !== expectedCourseId
    ) {
      throw new Error(
        "Folder tidak termasuk dalam course yang dipilih.",
      );
    }

    const [children, lessons] = await Promise.all([
      folderRepository.getChildren(id),
      lessonRepository.getByFolder(id),
    ]);

    if (children.length > 0) {
      throw new Error(
        "Folder masih memiliki subfolder. Hapus atau pindahkan subfolder terlebih dahulu.",
      );
    }

    if (lessons.length > 0) {
      throw new Error(
        "Folder masih berisi lesson. Hapus atau pindahkan lesson terlebih dahulu.",
      );
    }

    return await folderRepository.delete(id);
  }
}

export const folderService = new FolderService();
