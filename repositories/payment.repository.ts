import type { Database } from "@/supabase/types/database.types";

import { BaseRepository } from "./base.repository";

type Payment =
  Database["public"]["Tables"]["payments"]["Row"];

type PaymentInsert =
  Database["public"]["Tables"]["payments"]["Insert"];

type PaymentUpdate =
  Database["public"]["Tables"]["payments"]["Update"];

type PaymentStatus =
  Database["public"]["Enums"]["payment_status"];

export class PaymentRepository extends BaseRepository {

  /* ========================================
     READ
  ======================================== */

  async getAll(): Promise<Payment[]> {

    const supabase = await this.db();

    const { data, error } = await supabase
      .from("payments")
      .select("*")
      .order("created_at", {
        ascending: false,
      });

    if (error) this.handleError(error);

    return data ?? [];

  }

  async getById(
    id: string
  ): Promise<Payment | null> {

    const supabase = await this.db();

    const { data, error } = await supabase
      .from("payments")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) this.handleError(error);

    return data;

  }

  async getByEnrollment(
    enrollmentId: string
  ): Promise<Payment | null> {

    const supabase = await this.db();

    const { data, error } = await supabase
      .from("payments")
      .select("*")
      .eq("enrollment_id", enrollmentId)
      .maybeSingle();

    if (error) this.handleError(error);

    return data;

  }

  async getByStatus(
    status: PaymentStatus
  ): Promise<Payment[]> {

    const supabase = await this.db();

    const { data, error } = await supabase
      .from("payments")
      .select("*")
      .eq("status", status)
      .order("created_at", {
        ascending: false,
      });

    if (error) this.handleError(error);

    return data ?? [];

  }

  async count(): Promise<number> {

    const supabase = await this.db();

    const { count, error } = await supabase
      .from("payments")
      .select("*", {
        count: "exact",
        head: true,
      });

    if (error) this.handleError(error);

    return count ?? 0;

  }

  async countByStatus(
    status: PaymentStatus
  ): Promise<number> {

    const supabase = await this.db();

    const { count, error } = await supabase
      .from("payments")
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq("status", status);

    if (error) this.handleError(error);

    return count ?? 0;

  }

  /* ========================================
     CREATE
  ======================================== */

  async create(
    data: PaymentInsert
  ): Promise<Payment> {

    const supabase = await this.db();

    const { data: created, error } = await supabase
      .from("payments")
      .insert(data)
      .select()
      .single();

    if (error) this.handleError(error);

    return created;

  }

  /* ========================================
     UPDATE
  ======================================== */

  async update(
    id: string,
    data: PaymentUpdate
  ): Promise<Payment> {

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

  async getPendingPayments(): Promise<Payment[]> {
  const supabase = await this.db();

  const { data, error } = await supabase
    .from("payments")
    .select("*")
    .eq("status", "pending")
    .order("created_at", {
      ascending: true,
    });

  if (error) this.handleError(error);

  return data ?? [];

  
}
async approveAllPending(
  verifiedBy: string,
): Promise<Payment[]> {
  const supabase = await this.db();

  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("payments")
    .update({
      status: "approved",
      verified_by: verifiedBy,
      verified_at: now,
      updated_at: now,
    })
    .eq("status", "pending")
    .select();

  if (error) this.handleError(error);

  return data ?? [];
}

  /* ========================================
     DELETE
  ======================================== */

  async delete(
    id: string
  ): Promise<void> {

    const supabase = await this.db();

    const { error } = await supabase
      .from("payments")
      .delete()
      .eq("id", id);

    if (error) this.handleError(error);

  }

}

export const paymentRepository =
  new PaymentRepository();