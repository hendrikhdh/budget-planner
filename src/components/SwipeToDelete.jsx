import { useState, useRef } from "react";
import { Icon } from "./Icon.jsx";

export const SwipeToDelete = ({ onDelete, children, T, disabled, onSwipeActive }) => {
  const ref = useRef(null);
  const containerRef = useRef(null);
  const startX = useRef(0);
  const currentX = useRef(0);
  const isSwiping = useRef(false);
  const containerWidth = useRef(300);
  const [deleteReady, setDeleteReady] = useState(false);
  const DELETE_THRESHOLD = 0.45;

  if (disabled) return <div style={{ marginBottom: 6 }}>{children}</div>;

  const handleTouchStart = (ev) => {
    startX.current = ev.touches[0].clientX;
    currentX.current = 0;
    isSwiping.current = false;
    setDeleteReady(false);
    if (containerRef.current) containerWidth.current = containerRef.current.offsetWidth;
  };
  const handleTouchMove = (ev) => {
    const diff = ev.touches[0].clientX - startX.current;
    if (diff < -8) {
      isSwiping.current = true;
      if (onSwipeActive) onSwipeActive();
      const maxSwipe = containerWidth.current * 0.8;
      currentX.current = Math.max(diff, -maxSwipe);
      if (ref.current) {
        ref.current.style.transition = "none";
        ref.current.style.transform = `translateX(${currentX.current}px)`;
      }
      const swipeRatio = Math.abs(currentX.current) / containerWidth.current;
      setDeleteReady(swipeRatio >= DELETE_THRESHOLD);
    }
  };
  const handleTouchEnd = () => {
    if (!ref.current) return;
    const swipeRatio = Math.abs(currentX.current) / containerWidth.current;
    if (swipeRatio >= DELETE_THRESHOLD) {
      ref.current.style.transition = "transform .3s ease, opacity .3s ease";
      ref.current.style.transform = `translateX(-${containerWidth.current}px)`;
      ref.current.style.opacity = "0";
      const reset = () => {
        if (ref.current) {
          ref.current.style.transition = "transform .3s ease, opacity .3s ease";
          ref.current.style.transform = "translateX(0)";
          ref.current.style.opacity = "1";
        }
      };
      setTimeout(() => onDelete(reset), 300);
    } else {
      ref.current.style.transition = "transform .3s ease";
      ref.current.style.transform = "translateX(0)";
      setTimeout(() => { isSwiping.current = false; }, 50);
    }
    setDeleteReady(false);
  };
  const handleClickCapture = (ev) => {
    if (isSwiping.current) { ev.stopPropagation(); ev.preventDefault(); }
  };

  return (
    <div ref={containerRef} style={{ position: "relative", overflow: "hidden", borderRadius: 14, marginBottom: 6 }}>
      <div style={{
        position: "absolute", right: 0, top: 0, bottom: 0, left: 0,
        background: deleteReady
          ? `linear-gradient(135deg, ${T.expense}, #ff3333)`
          : `linear-gradient(135deg, ${T.expense}90, #ff6b35aa)`,
        display: "flex", alignItems: "center", justifyContent: "flex-end",
        paddingRight: 24, borderRadius: 14,
        transition: "background .2s"
      }}>
        <div style={{
          color: "#fff", fontSize: 12, fontWeight: 700,
          display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
          opacity: isSwiping.current ? 1 : 0.6,
          transition: "opacity .2s, transform .2s",
          transform: deleteReady ? "scale(1.15)" : "scale(1)"
        }}>
          <Icon name="trash" size={22} color="#fff"/>
          {deleteReady ? "Loslassen" : "← Weiter"}
        </div>
      </div>
      <div ref={ref} onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}
        onClickCapture={handleClickCapture}
        style={{ position: "relative", zIndex: 1, transform: "translateX(0)", transition: "transform .3s ease", background: T.glassCardOpaque || T.bg, borderRadius: 14 }}>
        {children}
      </div>
    </div>
  );
};
