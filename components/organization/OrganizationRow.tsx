import type { Database } from "@/supabase/types/database.types";

import OrganizationStatusBadge from "./OrganizationStatusBadge";
import OrganizationActionMenu from "./OrganizationActionMenu";

type Organization =
  Database["public"]["Tables"]["organizations"]["Row"];

interface OrganizationRowProps {
  organization: Organization;
}

export default function OrganizationRow({
  organization,
}: OrganizationRowProps) {
  return (
    <tr className="border-t">

      <td className="px-6 py-4">

        <div className="font-semibold">
          {organization.title}
        </div>

      </td>

      <td className="px-6 py-4">

        {organization.short_name}

      </td>

      <td className="px-6 py-4">

        <OrganizationStatusBadge
          status={organization.status}
        />

      </td>

      <td className="px-6 py-4 text-right">

        <OrganizationActionMenu
          organizationId={organization.id}
          status={organization.status}
        />

      </td>

    </tr>
  );
}