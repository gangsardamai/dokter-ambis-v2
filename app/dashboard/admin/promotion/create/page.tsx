import { redirect } from "next/navigation";

import {
  PageTitle,
} from "@/components/admin";

import PromotionForm
from "@/components/admin/promotion/PromotionForm";

import {
  createPromotionAction,
} from "../actions";

import {
  mapPromotionForm,
} from "@/lib/forms/promotion";

export default function CreatePromotionPage() {

  async function create(
    formData: FormData
  ) {

    "use server";

    const result =
      await createPromotionAction(

        mapPromotionForm(
          formData
        )

      );

    if (!result.success) {

      throw new Error(
        result.message
      );

    }

    redirect(
      "/dashboard/admin/promotion"
    );

  }

  return (

    <main className="max-w-3xl mx-auto p-8">

      <PageTitle
        title="Tambah Promotion"
        description="Buat voucher baru."
      />

      <PromotionForm
        submitLabel="Simpan Promotion"
        action={create}
      />

    </main>

  );

}