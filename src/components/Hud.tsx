import { FIGHTERS, loadingArt } from "../data/fighters";
import { formatTime } from "../lib/utils";

type Props = {
  playerName: string;
  elapsedMs: number;
  bossHp: number; // 0..1
  bossHit: number; // muda a cada acerto pra disparar animação
  lives: number | null;
  maxLives: number | null;
  combo: number;
  score: number;
  moves: number;
  pairsFound: number;
  pairsTotal: number;
  difficultyLabel: string;
};

const gwen = FIGHTERS.find((f) => f.id === "gwen")!;
const boss = FIGHTERS.find((f) => f.id === "shaco-p")!;

function Portrait({ src, side, color }: { src: string; side: "l" | "r"; color: string }) {
  return (
    <div
      className={`relative h-10 w-10 shrink-0 overflow-hidden rounded-lg border-2 bg-soul-ink sm:h-16 sm:w-16 sm:rounded-xl sm:border-[3px] ${
        side === "l" ? "-skew-x-6" : "skew-x-6"
      }`}
      style={{ borderColor: color, boxShadow: `0 0 14px -3px ${color}` }}
    >
      <img
        src={src}
        alt=""
        className="h-full w-full scale-[1.6] object-cover object-[50%_20%]"
        style={{ transformOrigin: "50% 20%" }}
      />
    </div>
  );
}

export default function Hud(p: Props) {
  const lifePct = p.lives !== null && p.maxLives ? p.lives / p.maxLives : null;
  const comboPct = Math.min(p.combo / 5, 1);

  return (
    <div className="w-full select-none">
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Player */}
        <div className="flex min-w-0 flex-1 items-center gap-1.5 sm:gap-3">
          <Portrait src={loadingArt(gwen)} side="l" color="#ff6fb5" />
          <div className="min-w-0 flex-1">
            <div className="mb-0.5 flex items-baseline justify-between gap-1.5">
              <span className="font-display truncate text-sm leading-none tracking-wide sm:text-xl">
                {p.playerName}
              </span>
              <span className="hidden text-[9px] font-bold tracking-widest text-white/50 uppercase sm:inline">
                {p.difficultyLabel}
              </span>
            </div>
            {/* Barra de vida ou combo */}
            <div className="clip-slant-r relative h-2.5 overflow-hidden bg-black/60 ring-1 ring-white/20 sm:h-4">
              <div
                className={`absolute inset-y-0 left-0 transition-all duration-500 ${
                  lifePct !== null
                    ? lifePct > 0.3
                      ? "bg-gradient-to-r from-emerald-400 to-lime-300"
                      : "bg-gradient-to-r from-red-600 to-orange-400"
                    : "bg-gradient-to-r from-soul-cyan via-soul-violet to-soul-pink"
                }`}
                style={{ width: `${(lifePct ?? comboPct) * 100}%` }}
              />
              <div className="halftone-dark absolute inset-0" />
            </div>
            <div className="mt-0.5 flex items-center justify-between text-[9px] font-bold tracking-widest text-white/60 uppercase sm:text-xs">
              {p.lives !== null ? (
                <span>
                  <span className="text-red-400">♥</span> {p.lives}/{p.maxLives}
                </span>
              ) : (
                <span className="hidden sm:inline">Alma</span>
              )}
              {p.combo >= 2 && <span className="text-soul-gold font-bold">x{p.combo}</span>}
            </div>
          </div>
        </div>

        {/* Timer / VS */}
        <div className="relative flex shrink-0 flex-col items-center">
          <div className="clip-slant flex min-w-[70px] items-center justify-center bg-gradient-to-b from-soul-gold to-soul-orange px-2 py-1 sm:min-w-[110px] sm:py-1.5">
            <span className="font-display text-lg leading-none tracking-wider text-soul-ink tabular-nums sm:text-3xl">
              {formatTime(p.elapsedMs).slice(0, 5)}
            </span>
          </div>
          <span className="font-display text-[10px] tracking-[0.25em] text-white/60 sm:text-xs sm:mt-0.5">
            VS
          </span>
        </div>

        {/* Boss */}
        <div className="flex min-w-0 flex-1 flex-row-reverse items-center gap-1.5 sm:gap-3">
          <Portrait src={loadingArt(boss)} side="r" color="#ffd23f" />
          <div className="min-w-0 flex-1">
            <div className="mb-0.5 flex items-baseline justify-between gap-1.5">
              <span className="hidden text-[9px] font-bold tracking-widest text-white/50 uppercase sm:inline">
                Chefão
              </span>
              <span className="font-display ml-auto truncate text-sm leading-none tracking-wide text-soul-gold sm:text-xl">
                SHACO
              </span>
            </div>
            <div
              key={p.bossHit}
              className={`clip-slant relative h-2.5 overflow-hidden bg-black/60 ring-1 ring-white/20 sm:h-4 ${
                p.bossHit ? "animate-bar-flash" : ""
              }`}
            >
              <div
                className="absolute inset-y-0 right-0 bg-white/70 transition-all delay-300 duration-700"
                style={{ width: `${p.bossHp * 100}%` }}
              />
              <div
                className="absolute inset-y-0 right-0 bg-gradient-to-l from-soul-gold via-soul-orange to-red-500 transition-all duration-200"
                style={{ width: `${p.bossHp * 100}%` }}
              />
              <div className="halftone-dark absolute inset-0" />
            </div>
            <div className="mt-0.5 text-right text-[9px] font-bold tracking-widest text-white/60 uppercase sm:text-xs">
              {p.pairsFound}/{p.pairsTotal} pares
            </div>
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div className="mt-1.5 flex items-center justify-center gap-1.5 text-xs sm:mt-2.5 sm:gap-2.5 sm:text-sm">
        <Stat label="Pontos" value={p.score.toLocaleString("pt-BR")} accent="text-soul-pink" />
        <Stat label="Jogadas" value={String(p.moves)} />
        <Stat label="Precisão" value={p.moves ? `${Math.round((p.pairsFound / p.moves) * 100)}%` : "—"} />
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  accent = "text-white",
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="flex items-baseline gap-1 rounded-full bg-black/40 px-2 py-0.5 ring-1 ring-white/10 sm:px-3 sm:py-1 sm:gap-1.5">
      <span className="text-[9px] font-bold tracking-wider text-white/50 uppercase sm:text-[10px]">
        {label}
      </span>
      <span className={`font-display text-sm leading-none tracking-wide tabular-nums sm:text-lg ${accent}`}>
        {value}
      </span>
    </div>
  );
}
