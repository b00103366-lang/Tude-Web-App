import { useEffect, useRef } from "react";

// ── Symbol configuration ──────────────────────────────────────────────────────

const CHARS = ["Σ", "π", "∫", "∂", "√", "α", "β", "θ", "∞", "Δ", "λ", "φ", "ω", "μ", "ε", "≈", "≠", "∈", "∇", "²", "³"];

// Amber/orange palette — same theme as the rest of the landing page
const COLORS = ["#f59e0b", "#fb923c", "#f97316", "#fbbf24", "#fde68a"];

/** Deterministic pseudo-random from a seed so positions are stable across renders. */
function sr(seed: number): number {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

interface SymbolDef {
  char: string;
  color: string;
  homeX: number;   // % of container width
  homeY: number;   // % of container height
  size: number;    // px
  opacity: number;
  rotation: number; // deg
  floatDur: number; // seconds per float cycle
  floatDelay: number; // phase offset in seconds
  floatAmp: number;  // float amplitude in px
}

function buildSymbols(): SymbolDef[] {
  const defs: SymbolDef[] = [];

  for (let i = 0; i < 23; i++) {
    const r = (n: number) => sr(i * 31 + n);

    // Right-heavy distribution: ~60% on right half, rest scattered left
    const homeX =
      i < 9  ? 3  + r(1) * 48   // left side:  3 – 51%
      : i < 14 ? 58 + r(1) * 38  // right side: 58 – 96%
      :          8  + r(1) * 84;  // anywhere:   8 – 92%

    const homeY = 4 + r(2) * 88;

    // Three size tiers
    const tier = r(3);
    const size =
      tier < 0.20 ? 80  + r(4) * 40  // large  80-120 px
      : tier < 0.55 ? 40 + r(4) * 20 // medium 40-60 px
      :               20 + r(4) * 10; // small  20-30 px

    // Larger symbols are (slightly) more opaque — depth illusion
    const opacity =
      size > 70 ? 0.18 + r(5) * 0.07
      : size > 40 ? 0.13 + r(5) * 0.06
      :             0.09 + r(5) * 0.05;

    defs.push({
      char:       CHARS[i % CHARS.length],
      color:      COLORS[Math.floor(r(10) * COLORS.length)],
      homeX,
      homeY,
      size,
      opacity,
      rotation:   -30 + r(6) * 60,
      floatDur:   8   + r(7) * 12,
      floatDelay: r(8) * 8,
      floatAmp:   6   + r(9) * 10,
    });
  }

  return defs;
}

// Built once at module load — stable positions, no hydration mismatch
const SYMBOL_DEFS = buildSymbols();

// ── Physics constants ─────────────────────────────────────────────────────────

const REPEL_RADIUS = 150; // px — cursor influence radius
const MAX_PUSH     = 40;  // px — max displacement
const SPRING       = 0.05;
const DAMPING      = 0.85;

// ── Component ─────────────────────────────────────────────────────────────────

export function FloatingSymbols() {
  const containerRef = useRef<HTMLDivElement>(null);
  const spansRef     = useRef<(HTMLSpanElement | null)[]>([]);

  // Mutable physics state — never stored in React state to avoid re-renders
  const physRef = useRef(
    SYMBOL_DEFS.map(() => ({ x: 0, y: 0, vx: 0, vy: 0 }))
  );
  const mouseRef  = useRef({ x: -9999, y: -9999 });
  const rafRef    = useRef<number>(0);
  const activeRef = useRef(false);
  const lastThrottle = useRef(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Disable mouse tracking on touch-only devices
    const isTouchOnly = window.matchMedia("(hover: none)").matches;

    // ── Mouse tracking ──────────────────────────────────────────────────────
    function onMouseMove(e: MouseEvent) {
      if (isTouchOnly) return;
      const now = performance.now();
      if (now - lastThrottle.current < 16) return; // ~60 fps cap
      lastThrottle.current = now;
      const rect = container!.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }

    function onMouseLeave() {
      mouseRef.current = { x: -9999, y: -9999 };
    }

    container.addEventListener("mousemove", onMouseMove);
    container.addEventListener("mouseleave", onMouseLeave);

    // ── Animation loop ──────────────────────────────────────────────────────
    function tick(ts: number) {
      if (!activeRef.current) return;

      const W  = container!.offsetWidth;
      const H  = container!.offsetHeight;
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      for (let i = 0; i < SYMBOL_DEFS.length; i++) {
        const def  = SYMBOL_DEFS[i];
        const phys = physRef.current[i];
        const span = spansRef.current[i];
        if (!span) continue;

        // Home position in pixels
        const homeX = (def.homeX / 100) * W;
        const homeY = (def.homeY / 100) * H;

        // Idle float (sin wave, all done in rAF — no CSS animation conflict)
        const phase  = (ts / 1000 + def.floatDelay) * ((2 * Math.PI) / def.floatDur);
        const floatY = Math.sin(phase) * def.floatAmp;

        // Current world position of symbol centre
        const symX = homeX + phys.x;
        const symY = homeY + phys.y + floatY;

        // Repulsion force from cursor
        const dx   = symX - mx;
        const dy   = symY - my;
        const dist = Math.sqrt(dx * dx + dy * dy);

        let targetX = 0;
        let targetY = 0;
        if (dist > 0.1 && dist < REPEL_RADIUS) {
          const strength = ((REPEL_RADIUS - dist) / REPEL_RADIUS) * MAX_PUSH;
          targetX = (dx / dist) * strength;
          targetY = (dy / dist) * strength;
        }

        // Spring toward target offset from home
        phys.vx = phys.vx * DAMPING + (targetX - phys.x) * SPRING;
        phys.vy = phys.vy * DAMPING + (targetY - phys.y) * SPRING;
        phys.x += phys.vx;
        phys.y += phys.vy;

        span.style.transform = `translate(${phys.x.toFixed(2)}px, ${(phys.y + floatY).toFixed(2)}px) rotate(${def.rotation}deg)`;
      }

      rafRef.current = requestAnimationFrame(tick);
    }

    function startLoop() {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(tick);
    }

    // ── IntersectionObserver — pause when hero is off-screen ────────────────
    const observer = new IntersectionObserver(
      ([entry]) => {
        activeRef.current = entry.isIntersecting;
        if (entry.isIntersecting) startLoop();
        else cancelAnimationFrame(rafRef.current);
      },
      { threshold: 0.01 }
    );
    observer.observe(container);

    return () => {
      container.removeEventListener("mousemove", onMouseMove);
      container.removeEventListener("mouseleave", onMouseLeave);
      observer.disconnect();
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="absolute inset-0 pointer-events-none select-none overflow-hidden"
      style={{ zIndex: 0 }}
    >
      {SYMBOL_DEFS.map((def, i) => (
        <span
          key={i}
          ref={(el) => { spansRef.current[i] = el; }}
          style={{
            position:   "absolute",
            left:       `${def.homeX}%`,
            top:        `${def.homeY}%`,
            fontSize:   def.size,
            color:      def.color,
            opacity:    def.opacity,
            fontFamily: "Georgia, 'Times New Roman', serif",
            fontWeight: 700,
            lineHeight: 1,
            // Initial transform before rAF kicks in
            transform:  `translate(0, 0) rotate(${def.rotation}deg)`,
            willChange: "transform",
          }}
        >
          {def.char}
        </span>
      ))}
    </div>
  );
}
