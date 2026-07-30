export type CourseDescriptionTone = "default" | "price" | "note";

export interface CourseDescriptionSection {
  title: string | null;
  tone: CourseDescriptionTone;
  paragraphs: string[];
  items: string[];
}

const KNOWN_HEADING_PATTERN =
  /^(fasilitas|biaya(?:\s+investasi)?|harga|investasi|catatan|note|bonus|ketentuan|jadwal|informasi|promo)\b/i;
const COMMERCIAL_LINE_PATTERN =
  /^(rp\b|biaya\b|harga\b|investasi\b|promo\b|member\b|batch\b|bayar\b|kode voucher\b|note\b|catatan\b)/i;
const LIST_MARKER_PATTERN = /^(?:[-*•]|[✓✔✅])\s*/;
const NUMBERED_LIST_PATTERN = /^\d+[.)]\s+/;

function normalizeDescription(description: string): string[] {
  return description
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => line.trim());
}

function normalizeDisplayText(value: string): string {
  return value
    .replace(/\s*(?:->|=>)\s*/g, " → ")
    .replace(/\s+/g, " ")
    .replace(/!{2,}/g, "!")
    .trim();
}

function stripDecorativePrefix(value: string): string {
  return value.replace(/^[✅💰📝📌🎁⭐]+\s*/u, "").trim();
}

function cleanListItem(value: string): string {
  return normalizeDisplayText(
    value.replace(LIST_MARKER_PATTERN, "").replace(/^\s+/, ""),
  );
}

function isHeadingLine(value: string): boolean {
  const cleaned = stripDecorativePrefix(value).replace(/:\s*$/, "").trim();

  if (!cleaned) {
    return false;
  }

  if (KNOWN_HEADING_PATTERN.test(cleaned)) {
    return true;
  }

  const letters = cleaned.replace(/[^\p{L}]/gu, "");
  return (
    cleaned.length <= 72 &&
    letters.length >= 4 &&
    cleaned === cleaned.toLocaleUpperCase("id-ID")
  );
}

function getTone(title: string | null): CourseDescriptionTone {
  if (!title) {
    return "default";
  }

  if (/biaya|harga|investasi|promo/i.test(title)) {
    return "price";
  }

  if (/catatan|note|ketentuan|informasi/i.test(title)) {
    return "note";
  }

  return "default";
}

function createSection(title: string | null): CourseDescriptionSection {
  return {
    title,
    tone: getTone(title),
    paragraphs: [],
    items: [],
  };
}

function hasContent(section: CourseDescriptionSection): boolean {
  return section.paragraphs.length > 0 || section.items.length > 0;
}

function parseHeading(value: string): {
  title: string;
  remainder: string | null;
} {
  const cleaned = normalizeDisplayText(stripDecorativePrefix(value));
  const separatorIndex = cleaned.indexOf(":");

  if (separatorIndex > 0) {
    const possibleTitle = cleaned.slice(0, separatorIndex).trim();

    if (KNOWN_HEADING_PATTERN.test(possibleTitle)) {
      const remainder = cleaned.slice(separatorIndex + 1).trim();
      return {
        title: possibleTitle,
        remainder: remainder || null,
      };
    }
  }

  return {
    title: cleaned.replace(/:\s*$/, "").trim(),
    remainder: null,
  };
}

function truncateAtWord(value: string, maxLength: number): string {
  if (value.length <= maxLength) {
    return value;
  }

  const shortened = value.slice(0, maxLength + 1);
  const lastSpace = shortened.lastIndexOf(" ");
  const safeEnd = lastSpace >= Math.floor(maxLength * 0.65) ? lastSpace : maxLength;

  return `${shortened.slice(0, safeEnd).trimEnd()}…`;
}

export function getCourseDescriptionSummary(
  description: string | null | undefined,
  maxLength = 150,
): string | null {
  if (!description?.trim()) {
    return null;
  }

  const candidates = normalizeDescription(description)
    .filter(Boolean)
    .filter((line) => !isHeadingLine(line))
    .map(cleanListItem)
    .filter(Boolean)
    .filter((line) => !COMMERCIAL_LINE_PATTERN.test(line))
    .filter((line) => !/\bRp\.?\s*\d/i.test(line));

  const fallback = normalizeDescription(description)
    .map(stripDecorativePrefix)
    .map(cleanListItem)
    .find(Boolean);
  const selected = candidates.slice(0, 3);
  const summary = selected.length > 0 ? selected.join(" • ") : fallback;

  return summary ? truncateAtWord(summary, maxLength) : null;
}

export function parseCourseDescription(
  description: string | null | undefined,
): CourseDescriptionSection[] {
  if (!description?.trim()) {
    return [];
  }

  const sections: CourseDescriptionSection[] = [];
  let current = createSection(null);

  for (const rawLine of normalizeDescription(description)) {
    if (!rawLine) {
      continue;
    }

    if (isHeadingLine(rawLine)) {
      if (hasContent(current)) {
        sections.push(current);
      }

      const heading = parseHeading(rawLine);
      current = createSection(heading.title);

      if (heading.remainder) {
        current.paragraphs.push(heading.remainder);
      }

      continue;
    }

    if (LIST_MARKER_PATTERN.test(rawLine) || NUMBERED_LIST_PATTERN.test(rawLine)) {
      current.items.push(cleanListItem(rawLine));
      continue;
    }

    current.paragraphs.push(normalizeDisplayText(rawLine));
  }

  if (hasContent(current)) {
    sections.push(current);
  }

  return sections;
}
