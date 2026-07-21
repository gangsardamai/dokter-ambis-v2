import {

    EmptyState,

} from "@/components/admin";
import {
  deletePromotionAction,
} from "@/app/dashboard/admin/promotion/actions";

import Link from "next/link";

import PromotionStatusBadge from "./PromotionStatusBadge";

import type { Database } from "@/supabase/types/database.types";

type Promotion =
  Database["public"]["Tables"]["promotions"]["Row"];

interface PromotionTableProps {

  promotions: Promotion[];

}

export default function PromotionTable({

  promotions,

}: PromotionTableProps) {

  if (promotions.length === 0) {

    return (

        <EmptyState

            title="Belum ada Promotion"

            description="Silakan tambahkan promotion baru."

        />

    );

}

  return (

    <div className="overflow-x-auto rounded-lg border">

      <table className="min-w-full">

        <thead className="bg-gray-100">

          <tr>

            <th className="px-4 py-3 text-left">
              Kode
            </th>

            <th className="px-4 py-3 text-left">
              Nama
            </th>

            <th className="px-4 py-3 text-left">
              Type
            </th>

            <th className="px-4 py-3 text-center">
              Value
            </th>

            <th className="px-4 py-3 text-center">
              Status
            </th>

            <th className="px-4 py-3 text-center">
              Aksi
            </th>

          </tr>

        </thead>

        <tbody>

          {promotions.map((promotion) => (

            <tr
              key={promotion.id}
              className="border-t"
            >

              <td className="px-4 py-3">

                {promotion.code ?? "-"}

              </td>

              <td className="px-4 py-3">

                {promotion.name}

              </td>

              <td className="px-4 py-3">

                {promotion.type}

              </td>

              <td className="px-4 py-3 text-center">

                {promotion.value}

              </td>

              <td className="px-4 py-3 text-center">

                <PromotionStatusBadge
                  status={promotion.status}
                />

              </td>

              <td className="px-4 py-3">

                <div className="flex justify-center gap-2">

                  <Link
                    href={`/dashboard/admin/promotion/${promotion.id}/edit`}
                    className="rounded bg-blue-600 px-3 py-1 text-white"
                  >

                    Edit

                  </Link>

                  <form
  action={async () => {
    "use server";

    await deletePromotionAction(
      promotion.id
    );
  }}
>

  <button
    type="submit"
    className="
      rounded
      bg-red-600
      px-3
      py-1
      text-white
      hover:bg-red-700
    "
  >

    Delete

  </button>

</form>

                </div>

              </td>

            </tr>

          ))}

        </tbody>

      </table>

    </div>

  );

}