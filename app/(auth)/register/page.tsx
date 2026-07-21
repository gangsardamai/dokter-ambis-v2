import { redirect } from "next/navigation";

import RegisterForm from "@/components/auth/RegisterForm";

import {
  registerAction,
} from "./actions";

export default function RegisterPage() {

  async function handleRegister(
    data: {
      fullName: string;
      phone: string;
      email: string;
      password: string;
    }
  ) {

    "use server";

    await registerAction(data);

    redirect("/login");

  }

  return (

    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-6 py-10">

      <RegisterForm
        onSubmit={handleRegister}
      />

    </main>

  );

}