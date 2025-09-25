import { create } from "zustand";

type PieceLocation =
  | { area: "tray" }
  | { area: "board"; row: number; col: number };

export type PuzzlePiece = {
  id: string;
  correctRow: number;
  correctCol: number;
  placed: boolean;
  location: PieceLocation;
  order: number;
};

type PuzzlePieceInput = {
  id: string;
  correctRow: number;
  correctCol: number;
};

export type PuzzleState = {
  pieces: PuzzlePiece[];
  startedAt: number | null;
  completedAt: number | null;
  hintVisible: boolean;
  actions: {
    initialise: (pieces: PuzzlePieceInput[]) => void;
    moveToBoard: (pieceId: string, row: number, col: number) => boolean;
    reset: () => void;
    toggleHint: () => void;
  };
};

const shufflePieces = (pieces: PuzzlePieceInput[]) => {
  return [...pieces]
    .map((piece) => ({ sortKey: Math.random(), piece }))
    .sort((a, b) => a.sortKey - b.sortKey)
    .map(({ piece }) => piece);
};

export const usePuzzleStore = create<PuzzleState>((set) => ({
  pieces: [],
  startedAt: null,
  completedAt: null,
  hintVisible: false,
  actions: {
    initialise: (inputPieces) => {
      const shuffled = shufflePieces(inputPieces);
      const pieces: PuzzlePiece[] = shuffled.map((piece, index) => ({
        ...piece,
        placed: false,
        location: { area: "tray" as const },
        order: index
      }));

      set({
        pieces,
        startedAt: Date.now(),
        completedAt: null,
        hintVisible: false
      });
    },
    moveToBoard: (pieceId, row, col) => {
      let success = false;

      set((state) => {
        const piece = state.pieces.find((item) => item.id === pieceId);
        if (!piece || piece.placed || piece.correctRow !== row || piece.correctCol !== col) {
          return state;
        }

        const cellOccupied = state.pieces.some(
          (item) =>
            item.location.area === "board" &&
            item.location.row === row &&
            item.location.col === col
        );

        if (cellOccupied) {
          return state;
        }

        const updatedPieces: PuzzlePiece[] = state.pieces.map((item) =>
          item.id === pieceId
            ? {
                ...item,
                placed: true,
                location: { area: "board", row, col }
              }
            : item
        );

        const allPlaced = updatedPieces.every((item) => item.placed);
        success = true;

        return {
          pieces: updatedPieces,
          completedAt: allPlaced ? Date.now() : state.completedAt
        };
      });

      return success;
    },
    reset: () => {
      set({ pieces: [], startedAt: null, completedAt: null, hintVisible: false });
    },
    toggleHint: () => {
      set((state) => ({ hintVisible: !state.hintVisible }));
    }
  }
}));
