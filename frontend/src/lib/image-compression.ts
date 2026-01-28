import sharp from "sharp";

const MAX_FILE_SIZE = 4.5 * 1024 * 1024; // 4.5MB in bytes

/**
 * Compress and convert image to WebP format
 * Ensures the output is under 4.5MB
 * @param buffer - Image buffer
 * @param quality - Initial quality (default: 85)
 * @returns Compressed WebP buffer
 */
export async function compressToWebP(
  buffer: Buffer,
  quality: number = 85
): Promise<Buffer> {
  let currentQuality = quality;
  let compressedBuffer: Buffer;

  // Try compressing with decreasing quality until we're under the limit
  while (currentQuality >= 20) {
    compressedBuffer = await sharp(buffer)
      .webp({ quality: currentQuality, effort: 6 })
      .toBuffer();

    // If we're under the size limit, return
    if (compressedBuffer.length <= MAX_FILE_SIZE) {
      return compressedBuffer;
    }

    // Reduce quality by 10 and try again
    currentQuality -= 10;
  }

  // If still too large, resize the image
  const metadata = await sharp(buffer).metadata();
  let width = metadata.width ?? 1920;
  let height = metadata.height ?? 1080;

  // Keep trying with smaller dimensions
  while (width > 800 && height > 600) {
    compressedBuffer = await sharp(buffer)
      .resize(width, height, {
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 75, effort: 6 })
      .toBuffer();

    if (compressedBuffer.length <= MAX_FILE_SIZE) {
      return compressedBuffer;
    }

    // Reduce dimensions by 20%
    width = Math.floor(width * 0.8);
    height = Math.floor(height * 0.8);
  }

  // Last resort: aggressive compression
  return await sharp(buffer)
    .resize(800, 600, {
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: 60, effort: 6 })
    .toBuffer();
}

/**
 * Get image metadata
 */
export async function getImageMetadata(buffer: Buffer) {
  return await sharp(buffer).metadata();
}

