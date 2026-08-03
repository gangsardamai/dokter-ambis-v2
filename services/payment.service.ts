import type { Database } from "@/supabase/types/database.extended.types";

import { enrollmentRepository, paymentRepository } from "@/repositories";

type Payment = Database["public"]["Tables"]["payments"]["Row"];
type PaymentInsert = Database["public"]["Tables"]["payments"]["Insert"];
type PaymentUpdate = Database["public"]["Tables"]["payments"]["Update"];
type PaymentStatus = Database["public"]["Enums"]["payment_status"];

export class PaymentService {
  async getPayments(): Promise<Payment[]> {
    return paymentRepository.getAll();
  }

  async getPaymentById(id: string): Promise<Payment | null> {
    if (!id) throw new Error("ID payment wajib diisi.");
    return paymentRepository.getById(id);
  }

  async getPaymentByEnrollment(
    enrollmentId: string,
  ): Promise<Payment | null> {
    if (!enrollmentId) throw new Error("Enrollment tidak ditemukan.");
    return paymentRepository.getByEnrollment(enrollmentId);
  }

  async getPaymentsByStatus(status: PaymentStatus): Promise<Payment[]> {
    return paymentRepository.getByStatus(status);
  }

  async countPayments(): Promise<number> {
    return paymentRepository.count();
  }

  async countPaymentsByStatus(status: PaymentStatus): Promise<number> {
    return paymentRepository.countByStatus(status);
  }

  async createPayment(data: PaymentInsert): Promise<Payment> {
    if (!data.enrollment_id) throw new Error("Enrollment wajib diisi.");
    if (data.amount === undefined || data.amount === null) {
      throw new Error("Nominal pembayaran wajib diisi.");
    }
    if (data.amount < 0) throw new Error("Nominal pembayaran tidak valid.");

    const enrollment = await enrollmentRepository.getById(data.enrollment_id);
    if (!enrollment) throw new Error("Enrollment tidak ditemukan.");

    const existingPayment = await paymentRepository.getByEnrollment(
      data.enrollment_id,
    );
    if (existingPayment) {
      throw new Error("Payment untuk enrollment ini sudah tersedia.");
    }

    return paymentRepository.create({
      ...data,
      status: data.status ?? "pending",
      payment_method: data.payment_method ?? "bank_transfer",
    });
  }

  async submitPaymentProof(
    enrollmentId: string,
    amount: number,
    paymentProofPath: string,
  ): Promise<Payment> {
    if (!enrollmentId) throw new Error("Enrollment tidak ditemukan.");
    if (!paymentProofPath.trim()) {
      throw new Error("Bukti pembayaran tidak ditemukan.");
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error("Nominal pembayaran tidak valid.");
    }

    return paymentRepository.submitAsStudent(
      enrollmentId,
      amount,
      paymentProofPath.trim(),
    );
  }

  async updatePayment(id: string, data: PaymentUpdate): Promise<Payment> {
    if (!id) throw new Error("ID payment wajib diisi.");
    const existing = await paymentRepository.getById(id);
    if (!existing) throw new Error("Payment tidak ditemukan.");
    return paymentRepository.update(id, data);
  }

  async updatePaymentProof(
    id: string,
    paymentProofPath: string,
  ): Promise<Payment> {
    if (!paymentProofPath.trim()) {
      throw new Error("Bukti pembayaran wajib diisi.");
    }
    return this.updatePayment(id, {
      payment_proof_path: paymentProofPath.trim(),
      paid_at: new Date().toISOString(),
      status: "pending",
    });
  }

  async approvePayment(id: string, verifiedBy: string): Promise<Payment> {
    if (!id) throw new Error("Payment tidak ditemukan.");
    if (!verifiedBy) throw new Error("Admin verifier wajib diisi.");
    return paymentRepository.reviewAsAdmin(id, "approved");
  }

  async rejectPayment(
    id: string,
    verifiedBy: string,
    notes?: string | null,
  ): Promise<Payment> {
    if (!id) throw new Error("Payment tidak ditemukan.");
    if (!verifiedBy) throw new Error("Admin verifier wajib diisi.");
    return paymentRepository.reviewAsAdmin(id, "rejected", notes);
  }

  async resetToPending(id: string): Promise<Payment> {
    return this.updatePayment(id, {
      status: "pending",
      verified_by: null,
      verified_at: null,
    });
  }

  async approveAllPendingPayments(verifiedBy: string): Promise<Payment[]> {
    if (!verifiedBy) throw new Error("Admin verifier wajib tersedia.");
    return paymentRepository.approveAllPendingAsAdmin();
  }

  async deletePayment(id: string): Promise<void> {
    if (!id) throw new Error("ID payment wajib diisi.");
    const existing = await paymentRepository.getById(id);
    if (!existing) throw new Error("Payment tidak ditemukan.");
    await paymentRepository.delete(id);
  }
}

export const paymentService = new PaymentService();
