import { memo } from "react";
import { loadingArt, type Fighter } from "../data/fighters";
import { useI18n } from "../i18n";

type Props = {
  fighter: Fighter;
  index: number;
  revealed: boolean;
  matched: boolean;
  wrong: boolean;
  justMatched: boolean;
  hinted?: boolean;
  onClick: (index: number) => void;
};

function CardBack() {
  return (
    <div className="absolute inset-0 overflow-hidden rounded-xl border-2 border-soul-gold/70 bg-gradient-to-br from-[#3a0d6e] via-[#1c0840] to-[#5a0f4a]">
      <div className="speedlines absolute inset-0" />
      <div className="halftone absolute inset-0 opacity-40" />
      <div className="absolute inset-1.5 rounded-lg border border-soul-gold/40" />
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <svg viewBox="0 0 64 64" className="h-1/2 w-1/2 drop-shadow-[0_0_10px_rgba(255,61,154,0.8)]">
          <defs>
            <linearGradient id="flame" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor="#ff3d9a" />
              <stop offset="55%" stopColor="#ff7a1a" />
              <stop offset="100%" stopColor="#ffd23f" />
            </linearGradient>
          </defs>
          <path
            d="M32 4c4 10 14 14 14 28a14 14 0 0 1-28 0c0-7 4-11 7-14-1 6 2 9 5 9-3-8 0-16 2-23z"
            fill="url(#flame)"
            stroke="#120725"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <path d="M32 30c3 4 6 6 6 11a6 6 0 0 1-12 0c0-3 2-5 3-6 0 2 1 3 2 3-1-3 0-6 1-8z" fill="#fff" opacity="0.9" />
        </svg>
        <span className="font-display mt-0.5 text-[clamp(0.7rem,2.2vw,1.1rem)] tracking-[0.2em] text-soul-gold">SOUL FIGHTER</span>
      </div>
    </div>
  );
}

function Card({ fighter, index, revealed, matched, wrong, justMatched, hinted = false, onClick }: Props) {
  const { t } = useI18n();
  const flipped = revealed || matched;
  return (
    <button
      type="button"
      onClick={() => onClick(index)}
      aria-label={flipped ? fighter.name : t("card.face_down", { index: index + 1 })}
      disabled={matched}
      className={`animate-deal group relative aspect-[3/4] w-full cursor-pointer rounded-xl outline-none focus-visible:ring-4 focus-visible:ring-soul-cyan disabled:cursor-default transition-transform ${
        hinted ? "scale-105 z-20" : ""
      }`}
      style={{ animationDelay: `${index * 35}ms` }}
    >
      <div className={`perspective h-full w-full ${wrong ? "animate-shake" : ""}`}>
      <div
        className={`preserve-3d relative h-full w-full rounded-xl transition-transform duration-500 ease-[cubic-bezier(.2,.9,.3,1.2)] ${
          flipped ? "rotate-y-180" : "group-hover:-translate-y-1 group-hover:rotate-x-6"
        }`}
      >
        {/* Verso */}
        <div className={`backface-hidden absolute inset-0 rounded-xl shadow-[0_8px_20px_-6px_rgba(0,0,0,0.8)] ${
          hinted ? "ring-4 ring-soul-cyan shadow-[0_0_35px_#3ee0ff]" : ""
        }`}>
          <CardBack />
          {hinted && !flipped && (
            <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center rounded-xl bg-soul-cyan/15">
              <span className="font-display rounded-full bg-soul-cyan px-2 py-0.5 text-[11px] sm:text-xs font-black tracking-widest text-soul-ink uppercase shadow-xl animate-bounce">
                ✦ {t("card.hint_mark")} ✦
              </span>
            </div>
          )}
        </div>

        {/* Frente */}
        <div
          className={`backface-hidden rotate-y-180 absolute inset-0 overflow-hidden rounded-xl border-2 bg-soul-ink ${
            justMatched ? "animate-pop-glow" : ""
          } ${wrong ? "border-red-500" : ""}`}
          style={{
            borderColor: wrong ? undefined : matched ? fighter.color : "rgba(255,255,255,0.6)",
            boxShadow: matched ? `0 0 18px -2px ${fighter.color}` : undefined,
          }}
        >
          <img
            src={loadingArt(fighter)}
            alt={fighter.name}
            draggable={false}
            className="h-full w-full object-cover object-[50%_15%]"
          />
          {fighter.prestige && (
            <span className="absolute top-1 right-1 rounded bg-soul-gold px-1 text-[9px] font-black tracking-wider text-soul-ink">
              {t("card.prestige")}
            </span>
          )}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent px-1.5 pt-5 pb-1">
            <p className="font-display truncate text-center text-[clamp(0.7rem,2vw,1.05rem)] leading-none tracking-wide" style={{ color: fighter.color }}>
              {fighter.name}
            </p>
          </div>
          {justMatched && (
            <span className="animate-shine pointer-events-none absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-transparent via-white/60 to-transparent" />
          )}
          {matched && !justMatched && <div className="absolute inset-0 bg-black/15" />}
        </div>
      </div>
      </div>
    </button>
  );
}

export default memo(Card);
