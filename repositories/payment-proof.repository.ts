import { createClient } from "@/lib/supabase/server";

export class PaymentProofRepository {
  async upload(
    path: string,
    file: File,
  ): Promise<string> {
    const supabase =
      await createClient();

    const { data, error } =
      await supabase.storage
        .from("payment-proofs")
        .upload(
          path,
          file,
          {
            contentType: file.type,
            cacheControl: "3600",
            upsert: false,
          },
        );

    if (error) {
      throw new Error(
        `Gagal mengunggah bukti pembayaran: ${error.message}`,
      );
    }

    return data.path;
  }

  async createSignedUrl(
    path: string,
    expiresIn = 600,
  ): Promise<string> {
    const supabase =
      await createClient();

    const { data, error } =
      await supabase.storage
        .from("payment-proofs")
        .createSignedUrl(
          path,
          expiresIn,
        );

    if (error) {
      throw new Error(
        `Gagal membuka bukti pembayaran: ${error.message}`,
      );
    }

    return data.signedUrl;
  }
}

export const paymentProofRepository =
  new PaymentProofRepository();