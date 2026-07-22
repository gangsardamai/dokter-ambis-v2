import { organizationRepository } from "@/repositories";

import type { Database } from "@/supabase/types/database.types";

type OrganizationInsert =
  Database["public"]["Tables"]["organizations"]["Insert"];

type OrganizationUpdate =
  Database["public"]["Tables"]["organizations"]["Update"];

export class OrganizationService {
  /* ========================================
     READ
  ======================================== */

  async getOrganizations() {
    return await organizationRepository.getAll();
  }

  async getActiveOrganizations() {
    return await organizationRepository.getActive();
  }

  async getActiveUniversities() {
    return await organizationRepository.getActiveUniversities();
  }

  async getOrganizationById(
    id: string
  ) {
    return await organizationRepository.getById(id);
  }

  async getOrganizationBySlug(
    slug: string
  ) {
    return await organizationRepository.getBySlug(slug);
  }

  async countOrganizations() {
    return await organizationRepository.count();
  }

  async countUniversities() {
    return await organizationRepository.countUniversities();
  }


  /* ========================================
     CREATE
  ======================================== */

  async createOrganization(
    data: OrganizationInsert
  ) {
    return await organizationRepository.create(
      data
    );
  }

  /* ========================================
     UPDATE
  ======================================== */

  async updateOrganization(
    id: string,
    data: OrganizationUpdate
  ) {
    return await organizationRepository.update(
      id,
      data
    );
  }

  /* ========================================
     ACTIVATE
  ======================================== */

  async activateOrganization(
    id: string
  ) {
    return await organizationRepository.update(
      id,
      {
        status: "active",
      }
    );
  }

  /* ========================================
     DEACTIVATE
  ======================================== */

  async deactivateOrganization(
    id: string
  ) {
    return await organizationRepository.update(
      id,
      {
        status: "inactive",
      }
    );
  }

  /* ========================================
     DELETE
  ======================================== */

  async deleteOrganization(
    id: string
  ) {
    return await organizationRepository.delete(
      id
    );
  }

}

export const organizationService =
  new OrganizationService();