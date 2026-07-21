import {
  paymentProofRepository,
} from "@/repositories/payment-proof.repository";

const MAX_FILE_SIZE =
  5 * 1024 * 1024;

const FILE_EXTENSIONS: Record<
  string,
  string
> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
};

export class PaymentProofService {
  async uploadPaymentProof(
    userId: string,
    enrollmentId: string,
    file: File,
  ): Promise<string> {
    if (!userId) {
      throw new Error(
        "User tidak ditemukan.",
      );
    }

    if (!enrollmentId) {
      throw new Error(
        "Enrollment tidak ditemukan.",
      );
    }

    if (!file || file.size === 0) {
      throw new Error(
        "Bukti pembayaran wajib dipilih.",
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new Error(
        "Ukuran bukti pembayaran maksimal 5 MB.",
      );
    }

    const extension =
      FILE_EXTENSIONS[file.type];

    if (!extension) {
      throw new Error(
        "Format file harus JPG, PNG, WEBP, atau PDF.",
      );
    }

    const fileName =
      `proof-${Date.now()}-${crypto.randomUUID()}.${extension}`;

    const path =
      `${userId}/${enrollmentId}/${fileName}`;

    return paymentProofRepository.upload(
      path,
      file,
    );
    
  }
    async getPaymentProofSignedUrl(
    path: string,
  ): Promise<string> {
    if (!path) {
      throw new Error(
        "Path bukti pembayaran tidak tersedia.",
      );
    }

    return paymentProofRepository
      .createSignedUrl(
        path,
        600,
      );
  }
}

export const paymentProofService =
  new PaymentProofService();