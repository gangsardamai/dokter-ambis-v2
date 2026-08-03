import { studentCheckoutRepository } from "@/repositories/student-checkout.repository";
import type { PaymentTiming } from "@/supabase/types/payment-account.types";

export class StudentCheckoutService {
  async applyPromotionCode(
    enrollmentId: string,
    code: string,
    paymentTiming: PaymentTiming,
  ) {
    const normalizedCode = code.trim();

    if (!enrollmentId) throw new Error("Enrollment tidak ditemukan.");
    if (!normalizedCode) throw new Error("Kode promosi wajib diisi.");

    return studentCheckoutRepository.applyPromotionCode(
      enrollmentId,
      normalizedCode,
      paymentTiming,
    );
  }

  async submitZeroPayment(
    enrollmentId: string,
    paymentTiming: PaymentTiming,
  ) {
    if (!enrollmentId) throw new Error("Enrollment tidak ditemukan.");
    return studentCheckoutRepository.submitZeroPayment(
      enrollmentId,
      paymentTiming,
    );
  }
}

export const studentCheckoutService = new StudentCheckoutService();
