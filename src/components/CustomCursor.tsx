import { useEffect, useRef, useState } from "react";

interface Spark {
  id: number;
  x: number;
  y: number;
  color: string;
}

export default function CustomCursor() {
  const [enabled, setEnabled] = useState(false);
  const [sparks, setSparks] = useState<Spark[]>([]);

  const auraRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef({ x: -100, y: -100, visible: false, hovered: false, down: false });
  const trailRef = useRef({ x: -100, y: -100 });
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    // Apenas ativa em telas de desktop com mouse de precisão (ponteiro fino)
    const isFinePointer = window.matchMedia("(pointer: fine)").matches;
    if (!isFinePointer) return;

    setEnabled(true);

    const onMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
      mouseRef.current.visible = true;

      const target = e.target as HTMLElement | null;
      if (target) {
        const isInteractive = Boolean(
          target.closest("button") ||
          target.closest("a") ||
          target.closest("input") ||
          target.closest("[role='button']") ||
          target.closest(".cursor-pointer") ||
          target.tagName === "BUTTON" ||
          target.tagName === "A" ||
          target.tagName === "INPUT"
        );
        mouseRef.current.hovered = isInteractive;
      }
    };

    const onMouseDown = (e: MouseEvent) => {
      mouseRef.current.down = true;

      // Centelha de impacto ao clicar na arena
      const sparkColors = ["#ffd23f", "#ff3d9a", "#3ee0ff", "#ff7a1a"];
      const randomColor = sparkColors[Math.floor(Math.random() * sparkColors.length)];
      const newSpark: Spark = {
        id: Date.now() + Math.random(),
        x: e.clientX,
        y: e.clientY,
        color: randomColor,
      };

      setSparks((prev) => [...prev.slice(-3), newSpark]);
      setTimeout(() => {
        setSparks((prev) => prev.filter((s) => s.id !== newSpark.id));
      }, 350);
    };

    const onMouseUp = () => {
      mouseRef.current.down = false;
    };

    const onMouseLeave = () => {
      mouseRef.current.visible = false;
      if (auraRef.current) auraRef.current.style.opacity = "0";
    };

    const onMouseEnter = () => {
      mouseRef.current.visible = true;
      if (auraRef.current) auraRef.current.style.opacity = "1";
    };

    window.addEventListener("mousemove", onMouseMove, { passive: true });
    window.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mouseup", onMouseUp);
    document.addEventListener("mouseleave", onMouseLeave);
    document.addEventListener("mouseenter", onMouseEnter);

    // Loop ultra fluido de alta performance (60-240 FPS via rAF sem re-renders do React)
    const animate = () => {
      const dx = mouseRef.current.x - trailRef.current.x;
      const dy = mouseRef.current.y - trailRef.current.y;

      // Velocidade fluida de amortecimento
      trailRef.current.x += dx * 0.28;
      trailRef.current.y += dy * 0.28;

      if (auraRef.current) {
        if (!mouseRef.current.visible) {
          auraRef.current.style.opacity = "0";
        } else {
          auraRef.current.style.opacity = "1";
          auraRef.current.style.transform = `translate3d(${trailRef.current.x}px, ${trailRef.current.y}px, 0)`;

          if (mouseRef.current.hovered) {
            auraRef.current.setAttribute("data-state", "hover");
          } else if (mouseRef.current.down) {
            auraRef.current.setAttribute("data-state", "down");
          } else {
            auraRef.current.setAttribute("data-state", "default");
          }
        }
      }

      frameRef.current = requestAnimationFrame(animate);
    };

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mouseup", onMouseUp);
      document.removeEventListener("mouseleave", onMouseLeave);
      document.removeEventListener("mouseenter", onMouseEnter);
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, []);

  if (!enabled) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[9999] overflow-hidden select-none">
      {/* 1. Aura Espiritual & Mira de Combate (Persegue o cursor com GPU fluida) */}
      <div
        ref={auraRef}
        className="sf-combat-aura absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 will-change-transform"
        style={{ opacity: 0 }}
      >
        {/* Anel Externo de Energia */}
        <div className="sf-aura-ring rounded-full border transition-all duration-200" />

        {/* Retículo / Miras de Combate */}
        <div className="sf-aura-brackets absolute inset-0 pointer-events-none" />
      </div>

      {/* 2. Centelhas de Impacto ao Clicar */}
      {sparks.map((s) => (
        <div
          key={s.id}
          className="absolute -translate-x-1/2 -translate-y-1/2 animate-ping rounded-full pointer-events-none"
          style={{
            left: `${s.x}px`,
            top: `${s.y}px`,
            width: "36px",
            height: "36px",
            borderColor: s.color,
            borderWidth: "2.5px",
            boxShadow: `0 0 16px ${s.color}`,
          }}
        />
      ))}
    </div>
  );
}
