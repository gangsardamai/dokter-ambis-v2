import {
  studentCheckoutRepository,
} from "@/repositories/student-checkout.repository";

export class StudentCheckoutService {
  async applyPromotionCode(
    enrollmentId: string,
    code: string,
  ) {
    const normalizedCode = code.trim();

    if (!enrollmentId) {
      throw new Error("Enrollment tidak ditemukan.");
    }

    if (!normalizedCode) {
      throw new Error("Kode promosi wajib diisi.");
    }

    return studentCheckoutRepository.applyPromotionCode(
      enrollmentId,
      normalizedCode,
    );
  }

  async submitZeroPayment(
    enrollmentId: string,
  ) {
    if (!enrollmentId) {
      throw new Error("Enrollment tidak ditemukan.");
    }

    return studentCheckoutRepository.submitZeroPayment(
      enrollmentId,
    );
  }
}

export const studentCheckoutService =
  new StudentCheckoutService();
