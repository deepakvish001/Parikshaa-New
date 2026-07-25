/**
 * Allowlisting + validation for discussion comment attachments.
 * Kept as a pure module so it can be unit-tested without pulling in React.
 */
export const ALLOWED_IMAGE_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
]);
export const ALLOWED_IMAGE_EXTS = new Set(["png", "jpg", "jpeg", "webp", "gif"]);
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const SIGNED_URL_TTL_SECONDS = 60 * 60 * 24 * 90; // 90 days

export type AttachmentValidation =
  | { ok: true; ext: string }
  | { ok: false; reason: string };

export function validateAttachment(file: {
  name: string;
  type: string;
  size: number;
}): AttachmentValidation {
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    return { ok: false as const, reason: "Only PNG, JPEG, WEBP, or GIF images are allowed" };
  }
  if (file.size === 0) return { ok: false as const, reason: "Empty file" };
  if (file.size > MAX_IMAGE_BYTES) return { ok: false as const, reason: "Image must be under 5MB" };
  const rawExt = (file.name.split(".").pop() || "").toLowerCase();
  const ext = ALLOWED_IMAGE_EXTS.has(rawExt) ? rawExt : file.type.split("/")[1];
  if (!ALLOWED_IMAGE_EXTS.has(ext)) {
    return { ok: false as const, reason: "Unsupported file extension" };
  }
  return { ok: true as const, ext };
}

/** Only accept http(s) URLs for rendered images. Blocks data:, javascript:, blob:, etc. */
export function isSafeImageUrl(src: string | undefined | null): boolean {
  if (!src) return false;
  return /^https:\/\//i.test(src) || /^http:\/\//i.test(src);
}
