import { createClient } from "@supabase/supabase-js";
import type { DifficultyId } from "../data/fighters";

export const SUPABASE_URL = "https://yofvcyarznuvqntgslep.supabase.co";
export const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlvZnZjeWFyem51dnFudGdzbGVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEyNzg2MDIsImV4cCI6MjEwNjg1NDYwMn0.HpYpKPqu8rE28hrmgZvy3Xf6zE50S6mNyZhXaCHeagw";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export type UserProfile = {
  id: string;
  full_name: string | null;
  channel: string | null;
  avatar_url: string | null;
  is_vip: boolean;
};

export type SupabaseLeaderboardEntry = {
  id: string;
  player_name: string;
  user_id: string | null;
  difficulty: DifficultyId;
  score: number;
  time_ms: number;
  moves: number;
  rank: string;
  created_at: string;
  profiles?: UserProfile | null;
};

export async function fetchProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, channel, avatar_url, is_vip")
    .eq("id", userId)
    .maybeSingle();

  if (error || !data) return null;
  return data as UserProfile;
}

export async function fetchLeaderboardFromDb(
  difficulty: DifficultyId
): Promise<SupabaseLeaderboardEntry[]> {
  try {
    const { data, error } = await supabase
      .from("soulfighter_ranking")
      .select(`
        id,
        player_name,
        user_id,
        difficulty,
        score,
        time_ms,
        moves,
        rank,
        created_at,
        profiles (
          id,
          full_name,
          channel,
          avatar_url,
          is_vip
        )
      `)
      .eq("difficulty", difficulty)
      .order("score", { ascending: false })
      .order("time_ms", { ascending: true })
      .limit(50);

    if (error) {
      console.warn("Erro ao buscar ranking do Supabase:", error);
      return [];
    }

    return (data as unknown as SupabaseLeaderboardEntry[]) || [];
  } catch (err) {
    console.error("Erro na requisição de ranking:", err);
    return [];
  }
}

export async function saveScoreToDb(params: {
  playerName: string;
  userId?: string | null;
  difficulty: DifficultyId;
  score: number;
  timeMs: number;
  moves: number;
  rank: string;
}): Promise<SupabaseLeaderboardEntry | null> {
  const cleanPlayerName = params.playerName?.trim() || "Guerreiro";
  const cleanScore = Math.max(0, Math.round(Number(params.score) || 0));
  const cleanTimeMs = Math.max(0, Math.round(Number(params.timeMs) || 0));
  const cleanMoves = Math.max(0, Math.round(Number(params.moves) || 0));
  const cleanRank = params.rank?.trim() || "S";
  const targetUserId = params.userId || null;

  try {
    const { data, error } = await supabase.rpc("upsert_soulfighter_score", {
      p_player_name: cleanPlayerName,
      p_user_id: targetUserId,
      p_difficulty: params.difficulty,
      p_score: cleanScore,
      p_time_ms: cleanTimeMs,
      p_moves: cleanMoves,
      p_rank: cleanRank,
    });

    if (!error && data) {
      return data as unknown as SupabaseLeaderboardEntry;
    }

    if (error) {
      console.warn("RPC upsert_soulfighter_score retornou erro:", error.message, error.code);
      // Se falhou por violação de foreign key do user_id (ex: perfil ausente em public.profiles)
      if (error.code === "23503" && targetUserId) {
        console.warn("Retentando salvar score como convidado devido a foreign key inexistente...");
        const retryRes = await supabase.rpc("upsert_soulfighter_score", {
          p_player_name: cleanPlayerName,
          p_user_id: null,
          p_difficulty: params.difficulty,
          p_score: cleanScore,
          p_time_ms: cleanTimeMs,
          p_moves: cleanMoves,
          p_rank: cleanRank,
        });
        if (!retryRes.error && retryRes.data) {
          return retryRes.data as unknown as SupabaseLeaderboardEntry;
        }
      }
    }
  } catch (err) {
    console.error("Falha ao chamar RPC upsert_soulfighter_score:", err);
  }

  // Fallback de contingência: inserção direta na tabela soulfighter_ranking
  try {
    console.warn("Tentando fallback de inserção direta no soulfighter_ranking...");
    const payload = {
      player_name: cleanPlayerName,
      user_id: targetUserId,
      difficulty: params.difficulty,
      score: cleanScore,
      time_ms: cleanTimeMs,
      moves: cleanMoves,
      rank: cleanRank,
    };

    let insertRes = await supabase.from("soulfighter_ranking").insert(payload).select().single();
    if (insertRes.error && insertRes.error.code === "23503" && targetUserId) {
      payload.user_id = null;
      insertRes = await supabase.from("soulfighter_ranking").insert(payload).select().single();
    }

    if (!insertRes.error && insertRes.data) {
      return insertRes.data as unknown as SupabaseLeaderboardEntry;
    }
  } catch (fallbackErr) {
    console.error("Falha fatal no fallback de pontuação:", fallbackErr);
  }

  return null;
}

export type GeneralLeaderboardEntry = {
  player_key: string;
  player_name: string;
  user_id: string | null;
  total_score: number;
  total_time_ms: number;
  total_moves: number;
  modes_played: number;
  best_rank: string;
  is_aster_account: boolean;
  is_vip: boolean;
  avatar_url: string | null;
  channel: string | null;
  novato_score: number;
  lutador_score: number;
  lenda_score: number;
  classico_score: number;
};

export async function fetchGeneralLeaderboardFromDb(): Promise<GeneralLeaderboardEntry[]> {
  try {
    const { data, error } = await supabase.rpc("get_soulfighter_general_leaderboard");
    if (error) {
      console.warn("Erro ao buscar ranking geral do Supabase:", error);
      return [];
    }
    return (data as GeneralLeaderboardEntry[]) || [];
  } catch (err) {
    console.error("Erro na requisição de ranking geral:", err);
    return [];
  }
}
