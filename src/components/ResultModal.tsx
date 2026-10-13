import { useEffect, useState } from "react";
import type { DifficultyId } from "../data/fighters";
import { formatTime, RANK_STYLE } from "../lib/utils";
import Leaderboard from "./Leaderboard";

export type Result = {
  won: boolean;
  name: string;
  timeMs: number;
  moves: number;
  accuracy: number;
  maxCombo: number;
  baseScore: number;
  timeBonus: number;
  lifeBonus: number;
  score: number;
  rank: string;
  position: number;
  date: number;
  difficulty: DifficultyId;
};

type Props = {
  result: Result;
  onRetry: () => void;
  onMenu: () => void;
};

export default function ResultModal({ result: r, onRetry, onMenu }: Props) {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setStage(1), 1100);
    const t2 = setTimeout(() => setStage(2), 1700);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  const rs = RANK_STYLE[r.rank];
  const seconds = Math.round(r.timeMs / 1000);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/75 px-4 py-8 backdrop-blur-sm sm:items-center">
      <div className="speedlines pointer-events-none fixed inset-0 opacity-60" />

      {stage === 0 && (
        <div className="fixed inset-0 flex items-center justify-center">
          <h2
            className="animate-slam font-display text-[28vw] leading-none tracking-wider sm:text-[14rem]"
            style={{
              color: r.won ? "#ffd23f" : "#ff3b3b",
              textShadow: "8px 8px 0 #120725, 0 0 60px rgba(255,61,154,0.8)",
            }}
          >
            {r.won ? "K.O.!" : "DERROTA"}
          </h2>
        </div>
      )}

      {stage >= 1 && (
        <div className="animate-deal relative w-full max-w-lg rounded-3xl border border-white/15 bg-soul-ink/95 p-6 shadow-[0_30px_120px_-20px_rgba(255,61,154,0.6)] sm:p-8">
          <div className="text-center">
            <p className="font-display text-xl tracking-[0.3em] text-white/60">{r.won ? "VITÓRIA" : "GAME OVER"}</p>
            {r.won ? (
              <>
                <div className="relative mx-auto my-2 inline-block">
                  <span
                    className="animate-slam font-display block text-[9rem] leading-none"
                    style={{ color: rs.color, textShadow: `6px 6px 0 #120725, 0 0 50px ${rs.color}` }}
                  >
                    {r.rank}
                  </span>
                </div>
                <p className="font-display text-3xl tracking-wider" style={{ color: rs.color }}>
                  {rs.label}
                </p>
              </>
            ) : (
              <p className="font-display my-4 text-5xl tracking-wider text-red-400">O SHACO VENCEU...</p>
            )}

            <p className="mx-auto mt-3 max-w-sm text-sm text-white/70">
              {r.won ? (
                <>
                  BOAAAAA <b className="text-soul-gold">{r.name}</b>! você conseguiu perder{" "}
                  <b className="text-soul-pink">{seconds}</b> segundos da sua vida.
                </>
              ) : (
                <>
                  Calma, <b className="text-soul-gold">{r.name}</b>. Até a Gwen errou o corte umas vezes antes de virar campeã.
                </>
              )}
            </p>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              ["Tempo", formatTime(r.timeMs)],
              ["Jogadas", String(r.moves)],
              ["Precisão", `${Math.round(r.accuracy * 100)}%`],
              ["Combo máx", `x${r.maxCombo}`],
            ].map(([l, v]) => (
              <div key={l} className="rounded-xl bg-white/5 p-2.5 text-center ring-1 ring-white/10">
                <p className="text-[10px] font-bold tracking-widest text-white/50 uppercase">{l}</p>
                <p className="font-display text-2xl tracking-wide">{v}</p>
              </div>
            ))}
          </div>

          {r.won && stage >= 2 && (
            <div className="animate-deal mt-4 rounded-2xl bg-gradient-to-r from-soul-pink/20 via-soul-violet/20 to-soul-cyan/20 p-4 ring-1 ring-white/10">
              <div className="space-y-1 text-sm text-white/70">
                <Row label="Pares + combos" value={r.baseScore} />
                <Row label="Bônus de tempo" value={r.timeBonus} />
                {r.lifeBonus > 0 && <Row label="Bônus de vidas" value={r.lifeBonus} />}
              </div>
              <div className="mt-2 flex items-baseline justify-between border-t border-white/10 pt-2">
                <span className="font-display text-xl tracking-widest">TOTAL</span>
                <span className="font-display text-4xl tracking-wide text-soul-gold">{r.score.toLocaleString("pt-BR")}</span>
              </div>
              {r.position >= 0 && (
                <p className="mt-2 text-center text-xs font-bold tracking-widest text-soul-gold uppercase">
                  🏆 Novo recorde! #{r.position + 1} no ranking
                </p>
              )}
            </div>
          )}

          {r.won && stage >= 2 && (
            <div className="mt-4">
              <Leaderboard initial={r.difficulty} highlightDate={r.date} />
            </div>
          )}

          <div className="mt-6 grid grid-cols-2 gap-3">
            <button
              onClick={onMenu}
              className="rounded-2xl border-2 border-white/20 py-3 font-bold tracking-wide text-white/80 transition hover:bg-white/10"
            >
              Menu
            </button>
            <button
              onClick={onRetry}
              autoFocus
              className="font-display rounded-2xl bg-gradient-to-r from-soul-orange via-soul-pink to-soul-violet py-3 text-2xl tracking-widest transition hover:scale-[1.03] active:scale-95"
            >
              {r.won ? "REVANCHE!" : "TENTAR DE NOVO"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between">
      <span>{label}</span>
      <span className="font-bold text-white tabular-nums">+{value.toLocaleString("pt-BR")}</span>
    </div>
  );
}
