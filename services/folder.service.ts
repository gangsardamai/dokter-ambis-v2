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
    if (data.parent_folder_id) {
      const parent = await folderRepository.getById(data.parent_folder_id);
      if (!parent || parent.course_id !== data.course_id) {
        throw new Error("Folder induk tidak termasuk dalam course yang dipilih.");
      }
    }

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
      publication_status: "published",
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

    const targetParentId =
      data.parent_folder_id === undefined
        ? existing.parent_folder_id
        : data.parent_folder_id;

    if (targetParentId) {
      const parent = await folderRepository.getById(targetParentId);
      if (
        !parent ||
        parent.course_id !== existing.course_id ||
        parent.id === existing.id
      ) {
        throw new Error("Folder induk tidak valid untuk course ini.");
      }
    }

    return await folderRepository.update(id, {
      ...data,
      course_id: existing.course_id,
      slug: existing.slug,
      publication_status: "published",
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
