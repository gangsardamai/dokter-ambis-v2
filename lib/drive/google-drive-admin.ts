import "server-only";

/**
 * Google Drive API client for admin-owned material migration.
 * All credentials are server-only. Never place them in NEXT_PUBLIC_*.
 * The refresh token must have Google Drive permissions for the main account.
 */
export interface DrivePermission {
  id?: string;
  type?: string;
  role?: string;
  emailAddress?: string;
  domain?: string;
  allowFileDiscovery?: boolean;
}

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  md5Checksum?: string;
  parents?: string[];
  owners?: { emailAddress: string }[];
  permissions?: DrivePermission[];
}

const MAIN_OWNER = "ambitious.premium@gmail.com";
const DRIVE_API = "https://www.googleapis.com/drive/v3";

const UNEJ_COURSE_ROOTS: Record<string, string> = {
  "aa4a2839-c6d1-4afb-8c2c-7732bb0e446d": "1Xlrhi62SRaNZI9HiU1JIy_7b3LT7JTae", // Blok 2
  "50b4ef9e-e572-494c-ae81-e22a8c2c47ea": "1qWs04G5VAUcskhn9x8fXqv-qZjxG2qey", // Blok 8
  "b575f68c-8bcb-4f98-ab0f-0f51b96a5207": "1d68DXIqz9Ij7nqzXdVsRVdbAjSYK-pdB", // Blok 14
};

export function isUneJCourse(courseId: string): boolean {
  return Object.prototype.hasOwnProperty.call(UNEJ_COURSE_ROOTS, courseId);
}

export function isDriveAdminConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_DRIVE_CLIENT_ID &&
    process.env.GOOGLE_DRIVE_CLIENT_SECRET &&
    process.env.GOOGLE_DRIVE_REFRESH_TOKEN,
  );
}

function isDriveId(value: string): boolean {
  return /^[A-Za-z0-9_-]{10,}$/.test(value);
}

export function validateDriveId(value: string): void {
  if (!isDriveId(value)) throw new Error("Google Drive File ID tidak valid.");
}

export function cleanDriveCopyName(value: string): string {
  return value.replace(/^(?:(?:salinan(?: dari)?|copy(?: of)?)\s*[-:_ ]+)+/i, "").trim() || value;
}

async function getAccessToken(): Promise<string> {
  const { GOOGLE_DRIVE_CLIENT_ID, GOOGLE_DRIVE_CLIENT_SECRET, GOOGLE_DRIVE_REFRESH_TOKEN } =
    process.env;
  if (!GOOGLE_DRIVE_CLIENT_ID || !GOOGLE_DRIVE_CLIENT_SECRET || !GOOGLE_DRIVE_REFRESH_TOKEN) {
    throw new Error("OAuth Google Drive akun utama belum terhubung di server.");
  }
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: GOOGLE_DRIVE_CLIENT_ID,
      client_secret: GOOGLE_DRIVE_CLIENT_SECRET,
      refresh_token: GOOGLE_DRIVE_REFRESH_TOKEN,
      grant_type: "refresh_token",
    }),
    cache: "no-store",
  });
  if (!response.ok) throw new Error("Otorisasi Google Drive tidak tersedia. Periksa koneksi OAuth.");
  const token = (await response.json()) as { access_token?: string };
  if (!token.access_token) throw new Error("Token OAuth Google Drive kosong.");
  return token.access_token;
}

export class DriveAdminClient {
  private constructor(private readonly token: string) {}

  static async create(): Promise<DriveAdminClient> {
    const client = new DriveAdminClient(await getAccessToken());
    const about = await client.request<{ user?: { emailAddress?: string } }>(
      "GET",
      "/about?fields=user(emailAddress)",
    );
    if (about.user?.emailAddress?.toLowerCase() !== MAIN_OWNER) {
      throw new Error("Google Drive OAuth bukan milik ambitious.premium@gmail.com.");
    }
    return client;
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const response = await fetch(`${DRIVE_API}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${this.token}`,
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      cache: "no-store",
    });
    if (!response.ok) {
      throw new Error(`Google Drive API ${method} gagal (HTTP ${response.status}).`);
    }
    if (response.status === 204) return undefined as T;
    return (await response.json()) as T;
  }

  async getFile(id: string): Promise<DriveFile> {
    validateDriveId(id);
    const fields = [
      "id", "name", "mimeType", "size", "md5Checksum", "parents",
      "owners(emailAddress)", "permissions(id,type,role,emailAddress,domain,allowFileDiscovery)",
    ].join(",");
    return this.request<DriveFile>("GET", `/files/${encodeURIComponent(id)}?supportsAllDrives=true&fields=${encodeURIComponent(fields)}`);
  }

  async copyFile(source: DriveFile): Promise<DriveFile> {
    const parentId = source.parents?.[0];
    if (!parentId || source.parents?.length !== 1) {
      throw new Error("Folder asal Google Drive tidak tunggal atau tidak terverifikasi.");
    }
    const fields = "id,name,mimeType,size,md5Checksum,parents,owners(emailAddress),permissions(id,type,role,emailAddress,domain,allowFileDiscovery)";
    return this.request<DriveFile>(
      "POST",
      `/files/${encodeURIComponent(source.id)}/copy?supportsAllDrives=true&fields=${encodeURIComponent(fields)}`,
      { name: cleanDriveCopyName(source.name), parents: [parentId] },
    );
  }

  async deleteFile(id: string): Promise<void> {
    validateDriveId(id);
    await this.request<void>("DELETE", `/files/${encodeURIComponent(id)}?supportsAllDrives=true`);
  }

  /** Traverse only the direct ancestor chain, never rely on name matches across Drive. */
  async assertInUneJ2026(source: DriveFile, courseId: string): Promise<void> {
    const rootId = UNEJ_COURSE_ROOTS[courseId];
    if (!rootId) throw new Error("Pilot hanya tersedia untuk UNEJ Blok 2, 8, dan 14.");
    let next = source.parents?.[0];
    let hasExplicit2026 = false;
    let foundRoot = false;
    const seen = new Set<string>();
    for (let depth = 0; next && depth < 20; depth++) {
      if (seen.has(next)) throw new Error("Siklus folder Google Drive tidak valid.");
      seen.add(next);
      const folder = await this.getFile(next);
      if (folder.mimeType !== "application/vnd.google-apps.folder") {
        throw new Error("Induk file bukan folder.");
      }
      if (/2025|untuk\s+admin/i.test(folder.name)) {
        throw new Error("Materi 2025 atau Untuk Admin tidak termasuk target.");
      }
      if (next !== rootId && /2026/.test(folder.name)) hasExplicit2026 = true;
      if (next === rootId) {
        foundRoot = true;
        break;
      }
      next = folder.parents?.[0];
    }
    if (!foundRoot || !hasExplicit2026) {
      throw new Error("File bukan bagian subfolder 2026 course UNEJ yang terverifikasi.");
    }
  }

  async assertEquivalentCopy(source: DriveFile, copied: DriveFile): Promise<void> {
    if (copied.id === source.id || !copied.id) throw new Error("ID salinan tidak valid.");
    if (copied.mimeType !== source.mimeType) throw new Error("Tipe file berubah pada salinan.");
    if (source.size && copied.size !== source.size) throw new Error("Ukuran salinan berbeda.");
    if (source.md5Checksum && copied.md5Checksum !== source.md5Checksum) {
      throw new Error("Checksum salinan berbeda.");
    }
    const originalOwner = source.owners?.[0]?.emailAddress?.toLowerCase();
    const copyOwner = copied.owners?.[0]?.emailAddress?.toLowerCase();
    if (!originalOwner || copyOwner !== MAIN_OWNER) {
      throw new Error("Kepemilikan salinan bukan akun utama, atau pemilik asal tidak diketahui.");
    }
    if (copied.parents?.[0] !== source.parents?.[0]) {
      throw new Error("Salinan tidak berada di folder yang sama.");
    }

    // A student without a specific Google account must still be able to read
    // a file if the original was shared to anyone with its link.
    const originalPermissions = source.permissions;
    const newPermissions = copied.permissions;
    if (!originalPermissions || !newPermissions) {
      throw new Error("Daftar izin file tidak lengkap.");
    }
    const key = (p: DrivePermission): string | null => {
      if (p.type === "anyone") return "anyone";
      if (p.type === "domain" && p.domain) return `domain:${p.domain.toLowerCase()}`;
      if ((p.type === "user" || p.type === "group") && p.emailAddress) {
        return `${p.type}:${p.emailAddress.toLowerCase()}`;
      }
      return null;
    };
    const level = (role?: string): number => ({
      reader: 1, commenter: 2, writer: 3, organizer: 4, fileOrganizer: 4, owner: 5,
    })[role ?? ""] ?? 0;

    const original = new Map<string, number>();
    for (const permission of originalPermissions) {
      const subject = key(permission);
      if (!subject || permission.role === "owner") continue;
      original.set(subject, Math.max(original.get(subject) ?? 0, level(permission.role)));
    }
    const destination = new Map<string, number>();
    for (const permission of newPermissions) {
      const subject = key(permission);
      if (!subject) continue;
      destination.set(subject, Math.max(destination.get(subject) ?? 0, level(permission.role)));
    }
    if (!original.has("anyone")) {
      throw new Error("File asal tidak memiliki akses via tautan umum; migrasi otomatis ditunda.");
    }
    for (const [subject, access] of original) {
      if ((destination.get(subject) ?? 0) < access) {
        throw new Error("Ada izin pengguna yang hilang pada salinan.");
      }
    }
    // Never broaden public or domain-wide permissions beyond the source.
    for (const [subject, access] of destination) {
      if ((subject === "anyone" || subject.startsWith("domain:")) &&
          access > (original.get(subject) ?? 0)) {
        throw new Error("Akses umum/domain salinan lebih luas daripada asal.");
      }
    }
  }
}
