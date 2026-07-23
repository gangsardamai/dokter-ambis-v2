import "server-only";

import {
  createHash,
  createHmac,
} from "node:crypto";

type R2Method = "GET" | "PUT" | "DELETE";

interface PresignOptions {
  method: R2Method;
  key: string;
  expiresIn?: number;
  contentType?: string;
  downloadName?: string;
}

interface R2Config {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
}

const MAX_PRESIGN_SECONDS = 900;

function getR2Config(): R2Config {
  const accountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID;
  const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
  const bucket = process.env.CLOUDFLARE_R2_BUCKET;

  if (
    !accountId ||
    !accessKeyId ||
    !secretAccessKey ||
    !bucket
  ) {
    throw new Error(
      "Konfigurasi Cloudflare R2 belum lengkap.",
    );
  }

  return {
    accountId,
    accessKeyId,
    secretAccessKey,
    bucket,
  };
}

function encodeRfc3986(value: string): string {
  return encodeURIComponent(value).replace(
    /[!'()*]/g,
    (character) =>
      `%${character.charCodeAt(0).toString(16).toUpperCase()}`,
  );
}

function encodePath(value: string): string {
  return value
    .split("/")
    .map((segment) => encodeRfc3986(segment))
    .join("/");
}

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function hmac(
  key: Buffer | string,
  value: string,
): Buffer {
  return createHmac("sha256", key).update(value).digest();
}

function formatDate(date: Date): {
  dateStamp: string;
  amzDate: string;
} {
  const iso = date
    .toISOString()
    .replace(/[:-]|\.\d{3}/g, "");

  return {
    dateStamp: iso.slice(0, 8),
    amzDate: iso,
  };
}

function compareAscii(left: string, right: string): number {
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

function createCanonicalQuery(
  parameters: Record<string, string>,
): string {
  return Object.entries(parameters)
    .map(([key, value]) => [
      encodeRfc3986(key),
      encodeRfc3986(value),
    ] as const)
    .sort(([leftKey, leftValue], [rightKey, rightValue]) => {
      const keyComparison = compareAscii(leftKey, rightKey);
      return keyComparison || compareAscii(leftValue, rightValue);
    })
    .map(([key, value]) => `${key}=${value}`)
    .join("&");
}

export function getR2BucketName(): string {
  return getR2Config().bucket;
}

export function createR2FilePath(key: string): string {
  const { bucket } = getR2Config();
  return `r2://${bucket}/${key}`;
}

export function parseR2FilePath(filePath: string): {
  bucket: string;
  key: string;
} | null {
  if (!filePath.startsWith("r2://")) {
    return null;
  }

  const pathWithoutScheme = filePath.slice("r2://".length);
  const separatorIndex = pathWithoutScheme.indexOf("/");

  if (separatorIndex < 1) {
    return null;
  }

  const bucket = pathWithoutScheme.slice(0, separatorIndex);
  const key = pathWithoutScheme.slice(separatorIndex + 1);

  if (!key) {
    return null;
  }

  return { bucket, key };
}

export function createR2PresignedUrl({
  method,
  key,
  expiresIn = 300,
  contentType,
  downloadName,
}: PresignOptions): {
  url: string;
  headers: Record<string, string>;
} {
  const {
    accountId,
    accessKeyId,
    secretAccessKey,
    bucket,
  } = getR2Config();

  const safeExpiresIn = Math.min(
    Math.max(Math.floor(expiresIn), 1),
    MAX_PRESIGN_SECONDS,
  );
  const host = `${accountId}.r2.cloudflarestorage.com`;
  const canonicalUri = `/${encodeRfc3986(bucket)}/${encodePath(key)}`;
  const { dateStamp, amzDate } = formatDate(new Date());
  const credentialScope = `${dateStamp}/auto/s3/aws4_request`;
  const headers: Record<string, string> = {};
  const canonicalHeaders: string[] = [];

  if (contentType) {
    const normalizedContentType =
      contentType.trim().toLowerCase();
    headers["Content-Type"] = normalizedContentType;
    canonicalHeaders.push(
      `content-type:${normalizedContentType}\n`,
    );
  }

  canonicalHeaders.push(`host:${host}\n`);

  const signedHeaders = contentType
    ? "content-type;host"
    : "host";
  const queryParameters: Record<string, string> = {
    "X-Amz-Algorithm": "AWS4-HMAC-SHA256",
    "X-Amz-Content-Sha256": "UNSIGNED-PAYLOAD",
    "X-Amz-Credential": `${accessKeyId}/${credentialScope}`,
    "X-Amz-Date": amzDate,
    "X-Amz-Expires": String(safeExpiresIn),
    "X-Amz-SignedHeaders": signedHeaders,
  };

  if (method === "GET" && downloadName) {
    queryParameters["response-content-disposition"] =
      `attachment; filename*=UTF-8''${encodeRfc3986(downloadName)}`;
  }

  const canonicalQuery = createCanonicalQuery(queryParameters);
  const canonicalRequest = [
    method,
    canonicalUri,
    canonicalQuery,
    canonicalHeaders.join(""),
    signedHeaders,
    "UNSIGNED-PAYLOAD",
  ].join("\n");
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    credentialScope,
    sha256(canonicalRequest),
  ].join("\n");
  const dateKey = hmac(`AWS4${secretAccessKey}`, dateStamp);
  const regionKey = hmac(dateKey, "auto");
  const serviceKey = hmac(regionKey, "s3");
  const signingKey = hmac(serviceKey, "aws4_request");
  const signature = createHmac("sha256", signingKey)
    .update(stringToSign)
    .digest("hex");
  const finalQuery = `${canonicalQuery}&X-Amz-Signature=${signature}`;

  return {
    url: `https://${host}${canonicalUri}?${finalQuery}`,
    headers,
  };
}
