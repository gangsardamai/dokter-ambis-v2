export interface CourseValidationInput {

  title: string;

  slug: string;

  organization_id: string;

  program_id: string;

  price: number;

}

export function validateCourse(
  data: CourseValidationInput
) {

  if (!data.title.trim()) {

    return {

      valid: false,

      message: "Nama course wajib diisi.",

    };

  }

  if (!data.slug.trim()) {

    return {

      valid: false,

      message: "Slug wajib diisi.",

    };

  }

  if (!data.organization_id) {

    return {

      valid: false,

      message: "Universitas wajib dipilih.",

    };

  }

  if (!data.program_id) {

    return {

      valid: false,

      message: "Program wajib dipilih.",

    };

  }

  if (data.price < 0) {

    return {

      valid: false,

      message: "Harga tidak boleh negatif.",

    };

  }

  return {

    valid: true,

  };

}