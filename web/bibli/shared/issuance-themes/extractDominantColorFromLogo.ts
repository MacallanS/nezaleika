import {
  DOCUMENT_STORAGE_HOSTS,
  isLocalDevHostname,
} from 'bibli/shared/utils/documentApiOrigin'

const WHITE_THRESHOLD = 240;
const ALPHA_THRESHOLD = 16;
const QUANTIZE_STEP = 16;

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (value: number) => value.toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function quantize(value: number): number {
  return Math.min(255, Math.round(value / QUANTIZE_STEP) * QUANTIZE_STEP);
}

function isIgnoredPixel(r: number, g: number, b: number, a: number): boolean {
  if (a < ALPHA_THRESHOLD) {
    return true;
  }

  return r >= WHITE_THRESHOLD && g >= WHITE_THRESHOLD && b >= WHITE_THRESHOLD;
}

export interface DominantColorInput {
  data: Uint8ClampedArray;
  width: number;
  height: number;
}

/** Count non-white / non-transparent pixels; return most frequent quantized hex color. */
export function extractDominantColorFromImageData(
  input: DominantColorInput,
): string | null {
  const { data, width, height } = input;
  const counts = new Map<string, number>();

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * 4;
      const r = data[index];
      const g = data[index + 1];
      const b = data[index + 2];
      const a = data[index + 3];

      if (isIgnoredPixel(r, g, b, a)) {
        continue;
      }

      const hex = rgbToHex(quantize(r), quantize(g), quantize(b));
      counts.set(hex, (counts.get(hex) ?? 0) + 1);
    }
  }

  if (counts.size === 0) {
    return null;
  }

  let dominant: string | null = null;
  let maxCount = 0;

  for (const [hex, count] of counts.entries()) {
    if (count > maxCount) {
      dominant = hex;
      maxCount = count;
    }
  }

  return dominant;
}

/** Local dev: same-origin /document-proxy вместо cross-origin dev.server (CORS на canvas). */
export function resolveLogoLoadUrl(logoUrl: string): string {
  if (!logoUrl || typeof window === 'undefined') {
    return logoUrl;
  }

  try {
    const parsed = new URL(logoUrl, window.location.href);
    const host = window.location.hostname.toLowerCase();

    if (!isLocalDevHostname(host) || parsed.origin === window.location.origin) {
      return logoUrl;
    }

    if (
      DOCUMENT_STORAGE_HOSTS.has(parsed.hostname.toLowerCase())
      && parsed.pathname.includes('/document/')
    ) {
      return `${window.location.origin}/document-proxy?url=${encodeURIComponent(logoUrl)}`;
    }
  } catch {
    return logoUrl;
  }

  return logoUrl;
}

export async function extractDominantColorFromLogo(
  logoUrl: string,
  sampleSize = 64,
): Promise<string | null> {
  if (!logoUrl || typeof logoUrl !== 'string') {
    return null;
  }

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Failed to load logo: ${logoUrl}`));
    image.src = resolveLogoLoadUrl(logoUrl);
  });

  const canvas = document.createElement('canvas');
  canvas.width = sampleSize;
  canvas.height = sampleSize;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return null;
  }

  ctx.drawImage(img, 0, 0, sampleSize, sampleSize);
  const imageData = ctx.getImageData(0, 0, sampleSize, sampleSize);

  return extractDominantColorFromImageData({
    data: imageData.data,
    width: sampleSize,
    height: sampleSize,
  });
}
