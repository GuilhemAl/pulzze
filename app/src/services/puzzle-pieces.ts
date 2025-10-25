const createImageElement = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = "async";
    image.crossOrigin = "anonymous";
    image.referrerPolicy = "no-referrer";
    image.onload = () => resolve(image);
    image.onerror = (event) => reject(event);
    image.src = src;
  });

export type PuzzlePieceAsset = {
  id: string;
  correctRow: number;
  correctCol: number;
  imageSrc: string;
};

const CANVAS_MIME = "image/webp";
const CANVAS_QUALITY = 0.92;

export const sliceImageIntoPieces = async (
  imageUrl: string,
  gridSize: number
): Promise<PuzzlePieceAsset[]> => {
  if (!imageUrl) {
    throw new Error("URL d'image invalide pour la generation du puzzle.");
  }

  if (gridSize < 1) {
    throw new Error("La taille de la grille doit etre superieure a zero.");
  }

  const image = await createImageElement(imageUrl);
  const squareSize = Math.min(image.naturalWidth, image.naturalHeight);
  const offsetX = (image.naturalWidth - squareSize) / 2;
  const offsetY = (image.naturalHeight - squareSize) / 2;
  const sourcePieceSize = squareSize / gridSize;
  const canvasSize = Math.max(1, Math.round(sourcePieceSize));

  const canvas = document.createElement("canvas");
  canvas.width = canvasSize;
  canvas.height = canvasSize;
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Impossible de generer le puzzle: contexte 2D indisponible.");
  }

  const pieces: PuzzlePieceAsset[] = [];

  for (let row = 0; row < gridSize; row += 1) {
    for (let col = 0; col < gridSize; col += 1) {
      context.clearRect(0, 0, canvasSize, canvasSize);
      context.drawImage(
        image,
        offsetX + col * sourcePieceSize,
        offsetY + row * sourcePieceSize,
        sourcePieceSize,
        sourcePieceSize,
        0,
        0,
        canvasSize,
        canvasSize
      );

      const imageSrc = canvas.toDataURL(CANVAS_MIME, CANVAS_QUALITY);
      pieces.push({
        id: `${row}-${col}`,
        correctRow: row,
        correctCol: col,
        imageSrc
      });
    }
  }

  return pieces;
};