// Archivo: constants — app/src/lib/constants.js
// Razón: agregar BRAND — colores de marca iVent como fuente única de verdad
// 2026-06-23 21:05

// ─── Base path ────────────────────────────────────────────────────────────
// Debe coincidir con vite.config.js `base` y BrowserRouter `basename`
export const APP_BASE = '/ivent/app'

// URL completa de la portada de un evento (para QR, links compartidos, etc.)
// Ejemplo: https://www.eventosytech.com/ivent/app/e/abc-123
export const appEventUrl = (eventId) =>
  `${window.location.origin}${APP_BASE}/e/${eventId}`

// Path relativo de la portada de un evento (para window.open, hrefs internos)
// Ejemplo: /ivent/app/e/abc-123
export const appEventPath = (eventId) =>
  `${APP_BASE}/e/${eventId}`

// ─── Colores de marca iVent ───────────────────────────────────────────────
// Fuente única de verdad para Login, Events y cualquier página del organizador.
// Las páginas del invitado usan la paleta del evento (ver eventHelpers.js).
export const BRAND = {
  navy:        '#0F1E35',
  navyMid:     '#1E3352',
  navyDeep:    '#06111D',
  gold:        '#C9A84C',
  goldDark:    '#A8832A',
  goldLight:   'rgba(201,168,76,0.12)',
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

// ─── Escala tipográfica de referencia ────────────────────────────────────
// No enforced en código aún — usar como guía al crear nuevas páginas.
// xs:10 sm:12 md:14 base:16 lg:18 xl:24 2xl:32 3xl:48
