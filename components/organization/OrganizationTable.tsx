import { organizationService } from "@/services";

import OrganizationRow from "./OrganizationRow";

export default async function OrganizationTable() {
  const organizations =
    await organizationService.getOrganizations();

  if (organizations.length === 0) {
    return (
      <div className="rounded-xl border bg-white p-8 text-center text-gray-500">
        Belum ada universitas.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border bg-white">
      <table className="min-w-full">

        <thead className="bg-gray-50">

          <tr>

            <th className="px-6 py-4 text-left">
              Universitas
            </th>

            <th className="px-6 py-4 text-left">
              Singkatan
            </th>

            <th className="px-6 py-4 text-left">
              Status
            </th>

            <th className="px-6 py-4 text-right">
              Aksi
            </th>

          </tr>

        </thead>

        <tbody>

          {organizations.map((organization) => (

            <OrganizationRow
              key={organization.id}
              organization={organization}
            />

          ))}

        </tbody>

      </table>
    </div>
  );
}