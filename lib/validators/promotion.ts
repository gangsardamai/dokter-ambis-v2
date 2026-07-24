export interface PromotionValidationResult {
  valid: boolean;
  message?: string;
}

type PromotionType =
  | "percentage"
  | "fixed_amount"
  | "special_price"
  | "free";

export function validatePromotion(data: {
  name: string;
  type: PromotionType;
  value: number;
  priority: number;
  quota: number | null;
  start_at: string;
  end_at: string | null;
}): PromotionValidationResult {
  if (!data.name.trim()) {
    return {
      valid: false,
      message: "Nama promotion wajib diisi.",
    };
  }

  if (!Number.isFinite(data.value)) {
    return {
      valid: false,
      message: "Nilai promotion wajib diisi dengan angka yang valid.",
    };
  }

  if (data.value < 0) {
    return {
      valid: false,
      message:
        "Nilai promotion harus berupa angka positif. Gunakan 20 untuk diskon 20%, bukan -20.",
    };
  }

  if (data.type === "percentage" && data.value > 100) {
    return {
      valid: false,
      message: "Persentase diskon maksimal 100%.",
    };
  }

  if (data.type === "free" && data.value !== 0) {
    return {
      valid: false,
      message: "Promotion gratis harus menggunakan nilai 0.",
    };
  }

  if (
    !Number.isInteger(data.priority) ||
    data.priority < 1
  ) {
    return {
      valid: false,
      message: "Priority harus berupa bilangan bulat minimal 1.",
    };
  }

  if (
    data.quota !== null &&
    (!Number.isInteger(data.quota) || data.quota < 1)
  ) {
    return {
      valid: false,
      message: "Quota harus berupa bilangan bulat minimal 1.",
    };
  }

  const startAt = new Date(data.start_at);

  if (Number.isNaN(startAt.getTime())) {
    return {
      valid: false,
      message: "Tanggal mulai tidak valid.",
    };
  }

  if (data.end_at) {
    const endAt = new Date(data.end_at);

    if (Number.isNaN(endAt.getTime())) {
      return {
        valid: false,
        message: "Tanggal berakhir tidak valid.",
      };
    }

    if (endAt < startAt) {
      return {
        valid: false,
        message: "Tanggal berakhir harus setelah tanggal mulai.",
      };
    }
  }

  return {
    valid: true,
  };
}
