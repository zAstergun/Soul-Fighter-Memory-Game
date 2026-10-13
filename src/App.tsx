import { useEffect, useState } from "react";
import Background from "./components/Background";
import Game from "./components/Game";
import StartScreen from "./components/StartScreen";
import CustomCursor from "./components/CustomCursor";
import type { DifficultyId } from "./data/fighters";
import { getPlayerName, setPlayerName } from "./lib/storage";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { startPresenceHeartbeat, sendPresencePing } from "./lib/presence";

type Screen = { name: "menu" } | { name: "game"; player: string; diff: DifficultyId; key: number };

function MainContent() {
  const { user, profile } = useAuth();
  const [screen, setScreen] = useState<Screen>({ name: "menu" });
  const [lastDiff, setLastDiff] = useState<DifficultyId>(
    () => (localStorage.getItem("sf-diff") as DifficultyId) || "lutador"
  );

  // Conexão de Presença em Tempo Real com o CRM Aster
  useEffect(() => {
    const cleanup = startPresenceHeartbeat(() => ({
      currentPath: screen.name === "menu" ? "/arena/menu" : `/arena/batalha/${screen.diff}`,
      playerName: screen.name === "game" ? screen.player : getPlayerName() || "Lutador",
      user,
      profile,
    }));

    return cleanup;
  }, [screen, user, profile]);

  const start = (player: string, diff: DifficultyId) => {
    setPlayerName(player);
    localStorage.setItem("sf-diff", diff);
    setLastDiff(diff);
    setScreen({ name: "game", player, diff, key: Date.now() });

    // Notifica o CRM da transição para a batalha imediatamente
    sendPresencePing({
      currentPath: `/arena/batalha/${diff}`,
      playerName: player,
      user,
      profile,
    });
  };

  return (
    <main className="relative h-dvh max-h-dvh w-full overflow-hidden select-none">
      <CustomCursor />
      <Background dim={screen.name === "game"} />
      {screen.name === "menu" ? (
        <StartScreen onStart={start} initialDiff={lastDiff} />
      ) : (
        <Game
          key={screen.key}
          playerName={screen.player}
          difficulty={screen.diff}
          onRestart={() => setScreen({ ...screen, key: Date.now() })}
          onExit={() => setScreen({ name: "menu" })}
        />
      )}
    </main>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainContent />
    </AuthProvider>
  );
}

