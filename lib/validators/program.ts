export interface ProgramValidationResult {

  valid: boolean;

  message?: string;

}

export function validateProgram(data: {

  title: string;

  slug: string;

}) : ProgramValidationResult {

  if (!data.title.trim()) {

    return {

      valid: false,

      message: "Nama program wajib diisi.",

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