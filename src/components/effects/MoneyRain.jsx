import { useMemo } from "react";

const PARTICLE_COUNT = 25;

export function MoneyRain({ triggerId }) {
  const particles = useMemo(() => {
    if (!triggerId) return [];
    return Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      size: 18 + Math.random() * 16,
      duration: 1.8 + Math.random() * 1.0,
      delay: Math.random() * 0.6,
      rotation: Math.random() * 360,
    }));
  }, [triggerId]);

  if (!triggerId || particles.length === 0) return null;

  return (
    <div style={{
      position: "fixed", inset: 0, pointerEvents: "none",
      overflow: "hidden", zIndex: 999
    }} aria-hidden="true">
      {particles.map(p => (
        <span key={`${triggerId}-${p.id}`} style={{
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
