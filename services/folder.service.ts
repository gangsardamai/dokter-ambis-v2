import { folderRepository } from "@/repositories";

import type { Database } from "@/supabase/types/database.types";

type LessonFolderInsert =
  Database["public"]["Tables"]["lesson_folders"]["Insert"];

type LessonFolderUpdate =
  Database["public"]["Tables"]["lesson_folders"]["Update"];

export class FolderService {

  /* ========================================
     READ
  ======================================== */

  async getFolders() {
    return await folderRepository.getAll();
  }

  async getFolderById(
    id: string
  ) {
    return await folderRepository.getById(id);
  }

  async getFoldersByCourse(
    courseId: string
  ) {
    return await folderRepository.getByCourse(
      courseId
    );
  }

  async getRootFolders(
    courseId: string
  ) {
    return await folderRepository.getRootFolders(
      courseId
    );
  }

  async getChildren(
    parentFolderId: string
  ) {
    return await folderRepository.getChildren(
      parentFolderId
    );
  }

  async countFolders() {
    return await folderRepository.count();
  }

  /* ========================================
     CREATE
  ======================================== */

  async createFolder(
    data: LessonFolderInsert
  ) {

    // Sprint 1
    // Business validation akan ditambahkan
    // pada Sprint Explorer.

    return await folderRepository.create(
      data
    );

  }

  /* ========================================
     UPDATE
  ======================================== */

  async updateFolder(
    id: string,
    data: LessonFolderUpdate
  ) {

    return await folderRepository.update(
      id,
      data
    );

  }

  /* ========================================
     DELETE
  ======================================== */

  async deleteFolder(
    id: string
  ) {

    return await folderRepository.delete(
      id
    );

  }

}

export const folderService =
  new FolderService();