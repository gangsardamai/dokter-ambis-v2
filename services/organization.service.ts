import { organizationRepository } from "@/repositories";

export class OrganizationService {

  async getOrganizations() {
    return await organizationRepository.getAll();
  }

  async getOrganization(id: string) {
    return await organizationRepository.getById(id);
  }

  async getOrganizationBySlug(
    slug: string
  ) {
    return await organizationRepository.getBySlug(slug);
  }

}

export const organizationService =
  new OrganizationService();