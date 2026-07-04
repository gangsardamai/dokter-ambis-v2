import { Organization } from "@/types";
import { organizationRepository } from "@/lib/repositories/organization.repository";

export const organizationService = {
  getOrganizations(): Organization[] {
    return organizationRepository.findAll();
  },

  getActiveOrganizations(): Organization[] {
    return organizationRepository.findActive();
  },

  getOrganizationById(
    id: string
  ): Organization | undefined {
    return organizationRepository.findById(id);
  },
};