import { enrollmentExportRepository } from "@/repositories/enrollment-export.repository";

export class EnrollmentExportService {
  async getEnrollments() {
    return enrollmentExportRepository.getAll();
  }
}

export const enrollmentExportService = new EnrollmentExportService();
