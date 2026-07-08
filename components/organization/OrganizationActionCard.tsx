import Link from "next/link";

import { Card } from "@/components/ui";

import OrganizationActionMenu from "./OrganizationActionMenu";

import type { Database } from "@/supabase/types/database.types";

type OrganizationStatus =
  Database["public"]["Enums"]["organization_status"];

interface OrganizationActionCardProps {
  organizationId: string;
  status: OrganizationStatus;
}

export default function OrganizationActionCard({
  organizationId,
  status,
}: OrganizationActionCardProps) {
  return (
    <Card>

      <div className="p-6">

        <h2 className="text-xl font-semibold">
          Manajemen Universitas
        </h2>

        <div className="mt-6 space-y-3">

          <Link
            href={`/dashboard/admin/organization/${organizationId}/edit`}
            className="block rounded-lg bg-blue-600 px-4 py-2 text-center font-medium text-white hover:bg-blue-700"
          >
            Edit Universitas
          </Link>

        </div>

        <div className="mt-8 border-t pt-6">

          <h3 className="font-semibold text-red-600">
            Danger Zone
          </h3>

          <div className="mt-4">

            <OrganizationActionMenu
              organizationId={organizationId}
              status={status}
            />

          </div>

        </div>

      </div>

    </Card>
  );
}