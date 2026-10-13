import { useState } from "react";
import Background from "./components/Background";
import Game from "./components/Game";
import StartScreen from "./components/StartScreen";
import type { DifficultyId } from "./data/fighters";
import { setPlayerName } from "./lib/storage";
import { AuthProvider } from "./context/AuthContext";

type Screen = { name: "menu" } | { name: "game"; player: string; diff: DifficultyId; key: number };

function MainContent() {
  const [screen, setScreen] = useState<Screen>({ name: "menu" });
  const [lastDiff, setLastDiff] = useState<DifficultyId>(
    () => (localStorage.getItem("sf-diff") as DifficultyId) || "lutador"
  );

  const start = (player: string, diff: DifficultyId) => {
    setPlayerName(player);
    localStorage.setItem("sf-diff", diff);
    setLastDiff(diff);
    setScreen({ name: "game", player, diff, key: Date.now() });
  };

  return (
    <main className="relative h-dvh max-h-dvh w-full overflow-hidden select-none">
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

