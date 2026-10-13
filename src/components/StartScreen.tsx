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
    <div className="h-dvh max-h-dvh w-full overflow-hidden flex flex-col items-center justify-between px-3 py-1.5 sm:px-4 sm:py-3.5 select-none touch-manipulation">
      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={() => {
          setMode("account");
        }}
      />

      {/* Top Bar / Status da Conta */}
      <div className="flex w-full max-w-3xl md:max-w-4xl shrink-0 items-center justify-between gap-2 px-1 text-xs">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className="font-display text-xs sm:text-sm tracking-wider text-soul-gold">
            REDE ASTER
          </span>
          <span className="h-1 w-1 rounded-full bg-white/40" />
          <span className="text-[10px] text-white/60 sm:text-xs">Soul Fighter Arena</span>
        </div>

        {user && profile ? (
          <div className="flex items-center gap-1.5 rounded-full border border-soul-gold/30 bg-black/50 py-0.5 pl-1 pr-2 backdrop-blur-sm sm:py-1 sm:pl-1.5 sm:pr-2.5">
            <PlayerAvatar profile={profile} name={profile.full_name || "Guerreiro"} size="sm" />
            <div className="flex items-center gap-1">
              <span className="max-w-[90px] truncate text-[11px] font-bold text-white sm:max-w-[140px] sm:text-xs">
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
            className="flex items-center gap-1 rounded-full border border-soul-cyan/40 bg-soul-cyan/10 px-2.5 py-0.5 text-[11px] font-bold text-soul-cyan transition hover:bg-soul-cyan/20 active:scale-95 sm:px-3 sm:py-1 sm:text-xs"
          >
            <VerifiedBadge className="h-3 w-3" />
            <span>Entrar com Aster Account</span>
          </button>
        )}
      </div>

      {/* Logo */}
      <header className="animate-slam relative shrink-0 my-0.5 text-center select-none sm:my-1">
        <div className="font-display text-3xl leading-[0.85] tracking-wide [filter:drop-shadow(3px_3px_0_#120725)_drop-shadow(0_0_18px_rgba(255,61,154,0.5))] sm:text-5xl md:text-6xl">
          <span className="bg-gradient-to-b from-soul-gold via-soul-orange to-soul-pink bg-clip-text text-transparent [-webkit-text-stroke:0]">
            SOUL
          </span>{" "}
          <span className="bg-gradient-to-b from-white via-soul-cyan to-soul-violet bg-clip-text text-transparent [-webkit-text-stroke:0]">
            FIGHTER
          </span>
        </div>
        <div className="mt-1 flex items-center justify-center gap-1.5 sm:mt-1.5 sm:gap-2">
          <span className="clip-slant bg-soul-pink px-2.5 py-0.5 font-display text-xs tracking-widest text-white sm:px-4 sm:py-1 sm:text-lg">
            MEMORY GAME
          </span>
          <span className="clip-slant-r bg-soul-gold px-2 py-0.5 font-display text-[11px] tracking-widest text-soul-ink sm:px-3 sm:py-1 sm:text-base">
            REMASTERED
          </span>
        </div>
      </header>

      {/* Roster Strip: MOBILE MARQUEE (< md) com loop infinito contínuo */}
      <div className="shrink-0 my-0.5 sm:my-1 w-full max-w-full overflow-hidden py-3 -my-2 md:hidden">
        <div className="flex w-max gap-2 animate-sf-marquee px-1 pointer-events-none select-none">
          {[...BASE_FIGHTERS, ...BASE_FIGHTERS].map((f, i) => (
            <div
              key={`${f.id}-${i}`}
              className="group relative h-18 w-13 min-[480px]:h-22 min-[480px]:w-16 shrink-0 -skew-x-6 overflow-hidden rounded-lg border-2 shadow-xl"
              style={{ borderColor: f.color }}
              title={f.name}
            >
              <img
                src={loadingArt(f)}
                alt={f.name}
                className="h-full w-full scale-125 object-cover object-top transition duration-300 group-hover:scale-150"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/50 to-transparent p-0.5 text-center">
                <span className="font-display block text-[8px] min-[480px]:text-[9px] truncate" style={{ color: f.color }}>
                  {f.name}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Roster Strip: DESKTOP (>= md) quebra a caixa para mostrar todos os 10 sem cortar e sem marquee */}
      <div className="shrink-0 my-1 hidden md:flex w-full max-w-5xl lg:max-w-6xl items-center justify-center gap-2 lg:gap-3 py-4 -my-2 px-2 overflow-visible">
        {BASE_FIGHTERS.map((f, i) => (
          <div
            key={f.id}
            className="animate-deal group relative md:h-28 md:w-20 lg:h-32 lg:w-23 shrink-0 -skew-x-6 overflow-hidden rounded-xl border-2 transition duration-300 hover:scale-120 hover:z-30 hover:rotate-0 shadow-xl cursor-pointer"
            style={{ animationDelay: `${i * 35}ms`, borderColor: f.color }}
            title={f.name}
          >
            <img
              src={loadingArt(f)}
              alt={f.name}
              className="h-full w-full scale-125 object-cover object-top transition duration-300 group-hover:scale-150"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/50 to-transparent p-1 text-center">
              <span className="font-display block text-[10px] lg:text-xs truncate" style={{ color: f.color }}>
                {f.name}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Painel Principal com Altura Adaptável (Nunca corta o botão e não pula entre abas) */}
      <div className="w-full max-w-3xl md:max-w-4xl flex-1 min-h-0 max-h-[380px] sm:max-h-[430px] md:max-h-[450px] flex flex-col justify-between rounded-2xl border border-white/15 bg-soul-ink/90 p-2.5 sm:p-4 shadow-[0_20px_60px_-15px_rgba(255,61,154,0.4)] backdrop-blur-md">
        {/* Abas Superiores do Painel */}
        <div className="mb-2 grid grid-cols-3 gap-1 shrink-0 rounded-full bg-black/40 p-1 sm:mb-2.5">
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
              className={`rounded-full py-1 text-xs font-bold transition sm:py-1.5 sm:text-sm ${
                panel === id
                  ? "bg-gradient-to-r from-soul-pink to-soul-violet text-white shadow"
                  : "text-white/60 hover:text-white"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Conteúdo do Painel */}
        <div className="flex-1 min-h-0 flex flex-col justify-between overflow-hidden pr-0.5">
          {panel === "play" && (
            <form onSubmit={submit} className="h-full flex-1 min-h-0 flex flex-col justify-between gap-1.5 sm:gap-2.5 overflow-hidden">
              {/* Área interna com rolagem garantida para telas curtas */}
              <div className="flex-1 min-h-0 overflow-y-auto md:overflow-y-visible no-scrollbar pr-0.5 md:pr-0 space-y-2">
                <div className="grid grid-cols-1 min-[480px]:grid-cols-2 gap-2 sm:gap-3 items-stretch">
                  {/* LADO ESQUERDO: Identidade na Arena + Nome do Lutador */}
                  <div className="flex flex-col justify-between gap-1.5">
                    {/* Seletor de Modo: Convidado vs Aster Account */}
                    <div className="rounded-xl border border-white/10 bg-black/40 p-1.5 sm:p-2.5">
                      <span className="mb-1 block text-[10px] font-bold tracking-wider text-white/50 uppercase sm:text-[11px]">
                        Identidade na Arena
                      </span>
                      <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            sfx.click();
                            setMode("guest");
                          }}
                          className={`flex flex-col items-start rounded-lg border p-1.5 text-left transition sm:rounded-xl ${
                            mode === "guest" && !user
                              ? "border-soul-gold/80 bg-soul-gold/15 text-white shadow-[0_0_12px_rgba(255,210,63,0.2)]"
                              : "border-white/10 bg-white/5 text-white/60 hover:bg-white/10"
                          }`}
                        >
                          <div className="flex items-center gap-1 font-bold text-[11px] sm:text-xs uppercase">
                            <span>👤</span> Convidado
                          </div>
                          <span className="mt-0.5 text-[9px] sm:text-[10px] text-white/50 leading-tight">
                            Nome livre. Sem foto.
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
                          className={`flex flex-col items-start rounded-lg border p-1.5 text-left transition sm:rounded-xl ${
                            user || mode === "account"
                              ? "border-soul-cyan/80 bg-soul-cyan/15 text-white shadow-[0_0_12px_rgba(62,224,255,0.2)]"
                              : "border-white/10 bg-white/5 text-white/60 hover:bg-white/10"
                          }`}
                        >
                          <div className="flex items-center gap-1 font-bold text-[11px] sm:text-xs uppercase text-soul-cyan">
                            <span>✨</span> Aster Account
                            <VerifiedBadge className="h-3 w-3" />
                          </div>
                          <span className="mt-0.5 text-[9px] sm:text-[10px] text-white/50 leading-tight">
                            {user && profile ? "VIP & Verificado!" : "Entrar / cadastrar"}
                          </span>
                        </button>
                      </div>

                      {/* Banner da Conta se logado */}
                      {user && profile ? (
                        <div className="mt-1.5 flex items-center justify-between rounded-lg bg-soul-cyan/10 border border-soul-cyan/25 px-2 py-1 text-xs">
                          <div className="flex items-center gap-1.5">
                            <PlayerAvatar profile={profile} name={profile.full_name || ""} size="sm" />
                            <div className="min-w-0">
                              <div className="flex items-center gap-1 font-bold text-white text-[11px] sm:text-xs">
                                <span className="truncate">{profile.full_name || profile.channel}</span>
                                <VerifiedBadge className="h-3 w-3 shrink-0" />
                                {profile.is_vip && <VipBadge className="text-[9px] px-1 py-0 shrink-0" />}
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              sfx.click();
                              signOut();
                            }}
                            className="text-[10px] font-bold text-soul-pink hover:underline shrink-0 ml-1"
                          >
                            Trocar
                          </button>
                        </div>
                      ) : (
                        <div className="mt-1.5 flex items-center gap-1 rounded-lg bg-white/5 border border-white/5 px-2 py-0.5 text-[9.5px] sm:text-[10px] text-white/50">
                          <span className="text-soul-gold text-xs">💡</span>
                          <span>Entre com Aster Account para selos e ranking global.</span>
                        </div>
                      )}
                    </div>

                    {/* Input do Nome do Lutador */}
                    <label className="block">
                      <span className="mb-0.5 block text-[10px] font-bold tracking-widest text-white/60 uppercase sm:text-xs">
                        Nome do lutador
                      </span>
                      <input
                        value={name}
                        onChange={(e) => setName(e.target.value.slice(0, 16))}
                        placeholder="Digite seu nome..."
                        className="w-full rounded-xl border border-white/15 bg-black/40 px-3 py-1.5 text-sm font-semibold text-white placeholder-white/30 outline-none transition focus:border-soul-gold sm:py-2 sm:text-base"
                      />
                    </label>
                  </div>

                  {/* LADO DIREITO: Dificuldades */}
                  <div className="flex flex-col justify-between">
                    <span className="mb-0.5 block text-[10px] font-bold tracking-widest text-white/60 uppercase sm:text-xs">
                      Dificuldade da Luta
                    </span>
                    <div className="flex flex-col gap-1 sm:gap-1.5 flex-1 justify-between">
                      {DIFFICULTIES.map((d) => (
                        <button
                          type="button"
                          key={d.id}
                          onClick={() => {
                            sfx.click();
                            setDiff(d.id);
                          }}
                          className={`relative overflow-hidden rounded-lg sm:rounded-xl border px-2.5 py-1.5 text-left transition flex items-center justify-between ${
                            diff === d.id
                              ? "border-soul-gold bg-soul-gold/15 shadow-[0_0_12px_rgba(255,210,63,0.25)] ring-1 ring-soul-gold/70"
                              : "border-white/10 bg-black/30 hover:border-white/30 hover:bg-white/5"
                          }`}
                        >
                          <div className={`absolute inset-y-0 left-0 w-1 sm:w-1.5 bg-gradient-to-b ${d.accent}`} />
                          <div className="pl-1 min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="font-display text-sm tracking-wide sm:text-base">{d.label}</span>
                              <span className="text-[9px] font-bold tracking-wide text-soul-gold uppercase sm:text-[10px]">
                                {d.tag}
                              </span>
                            </div>
                            <p className="text-[9.5px] sm:text-[10px] leading-tight text-white/60 truncate">
                              {d.description}
                            </p>
                          </div>
                          <div className="ml-1.5 flex shrink-0 items-center">
                            <span
                              className={`h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full border transition ${
                                diff === d.id
                                  ? "bg-soul-gold border-soul-gold shadow-[0_0_8px_#ffd23f]"
                                  : "border-white/30"
                              }`}
                            />
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Botão de Iniciar Jogo (SEMPRE VISÍVEL no rodapé) */}
              <button
                type="submit"
                disabled={!valid}
                className="shrink-0 font-display group relative mt-1 w-full overflow-hidden rounded-xl bg-gradient-to-r from-soul-orange via-soul-pink to-soul-violet py-2 text-xl sm:py-2.5 sm:text-2xl tracking-widest text-white shadow-lg transition enabled:hover:scale-[1.01] enabled:active:scale-95 disabled:cursor-not-allowed disabled:from-zinc-600 disabled:via-zinc-600 disabled:to-zinc-700 disabled:text-white/40"
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
            <ul className="h-full space-y-2 text-xs text-white/80 overflow-y-auto no-scrollbar pr-1 sm:space-y-2.5 sm:text-sm">
              {[
                ["🃏", "Vire duas cartas por vez. Se forem o mesmo lutador, o par é seu."],
                ["🔥", "Acertos seguidos geram COMBO e multiplicam seus pontos."],
                ["💥", "Cada par encontrado tira vida do Shaco, o chefão da arena."],
                ["❤️", "No modo Lenda você tem 10 vidas — cada erro custa uma."],
                ["🏆", "Termine rápido e com poucos erros pra tirar rank S."],
                ["✨", "Conecte sua Aster Account para garantir o selo de Verificado e foto no ranking."],
                ["⌨️", "Atalhos: P pausa, M silencia, R reinicia."],
              ].map(([icon, text]) => (
                <li key={text} className="flex gap-2 rounded-lg bg-white/5 p-2 sm:gap-3 sm:rounded-xl sm:p-2.5">
                  <span className="text-base sm:text-lg">{icon}</span>
                  <span>{text}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="shrink-0 pt-1 text-center text-[10px] text-white/40 sm:pt-2 sm:text-xs">
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
      </footer>
    </div>
  );
}
