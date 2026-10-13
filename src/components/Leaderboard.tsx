import { useEffect, useState } from "react";
import { DIFFICULTIES, type DifficultyId } from "../data/fighters";
import {
  getPlayerName,
  loadBoard,
  removePlayerFromBoard,
  removePlayerDifficultyScore,
} from "../lib/storage";
import {
  fetchGeneralLeaderboardFromDb,
  fetchLeaderboardFromDb,
  type GeneralLeaderboardEntry,
  type SupabaseLeaderboardEntry,
} from "../lib/supabase";
import { formatTime, RANK_STYLE } from "../lib/utils";
import { PlayerAvatar, VerifiedBadge, VipBadge } from "./UserBadges";
import { useI18n } from "../i18n";

export type LeaderboardTab = "geral" | DifficultyId;

type LeaderItem = {
  id: string;
  name: string;
  score: number;
  timeMs: number;
  moves: number;
  rank: string;
  isAsterAccount: boolean;
  isVip: boolean;
  avatarUrl?: string | null;
  channel?: string | null;
  // Campos exclusivos do ranking geral
  isGeneral?: boolean;
  modesPlayed?: number;
  novatoScore?: number;
  lutadorScore?: number;
  lendaScore?: number;
  classicoScore?: number;
};

export default function Leaderboard({
  initial = "geral",
  highlightDate,
  currentPlayerName,
}: {
  initial?: LeaderboardTab;
  highlightDate?: number;
  currentPlayerName?: string;
}) {
  const { t, resolvedLanguage } = useI18n();
  const [tab, setTab] = useState<LeaderboardTab>(initial);
  const [loading, setLoading] = useState(true);
  const [onlineList, setOnlineList] = useState<LeaderItem[]>([]);

  useEffect(() => {
    let active = true;
    setLoading(true);

    if (tab === "geral") {
      fetchGeneralLeaderboardFromDb()
        .then((data: GeneralLeaderboardEntry[]) => {
          if (!active) return;
          const mapped: LeaderItem[] = (data || []).map((d) => ({
            id: d.player_key,
            name: d.player_name,
            score: Number(d.total_score),
            timeMs: Number(d.total_time_ms),
            moves: Number(d.total_moves),
            rank: d.best_rank || "S",
            isAsterAccount: d.is_aster_account,
            isVip: d.is_vip,
            avatarUrl: d.avatar_url,
            channel: d.channel,
            isGeneral: true,
            modesPlayed: Number(d.modes_played),
            novatoScore: d.novato_score,
            lutadorScore: d.lutador_score,
            lendaScore: d.lenda_score,
            classicoScore: d.classico_score,
          }));

          // Se o jogador atual não consta mais no ranking do banco (ex: apagado via CRM),
          // sincroniza limpando seus registros do armazenamento local para não ressuscitar fantasmas
          const effectivePlayer = (currentPlayerName || getPlayerName()).toLowerCase().trim();
          if (effectivePlayer) {
            const inDb = mapped.some((m) => m.name.toLowerCase().trim() === effectivePlayer);
            if (!inDb) {
              removePlayerFromBoard(effectivePlayer);
            }
          }

          setOnlineList(mapped);
        })
        .catch(() => {
          if (!active) return;
          // Fallback offline se a requisição de rede falhar completamente
          const allLocal = loadBoard();
          const playerMap = new Map<string, {
            name: string;
            totalScore: number;
            totalTime: number;
            totalMoves: number;
            modes: Set<string>;
            bestRank: string;
            scores: Record<DifficultyId, number>;
          }>();

          (Object.keys(allLocal) as DifficultyId[]).forEach((diffKey) => {
            const entries = allLocal[diffKey] || [];
            entries.forEach((e) => {
              const key = e.name.toLowerCase().trim();
              const existing = playerMap.get(key) || {
                name: e.name,
                totalScore: 0,
                totalTime: 0,
                totalMoves: 0,
                modes: new Set<string>(),
                bestRank: e.rank,
                scores: { novato: 0, lutador: 0, lenda: 0, classico: 0 },
              };
              if (e.score > existing.scores[diffKey]) {
                existing.totalScore += e.score - existing.scores[diffKey];
                existing.scores[diffKey] = e.score;
                existing.totalTime += e.timeMs;
                existing.totalMoves += e.moves;
                existing.modes.add(diffKey);
                existing.bestRank = e.rank;
              }
              playerMap.set(key, existing);
            });
          });

          const fallbackList: LeaderItem[] = Array.from(playerMap.values())
            .sort((a, b) => b.totalScore - a.totalScore)
            .map((p, idx) => ({
              id: `local-gen-${idx}`,
              name: p.name,
              score: p.totalScore,
              timeMs: p.totalTime,
              moves: p.totalMoves,
              rank: p.bestRank,
              isAsterAccount: false,
              isVip: false,
              isGeneral: true,
              modesPlayed: p.modes.size,
              novatoScore: p.scores.novato,
              lutadorScore: p.scores.lutador,
              lendaScore: p.scores.lenda,
              classicoScore: p.scores.classico,
            }));
          setOnlineList(fallbackList);
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    } else {
      fetchLeaderboardFromDb(tab)
        .then((data: SupabaseLeaderboardEntry[]) => {
          if (!active) return;
          // Deduplica por player (user_id se houver, ou nome normalizado) mantendo o melhor score
          const seen = new Map<string, SupabaseLeaderboardEntry>();
          for (const d of (data || [])) {
            const key = d.user_id ? `u:${d.user_id}` : `n:${d.player_name.toLowerCase().trim()}`;
            const existing = seen.get(key);
            if (
              !existing ||
              d.score > existing.score ||
              (d.score === existing.score && d.time_ms < existing.time_ms)
            ) {
              seen.set(key, d);
            }
          }

          const deduplicated = Array.from(seen.values()).sort(
            (a, b) => b.score - a.score || a.time_ms - b.time_ms
          );

          const mapped: LeaderItem[] = deduplicated.map((d) => ({
            id: d.id,
            name: d.player_name,
            score: d.score,
            timeMs: d.time_ms,
            moves: d.moves,
            rank: d.rank,
            isAsterAccount: Boolean(d.user_id && d.profiles),
            isVip: Boolean(d.profiles?.is_vip),
            avatarUrl: d.profiles?.avatar_url,
            channel: d.profiles?.channel,
            isGeneral: false,
          }));

          // Se o jogador atual não consta mais nesta dificuldade no banco (ex: apagado via CRM),
          // sincroniza limpando do armazenamento local específico para evitar discrepâncias
          const effectivePlayer = (currentPlayerName || getPlayerName()).toLowerCase().trim();
          if (effectivePlayer) {
            const inDb = mapped.some((m) => m.name.toLowerCase().trim() === effectivePlayer);
            if (!inDb) {
              removePlayerDifficultyScore(tab, effectivePlayer);
            }
          }

          setOnlineList(mapped);
        })
        .catch(() => {
          if (!active) return;
          const local = loadBoard()[tab] ?? [];
          setOnlineList(
            local.map((l) => ({
              id: String(l.date),
              name: l.name,
              score: l.score,
              timeMs: l.timeMs,
              moves: l.moves,
              rank: l.rank,
              isAsterAccount: false,
              isVip: false,
              isGeneral: false,
            }))
          );
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }

    return () => {
      active = false;
    };
  }, [tab, currentPlayerName]);

  const activeDiff = tab !== "geral" ? DIFFICULTIES.find((d) => d.id === tab) : null;

  return (
    <div className="w-full h-full flex-1 min-h-0 flex flex-col justify-between">
      {/* Abas: GERAL + Dificuldades Individuais */}
      <div className="mb-2 shrink-0 flex items-center justify-center sm:justify-start gap-1.5 flex-wrap">
        <button
          onClick={() => setTab("geral")}
          className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide transition flex items-center gap-1.5 ${
            tab === "geral"
              ? "bg-gradient-to-r from-soul-gold via-amber-400 to-soul-pink text-soul-ink shadow-[0_0_16px_rgba(255,210,63,0.6)] font-black"
              : "bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"
          }`}
        >
          <span>👑</span>
          <span>{t("leaderboard.general_tab")}</span>
          <span className="text-[10px] opacity-80">{t("leaderboard.general_sub")}</span>
        </button>

        {DIFFICULTIES.map((d) => (
          <button
            key={d.id}
            onClick={() => setTab(d.id)}
            className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide transition flex items-center gap-1.5 ${
              tab === d.id
                ? "bg-soul-gold text-soul-ink shadow-[0_0_12px_rgba(255,210,63,0.5)]"
                : "bg-white/10 text-white/70 hover:bg-white/20"
            }`}
          >
            <span>{t(`diff.${d.id}.label`)}</span>
            <span
              className={`text-[9.5px] px-1 py-0.2 rounded font-extrabold ${
                tab === d.id ? "bg-black/20 text-soul-ink" : "text-soul-gold"
              }`}
            >
              {t("diff.pts_badge", { multiplier: d.scoreMultiplier.toFixed(1) })}
            </span>
          </button>
        ))}
      </div>

      {/* Sub-header explicativo */}
      <div className="mb-2 flex items-center justify-between px-1 text-[11px] text-white/50">
        {tab === "geral" ? (
          <span className="flex items-center gap-1">
            <span className="text-soul-gold font-bold">{t("leaderboard.general_info_title")}</span> {t("leaderboard.general_info_desc")}
          </span>
        ) : (
          <span className="flex items-center gap-1">
            <span className="text-soul-gold font-bold">{t(`diff.${activeDiff?.id}.label`)}:</span>{" "}
            {t("leaderboard.diff_info", {
              label: t(`diff.${activeDiff?.id}.label`),
              multiplier: activeDiff?.scoreMultiplier || 1,
              base: activeDiff?.pairBaseScore || 100,
            })}
          </span>
        )}
        <span className="hidden sm:inline font-mono text-[10px]">{t("leaderboard.top_fighters")}</span>
      </div>

      {loading ? (
        <div className="flex flex-1 min-h-0 flex-col items-center justify-center rounded-2xl border border-white/10 bg-black/20 p-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-soul-pink border-t-transparent" />
          <span className="mt-2 text-xs font-bold tracking-wider text-white/50 uppercase">
            {t("leaderboard.loading")}
          </span>
        </div>
      ) : onlineList.length === 0 ? (
        <div className="flex flex-1 min-h-0 flex-col items-center justify-center rounded-2xl border border-dashed border-white/20 p-6 text-center">
          <p className="text-sm font-semibold text-white/70">
            {t("leaderboard.empty_title")}
          </p>
          <p className="mt-1 text-xs text-white/40">
            {t("leaderboard.empty_desc")}
          </p>
        </div>
      ) : (
        <ol className="flex-1 min-h-0 space-y-1.5 overflow-y-auto no-scrollbar pr-1">
          {onlineList.map((e, i) => {
            const isCurrentPlayer = Boolean(
              (highlightDate && String(highlightDate) === e.id) ||
              (currentPlayerName && e.name.toLowerCase().trim() === currentPlayerName.toLowerCase().trim()) ||
              (!currentPlayerName && getPlayerName() && e.name.toLowerCase().trim() === getPlayerName().toLowerCase().trim())
            );

            return (
              <li
                key={e.id}
                className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition ${
                  isCurrentPlayer
                    ? "bg-gradient-to-r from-soul-gold/30 via-amber-400/20 to-soul-gold/15 border border-soul-gold ring-1 ring-soul-gold shadow-[0_0_16px_rgba(255,210,63,0.35)]"
                    : i === 0
                    ? "bg-gradient-to-r from-amber-500/20 via-soul-gold/15 to-transparent border border-soul-gold/30"
                    : i === 1
                    ? "bg-gradient-to-r from-slate-400/15 via-white/10 to-transparent border border-white/20"
                    : i === 2
                    ? "bg-gradient-to-r from-amber-700/20 via-orange-600/10 to-transparent border border-orange-500/20"
                    : "bg-white/5 hover:bg-white/10"
                }`}
              >
                {/* Posição */}
                <span
                  className={`font-display w-6 shrink-0 text-xl text-center ${
                    isCurrentPlayer
                      ? "text-soul-gold font-black"
                      : i === 0
                      ? "text-soul-gold"
                      : i === 1
                      ? "text-slate-300"
                      : i === 2
                      ? "text-amber-500"
                      : "text-white/40"
                  }`}
                >
                  {i + 1}
                </span>

                {/* Rank Tier (S, A, etc) */}
                <span
                  className="font-display flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-base text-soul-ink font-bold shadow-sm"
                  style={{ background: RANK_STYLE[e.rank]?.color || "#ffd23f" }}
                >
                  {e.rank}
                </span>

                {/* Foto de Perfil (Apenas para quem tiver Aster Account) */}
                {e.isAsterAccount && (
                  <PlayerAvatar
                    profile={{
                      id: e.id,
                      full_name: e.name,
                      channel: e.channel || null,
                      avatar_url: e.avatarUrl || null,
                      is_vip: e.isVip,
                    }}
                    name={e.name}
                    size="sm"
                  />
                )}

                {/* Informações do Jogador */}
                <div className="min-w-0 flex-1 flex flex-col justify-center">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="truncate font-bold text-white tracking-wide">
                      {e.name}
                    </span>

                    {/* Selo VOCÊ para o jogador atual */}
                    {isCurrentPlayer && (
                      <span className="rounded bg-soul-gold text-soul-ink font-black text-[9px] px-1.5 py-0.2 tracking-wider uppercase shrink-0 shadow-sm">
                        {t("leaderboard.you_badge")}
                      </span>
                    )}

                    {/* Badges de Aster Account */}
                    {e.isAsterAccount && (
                      <div className="flex items-center gap-1 shrink-0">
                        <VerifiedBadge className="h-3.5 w-3.5" />
                        {e.isVip && <VipBadge className="text-[10px] px-1 py-0" />}
                      </div>
                    )}
                  </div>

                  {/* Sub-linha para o ranking geral detalhando modos */}
                  {e.isGeneral && (
                    <div className="flex items-center gap-1 mt-0.5 text-[10px] text-white/50 flex-wrap">
                      <span className="rounded bg-soul-gold/15 text-soul-gold px-1 font-bold">
                        {t("leaderboard.modes_count", { count: e.modesPlayed || 0 })}
                      </span>
                      <span className="hidden md:inline text-white/30">|</span>
                      <div className="hidden md:flex items-center gap-1.5 font-mono text-[9.5px]">
                        {Boolean(e.novatoScore) && (
                          <span className="text-emerald-400">{t("diff.novato.label").slice(0, 3)}: {e.novatoScore?.toLocaleString(resolvedLanguage)}</span>
                        )}
                        {Boolean(e.lutadorScore) && (
                          <span className="text-amber-300">{t("diff.lutador.label").slice(0, 3)}: {e.lutadorScore?.toLocaleString(resolvedLanguage)}</span>
                        )}
                        {Boolean(e.lendaScore) && (
                          <span className="text-soul-pink">{t("diff.lenda.label").slice(0, 3)}: {e.lendaScore?.toLocaleString(resolvedLanguage)}</span>
                        )}
                        {Boolean(e.classicoScore) && (
                          <span className="text-violet-300">{t("diff.classico.label").slice(0, 3)}: {e.classicoScore?.toLocaleString(resolvedLanguage)}</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Estatísticas */}
                <span className="hidden text-xs text-white/50 sm:inline shrink-0">
                  {formatTime(e.timeMs)}
                </span>
                <span className="hidden text-xs text-white/40 sm:inline shrink-0">
                  {t("leaderboard.moves_suffix", { count: e.moves })}
                </span>
                <span className={`font-display text-lg tracking-wide shrink-0 font-bold ${
                  e.isGeneral
                    ? "bg-gradient-to-r from-soul-gold to-soul-pink bg-clip-text text-transparent"
                    : "text-soul-pink"
                }`}>
                  {e.score.toLocaleString(resolvedLanguage)}
                </span>
              </li>
            );
          })}
        </ol>
      )}

      {/* Rodapé do Ranking */}
      <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-2 text-[11px] text-white/40">
        <span>{t("leaderboard.footer_legend")}</span>
      </div>
    </div>
  );
}
