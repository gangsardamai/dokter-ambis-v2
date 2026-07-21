export interface OrganizationValidationResult {

  valid: boolean;

  message?: string;

}

export function validateOrganization(data: {

  title: string;

  short_name: string;

  slug: string;

}) : OrganizationValidationResult {

  if (!data.title.trim()) {

    return {

      valid: false,

      message: "Nama universitas wajib diisi.",

    };

  }

  if (!data.short_name.trim()) {

    return {

      valid: false,

      message: "Singkatan wajib diisi.",

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