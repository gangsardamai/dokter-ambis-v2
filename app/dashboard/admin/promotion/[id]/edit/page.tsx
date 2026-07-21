import { notFound } from "next/navigation";

import { PageTitle } from "@/components/admin";
import PromotionForm from "@/components/admin/promotion/PromotionForm";

import {
  promotionService,
} from "@/services";

import {
  updatePromotionAction,
} from "../../actions";

import {
  mapPromotionForm,
} from "@/lib/forms/promotion";

interface EditPromotionPageProps {

  params: Promise<{
    id: string;
  }>;

}

export default async function EditPromotionPage({

  params,

}: EditPromotionPageProps) {

  const { id } = await params;

  const promotion =
    await promotionService.getById(id);

  if (!promotion) {

    notFound();

  }

  async function update(
    formData: FormData
  ) {

    "use server";

    await updatePromotionAction(

      id,

      mapPromotionForm(formData)

    );

  }

  return (

    <main className="max-w-3xl mx-auto p-8">

      <PageTitle
        title="Edit Promotion"
        description="Ubah data promotion."
      />

      <PromotionForm
        defaultValues={promotion}
        submitLabel="Update Promotion"
        action={update}
      />

    </main>

  );

}