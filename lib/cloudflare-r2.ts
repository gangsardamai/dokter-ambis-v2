import "server-only";

import {
  createHash,
  createHmac,
  randomUUID,
} from "node:crypto";

const R2_FILE_PATH_PREFIX = "r2://";
const DEFAULT_EXPIRY_SECONDS = 600;
const MAX_EXPIRY_SECONDS = 604_800;

interface R2Config {
  accessKeyId: string;
  bucketName: string;
  endpoint: URL;
  secretAccessKey: string;
}

interface CreatePresignedUrlOptions {
  bucketName?: string;
  contentType?: string;
  downloadName?: string;
  expiresIn?: number;
  key: string;
  method: "GET" | "PUT" | "DELETE" | "HEAD";
}

interface MaterialObjectKeyInput {
  courseId: string;
  fileName: string;
  folderId?: string | null;
  lessonId: string;
}

function getRequiredEnvironmentValue(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(
      `Konfigurasi Cloudflare R2 belum lengkap: ${name} belum diatur.`,
    );
  }

  return value;
}

function getR2Config(): R2Config {
  const accountId = getRequiredEnvironmentValue(
    "CLOUDFLARE_R2_ACCOUNT_ID",
  );
  const endpointValue =
    process.env.CLOUDFLARE_R2_ENDPOINT?.trim() ||
    `https://${accountId}.r2.cloudflarestorage.com`;

  return {
    accessKeyId: getRequiredEnvironmentValue(
      "CLOUDFLARE_R2_ACCESS_KEY_ID",
    ),
    bucketName: getRequiredEnvironmentValue(
      "CLOUDFLARE_R2_BUCKET_NAME",
    ),
    endpoint: new URL(endpointValue),
    secretAccessKey: getRequiredEnvironmentValue(
      "CLOUDFLARE_R2_SECRET_ACCESS_KEY",
    ),
  };
}

function encodeRfc3986(value: string): string {
  return encodeURIComponent(value).replace(
    /[!'()*]/g,
    (character) =>
      `%${character.charCodeAt(0).toString(16).toUpperCase()}`,
  );
}

function encodeObjectPath(value: string): string {
  return value
    .split("/")
    .filter(Boolean)
    .map(encodeRfc3986)
    .join("/");
}

function sha256(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function hmac(
  key: Buffer | string,
  value: string,
): Buffer {
  return createHmac("sha256", key).update(value, "utf8").digest();
}

function formatAmzDate(date: Date): {
  amzDate: string;
  dateStamp: string;
} {
  const iso = date.toISOString().replace(/[:-]|\.\d{3}/g, "");

  return {
    amzDate: iso,
    dateStamp: iso.slice(0, 8),
  };
}

function normalizeHeaderValue(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function buildCanonicalQuery(
  parameters: Record<string, string>,
): string {
  return Object.entries(parameters)
    .map(([key, value]) => [
      encodeRfc3986(key),
      encodeRfc3986(value),
    ])
    .sort(([leftKey, leftValue], [rightKey, rightValue]) => {
      if (leftKey === rightKey) {
        return leftValue.localeCompare(rightValue);
      }

      return leftKey.localeCompare(rightKey);
    })
    .map(([key, value]) => `${key}=${value}`)
    .join("&");
}

function sanitizeHeaderFileName(fileName: string): string {
  return fileName
    .replace(/[\r\n"]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

export function sanitizeR2FileName(fileName: string): string {
  const sanitized = fileName
    .normalize("NFKD")
    .replace(/[^\w.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();

  return sanitized || "materi";
}

export function buildR2MaterialObjectKey({
  courseId,
  fileName,
  folderId,
  lessonId,
}: MaterialObjectKeyInput): string {
  const folderSegment = folderId || "ungrouped";

  return [
    "courses",
    courseId,
    "folders",
    folderSegment,
    "lessons",
    lessonId,
    `${randomUUID()}-${sanitizeR2FileName(fileName)}`,
  ].join("/");
}

export function createR2FilePath(key: string): string {
  const { bucketName } = getR2Config();

  return `${R2_FILE_PATH_PREFIX}${bucketName}/${key.replace(/^\/+/, "")}`;
}

export function parseR2FilePath(
  filePath: string,
): { bucketName: string; key: string } | null {
  if (!filePath.startsWith(R2_FILE_PATH_PREFIX)) {
    return null;
  }

  const value = filePath.slice(R2_FILE_PATH_PREFIX.length);
  const separatorIndex = value.indexOf("/");

  if (separatorIndex < 1 || separatorIndex === value.length - 1) {
    return null;
  }

  return {
    bucketName: value.slice(0, separatorIndex),
    key: value.slice(separatorIndex + 1),
  };
}

export function isR2FilePath(filePath: string): boolean {
  return parseR2FilePath(filePath) !== null;
}

export async function createR2PresignedUrl({
  bucketName,
  contentType,
  downloadName,
  expiresIn = DEFAULT_EXPIRY_SECONDS,
  key,
  method,
}: CreatePresignedUrlOptions): Promise<string> {
  const config = getR2Config();
  const targetBucket = bucketName || config.bucketName;
  const safeExpiry = Math.min(
    Math.max(Math.floor(expiresIn), 1),
    MAX_EXPIRY_SECONDS,
  );
  const { amzDate, dateStamp } = formatAmzDate(new Date());
  const credentialScope = `${dateStamp}/auto/s3/aws4_request`;
  const canonicalUri = `/${encodeObjectPath(targetBucket)}/${encodeObjectPath(key)}`;
  const headers: Record<string, string> = {
    host: config.endpoint.host,
  };

  if (contentType) {
    headers["content-type"] = contentType;
  }

  const sortedHeaderEntries = Object.entries(headers).sort(
    ([left], [right]) => left.localeCompare(right),
  );
  const canonicalHeaders = sortedHeaderEntries
    .map(
      ([name, value]) =>
        `${name}:${normalizeHeaderValue(value)}\n`,
    )
    .join("");
  const signedHeaders = sortedHeaderEntries
    .map(([name]) => name)
    .join(";");
  const queryParameters: Record<string, string> = {
    "X-Amz-Algorithm": "AWS4-HMAC-SHA256",
    "X-Amz-Content-Sha256": "UNSIGNED-PAYLOAD",
    "X-Amz-Credential": `${config.accessKeyId}/${credentialScope}`,
    "X-Amz-Date": amzDate,
    "X-Amz-Expires": String(safeExpiry),
    "X-Amz-SignedHeaders": signedHeaders,
  };

  if (downloadName) {
    const safeDownloadName = sanitizeHeaderFileName(downloadName);
    queryParameters["response-content-disposition"] =
      `attachment; filename="${safeDownloadName}"; filename*=UTF-8''${encodeRfc3986(safeDownloadName)}`;
  }

  const canonicalQuery = buildCanonicalQuery(queryParameters);
  const canonicalRequest = [
    method,
    canonicalUri,
    canonicalQuery,
    canonicalHeaders,
    signedHeaders,
    "UNSIGNED-PAYLOAD",
  ].join("\n");
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    credentialScope,
    sha256(canonicalRequest),
  ].join("\n");
  const dateKey = hmac(
    `AWS4${config.secretAccessKey}`,
    dateStamp,
  );
  const regionKey = hmac(dateKey, "auto");
  const serviceKey = hmac(regionKey, "s3");
  const signingKey = hmac(serviceKey, "aws4_request");
  const signature = createHmac("sha256", signingKey)
    .update(stringToSign, "utf8")
    .digest("hex");

  return `${config.endpoint.origin}${canonicalUri}?${canonicalQuery}&X-Amz-Signature=${signature}`;
}

export async function createR2DownloadUrl(
  filePath: string,
  downloadName: string,
  expiresIn = 60,
): Promise<string> {
  const parsed = parseR2FilePath(filePath);

  if (!parsed) {
    throw new Error("Path file R2 tidak valid.");
  }

  return createR2PresignedUrl({
    bucketName: parsed.bucketName,
    downloadName,
    expiresIn,
    key: parsed.key,
    method: "GET",
  });
}

export async function deleteR2Object(
  filePath: string,
): Promise<void> {
  const parsed = parseR2FilePath(filePath);

  if (!parsed) {
    return;
  }

  const deleteUrl = await createR2PresignedUrl({
    bucketName: parsed.bucketName,
    expiresIn: 60,
    key: parsed.key,
    method: "DELETE",
  });
  const response = await fetch(deleteUrl, {
    method: "DELETE",
  });

  if (!response.ok && response.status !== 404) {
    throw new Error(
      `Object R2 gagal dihapus dengan status ${response.status}.`,
    );
  }
}
