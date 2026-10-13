import type { DifficultyId } from "../data/fighters";

export type ScoreEntry = {
  name: string;
  score: number;
  timeMs: number;
  moves: number;
  rank: string;
  date: number;
};

type Board = Partial<Record<DifficultyId, ScoreEntry[]>>;

const KEY = "sf-memory-leaderboard-v1";

export const loadBoard = (): Board => {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}") as Board;
  } catch {
    return {};
  }
};

/** Salva e retorna a posição (0-based) no ranking, ou -1 se não entrou no top 5 */
export const saveScore = (diff: DifficultyId, entry: ScoreEntry): number => {
  const board = loadBoard();
  const currentList = board[diff] ?? [];
  const normalizedNewName = entry.name.toLowerCase().trim();

  // Verifica se o jogador já tem registro nesta categoria
  const existingIndex = currentList.findIndex(
    (e) => e.name.toLowerCase().trim() === normalizedNewName
  );

  let updatedList: ScoreEntry[];
  if (existingIndex >= 0) {
    const existing = currentList[existingIndex];
    const isBetter =
      entry.score > existing.score ||
      (entry.score === existing.score && entry.timeMs < existing.timeMs);

    if (isBetter) {
      // Substitui a pontuação anterior pela melhor
      updatedList = [...currentList];
      updatedList[existingIndex] = entry;
    } else {
      // Mantém a melhor pontuação que já existia
      updatedList = currentList;
    }
  } else {
    // Primeiro registro do jogador nesta categoria
    updatedList = [...currentList, entry];
  }

  // Ordena por maior pontuação e desempate por menor tempo
  updatedList.sort((a, b) => b.score - a.score || a.timeMs - b.timeMs);
  const finalList = updatedList.slice(0, 10);
  board[diff] = finalList;
  localStorage.setItem(KEY, JSON.stringify(board));
  return finalList.indexOf(entry);
};

export const getPlayerName = () => localStorage.getItem("player") ?? "";
export const setPlayerName = (n: string) => localStorage.setItem("player", n);
