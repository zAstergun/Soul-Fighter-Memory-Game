import { useEffect, useState } from "react";
import { BASE_FIGHTERS, DIFFICULTIES, loadingArt, type DifficultyId } from "../data/fighters";
import { getPlayerName, setPlayerName } from "../lib/storage";
import { sfx } from "../lib/sound";
import { useAuth } from "../context/AuthContext";
import AuthModal from "./AuthModal";
import Leaderboard from "./Leaderboard";
import { PlayerAvatar, VerifiedBadge, VipBadge } from "./UserBadges";

type Props = {
  onStart: (name: string, diff: DifficultyId) => void;
  initialDiff: DifficultyId;
};

export default function StartScreen({ onStart, initialDiff }: Props) {
  const { user, profile, signOut, loading: authLoading } = useAuth();
  const [name, setName] = useState(getPlayerName());
  const [diff, setDiff] = useState<DifficultyId>(initialDiff);
  const [panel, setPanel] = useState<"play" | "rank" | "help">("play");
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [mode, setMode] = useState<"guest" | "account">("guest");

  // Quando o usuário loga ou o perfil carrega, atualiza o nome e o modo
  useEffect(() => {
    if (user && profile) {
      setMode("account");
      const defaultName = profile.full_name || profile.channel?.replace("@", "") || "Lutador";
      setName(defaultName);
      setPlayerName(defaultName);
    } else if (!user && !authLoading) {
      setMode("guest");
    }
  }, [user, profile, authLoading]);

  const valid = name.trim().length >= 3;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    onStart(name.trim(), diff);
  };

  return (
    <div className="flex min-h-screen flex-col items-center px-4 pt-8 pb-6 sm:pt-12">
      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={() => {
          setMode("account");
        }}
      />

      {/* Top Bar / Status da Conta */}
      <div className="mb-4 flex w-full max-w-xl items-center justify-between gap-2 px-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-display text-sm tracking-wider text-soul-gold">
            REDE ASTER
          </span>
          <span className="h-1 w-1 rounded-full bg-white/40" />
          <span className="text-white/60">Soul Fighter Arena</span>
        </div>

        {user && profile ? (
          <div className="flex items-center gap-2 rounded-full border border-soul-gold/30 bg-black/50 py-1 pl-1.5 pr-2.5 backdrop-blur-sm">
            <PlayerAvatar profile={profile} name={profile.full_name || "Guerreiro"} size="sm" />
            <div className="flex items-center gap-1">
              <span className="max-w-[100px] truncate font-bold text-white sm:max-w-[140px]">
                {profile.full_name || profile.channel}
              </span>
              <VerifiedBadge className="h-3 w-3" />
              {profile.is_vip && <VipBadge className="text-[9px] px-1 py-0" />}
            </div>
            <button
              onClick={() => {
                sfx.click();
                signOut();
              }}
              title="Sair da Aster Account"
              className="ml-1 text-[10px] text-white/40 transition hover:text-soul-pink"
            >
              (Sair)
            </button>
          </div>
        ) : (
          <button
            onClick={() => {
              sfx.click();
              setAuthModalOpen(true);
            }}
            className="flex items-center gap-1.5 rounded-full border border-soul-cyan/40 bg-soul-cyan/10 px-3 py-1 font-bold text-soul-cyan transition hover:bg-soul-cyan/20 active:scale-95"
          >
            <VerifiedBadge className="h-3 w-3" />
            <span>Entrar com Aster Account</span>
          </button>
        )}
      </div>

      {/* Logo */}
      <header className="animate-slam relative mb-6 text-center select-none">
        <div className="font-display text-6xl leading-[0.85] tracking-wide [filter:drop-shadow(4px_4px_0_#120725)_drop-shadow(0_0_24px_rgba(255,61,154,0.6))] sm:text-8xl">
          <span className="bg-gradient-to-b from-soul-gold via-soul-orange to-soul-pink bg-clip-text text-transparent [-webkit-text-stroke:0]">
            SOUL
          </span>{" "}
          <span className="bg-gradient-to-b from-white via-soul-cyan to-soul-violet bg-clip-text text-transparent [-webkit-text-stroke:0]">
            FIGHTER
          </span>
        </div>
        <div className="mt-2 flex items-center justify-center gap-2">
          <span className="clip-slant bg-soul-pink px-4 py-1 font-display text-xl tracking-widest text-white sm:text-2xl">
            MEMORY GAME
          </span>
          <span className="clip-slant-r bg-soul-gold px-3 py-1 font-display text-lg tracking-widest text-soul-ink sm:text-xl">
            REMASTERED
          </span>
        </div>
      </header>

      {/* Roster */}
      <div className="mb-6 flex max-w-full gap-1.5 overflow-hidden px-2 sm:gap-2">
        {BASE_FIGHTERS.map((f, i) => (
          <div
            key={f.id}
            className="animate-deal group relative h-20 w-12 shrink-0 -skew-x-6 overflow-hidden rounded-md border-2 border-white/20 sm:h-28 sm:w-16"
            style={{ animationDelay: `${i * 60}ms`, borderColor: f.color + "aa" }}
            title={f.name}
          >
            <img
              src={loadingArt(f)}
              alt={f.name}
              className="h-full w-full scale-125 object-cover object-top transition group-hover:scale-150"
            />
          </div>
        ))}
      </div>

      {/* Painel Principal */}
      <div className="w-full max-w-xl rounded-3xl border border-white/15 bg-soul-ink/80 p-5 shadow-[0_20px_80px_-20px_rgba(255,61,154,0.5)] backdrop-blur-md sm:p-7">
        {/* Abas Superiores do Painel */}
        <div className="mb-5 grid grid-cols-3 gap-1 rounded-full bg-black/40 p-1">
          {(
            [
              ["play", "Jogar"],
              ["rank", "Ranking Global"],
              ["help", "Como jogar"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              onClick={() => {
                sfx.click();
                setPanel(id);
              }}
              className={`rounded-full py-2 text-sm font-bold transition ${
                panel === id
                  ? "bg-gradient-to-r from-soul-pink to-soul-violet text-white shadow"
                  : "text-white/60 hover:text-white"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {panel === "play" && (
          <form onSubmit={submit} className="space-y-5">
            {/* Seletor de Modo: Convidado vs Aster Account */}
            <div className="rounded-2xl border border-white/10 bg-black/40 p-2.5">
              <span className="mb-2 block text-[11px] font-bold tracking-wider text-white/50 uppercase">
                Identidade na Arena
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    sfx.click();
                    setMode("guest");
                  }}
                  className={`flex flex-col items-start rounded-xl border p-2.5 text-left transition ${
                    mode === "guest" && !user
                      ? "border-soul-gold/80 bg-soul-gold/10 text-white"
                      : "border-white/10 bg-white/5 text-white/60 hover:bg-white/10"
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs uppercase">
                    <span>👤</span> Convidado
                  </div>
                  <span className="mt-1 text-[11px] text-white/50 leading-tight">
                    Apenas digite um nome. Sem avatar no ranking.
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    sfx.click();
                    if (!user) {
                      setAuthModalOpen(true);
                    } else {
                      setMode("account");
                    }
                  }}
                  className={`flex flex-col items-start rounded-xl border p-2.5 text-left transition ${
                    user || mode === "account"
                      ? "border-soul-cyan/80 bg-soul-cyan/10 text-white shadow-[0_0_15px_rgba(62,224,255,0.15)]"
                      : "border-white/10 bg-white/5 text-white/60 hover:bg-white/10"
                  }`}
                >
                  <div className="flex items-center gap-1 font-bold text-xs uppercase text-soul-cyan">
                    <span>✨</span> Aster Account
                    <VerifiedBadge className="h-3 w-3" />
                  </div>
                  <span className="mt-1 text-[11px] text-white/50 leading-tight">
                    {user && profile
                      ? "Conectado! Verificado & VIP ativos."
                      : "Clique para entrar ou criar sua conta."}
                  </span>
                </button>
              </div>

              {/* Banner Informativo / Troca de Conta quando logado */}
              {user && profile ? (
                <div className="mt-3 flex items-center justify-between rounded-xl bg-soul-cyan/10 border border-soul-cyan/20 px-3 py-2 text-xs">
                  <div className="flex items-center gap-2">
                    <PlayerAvatar profile={profile} name={profile.full_name || ""} size="sm" />
                    <div>
                      <div className="flex items-center gap-1 font-bold text-white">
                        <span>{profile.full_name || profile.channel}</span>
                        <VerifiedBadge className="h-3.5 w-3.5" />
                        {profile.is_vip && <VipBadge className="text-[9px] px-1 py-0" />}
                      </div>
                      <span className="text-[10px] text-white/50">
                        {profile.channel || "Membro da Rede ASTER"}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      sfx.click();
                      signOut();
                    }}
                    className="text-[11px] font-bold text-soul-pink hover:underline"
                  >
                    Trocar Conta
                  </button>
                </div>
              ) : (
                <div className="mt-3 flex items-center justify-between rounded-xl bg-white/5 px-3 py-2 text-xs">
                  <span className="text-[11px] text-white/60">
                    💡 Jogar com uma Aster Account ativa o selo de Verificado e foto de perfil no ranking!
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      sfx.click();
                      setAuthModalOpen(true);
                    }}
                    className="shrink-0 ml-2 font-bold text-soul-gold hover:underline text-[11px]"
                  >
                    Conectar Agora
                  </button>
                </div>
              )}
            </div>

            {/* Input do Nome do Lutador */}
            <label className="block">
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-xs font-bold tracking-widest text-white/60 uppercase">
                  Nome do lutador na arena
                </span>
                {user && profile && (
                  <span className="text-[10px] text-soul-cyan font-semibold">
                    (Vinculado à sua Aster Account)
                  </span>
                )}
              </div>
              <input
                value={name}
                onChange={(e) => setName(e.target.value.slice(0, 16))}
                placeholder="Digite seu nome de luta..."
                autoFocus
                className="w-full rounded-xl border-2 border-white/15 bg-black/40 px-4 py-3 text-lg font-semibold text-white placeholder-white/30 outline-none transition focus:border-soul-gold"
              />
            </label>

            {/* Dificuldades */}
            <div>
              <span className="mb-1.5 block text-xs font-bold tracking-widest text-white/60 uppercase">
                Dificuldade
              </span>
              <div className="grid grid-cols-2 gap-2">
                {DIFFICULTIES.map((d) => (
                  <button
                    type="button"
                    key={d.id}
                    onClick={() => {
                      sfx.click();
                      setDiff(d.id);
                    }}
                    className={`relative overflow-hidden rounded-xl border-2 p-3 text-left transition ${
                      diff === d.id
                        ? "border-soul-gold bg-white/10"
                        : "border-white/10 bg-black/30 hover:border-white/30"
                    }`}
                  >
                    <div className={`absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b ${d.accent}`} />
                    <div className="flex items-baseline justify-between gap-2 pl-1">
                      <span className="font-display text-2xl tracking-wide">{d.label}</span>
                      <span className="text-[10px] font-bold tracking-wide text-white/50 uppercase">
                        {d.tag}
                      </span>
                    </div>
                    <p className="mt-0.5 pl-1 text-xs leading-snug text-white/60">{d.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Botão de Iniciar Jogo */}
            <button
              type="submit"
              disabled={!valid}
              className="font-display group relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-soul-orange via-soul-pink to-soul-violet py-4 text-3xl tracking-widest text-white shadow-lg transition enabled:hover:scale-[1.02] enabled:active:scale-95 disabled:cursor-not-allowed disabled:from-zinc-600 disabled:via-zinc-600 disabled:to-zinc-700 disabled:text-white/40"
            >
              <span className="relative z-10">{valid ? "LUTAR!" : "DIGITE SEU NOME"}</span>
              {valid && (
                <span className="absolute inset-y-0 left-0 w-1/3 bg-white/30 opacity-0 blur-md group-hover:animate-shine group-hover:opacity-100" />
              )}
            </button>
          </form>
        )}

        {panel === "rank" && <Leaderboard initial={diff} />}

        {panel === "help" && (
          <ul className="space-y-3 text-sm text-white/80">
            {[
              ["🃏", "Vire duas cartas por vez. Se forem o mesmo lutador, o par é seu."],
              ["🔥", "Acertos seguidos geram COMBO e multiplicam seus pontos."],
              ["💥", "Cada par encontrado tira vida do Shaco, o chefão da arena."],
              ["❤️", "No modo Lenda você tem 10 vidas — cada erro custa uma."],
              ["🏆", "Termine rápido e com poucos erros pra tirar rank S."],
              ["✨", "Conecte sua Aster Account para garantir o selo de Verificado e foto de perfil no ranking."],
              ["⌨️", "Atalhos: P pausa, M silencia, R reinicia."],
            ].map(([icon, text]) => (
              <li key={text} className="flex gap-3 rounded-xl bg-white/5 p-3">
                <span className="text-xl">{icon}</span>
                <span>{text}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <footer className="mt-auto pt-8 text-center text-xs text-white/50">
        Feito com tédio pelo{" "}
        <a
          href="https://github.com/zAstergun"
          target="_blank"
          rel="noreferrer"
          className="font-bold text-soul-gold hover:underline"
        >
          Aster
        </a>{" "}
        · agora remasterizado ✨
        <p className="mt-1 text-[10px] text-white/30">
          Fan game sem fins lucrativos. League of Legends e Soul Fighter são marcas da Riot Games.
        </p>
      </footer>
    </div>
  );
}
