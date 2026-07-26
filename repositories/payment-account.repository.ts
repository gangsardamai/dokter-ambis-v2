import type { Database } from "@/supabase/types/database.extended.types";

import { BaseRepository } from "./base.repository";

type PaymentAccount =
  Database["public"]["Tables"]["payment_accounts"]["Row"];
type PaymentAccountInsert =
  Database["public"]["Tables"]["payment_accounts"]["Insert"];
type PaymentAccountUpdate =
  Database["public"]["Tables"]["payment_accounts"]["Update"];

export class PaymentAccountRepository extends BaseRepository {
  async getAll(): Promise<PaymentAccount[]> {
    const supabase = await this.db();
    const { data, error } = await supabase
      .from("payment_accounts")
      .select("*")
      .order("is_default", { ascending: false })
      .order("label");

    if (error) this.handleError(error);
    return data ?? [];
  }

  async getActive(): Promise<PaymentAccount[]> {
    const supabase = await this.db();
    const { data, error } = await supabase
      .from("payment_accounts")
      .select("*")
      .eq("is_active", true)
      .order("is_default", { ascending: false })
      .order("label");

    if (error) this.handleError(error);
    return data ?? [];
  }

  async getById(id: string): Promise<PaymentAccount | null> {
    const supabase = await this.db();
    const { data, error } = await supabase
      .from("payment_accounts")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) this.handleError(error);
    return data;
  }

  async getForCourse(courseId: string): Promise<PaymentAccount | null> {
    const supabase = await this.db();
    const { data: course, error: courseError } = await supabase
      .from("courses")
      .select("payment_account_id")
      .eq("id", courseId)
      .maybeSingle();

    if (courseError) this.handleError(courseError);
    if (!course?.payment_account_id) return null;
    return this.getById(course.payment_account_id);
  }

  async create(input: PaymentAccountInsert): Promise<PaymentAccount> {
    const supabase = await this.db();
    const { data, error } = await supabase
      .from("payment_accounts")
      .insert(input)
      .select("*")
      .single();

    if (error) this.handleError(error);
    return data;
  }

  async update(
    id: string,
    input: PaymentAccountUpdate,
  ): Promise<PaymentAccount> {
    const supabase = await this.db();
    const { data, error } = await supabase
      .from("payment_accounts")
      .update(input)
      .eq("id", id)
      .select("*")
      .single();

    if (error) this.handleError(error);
    return data;
  }

  async setDefault(id: string): Promise<void> {
    const supabase = await this.db();
    const { error } = await supabase.rpc(
      "admin_set_default_payment_account",
      { target_account_id: id },
    );

    if (error) this.handleError(error);
  }

  async getCourseUsageCounts(): Promise<Record<string, number>> {
    const supabase = await this.db();
    const { data, error } = await supabase
      .from("courses")
      .select("payment_account_id");

    if (error) this.handleError(error);
    return (data ?? []).reduce<Record<string, number>>((counts, course) => {
      const accountId = course.payment_account_id;
      counts[accountId] = (counts[accountId] ?? 0) + 1;
      return counts;
    }, {});
  }
}

export const paymentAccountRepository = new PaymentAccountRepository();
