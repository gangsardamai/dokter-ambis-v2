import type { Database } from "@/supabase/types/database.extended.types";

import { BaseRepository } from "./base.repository";

type Payment = Database["public"]["Tables"]["payments"]["Row"];
type PaymentInsert = Database["public"]["Tables"]["payments"]["Insert"];
type PaymentUpdate = Database["public"]["Tables"]["payments"]["Update"];
type PaymentStatus = Database["public"]["Enums"]["payment_status"];

export class PaymentRepository extends BaseRepository {
  async getAll(): Promise<Payment[]> {
    const supabase = await this.db();
    const { data, error } = await supabase
      .from("payments")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) this.handleError(error);
    return data ?? [];
  }

  async getById(id: string): Promise<Payment | null> {
    const supabase = await this.db();
    const { data, error } = await supabase
      .from("payments")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) this.handleError(error);
    return data;
  }

  async getByEnrollment(enrollmentId: string): Promise<Payment | null> {
    const supabase = await this.db();
    const { data, error } = await supabase
      .from("payments")
      .select("*")
      .eq("enrollment_id", enrollmentId)
      .maybeSingle();

    if (error) this.handleError(error);
    return data;
  }

  async getByStatus(status: PaymentStatus): Promise<Payment[]> {
    const supabase = await this.db();
    const { data, error } = await supabase
      .from("payments")
      .select("*")
      .eq("status", status)
      .order("created_at", { ascending: false });

    if (error) this.handleError(error);
    return data ?? [];
  }

  async count(): Promise<number> {
    const supabase = await this.db();
    const { count, error } = await supabase
      .from("payments")
      .select("*", { count: "exact", head: true });

    if (error) this.handleError(error);
    return count ?? 0;
  }

  async countByStatus(status: PaymentStatus): Promise<number> {
    const supabase = await this.db();
    const { count, error } = await supabase
      .from("payments")
      .select("*", { count: "exact", head: true })
      .eq("status", status);

    if (error) this.handleError(error);
    return count ?? 0;
  }

  async create(data: PaymentInsert): Promise<Payment> {
    const supabase = await this.db();
    const { data: created, error } = await supabase
      .from("payments")
      .insert(data)
      .select()
      .single();

    if (error) this.handleError(error);
    return created;
  }

  async update(id: string, data: PaymentUpdate): Promise<Payment> {
    const supabase = await this.db();
    const { data: updated, error } = await supabase
      .from("payments")
      .update(data)
      .eq("id", id)
      .select()
      .single();

    if (error) this.handleError(error);
    return updated;
  }

  async submitAsStudent(
    enrollmentId: string,
    amount: number,
    paymentProofPath: string,
  ): Promise<Payment> {
    const supabase = await this.db();
    const { data, error } = await supabase.rpc("student_submit_payment", {
      target_enrollment_id: enrollmentId,
      target_amount: amount,
      target_payment_proof_path: paymentProofPath,
    });

    if (error) this.handleError(error);
    if (!data) throw new Error("Hasil pengiriman pembayaran tidak tersedia.");
    return data;
  }

  async reviewAsAdmin(
    paymentId: string,
    status: Extract<PaymentStatus, "approved" | "rejected">,
    notes?: string | null,
  ): Promise<Payment> {
    const supabase = await this.db();
    const { data, error } = await supabase.rpc("admin_review_payment", {
      target_payment_id: paymentId,
      target_status: status,
      rejection_notes: notes ?? null,
    });

    if (error) this.handleError(error);
    if (!data) throw new Error("Hasil review pembayaran tidak tersedia.");
    return data;
  }

  async approveAllPendingAsAdmin(): Promise<Payment[]> {
    const supabase = await this.db();
    const { data, error } = await supabase.rpc(
      "admin_approve_all_pending_payments",
    );

    if (error) this.handleError(error);
    return data ?? [];
  }

  async delete(id: string): Promise<void> {
    const supabase = await this.db();
    const { error } = await supabase.from("payments").delete().eq("id", id);

    if (error) this.handleError(error);
  }
}

export const paymentRepository = new PaymentRepository();
