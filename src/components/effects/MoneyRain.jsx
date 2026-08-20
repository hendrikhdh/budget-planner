import { useEffect, useMemo, useState } from "react";

const PARTICLE_COUNT = 25;
// Etwas mehr als die längstmögliche Animation (1,8-2,8s Dauer + bis 0,6s Verzögerung).
const CLEANUP_MS = 3600;

const prefersReducedMotion = () =>
  typeof window !== "undefined" && typeof window.matchMedia === "function"
  && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function MoneyRain({ triggerId }) {
  // `active` ist abgeleitet, nicht per setState im Effekt gesetzt: der Regen
  // blieb sonst für die gesamte Sitzung als 25 fixed-Elemente mit will-change
  // im DOM stehen.
  const [finishedId, setFinishedId] = useState(0);
  const active = !!triggerId && finishedId !== triggerId && !prefersReducedMotion();

  useEffect(() => {
    if (!active) return undefined;
    const timer = setTimeout(() => setFinishedId(triggerId), CLEANUP_MS);
    return () => clearTimeout(timer);
  }, [active, triggerId]);

  const particles = useMemo(() => (
    Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
      key: `${triggerId}-${i}`,
      left: Math.random() * 100,
      size: 18 + Math.random() * 16,
      duration: 1.8 + Math.random() * 1.0,
      delay: Math.random() * 0.6,
      rotation: Math.random() * 360,
    }))
  ), [triggerId]);

  if (!active) return null;

  return (
    <div style={{
      position: "fixed", inset: 0, pointerEvents: "none",
      overflow: "hidden", zIndex: 999
    }} aria-hidden="true">
      {particles.map(p => (
        <span key={p.key} style={{
          position: "absolute",
          top: 0,
          left: `${p.left}%`,
          fontSize: `${p.size}px`,
          transform: `rotate(${p.rotation}deg)`,
          animation: `moneyRain ${p.duration}s linear ${p.delay}s forwards`,
          willChange: "transform, opacity",
        }}>💶</span>
      ))}
    </div>
  );
}
