import {
  EmptyState,
} from "@/components/admin";

import OrganizationStatusBadge
  from "./OrganizationStatusBadge";

import OrganizationActionMenu
  from "./OrganizationActionMenu";

import type { Database }
  from "@/supabase/types/database.types";

type Organization =
  Database["public"]["Tables"]["organizations"]["Row"];

interface OrganizationTableProps {
  organizations: Organization[];
}

export default function OrganizationTable({
  organizations,
}: OrganizationTableProps) {

  if (organizations.length === 0) {
    return (
      <EmptyState
        title="Belum ada Universitas"
        description="Silakan tambahkan universitas baru."
      />
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border">

      <table className="min-w-full">

        <thead className="bg-gray-100">

          <tr>

            <th className="px-4 py-3 text-left">
              Nama
            </th>

            <th className="px-4 py-3 text-left">
              Singkatan
            </th>

            <th className="px-4 py-3 text-left">
              Slug
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

          {organizations.map((organization) => (

            <tr
              key={organization.id}
              className="border-t hover:bg-gray-50"
            >

              <td className="px-4 py-3">
                {organization.title}
              </td>

              <td className="px-4 py-3">
                {organization.short_name}
              </td>

              <td className="px-4 py-3">
                {organization.slug}
              </td>

              <td className="px-4 py-3 text-center">

                <OrganizationStatusBadge
                  status={organization.status}
                />

              </td>

              <td className="px-4 py-3">

                <OrganizationActionMenu
                  organizationId={organization.id}
                  status={organization.status}
                />

              </td>

            </tr>

          ))}

        </tbody>

      </table>

    </div>
  );

}