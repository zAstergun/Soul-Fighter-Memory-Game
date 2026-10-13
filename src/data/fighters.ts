export type Fighter = {
  id: string;
  name: string;
  champion: string;
  skin: number;
  tier: "Épica" | "Lendária" | "Suprema" | "Prestígio";
  color: string;
  quote: string;
  prestige?: boolean;
};

const DD = "https://ddragon.leagueoflegends.com/cdn/img/champion";

export const loadingArt = (f: Fighter) => `${DD}/loading/${f.champion}_${f.skin}.jpg`;
export const splashArt = (f: Fighter) => `${DD}/splash/${f.champion}_${f.skin}.jpg`;

export const FIGHTERS: Fighter[] = [
  { id: "gwen", name: "Gwen", champion: "Gwen", skin: 20, tier: "Épica", color: "#ff6fb5", quote: "Snip snip!" },
  { id: "samira", name: "Samira", champion: "Samira", skin: 30, tier: "Suprema", color: "#ff3b3b", quote: "Estilo é tudo." },
  { id: "viego", name: "Viego", champion: "Viego", skin: 30, tier: "Lendária", color: "#3ee0ff", quote: "Por ela, eu luto." },
  { id: "sett", name: "Sett", champion: "Sett", skin: 45, tier: "Épica", color: "#ffb11a", quote: "Pro orgulho da mamãe!" },
  { id: "lux", name: "Lux", champion: "Lux", skin: 38, tier: "Épica", color: "#ffe14d", quote: "Brilha, brilha!" },
  { id: "jhin", name: "Jhin", champion: "Jhin", skin: 36, tier: "Épica", color: "#d6a1ff", quote: "Quatro golpes. Perfeição." },
  { id: "evelynn", name: "Evelynn", champion: "Evelynn", skin: 42, tier: "Épica", color: "#c04dff", quote: "Vem brincar." },
  { id: "pyke", name: "Pyke", champion: "Pyke", skin: 53, tier: "Épica", color: "#2fe0b0", quote: "Seu nome tá na lista." },
  { id: "shaco", name: "Shaco", champion: "Shaco", skin: 43, tier: "Épica", color: "#ff4d4d", quote: "Quer ver uma mágica?" },
  { id: "naafiri", name: "Naafiri", champion: "Naafiri", skin: 1, tier: "Épica", color: "#ff8a3d", quote: "Somos mais!" },
  {
    id: "shaco-p",
    name: "Shaco Prestígio",
    champion: "Shaco",
    skin: 44,
    tier: "Prestígio",
    color: "#ffd23f",
    quote: "Agora você vê...",
    prestige: true,
  },
  {
    id: "pyke-p",
    name: "Pyke Prestígio",
    champion: "Pyke",
    skin: 54,
    tier: "Prestígio",
    color: "#ffd23f",
    quote: "Afogado em glória.",
    prestige: true,
  },
];

export const BASE_FIGHTERS = FIGHTERS.filter((f) => !f.prestige);

export type DifficultyId = "novato" | "lutador" | "lenda" | "classico";

export type Difficulty = {
  id: DifficultyId;
  label: string;
  tag: string;
  description: string;
  pairs: number; // número de lutadores distintos
  copies: number; // cópias de cada lutador no tabuleiro
  cols: { base: number; sm: number };
  previewMs: number;
  lives: number | null;
  accent: string;
};

export const DIFFICULTIES: Difficulty[] = [
  {
    id: "novato",
    label: "Novato",
    tag: "6 pares",
    description: "Espiadinha de 2s no começo. Ideal pra aquecer.",
    pairs: 6,
    copies: 2,
    cols: { base: 3, sm: 4 },
    previewMs: 2000,
    lives: null,
    accent: "from-emerald-400 to-cyan-400",
  },
  {
    id: "lutador",
    label: "Lutador",
    tag: "10 pares",
    description: "Todos os 10 campeões Soul Fighter. Espiadinha de 1s.",
    pairs: 10,
    copies: 2,
    cols: { base: 4, sm: 5 },
    previewMs: 1000,
    lives: null,
    accent: "from-soul-gold to-soul-orange",
  },
  {
    id: "lenda",
    label: "Lenda",
    tag: "12 pares · 10 vidas",
    description: "Inclui as skins Prestígio. Errou demais? K.O.",
    pairs: 12,
    copies: 2,
    cols: { base: 4, sm: 6 },
    previewMs: 0,
    lives: 10,
    accent: "from-soul-pink to-soul-violet",
  },
  {
    id: "classico",
    label: "Clássico",
    tag: "Modo original",
    description: "Como na versão antiga: 5 lutadores, 4 cartas de cada.",
    pairs: 5,
    copies: 4,
    cols: { base: 4, sm: 5 },
    previewMs: 0,
    lives: null,
    accent: "from-violet-400 to-fuchsia-500",
  },
];

export const getDifficulty = (id: DifficultyId) => DIFFICULTIES.find((d) => d.id === id)!;
