import type { Database } from "@/supabase/types/database.types";

import {
  enrollmentRepository,
  paymentRepository,
} from "@/repositories";

type Payment =
  Database["public"]["Tables"]["payments"]["Row"];

type PaymentInsert =
  Database["public"]["Tables"]["payments"]["Insert"];

type PaymentUpdate =
  Database["public"]["Tables"]["payments"]["Update"];

type PaymentStatus =
  Database["public"]["Enums"]["payment_status"];

export class PaymentService {

  /* ========================================
     READ
  ======================================== */

  async getPayments(): Promise<Payment[]> {

    return paymentRepository.getAll();

  }

  async getPaymentById(
    id: string
  ): Promise<Payment | null> {

    if (!id) {
      throw new Error("ID payment wajib diisi.");
    }

    return paymentRepository.getById(id);

  }

  async getPaymentByEnrollment(
    enrollmentId: string
  ): Promise<Payment | null> {

    if (!enrollmentId) {
      throw new Error(
        "Enrollment tidak ditemukan.",
      );
    }

    return paymentRepository.getByEnrollment(
      enrollmentId,
    );

  }

  async getPaymentsByStatus(
    status: PaymentStatus
  ): Promise<Payment[]> {

    return paymentRepository.getByStatus(
      status,
    );

  }

  async countPayments(): Promise<number> {

    return paymentRepository.count();

  }

  async countPaymentsByStatus(
    status: PaymentStatus
  ): Promise<number> {

    return paymentRepository.countByStatus(
      status,
    );

  }

  /* ========================================
     CREATE
  ======================================== */

  async createPayment(
    data: PaymentInsert
  ): Promise<Payment> {

    if (!data.enrollment_id) {
      throw new Error(
        "Enrollment wajib diisi.",
      );
    }

    if (
      data.amount === undefined ||
      data.amount === null
    ) {
      throw new Error(
        "Nominal pembayaran wajib diisi.",
      );
    }

    if (data.amount < 0) {
      throw new Error(
        "Nominal pembayaran tidak valid.",
      );
    }

    const enrollment =
      await enrollmentRepository.getById(
        data.enrollment_id,
      );

    if (!enrollment) {
      throw new Error(
        "Enrollment tidak ditemukan.",
      );
    }

    const existingPayment =
      await paymentRepository.getByEnrollment(
        data.enrollment_id,
      );

    if (existingPayment) {
      throw new Error(
        "Payment untuk enrollment ini sudah tersedia.",
      );
    }

    const payment =
      await paymentRepository.create({
        ...data,
        status:
          data.status ?? "pending",
        payment_method:
          data.payment_method ??
          "bank_transfer",
      });

    await enrollmentRepository.update(
      data.enrollment_id,
      {
        status: "pending_approval",
      },
    );

    return payment;

  }
  async submitPaymentProof(
    enrollmentId: string,
    amount: number,
    paymentProofPath: string,
  ): Promise<Payment> {
    if (!enrollmentId) {
      throw new Error(
        "Enrollment tidak ditemukan.",
      );
    }

    if (!paymentProofPath) {
      throw new Error(
        "Bukti pembayaran tidak ditemukan.",
      );
    }

    if (amount < 0) {
      throw new Error(
        "Nominal pembayaran tidak valid.",
      );
    }

    const enrollment =
      await enrollmentRepository.getById(
        enrollmentId,
      );

    if (!enrollment) {
      throw new Error(
        "Enrollment tidak ditemukan.",
      );
    }

    const existingPayment =
      await paymentRepository.getByEnrollment(
        enrollmentId,
      );

    if (
      existingPayment?.status ===
      "approved"
    ) {
      throw new Error(
        "Pembayaran sudah disetujui.",
      );
    }

    const now =
      new Date().toISOString();

    if (existingPayment) {
      const updatedPayment =
        await paymentRepository.update(
          existingPayment.id,
          {
            amount,
            payment_proof_path:
              paymentProofPath,
            payment_method:
              "bank_transfer",
            status: "pending",
            paid_at: now,
            verified_by: null,
            verified_at: null,
            notes: null,
          },
        );

      await enrollmentRepository.update(
        enrollmentId,
        {
          status: "pending_approval",
          activated_at: null,
        },
      );

      return updatedPayment;
    }

    return this.createPayment({
      enrollment_id:
        enrollmentId,
      amount,
      payment_method:
        "bank_transfer",
      payment_proof_path:
        paymentProofPath,
      paid_at: now,
      status: "pending",
    });
  }
  /* ========================================
     UPDATE
  ======================================== */

  async updatePayment(
    id: string,
    data: PaymentUpdate
  ): Promise<Payment> {

    if (!id) {
      throw new Error("ID payment wajib diisi.");
    }

    const existing =
      await paymentRepository.getById(id);

    if (!existing) {
      throw new Error(
        "Payment tidak ditemukan.",
      );
    }

    return paymentRepository.update(
      id,
      data,
    );

  }

  async updatePaymentProof(
    id: string,
    paymentProofPath: string
  ): Promise<Payment> {

    if (!paymentProofPath) {
      throw new Error(
        "Bukti pembayaran wajib diisi.",
      );
    }

    return this.updatePayment(
      id,
      {
        payment_proof_path:
          paymentProofPath,
        paid_at:
          new Date().toISOString(),
        status: "pending",
      },
    );

  }

  async approvePayment(
    id: string,
    verifiedBy: string
  ): Promise<Payment> {

    if (!verifiedBy) {
      throw new Error(
        "Admin verifier wajib diisi.",
      );
    }

    const payment =
      await paymentRepository.getById(id);

    if (!payment) {
      throw new Error(
        "Payment tidak ditemukan.",
      );
    }

    const updatedPayment =
      await paymentRepository.update(
        id,
        {
          status: "approved",
          verified_by: verifiedBy,
          verified_at:
            new Date().toISOString(),
        },
      );

    await enrollmentRepository.update(
      payment.enrollment_id,
      {
        status: "active",
        activated_at:
          new Date().toISOString(),
      },
    );

    return updatedPayment;

  }

  async rejectPayment(
    id: string,
    verifiedBy: string,
    notes?: string | null
  ): Promise<Payment> {

    if (!verifiedBy) {
      throw new Error(
        "Admin verifier wajib diisi.",
      );
    }

    const payment =
      await paymentRepository.getById(id);

    if (!payment) {
      throw new Error(
        "Payment tidak ditemukan.",
      );
    }

    const updatedPayment =
      await paymentRepository.update(
        id,
        {
          status: "rejected",
          verified_by: verifiedBy,
          verified_at:
            new Date().toISOString(),
          notes:
            notes ?? null,
        },
      );

    await enrollmentRepository.update(
      payment.enrollment_id,
      {
        status: "pending_payment",
        activated_at: null,
      },
    );

    return updatedPayment;

  }

  async resetToPending(
    id: string
  ): Promise<Payment> {

    return this.updatePayment(
      id,
      {
        status: "pending",
        verified_by: null,
        verified_at: null,
      },
    );

  }
  async approveAllPendingPayments(
  verifiedBy: string,
): Promise<Payment[]> {
  if (!verifiedBy) {
    throw new Error(
      "Admin verifier wajib tersedia.",
    );
  }

  const pendingPayments =
    await paymentRepository.getPendingPayments();

  if (pendingPayments.length === 0) {
    return [];
  }

  const approvedPayments =
    await paymentRepository.approveAllPending(
      verifiedBy,
    );

  const now = new Date().toISOString();

  await Promise.all(
    approvedPayments.map((payment) =>
      enrollmentRepository.update(
        payment.enrollment_id,
        {
          status: "active",
          activated_at: now,
        },
      ),
    ),
  );

  return approvedPayments;
}

  /* ========================================
     DELETE
  ======================================== */

  async deletePayment(
    id: string
  ): Promise<void> {

    if (!id) {
      throw new Error("ID payment wajib diisi.");
    }

    const existing =
      await paymentRepository.getById(id);

    if (!existing) {
      throw new Error(
        "Payment tidak ditemukan.",
      );
    }

    await paymentRepository.delete(id);

  }

}

export const paymentService =
  new PaymentService();