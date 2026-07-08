"use client";

import {
  Container,
  PageHeader,
} from "@/components/layout";

import { Card } from "@/components/ui";

import OrganizationForm from "@/components/organization/OrganizationForm";

import { createOrganizationAction } from "../actions";

export default function NewOrganizationPage() {
  return (
    <Container>
      <PageHeader
        title="Tambah Universitas"
        description="Buat universitas baru."
      />

      <Card>
        <div className="p-6">
          <OrganizationForm
            submitLabel="Simpan"
            onSubmit={createOrganizationAction}
          />
        </div>
      </Card>
    </Container>
  );
}