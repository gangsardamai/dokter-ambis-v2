export function slugify(value: string): string {
  const normalized = value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || "item";
}

export async function createUniqueSlug(
  value: string,
  isAvailable: (slug: string) => Promise<boolean>,
): Promise<string> {
  const baseSlug = slugify(value);

  for (let suffix = 1; suffix <= 1000; suffix += 1) {
    const candidate =
      suffix === 1 ? baseSlug : `${baseSlug}-${suffix}`;

    if (await isAvailable(candidate)) {
      return candidate;
    }
  }

  throw new Error("Slug unik tidak dapat dibuat secara otomatis.");
}
