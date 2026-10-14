import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase, fetchProfile, createProfileFromUser, type UserProfile } from "../lib/supabase";

type AuthContextType = {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, pass: string) => Promise<{ error?: string }>;
  signUp: (email: string, pass: string, fighterName: string, channel?: string) => Promise<{ error?: string; message?: string }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const CACHE_USER_KEY = "sf_cached_user";
const CACHE_PROFILE_KEY = "sf_cached_profile";

function getCachedProfile(): UserProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CACHE_PROFILE_KEY);
    return raw ? (JSON.parse(raw) as UserProfile) : null;
  } catch {
    return null;
  }
}

function getCachedUser(): User | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CACHE_USER_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => getCachedUser());
  const [profile, setProfile] = useState<UserProfile | null>(() => getCachedProfile());
  const [loading, setLoading] = useState<boolean>(() => !getCachedUser());

  const loadProfile = async (targetUser: User): Promise<UserProfile> => {
    try {
      const p = await fetchProfile(targetUser.id);
      if (p) {
        setProfile(p);
        localStorage.setItem(CACHE_PROFILE_KEY, JSON.stringify(p));
        return p;
      }
    } catch (err) {
      console.warn("Erro ao buscar perfil remoto:", err);
    }

    // Fallback: se o perfil não existe na tabela profiles (ou falha de rede),
    // cria a partir dos metadados da conta para que NUNCA fique nulo
    const fallback = createProfileFromUser(targetUser);
    setProfile(fallback);
    localStorage.setItem(CACHE_PROFILE_KEY, JSON.stringify(fallback));
    return fallback;
  };

  useEffect(() => {
    let isMounted = true;

    // Sincroniza sessão persistida pelo Supabase
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isMounted) return;
      const u = session?.user ?? null;
      if (u) {
        setUser(u);
        localStorage.setItem(CACHE_USER_KEY, JSON.stringify(u));
        loadProfile(u).finally(() => {
          if (isMounted) setLoading(false);
        });
      } else {
        // Se realmente não há sessão confirmada pelo Supabase, limpa
        setUser(null);
        setProfile(null);
        localStorage.removeItem(CACHE_PROFILE_KEY);
        localStorage.removeItem(CACHE_USER_KEY);
        if (isMounted) setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;
      const u = session?.user ?? null;

      if (event === "SIGNED_OUT") {
        setUser(null);
        setProfile(null);
        localStorage.removeItem(CACHE_PROFILE_KEY);
        localStorage.removeItem(CACHE_USER_KEY);
        setLoading(false);
        return;
      }

      if (u) {
        setUser(u);
        localStorage.setItem(CACHE_USER_KEY, JSON.stringify(u));
        await loadProfile(u);
        if (isMounted) setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const refreshProfile = async () => {
    if (user) {
      await loadProfile(user);
    }
  };

  const signIn = async (identifier: string, pass: string) => {
    try {
      const clean = identifier.trim();
      let targetEmail = clean;

      // Se não contiver formato de e-mail comum, tenta resolver Nome de Lutador ou @Canal via RPC
      if (!clean.includes("@") || !clean.includes(".")) {
        const { data: resolvedEmail, error: rpcErr } = await supabase.rpc(
          "get_email_by_identifier",
          { p_identifier: clean }
        );

        if (rpcErr || !resolvedEmail) {
          return { error: "Nome de Lutador não encontrado. Verifique a digitação ou use seu e-mail." };
        }
        targetEmail = resolvedEmail;
      }

      let { data, error } = await supabase.auth.signInWithPassword({
        email: targetEmail,
        password: pass,
      });

      if (error && clean.startsWith("@")) {
        const { data: resolvedEmail } = await supabase.rpc(
          "get_email_by_identifier",
          { p_identifier: clean }
        );
        if (resolvedEmail && resolvedEmail !== targetEmail) {
          const retry = await supabase.auth.signInWithPassword({
            email: resolvedEmail,
            password: pass,
          });
          data = retry.data;
          error = retry.error;
        }
      }

      if (error) {
        return { error: "Credenciais inválidas. Verifique seu nome/e-mail e senha." };
      }

      if (data?.user) {
        setUser(data.user);
        localStorage.setItem(CACHE_USER_KEY, JSON.stringify(data.user));
        await loadProfile(data.user);
      }

      return {};
    } catch (e: unknown) {
      const err = e as Error;
      return { error: err.message || "Erro inesperado ao conectar." };
    }
  };

  const signUp = async (email: string, pass: string, fighterName: string, channel?: string) => {
    try {
      const cleanName = fighterName.trim();
      const rawChannel = channel?.trim() || cleanName.toLowerCase().replace(/[^a-z0-9_]/gi, "") || "lutador";
      const formattedChannel = rawChannel.startsWith("@") ? rawChannel : `@${rawChannel}`;

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: pass,
        options: {
          data: {
            full_name: cleanName,
            channel: formattedChannel,
            user_name: formattedChannel.replace("@", ""),
          },
        },
      });

      if (error) return { error: error.message };

      if (data.user) {
        if (data.session) {
          setUser(data.user);
          localStorage.setItem(CACHE_USER_KEY, JSON.stringify(data.user));
          await loadProfile(data.user);
        } else {
          return {
            message:
              "Conta criada com sucesso! Verifique seu e-mail para confirmar o cadastro (se a confirmação estiver ativada).",
          };
        }
      }

      return {};
    } catch (e: unknown) {
      const err = e as Error;
      return { error: err.message || "Erro inesperado ao cadastrar." };
    }
  };

  const signOut = async () => {
    localStorage.removeItem(CACHE_PROFILE_KEY);
    localStorage.removeItem(CACHE_USER_KEY);
    setUser(null);
    setProfile(null);
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn("Erro ao fazer signOut:", err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        signIn,
        signUp,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
