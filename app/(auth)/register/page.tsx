import { redirect } from "next/navigation";

import RegisterForm from "@/components/auth/RegisterForm";

import {
  registerAction,
} from "./actions";

import type {
  RegisterActionResult,
} from "./actions";

export default function RegisterPage() {
  async function handleRegister(
    data: {
      fullName: string;
      phone: string;
      email: string;
      password: string;
    },
  ): Promise<RegisterActionResult> {
    "use server";

    const result =
      await registerAction(data);

    if (!result.success) {
      return result;
    }

    redirect(
      "/login?registered=check-email",
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-6 py-10">
      <RegisterForm
        onSubmit={handleRegister}
      />
    </main>
  );
}