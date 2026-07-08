import { Card } from "@/components/ui";

import type { Database } from "@/supabase/types/database.types";

type Organization =
  Database["public"]["Tables"]["organizations"]["Row"];

interface OrganizationInfoCardProps {
  organization: Organization;
}

export default function OrganizationInfoCard({
  organization,
}: OrganizationInfoCardProps) {
  return (
    <Card>
      <div className="p-6">

        <h2 className="text-xl font-semibold">
          Informasi Universitas
        </h2>

        <div className="mt-6 space-y-6">

          <div>
            <p className="text-sm text-gray-500">
              Nama Universitas
            </p>

            <p className="mt-1 font-medium">
              {organization.title}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">
              Nama Singkat
            </p>

            <p className="mt-1 font-medium">
              {organization.short_name}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">
              Slug
            </p>

            <p className="mt-1 font-medium">
              {organization.slug}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">
              Status
            </p>

            <span
              className={
                organization.status === "active"
                  ? "inline-flex rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700"
                  : "inline-flex rounded-full bg-gray-200 px-3 py-1 text-sm font-medium text-gray-700"
              }
            >
              {organization.status}
            </span>
          </div>

          <div>
            <p className="text-sm text-gray-500">
              Logo
            </p>

            <p className="mt-1 text-gray-700">
              {organization.logo_path ??
                "Belum ada logo."}
            </p>
          </div>

        </div>

      </div>
    </Card>
  );
}