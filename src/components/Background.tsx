import { useEffect, useMemo, useState } from "react";
import { BASE_FIGHTERS, splashArt } from "../data/fighters";

export default function Background({ dim = false }: { dim?: boolean }) {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setIdx((i) => (i + 1) % BASE_FIGHTERS.length), 7000);
    return () => clearInterval(id);
  }, []);

  const particles = useMemo(
    () =>
      Array.from({ length: 22 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        size: 4 + Math.random() * 10,
        dur: 8 + Math.random() * 10,
        delay: -Math.random() * 18,
        hue: ["#ff3d9a", "#ffd23f", "#3ee0ff", "#7b2cff"][i % 4],
      })),
    []
  );

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {BASE_FIGHTERS.map((f, i) => (
        <img
          key={f.id}
          src={splashArt(f)}
          alt=""
          loading={i === 0 ? "eager" : "lazy"}
          className="absolute inset-0 h-full w-full scale-110 object-cover transition-opacity duration-[2000ms]"
          style={{ opacity: i === idx ? (dim ? 0.18 : 0.38) : 0, filter: "blur(3px) saturate(1.2)" }}
        />
      ))}
      <div className="absolute inset-0 bg-gradient-to-b from-[#1a0638]/80 via-[#0b0418]/70 to-[#0b0418]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,61,154,0.35),transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(62,224,255,0.18),transparent_55%)]" />
      <div className="halftone absolute inset-0 opacity-30" />
      {particles.map((p) => (
        <span
          key={p.id}
          className="animate-drift absolute bottom-[-20px] rounded-full"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size,
            background: p.hue,
            boxShadow: `0 0 ${p.size * 2}px ${p.hue}`,
            animationDuration: `${p.dur}s`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </div>
  );
}
