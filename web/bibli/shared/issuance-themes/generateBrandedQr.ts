import type { GenerateBrandedQrOptions } from './types';

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
}

export async function generateBrandedQr(
  canvas: HTMLCanvasElement,
  url: string,
  logoUrl?: string | null,
  options: GenerateBrandedQrOptions = {},
): Promise<void> {
  if (!url || typeof url !== 'string' || url.trim() === '') {
    return;
  }

  const size = options.size ?? (canvas.width || 200);
  const logoRatio = options.logoRatio ?? 0.22;

  canvas.width = size;
  canvas.height = size;

  const QRCode = (await import('qrcode')).default;

  await QRCode.toCanvas(canvas, url.trim(), {
    width: size,
    margin: 2,
    errorCorrectionLevel: 'H',
    color: { dark: '#000000', light: '#ffffff' },
  });

  if (!logoUrl) {
    return;
  }

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return;
  }

  const img = await loadImage(logoUrl);
  const logoSize = size * logoRatio;
  const x = (size - logoSize) / 2;
  const y = (size - logoSize) / 2;
  const pad = logoSize * 0.12;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x - pad, y - pad, logoSize + pad * 2, logoSize + pad * 2);
  ctx.drawImage(img, x, y, logoSize, logoSize);
}
