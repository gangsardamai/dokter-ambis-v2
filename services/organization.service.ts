import { createUniqueSlug } from "@/lib/slug";
import { organizationRepository } from "@/repositories";

import type { Database } from "@/supabase/types/database.types";

type OrganizationInsert =
  Database["public"]["Tables"]["organizations"]["Insert"];

type OrganizationUpdate =
  Database["public"]["Tables"]["organizations"]["Update"];

export class OrganizationService {
  async getOrganizations() {
    return await organizationRepository.getAll();
  }

  async getActiveOrganizations() {
    return await organizationRepository.getActive();
  }

  async getActiveUniversities() {
    return await organizationRepository.getActiveUniversities();
  }

  async getOrganizationById(id: string) {
    return await organizationRepository.getById(id);
  }

  async getOrganizationBySlug(slug: string) {
    return await organizationRepository.getBySlug(slug);
  }

  async countOrganizations() {
    return await organizationRepository.count();
  }

  async countUniversities() {
    return await organizationRepository.countUniversities();
  }

  async createOrganization(data: OrganizationInsert) {
    const slug = await createUniqueSlug(
      data.title,
      async (candidate) =>
        (await organizationRepository.getBySlug(candidate)) === null,
    );

    return await organizationRepository.create({
      ...data,
      slug,
    });
  }

  async updateOrganization(
    id: string,
    data: OrganizationUpdate,
  ) {
    const existing = await organizationRepository.getById(id);

    if (!existing) {
      throw new Error("Organization tidak ditemukan.");
    }

    return await organizationRepository.update(id, {
      ...data,
      slug: existing.slug,
    });
  }

  async activateOrganization(id: string) {
    return await organizationRepository.update(id, {
      status: "active",
    });
  }

  async deactivateOrganization(id: string) {
    return await organizationRepository.update(id, {
      status: "inactive",
    });
  }

  async deleteOrganization(id: string) {
    const organization = await organizationRepository.getById(id);

    if (!organization) {
      throw new Error("Organization tidak ditemukan.");
    }

    if (organization.is_general) {
      throw new Error(
        "Organization Umum / Nasional tidak dapat dihapus.",
      );
    }

    return await organizationRepository.delete(id);
  }
}

export const organizationService = new OrganizationService();
