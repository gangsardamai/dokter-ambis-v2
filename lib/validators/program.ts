export interface ProgramValidationResult {

  valid: boolean;

  message?: string;

}

export function validateProgram(data: {

  title: string;

  slug: string;

  organization_id: string;

}) : ProgramValidationResult {

  if (!data.title.trim()) {

    return {

      valid: false,

      message: "Nama program wajib diisi.",

    };

  }

  if (!data.organization_id) {

    return {

      valid: false,

      message: "Organization wajib dipilih.",

    };

  }

  if (!data.slug.trim()) {

    return {

      valid: false,

      message: "Slug wajib diisi.",

    };

  }

  return {

    valid: true,

  };

}