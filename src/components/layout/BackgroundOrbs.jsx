// Animated decorative orbs that sit behind the app shell.
export function BackgroundOrbs({ isDark }) {
  if (isDark) {
    return (
      <>
        <div style={{ position: "fixed", top: -100, right: -100, width: 300, height: 300, background: "radial-gradient(circle, rgba(123,97,255,0.08) 0%, transparent 70%)", pointerEvents: "none", animation: "floatOrb1 20s ease-in-out infinite" }}/>
        <div style={{ position: "fixed", bottom: -100, left: -100, width: 300, height: 300, background: "radial-gradient(circle, rgba(0,232,123,0.05) 0%, transparent 70%)", pointerEvents: "none", animation: "floatOrb2 25s ease-in-out infinite" }}/>
      </>
    );
  }
  return (
    <>
      <div style={{ position: "fixed", top: -100, left: -80, width: 450, height: 450, background: "radial-gradient(circle, rgba(124,58,237,0.18) 0%, rgba(124,58,237,0.06) 45%, transparent 70%)", pointerEvents: "none", borderRadius: "50%", filter: "blur(40px)", animation: "floatOrb1 20s ease-in-out infinite" }}/>
      <div style={{ position: "fixed", top: -40, right: -60, width: 380, height: 380, background: "radial-gradient(circle, rgba(236,72,153,0.16) 0%, rgba(236,72,153,0.05) 45%, transparent 70%)", pointerEvents: "none", borderRadius: "50%", filter: "blur(45px)", animation: "floatOrb2 24s ease-in-out infinite" }}/>
      <div style={{ position: "fixed", top: "35%", right: -30, width: 350, height: 350, background: "radial-gradient(circle, rgba(251,146,60,0.14) 0%, rgba(251,146,60,0.04) 45%, transparent 70%)", pointerEvents: "none", borderRadius: "50%", filter: "blur(50px)", animation: "floatOrb3 18s ease-in-out infinite" }}/>
      <div style={{ position: "fixed", bottom: -80, left: -40, width: 420, height: 420, background: "radial-gradient(circle, rgba(6,182,212,0.15) 0%, rgba(6,182,212,0.05) 45%, transparent 70%)", pointerEvents: "none", borderRadius: "50%", filter: "blur(45px)", animation: "floatOrb2 22s ease-in-out infinite reverse" }}/>
      <div style={{ position: "fixed", bottom: -60, left: "40%", width: 360, height: 360, background: "radial-gradient(circle, rgba(139,92,246,0.12) 0%, rgba(139,92,246,0.04) 45%, transparent 70%)", pointerEvents: "none", borderRadius: "50%", filter: "blur(50px)", animation: "floatOrb1 26s ease-in-out infinite reverse" }}/>
      <div style={{ position: "fixed", top: "50%", left: -60, width: 300, height: 300, background: "radial-gradient(circle, rgba(52,211,153,0.1) 0%, transparent 60%)", pointerEvents: "none", borderRadius: "50%", filter: "blur(40px)", animation: "floatOrb3 16s ease-in-out infinite reverse" }}/>
    </>
  );
}
