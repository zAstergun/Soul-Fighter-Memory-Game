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
  try {
    const payload = {
      player_name: params.playerName?.trim() || "Guerreiro",
      user_id: params.userId || null,
      difficulty: params.difficulty,
      score: params.score,
      time_ms: params.timeMs,
      moves: params.moves,
      rank: params.rank,
    };

    const { data, error } = await supabase
      .from("soulfighter_ranking")
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.warn("Erro ao salvar pontuação no Supabase:", error);
      return null;
    }

    return data as unknown as SupabaseLeaderboardEntry;
  } catch (err) {
    console.error("Falha ao salvar score no Supabase:", err);
    return null;
  }
}
