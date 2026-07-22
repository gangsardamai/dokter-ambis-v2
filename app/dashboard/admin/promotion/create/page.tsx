import Link from "next/link";
import { redirect } from "next/navigation";

import { PageHeader } from "@/components/admin";
import PromotionForm from "@/components/admin/promotion/PromotionForm";

import { createPromotionAction } from "../actions";

import { mapPromotionForm } from "@/lib/forms/promotion";

export default function CreatePromotionPage() {
  async function create(formData: FormData) {
    "use server";

    const result = await createPromotionAction(
      mapPromotionForm(formData),
    );

    if (!result.success) {
      throw new Error(result.message);
    }

    redirect("/dashboard/admin/promotion");
  }

  return (
    <main className="mx-auto w-full max-w-3xl space-y-8 p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Tambah Promosi"
        description="Buat voucher baru."
        actions={(
          <Link
            href="/dashboard/admin/promotion"
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-blue-100 bg-white px-5 py-2.5 text-sm font-bold text-[#1769cf] shadow-sm transition hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-200 sm:w-auto"
          >
            ← Kembali ke Promosi
          </Link>
        )}
      />

      <PromotionForm
        submitLabel="Simpan Promosi"
        action={create}
      />
    </main>
  );
}
