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

export function resolveUniversityOrigin(
  selectedUniversity: string,
  otherUniversity: string,
): string | null {
  if (selectedUniversity === OTHER_UNIVERSITY_VALUE) {
    const customUniversity = otherUniversity.trim();

    return customUniversity.length >= 2 &&
      customUniversity.length <= 150
      ? customUniversity
      : null;
  }

  return UNIVERSITY_OPTIONS.includes(
    selectedUniversity as (typeof UNIVERSITY_OPTIONS)[number],
  )
    ? selectedUniversity
    : null;
}
