import { createClient } from "@/lib/supabase/server";
import type { PaymentTiming } from "@/supabase/types/payment-account.types";

interface RpcError {
  message: string;
}

interface RpcResponse<T> {
  data: T | null;
  error: RpcError | null;
}

interface RpcClient {
  rpc<T>(
    functionName: string,
    args: Record<string, unknown>,
  ): Promise<RpcResponse<T>>;
}

export interface PromotionApplicationResult {
  promotion_id: string;
  promotion_code: string;
  promotion_name: string;
  discount_amount: number;
  final_amount: number;
}

export interface ZeroPaymentSubmissionResult {
  enrollment_id: string;
  status: "pending_approval" | "active";
  amount: number;
}

export class StudentCheckoutRepository {
  private async rpcClient(): Promise<RpcClient> {
    const supabase = await createClient();
    return supabase as unknown as RpcClient;
  }

  async applyPromotionCode(
    enrollmentId: string,
    code: string,
    paymentTiming: PaymentTiming,
  ): Promise<PromotionApplicationResult> {
    const client = await this.rpcClient();
    const functionName =
      paymentTiming === "deferred"
        ? "apply_deferred_promotion_code"
        : "apply_promotion_code";
    const { data, error } = await client.rpc<PromotionApplicationResult>(
      functionName,
      {
        target_enrollment_id: enrollmentId,
        submitted_code: code,
      },
    );

    if (error) throw new Error(error.message);
    if (!data) throw new Error("Hasil penerapan promosi tidak tersedia.");
    return data;
  }

  async submitZeroPayment(
    enrollmentId: string,
    paymentTiming: PaymentTiming,
  ): Promise<ZeroPaymentSubmissionResult> {
    const client = await this.rpcClient();
    const functionName =
      paymentTiming === "deferred"
        ? "submit_deferred_zero_payment"
        : "submit_zero_payment_enrollment";
    const { data, error } = await client.rpc<ZeroPaymentSubmissionResult>(
      functionName,
      { target_enrollment_id: enrollmentId },
    );

    if (error) throw new Error(error.message);
    if (!data) throw new Error("Hasil pengiriman pendaftaran tidak tersedia.");
    return data;
  }
}

export const studentCheckoutRepository = new StudentCheckoutRepository();
