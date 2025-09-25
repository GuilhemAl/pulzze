import clsx from "clsx";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type DragEvent
} from "react";
import { useParams } from "react-router-dom";

import { Button } from "../components/Button";
import { ButtonLink } from "../components/ButtonLink";
import {
  fetchImageById,
  type GalleryImage
} from "../services/supabase-images";
import {
  usePuzzleStore,
  type PuzzlePiece
} from "../store/puzzle-store";
import styles from "./PlayPage.module.css";

type RouteParams = {
  imageId?: string;
};

const GRID_SIZE = 3;
const PIECE_COUNT = GRID_SIZE * GRID_SIZE;

const formatSeconds = (value: number) => {
  const minutes = Math.floor(value / 60)
    .toString()
    .padStart(2, "0");
  const seconds = Math.floor(value % 60)
    .toString()
    .padStart(2, "0");
  return `${minutes}:${seconds}`;
};

const loadImageElement = (url: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = (event) => reject(event);
    image.src = url;
  });

const createPuzzlePieces = async (imageUrl: string) => {
  const image = await loadImageElement(imageUrl);
  const sliceSize = Math.min(image.naturalWidth, image.naturalHeight);
  const offsetX = (image.naturalWidth - sliceSize) / 2;
  const offsetY = (image.naturalHeight - sliceSize) / 2;
  const segmentSize = sliceSize / GRID_SIZE;

  const canvas = document.createElement("canvas");
  const EXPORT_SIZE = 256;
  canvas.width = EXPORT_SIZE;
  canvas.height = EXPORT_SIZE;
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Canvas 2D non disponible pour generer les pieces.");
  }

  const pieces = [] as Array<{
    id: string;
    imageData: string;
    correctRow: number;
    correctCol: number;
  }>;

  for (let row = 0; row < GRID_SIZE; row += 1) {
    for (let col = 0; col < GRID_SIZE; col += 1) {
      context.clearRect(0, 0, EXPORT_SIZE, EXPORT_SIZE);
      context.drawImage(
        image,
        offsetX + col * segmentSize,
        offsetY + row * segmentSize,
        segmentSize,
        segmentSize,
        0,
        0,
        EXPORT_SIZE,
        EXPORT_SIZE
      );
      const imageData = canvas.toDataURL("image/png");
      pieces.push({
        id: `${row}-${col}`,
        imageData,
        correctRow: row,
        correctCol: col
      });
    }
  }

  return pieces;
};

export const PlayPage = () => {
  const { imageId } = useParams<RouteParams>();

  const pieces = usePuzzleStore((state) => state.pieces);
  const hintVisible = usePuzzleStore((state) => state.hintVisible);
  const startedAt = usePuzzleStore((state) => state.startedAt);
  const completedAt = usePuzzleStore((state) => state.completedAt);
  const { initialise, moveToBoard, reset, toggleHint } = usePuzzleStore(
    (state) => state.actions
  );

  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [image, setImage] = useState<GalleryImage | null>(null);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [dragOverCell, setDragOverCell] = useState<string | null>(null);

  useEffect(() => {
    if (!startedAt) {
      setElapsedSeconds(0);
      return;
    }

    const update = () => {
      const end = completedAt ?? Date.now();
      setElapsedSeconds((end - startedAt) / 1000);
    };

    update();
    const intervalId = window.setInterval(update, 500);
    return () => window.clearInterval(intervalId);
  }, [startedAt, completedAt]);

  useEffect(() => {
    let isActive = true;

    const load = async () => {
      reset();
      setImage(null);
      setFeedbackMessage(null);
      setDragOverCell(null);

      if (!imageId) {
        setLoadError("Aucune image selectionnee.");
        return;
      }

      try {
        setIsImageLoading(true);
        setLoadError(null);
        const record = await fetchImageById(imageId);
        if (!isActive) {
          return;
        }
        if (!record) {
          setLoadError("Image introuvable ou non publiee.");
          return;
        }
        setImage(record);
        const generatedPieces = await createPuzzlePieces(record.publicUrl);
        if (!isActive) {
          return;
        }
        initialise(generatedPieces);
      } catch (error) {
        console.error(error);
        if (isActive) {
          setLoadError("Impossible de charger cette image.");
        }
      } finally {
        if (isActive) {
          setIsImageLoading(false);
        }
      }
    };

    load();

    return () => {
      isActive = false;
      reset();
    };
  }, [imageId, initialise, reset]);

  const trayPieces = useMemo(
    () =>
      pieces
        .filter((piece) => piece.location.area === "tray")
        .sort((a, b) => a.order - b.order),
    [pieces]
  );

  const boardOccupancy = useMemo(() => {
    const occupancy = new Map<string, PuzzlePiece>();
    pieces.forEach((piece) => {
      if (piece.location.area === "board") {
        occupancy.set(
          `${piece.location.row}-${piece.location.col}`,
          piece
        );
      }
    });
    return occupancy;
  }, [pieces]);

  const placedCount = pieces.filter((piece) => piece.placed).length;

  const boardBackgroundStyle = useMemo<CSSProperties | undefined>(() => {
    if (!image || !hintVisible) {
      return undefined;
    }

    const style: CSSProperties = {
      backgroundImage: `url(${image.publicUrl})`,
      backgroundSize: "100% 100%",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat"
    };

    return style;
  }, [image, hintVisible]);

  const handleDragStart = useCallback(
    (pieceId: string) => (event: DragEvent<HTMLDivElement>) => {
      event.dataTransfer.setData("application/puzzle-piece", pieceId);
      event.dataTransfer.setData("text/plain", pieceId);
      event.dataTransfer.effectAllowed = "move";
      setFeedbackMessage(null);
    },
    []
  );

  const handleDragOver = useCallback(
    (row: number, col: number) => (event: DragEvent<HTMLDivElement>) => {
      const cellKey = `${row}-${col}`;
      if (boardOccupancy.has(cellKey)) {
        return;
      }
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
    },
    [boardOccupancy]
  );

  const handleDragEnter = useCallback(
    (row: number, col: number) => () => {
      const cellKey = `${row}-${col}`;
      if (boardOccupancy.has(cellKey)) {
        return;
      }
      setDragOverCell(cellKey);
    },
    [boardOccupancy]
  );

  const handleDragLeave = useCallback((row: number, col: number) => () => {
    const cellKey = `${row}-${col}`;
    setDragOverCell((current) => (current === cellKey ? null : current));
  }, []);

  const handleDrop = useCallback(
    (row: number, col: number) => (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      const cellKey = `${row}-${col}`;
      setDragOverCell(null);

      if (boardOccupancy.has(cellKey)) {
        setFeedbackMessage("Cette case est deja occupee.");
        return;
      }

      const pieceId =
        event.dataTransfer.getData("application/puzzle-piece") ||
        event.dataTransfer.getData("text/plain");

      if (!pieceId) {
        return;
      }

      const success = moveToBoard(pieceId, row, col);
      if (!success) {
        setFeedbackMessage("Cette piece ne correspond pas a cette position.");
      } else {
        setFeedbackMessage(null);
      }
    },
    [boardOccupancy, moveToBoard]
  );

  const renderBoardCell = (row: number, col: number) => {
    const cellKey = `${row}-${col}`;
    const boardPiece = boardOccupancy.get(cellKey);

    return (
      <div
        key={cellKey}
        className={clsx(
          styles.boardCell,
          boardPiece && styles.boardCellFilled,
          dragOverCell === cellKey && styles.boardCellActive
        )}
        onDragOver={handleDragOver(row, col)}
        onDragEnter={handleDragEnter(row, col)}
        onDragLeave={handleDragLeave(row, col)}
        onDrop={handleDrop(row, col)}
        role="presentation"
      >
        {boardPiece ? (
          <img
            src={boardPiece.imageData}
            alt={`Piece position ${row + 1}-${col + 1}`}
            className={styles.boardPiece}
            draggable={false}
          />
        ) : (
          <span className={styles.cellPlaceholder} aria-hidden="true">
            {row + 1}-{col + 1}
          </span>
        )}
      </div>
    );
  };

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <ButtonLink to="/gallery" variant="ghost">
          Retour galerie
        </ButtonLink>
        <div className={styles.metrics}>
          <div>
            <span className={styles.metricLabel}>Timer</span>
            <span className={styles.metricValue}>{formatSeconds(elapsedSeconds)}</span>
          </div>
          <div>
            <span className={styles.metricLabel}>Pieces</span>
            <span className={styles.metricValue}>
              {placedCount} / {PIECE_COUNT}
            </span>
          </div>
          <div>
            <span className={styles.metricLabel}>Indice</span>
            <span className={styles.metricValue}>{hintVisible ? "On" : "Off"}</span>
          </div>
        </div>
        <div>
          <Button variant="secondary" onClick={toggleHint}>
            {hintVisible ? "Masquer indice" : "Activer indice"}
          </Button>
        </div>
      </div>

      {feedbackMessage ? (
        <p className={styles.feedbackMessage} role="status">
          {feedbackMessage}
        </p>
      ) : null}

      <div className={styles.board}>
        <section className={styles.canvas}>
          {isImageLoading ? (
            <p className={styles.canvasMessage} role="status">
              Chargement de l'image...
            </p>
          ) : loadError ? (
            <p className={styles.canvasMessage} role="alert">
              {loadError}
            </p>
          ) : image ? (
            <div className={styles.canvasContent}>
              <div
                className={clsx(styles.boardGrid, hintVisible && styles.boardGridHint)}
                style={boardBackgroundStyle}
                aria-label="Plateau du puzzle"
              >
                {Array.from({ length: GRID_SIZE }).map((_, row) =>
                  Array.from({ length: GRID_SIZE }).map((__, col) =>
                    renderBoardCell(row, col)
                  )
                )}
              </div>
              {!hintVisible ? (
                <p className={styles.canvasHintMessage}>
                  Active l'indice pour afficher l'image de reference.
                </p>
              ) : null}
            </div>
          ) : (
            <p className={styles.canvasMessage}>Selectionne une image depuis la galerie.</p>
          )}
        </section>
        <aside className={styles.piecesArea}>
          <header>
            <h2>Pieces melangees</h2>
            <p>
              Fais glisser chaque piece vers sa position. Les pieces se verrouillent automatiquement si la position est correcte.
            </p>
          </header>
          <div className={styles.trayPieces}>
            {trayPieces.map((piece) => (
              <div
                key={piece.id}
                className={styles.trayPiece}
                draggable
                onDragStart={handleDragStart(piece.id)}
                role="button"
                tabIndex={0}
                aria-label={`Piece a placer ${piece.id}`}
              >
                <img
                  src={piece.imageData}
                  alt=""
                  className={styles.pieceImage}
                  draggable={false}
                />
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
};
