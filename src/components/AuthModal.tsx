import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { sfx } from "../lib/sound";
import { VerifiedBadge, VipBadge } from "./UserBadges";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
};

export default function AuthModal({ isOpen, onClose, onSuccess }: Props) {
  const { signIn, signUp } = useAuth();
  const [tab, setTab] = useState<"login" | "register">("login");
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [fighterName, setFighterName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);

    setSubmitting(true);
    sfx.click();

    try {
      if (tab === "login") {
        if (!loginIdentifier.trim() || !password) {
          setError("Informe seu Nome de Lutador ou E-mail e sua senha.");
          setSubmitting(false);
          return;
        }

        const res = await signIn(loginIdentifier, password);
        if (res.error) {
          setError(res.error);
        } else {
          sfx.match();
          onSuccess?.();
          onClose();
        }
      } else {
        if (!fighterName.trim()) {
          setError("Informe seu Nome de Lutador.");
          setSubmitting(false);
          return;
        }

        if (fighterName.trim().length < 3) {
          setError("O Nome de Lutador deve ter pelo menos 3 caracteres.");
          setSubmitting(false);
          return;
        }

        if (!email.trim()) {
          setError("Informe seu e-mail.");
          setSubmitting(false);
          return;
        }

        if (password.length < 8) {
          setError("A senha deve ter no mínimo 8 caracteres.");
          setSubmitting(false);
          return;
        }

        if (password !== confirmPassword) {
          setError("As senhas não coincidem. Digite novamente.");
          setSubmitting(false);
          return;
        }

        const res = await signUp(email, password, fighterName.trim());
        if (res.error) {
          setError(res.error);
        } else if (res.message) {
          setNotice(res.message);
        } else {
          sfx.combo();
          onSuccess?.();
          onClose();
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md bg-black/75 animate-deal">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border-2 border-soul-pink/50 bg-[#120725] p-6 text-white shadow-[0_0_50px_rgba(255,61,154,0.4)] sm:p-8">
        {/* Glow ambient background */}
        <div className="pointer-events-none absolute -top-24 -right-24 h-48 w-48 rounded-full bg-soul-pink/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-soul-cyan/20 blur-3xl" />

        {/* Close Button */}
        <button
          onClick={() => {
            sfx.click();
            onClose();
          }}
          className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/60 transition hover:bg-white/20 hover:text-white"
        >
          ✕
        </button>

        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-soul-gold/40 bg-soul-gold/10 px-3 py-1 text-xs font-bold text-soul-gold tracking-wider uppercase mb-2">
            <span>✨</span> Rede ASTER
          </div>
          <h2 className="font-display text-3xl sm:text-4xl tracking-wide uppercase bg-gradient-to-r from-soul-gold via-white to-soul-cyan bg-clip-text text-transparent">
            {tab === "login" ? "Entrar na Arena" : "Criar Aster Account"}
          </h2>
          <p className="mt-1 text-xs text-white/60 leading-relaxed">
            Sua conta global para jogar, salvar recordes no ranking com selo de{" "}
            <span className="text-soul-cyan font-bold inline-flex items-center gap-0.5">
              <VerifiedBadge className="h-3 w-3 inline" /> Verificado
            </span>{" "}
            e <span className="text-soul-gold font-bold inline-flex items-center gap-0.5"><VipBadge className="text-[9px] py-0 px-1" /> VIP</span>!
          </p>
        </div>

        {/* Tabs */}
        <div className="mt-5 grid grid-cols-2 gap-1 rounded-2xl bg-black/50 p-1">
          <button
            type="button"
            onClick={() => {
              sfx.click();
              setTab("login");
              setError(null);
              setNotice(null);
            }}
            className={`rounded-xl py-2 text-xs font-bold uppercase tracking-wider transition ${
              tab === "login"
                ? "bg-gradient-to-r from-soul-pink to-soul-violet text-white shadow-md"
                : "text-white/60 hover:text-white"
            }`}
          >
            Entrar
          </button>
          <button
            type="button"
            onClick={() => {
              sfx.click();
              setTab("register");
              setError(null);
              setNotice(null);
            }}
            className={`rounded-xl py-2 text-xs font-bold uppercase tracking-wider transition ${
              tab === "register"
                ? "bg-gradient-to-r from-soul-pink to-soul-violet text-white shadow-md"
                : "text-white/60 hover:text-white"
            }`}
          >
            Cadastrar
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mt-4 rounded-xl border border-red-500/40 bg-red-500/15 p-3 text-xs text-red-200">
            ⚠️ {error}
          </div>
        )}

        {notice && (
          <div className="mt-4 rounded-xl border border-emerald-500/40 bg-emerald-500/15 p-3 text-xs text-emerald-200">
            ✅ {notice}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-3.5">
          {tab === "login" ? (
            <div>
              <label className="block text-[11px] font-bold tracking-wider text-white/60 uppercase mb-1">
                Nome de Lutador ou E-mail
              </label>
              <input
                type="text"
                required
                autoFocus
                placeholder="Seu nome de lutador ou e-mail..."
                value={loginIdentifier}
                onChange={(e) => setLoginIdentifier(e.target.value)}
                className="w-full rounded-xl border border-white/15 bg-black/40 px-3.5 py-2.5 text-sm text-white placeholder-white/30 outline-none transition focus:border-soul-gold"
              />
            </div>
          ) : (
            <>
              <div>
                <label className="block text-[11px] font-bold tracking-wider text-white/60 uppercase mb-1">
                  Nome de Lutador
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="Ex: Gwen Master"
                  value={fighterName}
                  onChange={(e) => setFighterName(e.target.value.slice(0, 20))}
                  className="w-full rounded-xl border border-white/15 bg-black/40 px-3.5 py-2.5 text-sm text-white placeholder-white/30 outline-none transition focus:border-soul-gold"
                />
                <p className="mt-1 text-[10px] text-white/40 leading-snug">
                  💡 Nomes com espaços requerem e-mail verificado.
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-bold tracking-wider text-white/60 uppercase mb-1">
                  E-mail
                </label>
                <input
                  type="email"
                  required
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-white/15 bg-black/40 px-3.5 py-2.5 text-sm text-white placeholder-white/30 outline-none transition focus:border-soul-gold"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-[11px] font-bold tracking-wider text-white/60 uppercase mb-1">
              Senha
            </label>
            <input
              type="password"
              required
              placeholder={tab === "register" ? "Mínimo 8 caracteres" : "Sua senha"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-white/15 bg-black/40 px-3.5 py-2.5 text-sm text-white placeholder-white/30 outline-none transition focus:border-soul-gold"
            />
          </div>

          {tab === "register" && (
            <div>
              <label className="block text-[11px] font-bold tracking-wider text-white/60 uppercase mb-1">
                Confirmar Senha
              </label>
              <input
                type="password"
                required
                placeholder="Repita sua senha"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-xl border border-white/15 bg-black/40 px-3.5 py-2.5 text-sm text-white placeholder-white/30 outline-none transition focus:border-soul-gold"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="font-display group relative mt-2 w-full overflow-hidden rounded-xl bg-gradient-to-r from-soul-gold via-soul-orange to-soul-pink py-3 text-xl tracking-wider text-soul-ink shadow-lg transition hover:scale-[1.01] active:scale-95 disabled:opacity-50"
          >
            <span className="relative z-10 font-bold uppercase">
              {submitting ? "Carregando..." : tab === "login" ? "Entrar com Aster Account" : "Criar Minha Conta"}
            </span>
          </button>
        </form>

        {/* Guest switch option */}
        <div className="mt-4 pt-3 border-t border-white/10 text-center">
          <button
            type="button"
            onClick={() => {
              sfx.click();
              onClose();
            }}
            className="text-xs text-white/60 hover:text-white underline underline-offset-4"
          >
            Ou continue sem conta (apenas como convidado)
          </button>
        </div>
      </div>
    </div>
  );
}
