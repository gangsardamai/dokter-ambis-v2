"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { paymentAccountService, profileService } from "@/services";

async function requireAdmin() {
  const profile = await profileService.getCurrentProfile();
  if (!profile || profile.role !== "admin") {
    throw new Error("Akses Admin diperlukan.");
  }
}

function inputFrom(formData: FormData) {
  return {
    label: String(formData.get("label") ?? ""),
    bankName: String(formData.get("bankName") ?? ""),
    accountNumber: String(formData.get("accountNumber") ?? ""),
    accountHolderName: String(formData.get("accountHolderName") ?? ""),
    isActive: formData.get("isActive") === "on",
  };
}

function message(error: unknown) {
  return error instanceof Error ? error.message : "Terjadi kesalahan.";
}

export async function createPaymentAccountAction(formData: FormData) {
  try {
    await requireAdmin();
    await paymentAccountService.createAccount(inputFrom(formData));
  } catch (error) {
    redirect(`/dashboard/admin/payment-account?error=${encodeURIComponent(message(error))}`);
  }

  revalidatePath("/dashboard/admin/payment-account");
  redirect("/dashboard/admin/payment-account?created=true");
}

export async function updatePaymentAccountAction(
  accountId: string,
  formData: FormData,
) {
  try {
    await requireAdmin();
    await paymentAccountService.updateAccount(accountId, inputFrom(formData));
  } catch (error) {
    redirect(`/dashboard/admin/payment-account/${accountId}/edit?error=${encodeURIComponent(message(error))}`);
  }

  revalidatePath("/dashboard/admin/payment-account");
  redirect("/dashboard/admin/payment-account?saved=true");
}

export async function setDefaultPaymentAccountAction(accountId: string) {
  await requireAdmin();
  await paymentAccountService.setDefaultAccount(accountId);
  revalidatePath("/dashboard/admin/payment-account");
}
