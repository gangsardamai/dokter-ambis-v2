import { organizations } from "@/lib/data/organizations";
import { Organization } from "@/types";

export function findAll(): Organization[] {
  return organizations;
}

export function findById(
  id: string
): Organization | undefined {
  return organizations.find(
    (organization) => organization.id === id
  );
}

export function findActive(): Organization[] {
  return organizations.filter(
    (organization) => organization.status === "active"
  );
}

export function create(
  organization: Organization
): Organization {
  return organization;
}

export function update(
  organization: Organization
): Organization {
  return organization;
}

export function remove(id: string): boolean {
  return true;
}