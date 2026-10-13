export const shuffle = <T,>(arr: T[]): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

export const formatTime = (ms: number) => {
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  const t = Math.floor((ms % 1000) / 100);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${t}`;
};

export const getRank = (a: number) => {
  if (a >= 0.8) return "S";
  if (a >= 0.62) return "A";
  if (a >= 0.48) return "B";
  if (a >= 0.34) return "C";
  return "D";
};

export const RANK_STYLE: Record<string, { color: string; label: string }> = {
  S: { color: "#ffd23f", label: "SENSACIONAL!" },
  A: { color: "#ff3d9a", label: "ARRASOU!" },
  B: { color: "#3ee0ff", label: "BOA LUTA!" },
  C: { color: "#a78bfa", label: "CONSEGUIU!" },
  D: { color: "#9ca3af", label: "DÁ PRA MELHORAR" },
};
