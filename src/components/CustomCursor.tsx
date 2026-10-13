import { useEffect, useRef, useState } from "react";

interface Spark {
  id: number;
  x: number;
  y: number;
  color: string;
}

export default function CustomCursor() {
  const [enabled, setEnabled] = useState(false);
  const [pos, setPos] = useState({ x: -100, y: -100 });
  const [trailPos, setTrailPos] = useState({ x: -100, y: -100 });
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [sparks, setSparks] = useState<Spark[]>([]);

  const trailRef = useRef({ x: -100, y: -100 });
  const mouseRef = useRef({ x: -100, y: -100 });
  const requestRef = useRef<number | null>(null);

  useEffect(() => {
    // Apenas ativa o cursor customizado em dispositivos com mouse real (ponteiro fino)
    const isFinePointer = window.matchMedia("(pointer: fine)").matches;
    if (!isFinePointer) return;

    setEnabled(true);
    document.body.classList.add("custom-cursor-active");

    const onMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
      setPos({ x: e.clientX, y: e.clientY });
      setIsVisible(true);

      // Detecta elementos interativos
      const target = e.target as HTMLElement | null;
      if (target) {
        const interactive = Boolean(
          target.closest("button") ||
          target.closest("a") ||
          target.closest("input") ||
          target.closest("[role='button']") ||
          target.closest(".cursor-pointer") ||
          target.tagName === "BUTTON" ||
          target.tagName === "A" ||
          target.tagName === "INPUT"
        );
        setIsHovered(interactive);
      }
    };

    const onMouseDown = (e: MouseEvent) => {
      setIsPressed(true);

      // Cria um efeito de centelha/impacto ao clicar
      const sparkColors = ["#ffd23f", "#ff3d9a", "#3ee0ff", "#ff7a1a"];
      const randomColor = sparkColors[Math.floor(Math.random() * sparkColors.length)];
      const newSpark: Spark = {
        id: Date.now() + Math.random(),
        x: e.clientX,
        y: e.clientY,
        color: randomColor,
      };

      setSparks((prev) => [...prev.slice(-4), newSpark]);
      setTimeout(() => {
        setSparks((prev) => prev.filter((s) => s.id !== newSpark.id));
      }, 400);
    };

    const onMouseUp = () => {
      setIsPressed(false);
    };

    const onMouseLeave = () => {
      setIsVisible(false);
    };

    const onMouseEnter = () => {
      setIsVisible(true);
    };

    window.addEventListener("mousemove", onMouseMove, { passive: true });
    window.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mouseup", onMouseUp);
    document.addEventListener("mouseleave", onMouseLeave);
    document.addEventListener("mouseenter", onMouseEnter);

    // Loop suave de física (lerp) para o retículo/aura do cursor
    const animateTrail = () => {
      const dx = mouseRef.current.x - trailRef.current.x;
      const dy = mouseRef.current.y - trailRef.current.y;

      // Velocidade de perseguição da aura
      trailRef.current.x += dx * 0.22;
      trailRef.current.y += dy * 0.22;

      setTrailPos({ x: trailRef.current.x, y: trailRef.current.y });
      requestRef.current = requestAnimationFrame(animateTrail);
    };

    requestRef.current = requestAnimationFrame(animateTrail);

    return () => {
      document.body.classList.remove("custom-cursor-active");
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mouseup", onMouseUp);
      document.removeEventListener("mouseleave", onMouseLeave);
      document.removeEventListener("mouseenter", onMouseEnter);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  if (!enabled || !isVisible) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[9999] overflow-hidden select-none">
      {/* 1. Impact Sparks ao Clicar */}
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
            borderWidth: "3px",
            boxShadow: `0 0 16px ${s.color}`,
          }}
        />
      ))}

      {/* 2. Retículo / Aura Espiritual Perseguição (Smooth Trail) */}
      <div
        className="absolute -translate-x-1/2 -translate-y-1/2 transition-[width,height,opacity,border-color,background-color] duration-200 ease-out will-change-transform"
        style={{
          transform: `translate3d(${trailPos.x}px, ${trailPos.y}px, 0)`,
          width: isPressed ? "20px" : isHovered ? "46px" : "28px",
          height: isPressed ? "20px" : isHovered ? "46px" : "28px",
        }}
      >
        <div
          className={`h-full w-full rounded-full border-2 transition-all duration-300 ${
            isHovered
              ? "border-soul-pink bg-soul-pink/15 shadow-[0_0_18px_rgba(255,61,154,0.6)] animate-spin [animation-duration:6s]"
              : "border-soul-gold/60 bg-transparent shadow-[0_0_10px_rgba(255,210,63,0.3)]"
          }`}
          style={{
            borderStyle: isHovered ? "dashed" : "solid",
          }}
        />

        {/* Miras diagonais de estilo luta quando em hover */}
        {isHovered && (
          <>
            <span className="absolute -top-1 left-1/2 h-1.5 w-0.5 -translate-x-1/2 bg-soul-gold" />
            <span className="absolute -bottom-1 left-1/2 h-1.5 w-0.5 -translate-x-1/2 bg-soul-gold" />
            <span className="absolute top-1/2 -left-1 h-0.5 w-1.5 -translate-y-1/2 bg-soul-gold" />
            <span className="absolute top-1/2 -right-1 h-0.5 w-1.5 -translate-y-1/2 bg-soul-gold" />
          </>
        )}
      </div>

      {/* 3. Ponta da Lâmina / Cursor Principal (Sem lag, 1:1 com mouse) */}
      <div
        className="absolute top-0 left-0 will-change-transform transition-transform duration-75"
        style={{
          transform: `translate3d(${pos.x}px, ${pos.y}px, 0) scale(${isPressed ? 0.85 : isHovered ? 1.2 : 1})`,
        }}
      >
        <svg
          width="30"
          height="30"
          viewBox="0 0 30 30"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="drop-shadow-[0_2px_10px_rgba(255,61,154,0.7)]"
        >
          <defs>
            <linearGradient id="sfBladeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffd23f" />
              <stop offset="55%" stopColor="#ff3d9a" />
              <stop offset="100%" stopColor="#7b2cff" />
            </linearGradient>
            <filter id="sfGlowFilter" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="0" stdDeviation="2.5" floodColor="#ffd23f" floodOpacity="0.8" />
            </filter>
          </defs>

          {/* Sombra de quadrinho manga */}
          <path
            d="M3 3 L11 26 L15.5 16.5 L25 12 Z"
            fill="#120725"
            transform="translate(1.5, 1.5)"
          />

          {/* Lâmina estilizada de Soul Fighter com contorno preto grosso */}
          <path
            d="M2 2 L10 25 L14.5 15.5 L24 11 Z"
            fill="url(#sfBladeGrad)"
            stroke="#120725"
            strokeWidth="2.4"
            strokeLinejoin="round"
          />

          {/* Fio de Energia Cyan / Luz Espiritual */}
          <path
            d="M4.5 5 L13.5 14.5"
            stroke="#3ee0ff"
            strokeWidth="2"
            strokeLinecap="round"
          />

          {/* Núcleo de Energia (Spark Center) */}
          <circle
            cx="14"
            cy="15"
            r="1.8"
            fill="#ffffff"
            className={isHovered ? "animate-pulse" : ""}
          />
        </svg>
      </div>
    </div>
  );
}
