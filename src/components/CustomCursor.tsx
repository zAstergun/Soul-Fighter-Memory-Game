import { useEffect, useState } from "react";

interface Spark {
  id: number;
  x: number;
  y: number;
  color: string;
}

export default function CustomCursor() {
  const [sparks, setSparks] = useState<Spark[]>([]);

  useEffect(() => {
    // Apenas em dispositivos com ponteiro fino (Desktop)
    const isFinePointer = window.matchMedia("(pointer: fine)").matches;
    if (!isFinePointer) return;

    const onMouseDown = (e: MouseEvent) => {
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

    window.addEventListener("mousedown", onMouseDown, { passive: true });

    return () => {
      window.removeEventListener("mousedown", onMouseDown);
    };
  }, []);

  if (sparks.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[9999] overflow-hidden select-none">
      {sparks.map((s) => (
        <div
          key={s.id}
          className="absolute -translate-x-1/2 -translate-y-1/2 animate-ping rounded-full pointer-events-none"
          style={{
            left: `${s.x}px`,
            top: `${s.y}px`,
            width: "32px",
            height: "32px",
            borderColor: s.color,
            borderWidth: "2.5px",
            boxShadow: `0 0 14px ${s.color}`,
          }}
        />
      ))}
    </div>
  );
}
