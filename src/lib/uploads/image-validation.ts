export const MAX_IMAGE_BYTES = 12 * 1024 * 1024;
export const MAX_CORNER_IMAGES = 4;
export const MAX_TOTAL_UPLOAD_BYTES = 60 * 1024 * 1024;

export type DetectedImage = {
  mime: "image/jpeg" | "image/png" | "image/webp";
  ext: "jpg" | "png" | "webp";
};

function startsWith(bytes: Uint8Array, signature: number[]): boolean {
  if (bytes.length < signature.length) return false;
  return signature.every((value, index) => bytes[index] === value);
}

export function detectImageType(bytes: Uint8Array): DetectedImage | null {
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) {
    return { mime: "image/jpeg", ext: "jpg" };
  }

  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
    return { mime: "image/png", ext: "png" };
  }

  if (
    bytes.length >= 12 &&
    startsWith(bytes, [0x52, 0x49, 0x46, 0x46]) &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return { mime: "image/webp", ext: "webp" };
  }

  return null;
}

export async function inspectUploadedImage(file: File): Promise<DetectedImage | null> {
  if (file.size <= 0 || file.size > MAX_IMAGE_BYTES) return null;
  const header = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  return detectImageType(header);
}
