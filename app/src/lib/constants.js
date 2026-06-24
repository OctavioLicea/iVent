// Archivo: constants — app/src/lib/constants.js
// Razón: fuente única de verdad para el base path de la app y URLs de eventos
// 2026-06-23 21:00

// Base path donde vive la app React dentro del dominio
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
