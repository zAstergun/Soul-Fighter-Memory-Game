let ctx: AudioContext | null = null;
let muted = typeof localStorage !== "undefined" && localStorage.getItem("sf-muted") === "1";

const getCtx = () => {
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
};

export const isMuted = () => muted;
export const setMuted = (m: boolean) => {
  muted = m;
  localStorage.setItem("sf-muted", m ? "1" : "0");
};

type ToneOpts = {
  freq: number;
  to?: number;
  dur?: number;
  type?: OscillatorType;
  vol?: number;
  delay?: number;
};

const tone = ({ freq, to, dur = 0.12, type = "square", vol = 0.08, delay = 0 }: ToneOpts) => {
  if (muted) return;
  const c = getCtx();
  if (!c) return;
  const t = c.currentTime + delay;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (to) osc.frequency.exponentialRampToValueAtTime(to, t + dur);
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(vol, t + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(gain).connect(c.destination);
  osc.start(t);
  osc.stop(t + dur + 0.02);
};

const noise = (dur = 0.15, vol = 0.12, delay = 0) => {
  if (muted) return;
  const c = getCtx();
  if (!c) return;
  const t = c.currentTime + delay;
  const buffer = c.createBuffer(1, Math.floor(c.sampleRate * dur), c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  const src = c.createBufferSource();
  src.buffer = buffer;
  const filter = c.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 1200;
  const gain = c.createGain();
  gain.gain.value = vol;
  src.connect(filter).connect(gain).connect(c.destination);
  src.start(t);
};

export const sfx = {
  click: () => tone({ freq: 660, dur: 0.05, type: "triangle", vol: 0.06 }),
  flip: () => tone({ freq: 420, to: 820, dur: 0.07, type: "triangle", vol: 0.07 }),
  match: (combo = 1) => {
    const base = 520 + Math.min(combo, 8) * 40;
    tone({ freq: base, dur: 0.1, vol: 0.07 });
    tone({ freq: base * 1.5, dur: 0.16, vol: 0.07, delay: 0.08 });
    noise(0.12, 0.08);
  },
  combo: () => {
    [0, 0.06, 0.12, 0.18].forEach((d, i) => tone({ freq: 700 + i * 180, dur: 0.08, vol: 0.05, delay: d }));
  },
  hint: () => {
    [0, 0.07, 0.14].forEach((d, i) =>
      tone({ freq: 784 + i * 261, to: 1046 + i * 200, dur: 0.14, type: "sine", vol: 0.08, delay: d })
    );
  },
  miss: () => {
    tone({ freq: 220, to: 110, dur: 0.22, type: "sawtooth", vol: 0.05 });
  },
  hit: () => {
    noise(0.2, 0.18);
    tone({ freq: 140, to: 60, dur: 0.2, type: "sine", vol: 0.15 });
  },
  count: () => tone({ freq: 440, dur: 0.12, type: "square", vol: 0.06 }),
  fight: () => {
    tone({ freq: 523, dur: 0.12, vol: 0.07 });
    tone({ freq: 784, dur: 0.25, vol: 0.07, delay: 0.1 });
    noise(0.25, 0.1, 0.05);
  },
  win: () => {
    const notes = [523, 659, 784, 1046, 784, 1046];
    notes.forEach((n, i) => tone({ freq: n, dur: 0.16, vol: 0.07, delay: i * 0.11 }));
  },
  lose: () => {
    const notes = [392, 330, 262, 196];
    notes.forEach((n, i) => tone({ freq: n, dur: 0.25, type: "sawtooth", vol: 0.05, delay: i * 0.18 }));
  },
};
