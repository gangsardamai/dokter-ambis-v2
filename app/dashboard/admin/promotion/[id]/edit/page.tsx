import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/admin";
import PromotionForm from "@/components/admin/promotion/PromotionForm";

import { promotionService } from "@/services";

import { updatePromotionAction } from "../../actions";

import { mapPromotionForm } from "@/lib/forms/promotion";

interface EditPromotionPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditPromotionPage({
  params,
}: EditPromotionPageProps) {
  const { id } = await params;
  const promotion = await promotionService.getById(id);

  if (!promotion) {
    notFound();
  }

  async function update(formData: FormData) {
    "use server";

    await updatePromotionAction(
      id,
      mapPromotionForm(formData),
    );
  }

  return (
    <main className="mx-auto w-full max-w-3xl space-y-8 p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Edit Promosi"
        description="Ubah data promosi."
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
        defaultValues={promotion}
        submitLabel="Update Promosi"
        action={update}
      />
    </main>
  );
}
