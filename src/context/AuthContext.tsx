import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase, fetchProfile, type UserProfile } from "../lib/supabase";

type AuthContextType = {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, pass: string) => Promise<{ error?: string }>;
  signUp: (email: string, pass: string, fighterName: string, channel?: string) => Promise<{ error?: string; message?: string }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async (uid: string) => {
    const p = await fetchProfile(uid);
    setProfile(p);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) {
        loadProfile(u.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) {
        await loadProfile(u.id);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const refreshProfile = async () => {
    if (user) {
      await loadProfile(user.id);
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

      const { error } = await supabase.auth.signInWithPassword({
        email: targetEmail,
        password: pass,
      });

      if (error) {
        // Se falhou e o usuário digitou algo com @ que não era email direto (ex: @aster)
        if (clean.startsWith("@")) {
          const { data: resolvedEmail } = await supabase.rpc(
            "get_email_by_identifier",
            { p_identifier: clean }
          );
          if (resolvedEmail && resolvedEmail !== targetEmail) {
            const retry = await supabase.auth.signInWithPassword({
              email: resolvedEmail,
              password: pass,
            });
            if (!retry.error) return {};
          }
        }
        return { error: "Credenciais inválidas. Verifique seu nome/e-mail e senha." };
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

      if (data.user && !data.session) {
        return {
          message:
            "Conta criada com sucesso! Verifique seu e-mail para confirmar o cadastro (se a confirmação estiver ativada).",
        };
      }

      return {};
    } catch (e: unknown) {
      const err = e as Error;
      return { error: err.message || "Erro inesperado ao cadastrar." };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
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
