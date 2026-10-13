import { useEffect, useState } from "react";
import type { DifficultyId } from "../data/fighters";
import { formatTime, RANK_STYLE } from "../lib/utils";
import Leaderboard from "./Leaderboard";
import { useI18n } from "../i18n";

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
  hintsUsed?: number;
  hintPenalty?: number;
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
  const { t, resolvedLanguage } = useI18n();
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
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-black/80 px-2 py-2 backdrop-blur-sm sm:px-4 sm:py-6">
      <div className="speedlines pointer-events-none fixed inset-0 opacity-60" />

      {stage === 0 && (
        <div className="fixed inset-0 flex items-center justify-center">
          <h2
            className="animate-slam font-display text-[26vw] leading-none tracking-wider sm:text-[14rem]"
            style={{
              color: r.won ? "#ffd23f" : "#ff3b3b",
              textShadow: "8px 8px 0 #120725, 0 0 60px rgba(255,61,154,0.8)",
            }}
          >
            {r.won ? t("result.ko") : t("result.defeat")}
          </h2>
        </div>
      )}

      {stage >= 1 && (
        <div className="animate-deal relative w-full max-w-lg rounded-2xl sm:rounded-3xl border border-white/15 bg-soul-ink/95 p-4 sm:p-7 shadow-[0_25px_100px_-20px_rgba(255,61,154,0.6)] max-h-[96dvh] overflow-y-auto no-scrollbar">
          <div className="text-center">
            <p className="font-display text-lg sm:text-xl tracking-[0.3em] text-white/60">
              {r.won ? t("result.victory") : t("result.game_over")}
            </p>
            {r.won ? (
              <>
                <div className="relative mx-auto my-1 sm:my-2 inline-block">
                  <span
                    className="animate-slam font-display block text-[6.5rem] sm:text-[9rem] leading-none"
                    style={{ color: rs.color, textShadow: `6px 6px 0 #120725, 0 0 50px ${rs.color}` }}
                  >
                    {r.rank}
                  </span>
                </div>
                <p className="font-display text-2xl sm:text-3xl tracking-wider" style={{ color: rs.color }}>
                  {t(`ranks.${r.rank}`)}
                </p>
              </>
            ) : (
              <p className="font-display my-3 text-4xl sm:text-5xl tracking-wider text-red-400">
                {t("result.shaco_won")}
              </p>
            )}

            <p className="mx-auto mt-3 max-w-sm text-sm text-white/70 leading-relaxed">
              {r.won
                ? t("result.flavor_win", { name: r.name, seconds })
                : t("result.flavor_lose", { name: r.name })}
            </p>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              [t("result.stat_time"), formatTime(r.timeMs)],
              [t("result.stat_moves"), String(r.moves)],
              [t("result.stat_accuracy"), `${Math.round(r.accuracy * 100)}%`],
              [t("result.stat_max_combo"), `x${r.maxCombo}`],
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
                <Row label={t("result.pairs_and_combos")} value={r.baseScore} locale={resolvedLanguage} />
                <Row label={t("result.time_bonus")} value={r.timeBonus} locale={resolvedLanguage} />
                {r.lifeBonus > 0 && <Row label={t("result.life_bonus")} value={r.lifeBonus} locale={resolvedLanguage} />}
                {(r.hintsUsed ?? 0) > 0 && (r.hintPenalty ?? 0) > 0 && (
                  <Row
                    label={t("result.hints_penalty", { count: r.hintsUsed ?? 0 })}
                    value={-(r.hintPenalty ?? 0)}
                    locale={resolvedLanguage}
                    isNegative
                  />
                )}
              </div>
              <div className="mt-2 flex items-baseline justify-between border-t border-white/10 pt-2">
                <span className="font-display text-xl tracking-widest">{t("result.total")}</span>
                <span className="font-display text-4xl tracking-wide text-soul-gold">{r.score.toLocaleString(resolvedLanguage)}</span>
              </div>
              {r.position >= 0 && (
                <p className="mt-2 text-center text-xs font-bold tracking-widest text-soul-gold uppercase">
                  {t("result.new_record", { pos: r.position + 1 })}
                </p>
              )}
            </div>
          )}

          {r.won && stage >= 2 && (
            <div className="mt-4">
              <Leaderboard
                initial={r.difficulty}
                highlightDate={r.date}
                currentPlayerName={r.name}
              />
            </div>
          )}

          <div className="mt-6 grid grid-cols-2 gap-3">
            <button
              onClick={onMenu}
              className="rounded-2xl border-2 border-white/20 py-3 font-bold tracking-wide text-white/80 transition hover:bg-white/10"
            >
              {t("result.menu_btn")}
            </button>
            <button
              onClick={onRetry}
              autoFocus
              className="font-display rounded-2xl bg-gradient-to-r from-soul-orange via-soul-pink to-soul-violet py-3 text-2xl tracking-widest transition hover:scale-[1.03] active:scale-95"
            >
              {r.won ? t("result.rematch_btn") : t("result.retry_btn")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({
  label,
  value,
  locale,
  isNegative = false,
}: {
  label: string;
  value: number;
  locale: string;
  isNegative?: boolean;
}) {
  return (
    <div className="flex justify-between">
      <span>{label}</span>
      <span
        className={`font-bold tabular-nums ${
          isNegative ? "text-rose-400" : "text-white"
        }`}
      >
        {isNegative
          ? `-${Math.abs(value).toLocaleString(locale)}`
          : `+${value.toLocaleString(locale)}`}
      </span>
    </div>
  );
}
