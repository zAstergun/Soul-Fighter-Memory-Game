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
  const list = [...(board[diff] ?? []), entry].sort((a, b) => b.score - a.score || a.timeMs - b.timeMs).slice(0, 5);
  board[diff] = list;
  localStorage.setItem(KEY, JSON.stringify(board));
  return list.indexOf(entry);
};

export const getPlayerName = () => localStorage.getItem("player") ?? "";
export const setPlayerName = (n: string) => localStorage.setItem("player", n);
