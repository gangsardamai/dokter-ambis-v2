import {
  PageHeader,
  PrimaryButton,
} from "@/components/admin";

import PromotionTable from "@/components/admin/promotion/PromotionTable";

import { promotionService } from "@/services";

export default async function PromotionPage() {
  const promotions = await promotionService.getAll();

  return (
    <main className="mx-auto w-full max-w-7xl space-y-8 p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Promosi"
        description="Kelola voucher dan promosi."
        actions={(
          <PrimaryButton
            href="/dashboard/admin/promotion/create"
            className="w-full sm:w-auto"
          >
            Tambah Promosi
          </PrimaryButton>
        )}
      />

      <PromotionTable
        promotions={promotions}
      />
    </main>
  );
}
