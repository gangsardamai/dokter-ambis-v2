export interface PromotionValidationResult {

  valid: boolean;

  message?: string;

}

export function validatePromotion(data: {

  name: string;

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

  if (data.value < 0) {

    return {

      valid: false,

      message: "Value tidak boleh kurang dari 0.",

    };

  }

  if (data.priority < 1) {

    return {

      valid: false,

      message: "Priority minimal 1.",

    };

  }

  if (

    data.quota !== null &&

    data.quota < 1

  ) {

    return {

      valid: false,

      message: "Quota minimal 1.",

    };

  }

  if (

    data.end_at &&

    new Date(data.end_at) <

      new Date(data.start_at)

  ) {

    return {

      valid: false,

      message:
        "Tanggal berakhir harus setelah tanggal mulai.",

    };

  }

  return {

    valid: true,

  };

}