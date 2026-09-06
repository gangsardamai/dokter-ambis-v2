export const OTHER_UNIVERSITY_VALUE = "__other__";

export const UNIVERSITY_OPTIONS = [
  "Universitas Airlangga",
  "Universitas Andalas",
  "Universitas Brawijaya",
  "Universitas Diponegoro",
  "Universitas Gadjah Mada",
  "Universitas Hasanuddin",
  "Universitas Indonesia",
  "Universitas Islam Indonesia",
  "Universitas Jember",
  "Universitas Jenderal Soedirman",
  "Universitas Katolik Indonesia Atma Jaya",
  "Universitas Kristen Maranatha",
  "Universitas Lambung Mangkurat",
  "Universitas Malikussaleh",
  "Universitas Mataram",
  "Universitas Muhammadiyah Malang",
  "Universitas Muhammadiyah Yogyakarta",
  "Universitas Mulawarman",
  "Universitas Muslim Indonesia",
  "Universitas Padjadjaran",
  "Universitas Pattimura",
  "Universitas Pelita Harapan",
  "Universitas Prima Indonesia",
  "Universitas Sebelas Maret",
  "Universitas Sriwijaya",
  "Universitas Sumatera Utara",
  "Universitas Syiah Kuala",
  "Universitas Trisakti",
  "Universitas Udayana",
  "Universitas YARSI",
] as const;

function normalizeUniversityName(value: string): string {
  return value
    .replace(/\s*\([^)]{1,20}\)\s*$/, "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " dan ")
    .replace(/\b(?:university|univ)\b/g, "universitas")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(
      /^(?:fk|fakultas kedokteran(?: dan ilmu kesehatan)?)\s+/,
      "",
    )
    .trim()
    .replace(/\s+/g, " ");
}

export function shouldIncludeOrganizationAsUniversity(
  organizationName: string,
): boolean {
  const normalized = normalizeUniversityName(organizationName);

  if (!normalized || normalized.includes("ukmppd")) {
    return false;
  }

  if (
    normalized.includes("nasional") &&
    !normalized.startsWith("universitas nasional")
  ) {
    return false;
  }

  return true;
}

export function mergeUniversityOptions(
  organizationNames: readonly string[],
): string[] {
  const options: string[] = [];
  const seen = new Set<string>();

  const addOption = (rawName: string) => {
    const name = rawName.trim();
    const comparisonKey = normalizeUniversityName(name);

    if (!name || !comparisonKey || seen.has(comparisonKey)) {
      return;
    }

    seen.add(comparisonKey);
    options.push(name);
  };

  UNIVERSITY_OPTIONS.forEach(addOption);
  organizationNames
    .filter(shouldIncludeOrganizationAsUniversity)
    .forEach(addOption);

  return options.sort((left, right) =>
    left.localeCompare(right, "id-ID", { sensitivity: "base" }),
  );
}

export function resolveUniversityOrigin(
  selectedUniversity: string,
  otherUniversity: string,
  allowedUniversities: readonly string[] = UNIVERSITY_OPTIONS,
): string | null {
  if (selectedUniversity === OTHER_UNIVERSITY_VALUE) {
    const customUniversity = otherUniversity.trim();

    return customUniversity.length >= 2 &&
      customUniversity.length <= 150
      ? customUniversity
      : null;
  }

  const selectedKey = normalizeUniversityName(selectedUniversity);
  const matchedUniversity = allowedUniversities.find(
    (university) => normalizeUniversityName(university) === selectedKey,
  );

  return matchedUniversity ?? null;
}
