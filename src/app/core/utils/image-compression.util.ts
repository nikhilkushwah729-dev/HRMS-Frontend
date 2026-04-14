export interface ImageCompressionOptions {
  maxWidth: number;
  maxHeight: number;
  quality?: number;
  mimeType?: 'image/webp' | 'image/jpeg';
}

function isSvgDataUrl(dataUrl: string): boolean {
  return dataUrl.startsWith('data:image/svg+xml');
}

function loadImage(source: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Failed to load image'));
    image.src = source;
  });
}

function canvasToDataUrl(canvas: HTMLCanvasElement, mimeType: 'image/webp' | 'image/jpeg', quality: number): Promise<string> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        resolve(canvas.toDataURL('image/jpeg', quality));
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => resolve(typeof reader.result === 'string' ? reader.result : canvas.toDataURL('image/jpeg', quality));
      reader.onerror = () => resolve(canvas.toDataURL('image/jpeg', quality));
      reader.readAsDataURL(blob);
    }, mimeType, quality);
  });
}

export async function compressImageDataUrl(
  dataUrl: string,
  options: ImageCompressionOptions
): Promise<string> {
  if (!dataUrl || typeof dataUrl !== 'string') {
    return dataUrl;
  }

  if (!dataUrl.startsWith('data:image/')) {
    return dataUrl;
  }

  if (isSvgDataUrl(dataUrl)) {
    return dataUrl;
  }

  const quality = options.quality ?? 0.82;
  const preferredType = options.mimeType ?? 'image/webp';

  try {
    const image = await loadImage(dataUrl);
    const scale = Math.min(
      1,
      options.maxWidth / image.width,
      options.maxHeight / image.height
    );

    const width = Math.max(1, Math.round(image.width * scale));
    const height = Math.max(1, Math.round(image.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext('2d');
    if (!context) {
      return dataUrl;
    }

    context.drawImage(image, 0, 0, width, height);
    return await canvasToDataUrl(canvas, preferredType, quality);
  } catch {
    return dataUrl;
  }
}
