const MAX_OUTPUT_SIZE = 1920;
const OUTPUT_TYPE = "image/webp";
const OUTPUT_QUALITY = 0.85;

const loadImage = (file: File): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    const url = URL.createObjectURL(file);

    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };

    image.onerror = (event) => {
      URL.revokeObjectURL(url);
      reject(event);
    };

    image.src = url;
  });

const canvasToBlob = (canvas: HTMLCanvasElement, type: string, quality: number) =>
  new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("Impossible de generer le blob compresse."));
        return;
      }
      resolve(blob);
    }, type, quality);
  });

export type ProcessedImage = {
  blob: Blob;
  width: number;
  height: number;
};

export const processImageFile = async (file: File): Promise<ProcessedImage> => {
  const image = await loadImage(file);
  const minSize = Math.min(image.naturalWidth, image.naturalHeight);
  const targetSize = Math.min(MAX_OUTPUT_SIZE, minSize);

  const canvas = document.createElement("canvas");
  canvas.width = targetSize;
  canvas.height = targetSize;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Canvas 2D non disponible sur ce navigateur.");
  }

  const offsetX = (image.naturalWidth - minSize) / 2;
  const offsetY = (image.naturalHeight - minSize) / 2;

  context.drawImage(
    image,
    offsetX,
    offsetY,
    minSize,
    minSize,
    0,
    0,
    targetSize,
    targetSize
  );

  const blob = await canvasToBlob(canvas, OUTPUT_TYPE, OUTPUT_QUALITY);
  return {
    blob,
    width: targetSize,
    height: targetSize
  };
};
