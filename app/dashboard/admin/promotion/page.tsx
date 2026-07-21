import Link from "next/link";

import {
  PageTitle,
  PrimaryButton,
 } from "@/components/admin";

import PromotionTable
from "@/components/admin/promotion/PromotionTable";

import {
  promotionService,
} from "@/services";

export default async function PromotionPage() {

  const promotions =
    await promotionService.getAll();

  return (

    <main className="space-y-6 p-8">

      <div className="flex items-center justify-between">

        <PageTitle
          title="Promotion"
          description="Kelola voucher dan promosi."
        />

        <Link
          href="/dashboard/admin/promotion/create"
        >

          <PrimaryButton>

            Tambah Promotion

          </PrimaryButton>

        </Link>

      </div>

      <PromotionTable
        promotions={promotions}
      />

    </main>

  );

}