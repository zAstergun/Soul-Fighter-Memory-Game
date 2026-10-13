import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BASE_FIGHTERS, FIGHTERS, getDifficulty, type DifficultyId, type Fighter } from "../data/fighters";
import { isMuted, setMuted, sfx } from "../lib/sound";
import { saveScore } from "../lib/storage";
import { saveScoreToDb } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { getRank, shuffle } from "../lib/utils";
import Card from "./Card";
import Hud from "./Hud";
import ResultModal, { type Result } from "./ResultModal";
import LanguageSelector from "./LanguageSelector";
import { useI18n } from "../i18n";

type Phase = "intro" | "preview" | "fight" | "playing" | "over";
type Popup = { id: number; text: string; color: string; big?: boolean };

type Props = {
  playerName: string;
  difficulty: DifficultyId;
  onRestart: () => void;
  onExit: () => void;
};

const useIsSm = () => {
  const [sm, setSm] = useState(() => window.matchMedia("(min-width: 640px)").matches);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 640px)");
    const fn = () => setSm(mq.matches);
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, []);
  return sm;
};

const buildDeck = (diffId: DifficultyId): Fighter[] => {
  const d = getDifficulty(diffId);
  let pool: Fighter[];
  if (diffId === "lenda") pool = FIGHTERS.slice(0, d.pairs);
  else pool = shuffle(BASE_FIGHTERS).slice(0, d.pairs);
  const deck: Fighter[] = [];
  pool.forEach((f) => {
    for (let i = 0; i < d.copies; i++) deck.push(f);
  });
  return shuffle(deck);
};

export default function Game({ playerName, difficulty, onRestart, onExit }: Props) {
  const { t } = useI18n();
  const { user } = useAuth();
  const diff = getDifficulty(difficulty);
  const [deck] = useState(() => buildDeck(difficulty));
  const totalMatches = deck.length / 2;

  const [phase, setPhase] = useState<Phase>("intro");
  const [paused, setPaused] = useState(false);
  const [muted, setMutedState] = useState(isMuted());

  const [revealed, setRevealed] = useState<number[]>([]);
  const [matched, setMatched] = useState<Set<number>>(new Set());
  const [wrong, setWrong] = useState<number[]>([]);
  const [justMatched, setJustMatched] = useState<number[]>([]);

  const [moves, setMoves] = useState(0);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [lives, setLives] = useState<number | null>(diff.lives);
  const [bossHit, setBossHit] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [popups, setPopups] = useState<Popup[]>([]);
  const [result, setResult] = useState<Result | null>(null);

  // Sistema de Dicas
  const [hintsRemaining, setHintsRemaining] = useState(diff.hints);
  const [hintedCards, setHintedCards] = useState<number[]>([]);

  // refs (fonte da verdade dentro de callbacks/timeouts)
  const r = useRef({
    phase: "intro" as Phase,
    paused: false,
    lock: false,
    hintLock: false,
    hintsRemaining: diff.hints,
    hintsUsed: 0,
    revealed: [] as number[],
    matched: new Set<number>(),
    moves: 0,
    score: 0,
    combo: 0,
    maxCombo: 0,
    lives: diff.lives,
    elapsed: 0,
  });
  const timeouts = useRef<number[]>([]);
  const later = (fn: () => void, ms: number) => {
    const id = window.setTimeout(fn, ms);
    timeouts.current.push(id);
  };

  const setPhaseBoth = (p: Phase) => {
    r.current.phase = p;
    setPhase(p);
  };

  // Sequência de abertura: ROUND 1 -> (memorize) -> FIGHT!
  useEffect(() => {
    sfx.count();
    const t: number[] = [];
    let at = 1200;
    if (diff.previewMs > 0) {
      t.push(window.setTimeout(() => setPhaseBoth("preview"), at));
      at += diff.previewMs + 400;
    }
    t.push(
      window.setTimeout(() => {
        setPhaseBoth("fight");
        sfx.fight();
      }, at)
    );
    t.push(window.setTimeout(() => setPhaseBoth("playing"), at + 850));
    return () => t.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // limpa timeouts ao desmontar
  useEffect(() => () => timeouts.current.forEach(clearTimeout), []);

  // Timer
  useEffect(() => {
    if (phase !== "playing" || paused) return;
    let last = performance.now();
    const id = setInterval(() => {
      const now = performance.now();
      r.current.elapsed += now - last;
      last = now;
      setElapsed(r.current.elapsed);
    }, 100);
    return () => clearInterval(id);
  }, [phase, paused]);

  const popup = useCallback((text: string, color: string, big = false) => {
    const id = Math.random();
    setPopups((p) => [...p, { id, text, color, big }]);
    later(() => setPopups((p) => p.filter((x) => x.id !== id)), 1150);
  }, []);

  const finish = useCallback(
    (won: boolean) => {
      const s = r.current;
      setPhaseBoth("over");
      const accuracy = s.moves ? totalMatches / s.moves : 0;
      const seconds = s.elapsed / 1000;
      const par = totalMatches * 6; // tempo "ideal"
      const timeBonusRate = Math.round(25 * diff.scoreMultiplier);
      const timeBonus = won ? Math.max(0, Math.round((par - seconds) * timeBonusRate)) : 0;
      const lifeBonusRate = Math.round(150 * diff.scoreMultiplier);
      const lifeBonus = won && s.lives !== null ? s.lives * lifeBonusRate : 0;
      const hintPenalty = s.hintsUsed * diff.hintPenalty;
      const total = Math.max(0, s.score + timeBonus + lifeBonus - hintPenalty);
      const rank = getRank(accuracy);
      const date = Date.now();
      const position = won
        ? saveScore(difficulty, { name: playerName, score: total, timeMs: s.elapsed, moves: s.moves, rank, date })
        : -1;
      if (won) {
        saveScoreToDb({
          playerName,
          userId: user?.id,
          difficulty,
          score: total,
          timeMs: s.elapsed,
          moves: s.moves,
          rank,
        });
        sfx.win();
      } else {
        sfx.lose();
      }
      later(
        () =>
          setResult({
            won,
            name: playerName,
            timeMs: s.elapsed,
            moves: s.moves,
            accuracy,
            maxCombo: s.maxCombo,
            baseScore: s.score,
            timeBonus,
            lifeBonus,
            hintsUsed: s.hintsUsed,
            hintPenalty,
            score: total,
            rank,
            position,
            date,
            difficulty,
          }),
        won ? 700 : 500
      );
    },
    [difficulty, playerName, totalMatches]
  );

  const triggerHint = useCallback(() => {
    const s = r.current;
    if (s.phase !== "playing" || s.paused || s.lock || s.hintLock || s.hintsRemaining <= 0) return;

    // Se já tiver 1 carta virada, busca o par dessa carta virada
    let targetPair: [number, number] | null = null;
    if (s.revealed.length === 1) {
      const firstIdx = s.revealed[0];
      const matchId = deck[firstIdx].id;
      const partnerIdx = deck.findIndex(
        (f, idx) => idx !== firstIdx && f.id === matchId && !s.matched.has(idx)
      );
      if (partnerIdx !== -1) {
        targetPair = [firstIdx, partnerIdx];
      }
    }

    // Se não tiver carta virada, busca qualquer par ainda não descoberto
    if (!targetPair) {
      const unmatchedIndices: number[] = [];
      deck.forEach((_, idx) => {
        if (!s.matched.has(idx) && !s.revealed.includes(idx)) {
          unmatchedIndices.push(idx);
        }
      });

      const grouped: Record<string, number[]> = {};
      unmatchedIndices.forEach((idx) => {
        const id = deck[idx].id;
        if (!grouped[id]) grouped[id] = [];
        grouped[id].push(idx);
      });

      const availableIds = Object.keys(grouped).filter((id) => grouped[id].length >= 2);
      if (availableIds.length > 0) {
        const randomId = availableIds[Math.floor(Math.random() * availableIds.length)];
        targetPair = [grouped[randomId][0], grouped[randomId][1]];
      }
    }

    if (!targetPair) return;

    s.hintsRemaining -= 1;
    s.hintsUsed += 1;
    s.hintLock = true;
    setHintsRemaining(s.hintsRemaining);
    setHintedCards(targetPair);
    sfx.hint();

    popup(t("hud.hint_used_popup", { penalty: diff.hintPenalty }), "#3ee0ff", true);

    later(() => {
      setHintedCards([]);
      s.hintLock = false;
    }, 1800);
  }, [deck, diff.hintPenalty, popup, t]);

  const handleClick = useCallback(
    (i: number) => {
      const s = r.current;
      if (s.phase !== "playing" || s.paused || s.lock) return;
      if (s.matched.has(i) || s.revealed.includes(i)) return;

      const next = [...s.revealed, i];
      s.revealed = next;
      setRevealed(next);
      sfx.flip();

      if (next.length < 2) return;

      const [a, b] = next;
      s.moves += 1;
      setMoves(s.moves);

      if (deck[a].id === deck[b].id) {
        // ACERTO
        s.combo += 1;
        s.maxCombo = Math.max(s.maxCombo, s.combo);
        const gained = diff.pairBaseScore + (s.combo - 1) * diff.comboBonusStep;
        s.score += gained;
        const m = new Set(s.matched);
        m.add(a).add(b);
        s.matched = m;
        s.revealed = [];
        setMatched(m);
        setRevealed([]);
        setCombo(s.combo);
        setScore(s.score);
        setJustMatched([a, b]);
        setBossHit((h) => h + 1);
        later(() => setJustMatched([]), 900);

        sfx.match(s.combo);
        later(() => sfx.hit(), 120);
        if (s.combo >= 2) {
          later(() => sfx.combo(), 200);
          popup(t("phases.combo_popup", { combo: s.combo }), "#ffd23f", true);
        } else {
          popup(deck[a].name.toUpperCase() + "!", deck[a].color, true);
        }
        popup(`+${gained}`, "#ff3d9a");

        if (m.size === deck.length) {
          setPhaseBoth("over");
          later(() => finish(true), 600);
        }
      } else {
        // ERRO
        s.lock = true;
        s.combo = 0;
        setCombo(0);
        later(() => {
          setWrong([a, b]);
          sfx.miss();
        }, 350);
        if (s.lives !== null) {
          s.lives -= 1;
          setLives(s.lives);
          if (s.lives <= 0) {
            later(() => {
              setWrong([]);
              finish(false);
            }, 900);
            return;
          }
          later(() => popup("-1 ♥", "#ff4d4d"), 350);
        }
        later(() => {
          s.revealed = [];
          s.lock = false;
          setRevealed([]);
          setWrong([]);
        }, 950);
      }
    },
    [deck, finish, popup]
  );

  const togglePause = useCallback(() => {
    if (r.current.phase !== "playing") return;
    r.current.paused = !r.current.paused;
    setPaused(r.current.paused);
    sfx.click();
  }, []);

  const toggleMute = useCallback(() => {
    const m = !isMuted();
    setMuted(m);
    setMutedState(m);
  }, []);

  // Atalhos
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      const k = e.key.toLowerCase();
      if (k === "p" || k === "escape") togglePause();
      else if (k === "m") toggleMute();
      else if (k === "r" && !result) onRestart();
      else if (k === "h" || k === "d") triggerHint();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [togglePause, toggleMute, onRestart, result, triggerHint]);

  // pausa automática ao trocar de aba
  useEffect(() => {
    const fn = () => {
      if (document.hidden && r.current.phase === "playing" && !r.current.paused) togglePause();
    };
    document.addEventListener("visibilitychange", fn);
    return () => document.removeEventListener("visibilitychange", fn);
  }, [togglePause]);

  const isSm = useIsSm();
  const cols = isSm ? diff.cols.sm : diff.cols.base;
  const rows = Math.ceil(deck.length / cols);
  const gridStyle = useMemo(() => {
    const ratio = (cols * 3) / (rows * 4);
    return {
      gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
      aspectRatio: `${ratio.toFixed(4)}`,
      maxWidth: `min(100%, calc((100dvh - ${isSm ? "210px" : "155px"}) * ${ratio.toFixed(3)}))`,
    };
  }, [cols, rows, isSm]);

  const showAll = phase === "preview";

  return (
    <div className="h-dvh max-h-dvh w-full overflow-hidden flex flex-col items-center justify-between px-2 pt-1.5 pb-2 sm:px-5 sm:pt-3 sm:pb-3 select-none touch-manipulation">
      <div className="w-full max-w-4xl shrink-0">
        {/* Top bar */}
        <div className="mb-1 flex items-center justify-between sm:mb-2">
          <button
            onClick={onExit}
            className="rounded-full bg-black/40 px-2.5 py-1 text-[11px] font-bold tracking-wide text-white/70 ring-1 ring-white/10 transition hover:bg-white/10 hover:text-white sm:px-3 sm:py-1.5 sm:text-xs"
          >
            {t("hud.menu_btn")}
          </button>
          <div className="flex items-center gap-1 sm:gap-1.5">
            {/* Botão de Dica */}
            <button
              type="button"
              onClick={triggerHint}
              disabled={phase !== "playing" || paused || hintsRemaining <= 0 || hintedCards.length > 0}
              className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold tracking-wide transition ring-1 sm:px-3 sm:py-1.5 sm:text-xs ${
                hintsRemaining > 0 && phase === "playing" && !paused
                  ? "bg-soul-cyan/20 text-soul-cyan ring-soul-cyan/40 hover:bg-soul-cyan/30 hover:scale-105 active:scale-95 shadow-[0_0_12px_rgba(62,224,255,0.3)] cursor-pointer"
                  : "bg-white/5 text-white/30 ring-white/10 cursor-not-allowed"
              }`}
              title={t("hud.hint_tooltip", { remaining: hintsRemaining, penalty: diff.hintPenalty })}
            >
              <span className="text-sm">💡</span>
              <span className="font-display tracking-wider text-xs sm:text-sm">
                {t("hud.hint_btn")} ({hintsRemaining})
              </span>
            </button>
            <LanguageSelector compact />
            <IconBtn onClick={toggleMute} label={muted ? t("hud.sound_unmute") : t("hud.sound_mute")}>
              {muted ? "🔇" : "🔊"}
            </IconBtn>
            <IconBtn onClick={onRestart} label={t("hud.restart_btn")}>
              ↻
            </IconBtn>
            <IconBtn onClick={togglePause} label={t("hud.pause_btn")} disabled={phase !== "playing"}>
              {paused ? "▶" : "❚❚"}
            </IconBtn>
          </div>
        </div>

        <Hud
          playerName={playerName}
          elapsedMs={elapsed}
          bossHp={1 - matched.size / deck.length}
          bossHit={bossHit}
          lives={lives}
          maxLives={diff.lives}
          combo={combo}
          score={score}
          moves={moves}
          pairsFound={matched.size / 2}
          pairsTotal={totalMatches}
          difficultyLabel={t(`diff.${diff.id}.label`)}
        />
      </div>

      {/* Tabuleiro */}
      <div className="relative flex-1 min-h-0 w-full max-w-4xl flex items-center justify-center p-0.5 sm:p-1 my-auto">
        <div className="grid w-full gap-1.5 sm:gap-2.5 max-h-full max-w-full" style={gridStyle}>
          {deck.map((f, i) => (
            <Card
              key={i}
              fighter={f}
              index={i}
              revealed={showAll || revealed.includes(i)}
              matched={matched.has(i)}
              wrong={wrong.includes(i)}
              justMatched={justMatched.includes(i)}
              hinted={hintedCards.includes(i)}
              onClick={handleClick}
            />
          ))}
        </div>

        {/* Popups */}
        <div className="pointer-events-none absolute top-1/3 left-1/2 z-20">
          {popups.map((p, idx) => (
            <span
              key={p.id}
              className={`animate-float-up font-display absolute left-0 whitespace-nowrap tracking-wider ${p.big ? "text-5xl sm:text-7xl" : "text-3xl sm:text-4xl"}`}
              style={{
                color: p.color,
                top: p.big ? 0 : 60 + idx * 4,
                textShadow: "4px 4px 0 #120725, 0 0 24px rgba(0,0,0,0.6)",
              }}
            >
              {p.text}
            </span>
          ))}
        </div>

        {/* Overlays de fase */}
        {(phase === "intro" || phase === "fight" || phase === "preview") && (
          <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center">
            {phase === "intro" && (
              <BigText key="r1" color="#ffffff" sub={t(`diff.${diff.id}.label`).toUpperCase()}>
                {t("phases.round_1")}
              </BigText>
            )}
            {phase === "preview" && (
              <span className="animate-slam font-display rounded-xl bg-black/70 px-6 py-2 text-3xl tracking-[0.2em] text-soul-cyan sm:text-5xl">
                {t("phases.memorize")}
              </span>
            )}
            {phase === "fight" && (
              <BigText key="fight" color="#ffd23f">
                {t("phases.fight")}
              </BigText>
            )}
          </div>
        )}

        {paused && (
          <div className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-5 rounded-3xl bg-soul-ink/85 backdrop-blur-xl">
            <span className="font-display text-7xl tracking-widest text-white [text-shadow:5px_5px_0_#ff3d9a]">{t("phases.pause_title")}</span>
            <div className="flex gap-3">
              <button onClick={onExit} className="rounded-2xl border-2 border-white/20 px-6 py-3 font-bold text-white/80 hover:bg-white/10">
                {t("phases.exit_btn")}
              </button>
              <button
                onClick={togglePause}
                className="font-display rounded-2xl bg-gradient-to-r from-soul-pink to-soul-violet px-8 py-3 text-2xl tracking-widest"
              >
                {t("phases.resume_btn")}
              </button>
            </div>
          </div>
        )}
      </div>

      {result && <ResultModal result={result} onRetry={onRestart} onMenu={onExit} />}
    </div>
  );
}

function BigText({ children, color, sub }: { children: React.ReactNode; color: string; sub?: string }) {
  return (
    <div className="flex flex-col items-center">
      <span
        className="animate-slam font-display text-7xl leading-none tracking-wider sm:text-9xl"
        style={{ color, textShadow: "6px 6px 0 #120725, 0 0 50px rgba(255,61,154,0.9)" }}
      >
        {children}
      </span>
      {sub && <span className="clip-slant mt-3 bg-soul-pink px-5 py-1 font-display text-2xl tracking-[0.3em]">{sub}</span>}
    </div>
  );
}

function IconBtn({ children, onClick, label, disabled }: { children: React.ReactNode; onClick: () => void; label: string; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      disabled={disabled}
      className="flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-sm font-bold text-white/80 ring-1 ring-white/10 transition hover:bg-white/15 hover:text-white disabled:opacity-40"
    >
      {children}
    </button>
  );
}
