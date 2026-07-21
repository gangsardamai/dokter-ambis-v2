"use server";

import { authService } from "@/services";

export interface RegisterActionInput {

  fullName: string;

  phone: string;

  email: string;

  password: string;

}

export async function registerAction(
  data: RegisterActionInput
) {

  return await authService.register({

    fullName: data.fullName,

    phone: data.phone,

    email: data.email,

    password: data.password,

  });

}