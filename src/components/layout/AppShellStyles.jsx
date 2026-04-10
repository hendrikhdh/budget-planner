// Global <style> block for the main authenticated app shell.
export function AppShellStyles({ T }) {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700;800&display=swap');
      * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
      body { margin: 0; background: ${T.bg}; transition: background .4s ease; }
      input:focus, select:focus { border-color: ${T.accent}80 !important; box-shadow: 0 0 0 2px ${T.accent}20; }
      ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: transparent; } ::-webkit-scrollbar-thumb { background: ${T.scrollThumb}; border-radius: 2px; }
      @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
      @keyframes slideIn { from { transform: translateX(-100%); } to { transform: translateX(0); } }
      @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      @keyframes neonPulse { 0%, 100% { filter: brightness(1); } 50% { filter: brightness(1.15); } }
      @keyframes floatOrb1 { 0%, 100% { transform: translate(0, 0) scale(1); } 33% { transform: translate(40px, -30px) scale(1.1); } 66% { transform: translate(-20px, 20px) scale(0.95); } }
      @keyframes floatOrb2 { 0%, 100% { transform: translate(0, 0) scale(1); } 33% { transform: translate(-50px, 20px) scale(0.9); } 66% { transform: translate(30px, -40px) scale(1.08); } }
      @keyframes floatOrb3 { 0%, 100% { transform: translate(0, 0) scale(1); } 50% { transform: translate(25px, 35px) scale(1.05); } }
      @keyframes importCountdown { from { width: 100%; } to { width: 0%; } }
    `}</style>
  );
}
