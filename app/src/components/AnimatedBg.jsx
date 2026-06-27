// Página: AnimatedBg — app/src/components/AnimatedBg.jsx
// Razón: fondos animados con sparks tipo Login, colores de paleta del evento
// 2026-06-26 12:00

import { useRef, useEffect } from 'react'
import { hexToRgb, darken } from '../lib/eventHelpers'

// ─── Configuración por patrón ─────────────────────────────────────────────
// n        → número de sparks
// maxExtra → tamaño extra máximo sobre la base de 1.5px
// drift    → rango de segundos del drift (flotación)
// blur     → multiplicador del glow (box-shadow)
const PATTERN_CFG = {
  aurora:    { n: 18, maxExtra: 4,  drift: [8,  14], blur: 2.0 },
  destellos: { n: 48, maxExtra: 5,  drift: [6,  10], blur: 2.8 },
  ondas:     { n: 28, maxExtra: 3,  drift: [10, 18], blur: 1.8 },
  bruma:     { n: 10, maxExtra: 10, drift: [6,  10], blur: 3.5 },
}

// ─── Helper: hex → rgba string ────────────────────────────────────────────
function toRgba(hex, alpha) {
  try {
    const [r, g, b] = hexToRgb(hex)
    return `rgba(${r},${g},${b},${alpha})`
  } catch {
    return `rgba(201,168,76,${alpha})`
  }
}

// ─── Componente ──────────────────────────────────────────────────────────
export default function AnimatedBg({ pattern = 'destellos', primaryColor, accentColor }) {
  const dotsRef = useRef(null)

  useEffect(() => {
    const el = dotsRef.current
    if (!el || !accentColor) return
    el.innerHTML = ''

    const cfg = PATTERN_CFG[pattern] || PATTERN_CFG.destellos
    const rnd = s => { const x = Math.sin(s) * 10000; return x - Math.floor(x) }

    for (let i = 0; i < cfg.n; i++) {
      const size    = 1.5 + rnd(i * 3.1 + 1) * cfg.maxExtra
      const bright  = rnd(i * 5.5 + 4) > 0.62
      const tw      = 2.4 + rnd(i * 1.3 + 5) * 3.6
      const dr      = cfg.drift[0] + rnd(i * 0.9 + 2) * (cfg.drift[1] - cfg.drift[0])
      const delay   = -rnd(i * 4.2 + 6) * 6
      const top     = rnd(i * 1.7 + 3) * 100
      const left    = rnd(i * 2.3 + 7) * 100
      const color   = bright ? accentColor : toRgba(accentColor, 0.45)
      const glow    = size * cfg.blur
      const glowClr = toRgba(accentColor, bright ? 0.6 : 0.25)

      const outer = document.createElement('div')
      outer.style.cssText = `
        position:absolute;
        top:${top}%; left:${left}%;
        animation:spDrift ${dr}s ease-in-out ${delay}s infinite;
      `.replace(/\s+/g, ' ')

      const dot = document.createElement('div')
      dot.style.cssText = `
        width:${size}px; height:${size}px; border-radius:50%;
        background:${color};
        box-shadow:0 0 ${glow}px ${size * 0.8}px ${glowClr};
        animation:spTwinkle ${tw}s ease-in-out ${delay}s infinite;
      `.replace(/\s+/g, ' ')

      outer.appendChild(dot)
      el.appendChild(outer)
    }
  }, [pattern, accentColor, primaryColor])

  // Fondo oscuro derivado de la paleta — versión muy oscura del primary
  const darkA = darken(primaryColor || '#0F1E35', 0.62)
  const darkB = darken(primaryColor || '#0F1E35', 0.78)

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute', inset: 0, zIndex: 0,
        pointerEvents: 'none', overflow: 'hidden',
        background: `radial-gradient(120% 90% at 60% 20%, ${darkA} 0%, ${darkB} 100%)`,
      }}
    >
      <div ref={dotsRef} style={{ position: 'absolute', inset: 0 }} />
    </div>
  )
}
