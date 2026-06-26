// Archivo: constants — app/src/lib/constants.js
// Razón: agregar goldBright a BRAND para sparkles del Login
// 2026-06-25 20:10

// ─── Base path ────────────────────────────────────────────────────────────
export const APP_BASE = '/ivent/app'

export const appEventUrl = (eventId) =>
  `${window.location.origin}${APP_BASE}/e/${eventId}`

export const appEventPath = (eventId) =>
  `${APP_BASE}/e/${eventId}`

// ─── Colores de marca iVent ───────────────────────────────────────────────
// Fuente única de verdad para Login, Events y cualquier página del organizador.
export const BRAND = {
  navy:        '#0F1E35',
  navyMid:     '#1E3352',
  navyDeep:    '#06111D',
  gold:        '#C9A84C',
  goldDark:    '#A8832A',
  goldLight:   'rgba(201,168,76,0.12)',
  goldBright:  '#F4E2A6',   // variante clara — sparkles del Login
  ink:         '#1A1714',
  inkMid:      '#4A4540',
  inkMute:     '#8A837A',
  border:      'rgba(15,30,53,0.10)',
  borderLight: 'rgba(15,30,53,0.12)',
  surface:     '#ffffff',
  bg:          '#F4F5F7',
  surfaceInput:'#F7F8FA',
  green:       '#2D7A4F',
  greenBg:     '#EEF7F2',
  red:         '#C0392B',
  redLight:    '#FDF0EF',
}

// ─── Canvas oscuro — LiveBoard y PhotoUpload ──────────────────────────────
// Tokens del "mundo en vivo" del evento: experiencia oscura, cinematográfica.
//
// Usado en:
//   - src/pages/LiveBoard.jsx      — collage en tiempo real
//   - src/pages/PhotoUpload.jsx    — subida de fotos del invitado
//
// Si se cambia la identidad visual del canvas oscuro (ej. negro → navy),
// este es el único lugar que hay que editar.
export const DARK_CANVAS = {
  bg:           'linear-gradient(160deg,#0a0a0f 0%,#0f0d14 50%,#0a0c10 100%)',
  overlay:      'rgba(26,17,13,0.75)',
  overlayDeep:  'rgba(26,17,13,0.92)',
  surface:      'rgba(255,255,255,0.08)',
  surfaceHover: 'rgba(255,255,255,0.14)',
  border:       '0.5px solid rgba(237,224,203,0.20)',
  text:         '#EDE0CB',
  textMute:     'rgba(237,224,203,0.55)',
  accent:       '#C9A84C',
}

// ─── Escala tipográfica de referencia ────────────────────────────────────
// xs:10 sm:12 md:14 base:16 lg:18 xl:24 2xl:32 3xl:48
