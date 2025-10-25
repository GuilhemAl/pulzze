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
import { fetchImageById, type GalleryImage } from "../services/supabase-images";
import { sliceImageIntoPieces } from "../services/puzzle-pieces";
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

const cellKey = (row: number, col: number) => `${row}-${col}`;

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

        const generatedPieces = await sliceImageIntoPieces(
          record.publicUrl,
          GRID_SIZE
        );
        if (!isActive) {
          return;
        }

        setImage(record);
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

  useEffect(() => {
    if (!startedAt || !completedAt) {
      return;
    }

    const totalSeconds = Math.max(0, Math.round((completedAt - startedAt) / 1000));
    setFeedbackMessage(`Bravo ! Puzzle termine en ${formatSeconds(totalSeconds)}`);
  }, [completedAt, startedAt]);

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
        occupancy.set(cellKey(piece.location.row, piece.location.col), piece);
      }
    });
    return occupancy;
  }, [pieces]);

  const placedCount = pieces.filter((piece) => piece.placed).length;

  const boardBackgroundStyle = useMemo<CSSProperties | undefined>(() => {
    if (!image || !hintVisible) {
      return undefined;
    }

    return {
      backgroundImage: `url(${image.publicUrl})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat"
    } satisfies CSSProperties;
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
      const key = cellKey(row, col);
      if (boardOccupancy.has(key)) {
        return;
      }
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
    },
    [boardOccupancy]
  );

  const handleDragEnter = useCallback(
    (row: number, col: number) => () => {
      const key = cellKey(row, col);
      if (boardOccupancy.has(key)) {
        return;
      }
      setDragOverCell(key);
    },
    [boardOccupancy]
  );

  const handleDragLeave = useCallback(
    (row: number, col: number) => () => {
      const key = cellKey(row, col);
      if (dragOverCell === key) {
        setDragOverCell(null);
      }
    },
    [dragOverCell]
  );

  const handleDrop = useCallback(
    (row: number, col: number) => (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setDragOverCell(null);

      const pieceId =
        event.dataTransfer.getData("application/puzzle-piece") ||
        event.dataTransfer.getData("text/plain");

      if (!pieceId) {
        return;
      }

      const success = moveToBoard(pieceId, row, col);
      if (success) {
        setFeedbackMessage("Piece en place !");
      } else {
        setFeedbackMessage("Essaie une autre case.");
      }
    },
    [moveToBoard]
  );

  const renderBoardCell = (row: number, col: number) => {
    const key = cellKey(row, col);
    const boardPiece = boardOccupancy.get(key);

    return (
      <div
        key={key}
        className={clsx(
          styles.boardCell,
          boardPiece && styles.boardCellFilled,
          dragOverCell === key && styles.boardCellActive
        )}
        onDragOver={handleDragOver(row, col)}
        onDragEnter={handleDragEnter(row, col)}
        onDragLeave={handleDragLeave(row, col)}
        onDrop={handleDrop(row, col)}
        role="presentation"
      >
        <div className={styles.boardCellInner}>
          {boardPiece ? (
            <div className={styles.boardPiece}>
              <img
                src={boardPiece.imageSrc}
                alt=""
                className={styles.boardPieceImage}
                draggable={false}
              />
            </div>
          ) : (
            <span className={styles.cellPlaceholder} aria-hidden="true">
              {row + 1}-{col + 1}
            </span>
          )}
        </div>
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
                  src={piece.imageSrc}
                  alt=""
                  className={styles.trayPieceImage}
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