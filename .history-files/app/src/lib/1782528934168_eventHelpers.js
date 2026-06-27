// Archivo: eventHelpers — app/src/lib/eventHelpers.js
// Razón: fondos animados y acuarela usan color-mix() con CSS variables de paleta (sin hardcode)
// 2026-06-26 20:21
// Razón: fondos animados y acuarela usan color-mix() con CSS variables de paleta (sin hardcode)
// 2026-06-26 20:55

// ─── Paletas predefinidas ──────────────────────────────────────────────────

export const PALETTES = {
  boda:     { label: 'Romance',      primary: '#7D2935', primaryDark: '#561820', primaryMid: '#A34455', primaryLight: '#F3E8EA', accent: '#9C6B2E', accentLight: '#F7F0E3', surface: '#FAF7F2', surface2: '#F2EBE0', kraft: '#EDE0CB', ink: '#2A1F1A', inkMute: '#9C8878', sageLight: '#EBF0E8' },
  quince:   { label: 'Lila & Rosa',  primary: '#7B3FA0', primaryDark: '#5B2D8E', primaryMid: '#9B60C0', primaryLight: '#F5EAF8', accent: '#C97DC0', accentLight: '#FBF0FA', surface: '#FDF8FF', surface2: '#F5ECF8', kraft: '#EFE0F0', ink: '#2A1A2E', inkMute: '#9A7AA0', sageLight: '#F0EAF5' },
  marino:   { label: 'Marino & Oro', primary: '#2A4A7F', primaryDark: '#1B2C4E', primaryMid: '#3D6399', primaryLight: '#EAF0FA', accent: '#C4973A', accentLight: '#FBF5E6', surface: '#F8FAFF', surface2: '#EFF2F8', kraft: '#E8EBF2', ink: '#1A1F2E', inkMute: '#7A8AA0', sageLight: '#E8EFF8' },
  botanico: { label: 'Jardín',       primary: '#3D6B20', primaryDark: '#2D5016', primaryMid: '#5A8A35', primaryLight: '#EDF5E8', accent: '#7A9E52', accentLight: '#F2F8EC', surface: '#F8FCF5', surface2: '#EFF5EA', kraft: '#E4EDD8', ink: '#1A2010', inkMute: '#7A8A6A', sageLight: '#E8F0DE' },
}

// Mapa de color primario → clave de paleta (para detectar paleta desde config guardado)
export const DETECT_PALETTE = {
  '#7D2935': 'boda',    '#561820': 'boda',
  '#7B3FA0': 'quince',  '#5B2D8E': 'quince',
  '#2A4A7F': 'marino',  '#1B2C4E': 'marino',
  '#3D6B20': 'botanico','#2D5016': 'botanico',
}

// ─── Tipografía y frames por defecto ──────────────────────────────────────

export const DEFAULT_TYPOGRAPHY = {
  title:   { font: 'Great Vibes',         size: 52, bold: false, color: '' },
  display: { font: 'Cormorant Garamond',  size: 17, bold: true,  color: '' },
  caption: { font: 'DM Sans',             size: 10, bold: false, color: '' },
  label:   { font: 'Cormorant Garamond',  size: 12, bold: true,  color: '' },
}

export const DEFAULT_FRAMES = {
  inv:     { color: '#EDE0CB', on: true },
  nav:     { color: '#FAF7F2', on: true },
  qr:      { color: '#F2EBE0', on: true },
  maps_a:  { color: '#1B2C4E' },
  maps_b:  { color: '#C4973A' },
  maps_on: true,
}

// ─── Opciones tipográficas ────────────────────────────────────────────────

export const FONT_OPTIONS = [
  // Scripts elegantes
  'Great Vibes', 'Parisienne', 'Alex Brush', 'Sacramento',
  'Dancing Script', 'Pinyon Script', 'Satisfy',
  // Serif clásicas y dramáticas
  'Cormorant Garamond', 'EB Garamond', 'Playfair Display',
  'Bodoni Moda', 'Libre Baskerville', 'Crimson Pro',
  'Lora', 'Spectral', 'Italiana',
  // Serif ornamentales
  'Cinzel', 'Cinzel Decorative', 'Philosopher',
  // Sans elegantes
  'DM Sans', 'Josefin Sans', 'Raleway', 'Montserrat', 'Jost', 'Outfit',
]

export const TYPO_ROLES = [
  { key: 'title',   label: 'Título',   sample: 'Faith & Henry' },
  { key: 'display', label: 'Display',  sample: 'Ceremonia 2026' },
  { key: 'caption', label: 'Caption',  sample: 'Mié 1 · Julio' },
  { key: 'label',   label: 'Label',    sample: 'Sube tus fotos' },
]

// ─── Patrones de fondo ────────────────────────────────────────────────────

export const BG_PATTERNS = [
  { id: 'none',       label: 'Limpio',     style: { background: '#FAF7F2' } },
  { id: 'lino',       label: 'Lino',       style: { backgroundColor: '#EDE8DF', backgroundImage: 'repeating-linear-gradient(0deg,rgba(0,0,0,.03) 0px,rgba(0,0,0,.03) 1px,transparent 1px,transparent 4px),repeating-linear-gradient(90deg,rgba(0,0,0,.02) 0px,rgba(0,0,0,.02) 1px,transparent 1px,transparent 4px)' } },
  { id: 'marmol',     label: 'Mármol',     style: { backgroundColor: '#F4F2F0', backgroundImage: 'repeating-linear-gradient(125deg,rgba(180,170,160,.12) 0px,transparent 2px,transparent 8px,rgba(180,170,160,.08) 10px)' } },
  { id: 'acuarela',   label: 'Acuarela',   style: { background: 'radial-gradient(ellipse at 20% 20%, color-mix(in srgb, var(--color-accent) 8%, transparent) 0%, transparent 60%), radial-gradient(ellipse at 80% 80%, color-mix(in srgb, var(--color-primary) 6%, transparent) 0%, transparent 60%), var(--color-surface)' } },
  { id: 'cuadricula', label: 'Cuadrícula', style: { backgroundColor: '#F8F6F2', backgroundImage: 'linear-gradient(rgba(0,0,0,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(0,0,0,.04) 1px,transparent 1px)', backgroundSize: '24px 24px' } },
  { id: 'puntos',     label: 'Puntos',     style: { backgroundColor: '#FAF7F2', backgroundImage: 'radial-gradient(circle,rgba(0,0,0,.08) 1px,transparent 1px)', backgroundSize: '18px 18px' } },
  { id: 'kraft',      label: 'Kraft',      style: { backgroundColor: '#E8D9BE' } },
  { id: 'noche',      label: 'Noche',      style: { background: 'linear-gradient(160deg,#1a1530 0%,#0e1020 100%)' } },

  // ─── Fondos animados ─────────────────────────────────────────────────
  // El `style` es el fondo oscuro base visible en thumbnails y como fallback.
  // Las sparks/animaciones las genera AnimatedBg.jsx cuando el patrón está activo.
  {
    id: 'aurora', label: '✦ Aurora', animated: true,
    style: {
      background: 'radial-gradient(120% 90% at 60% 20%, color-mix(in srgb, var(--color-primary) 28%, #050505) 0%, color-mix(in srgb, var(--color-primary) 14%, #020202) 100%)',
    },
  },
  {
    id: 'destellos', label: '✦ Destellos', animated: true,
    style: {
      background: 'radial-gradient(120% 90% at 40% 30%, color-mix(in srgb, var(--color-primary) 30%, #050505) 0%, color-mix(in srgb, var(--color-primary) 14%, #020202) 100%)',
    },
  },
  {
    id: 'ondas', label: '✦ Ondas', animated: true,
    style: {
      background: 'radial-gradient(120% 90% at 50% 80%, color-mix(in srgb, var(--color-primary) 28%, #050505) 0%, color-mix(in srgb, var(--color-primary) 14%, #020202) 100%)',
    },
  },
  {
    id: 'bruma', label: '✦ Bruma', animated: true,
    style: {
      background: 'radial-gradient(120% 90% at 30% 60%, color-mix(in srgb, var(--color-primary) 25%, #050505) 0%, color-mix(in srgb, var(--color-primary) 12%, #020202) 100%)',
    },
  },
]

// ─── Módulos del evento ───────────────────────────────────────────────────
// Unificación de MODULE_DEFS (EventDesigner) y MODULE_REGISTRY (EventFrontPage)

export const MODULE_DEFS = [
  { key: 'fotos',   icon: '📷', name: 'Fotos en vivo',   defaultLabel: 'Sube tus fotos',      sub: 'Comparte el momento',     path: 'fotos',     iconBg: p => p.primaryLight },
  { key: 'collage', icon: '🖼', name: 'Collage en vivo', defaultLabel: 'Collage en vivo',      sub: 'Fotos en tiempo real',    path: 'liveboard', iconBg: () => '#2a1f1a'    },
  { key: 'crono',   icon: '🕐', name: 'Cronograma',      defaultLabel: 'Cronograma',           sub: 'Timeline del día',        path: 'crono',     iconBg: p => p.surface2    },
  { key: 'deseos',  icon: '💌', name: 'Mensajes',        defaultLabel: '¡Escríbenos algo!',    sub: 'Tus palabras para ellos', path: 'deseos',    iconBg: () => '#F9EEF3'    },
  { key: 'mesas',   icon: '🪑', name: 'Mesas',           defaultLabel: '¿Cuál es mi mesa?',    sub: 'Encuentra tu lugar',      path: 'mesas',     iconBg: p => p.sageLight   },
]

// ─── Helpers de fecha ─────────────────────────────────────────────────────

const DIAS  = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado']
const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

export function formatDate(s) {
  if (!s) return ''
  const [y, m, d] = s.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  return `${DIAS[dt.getDay()]} ${d} · ${MESES[m - 1]} · ${y}`
}

export function formatTime(s) {
  if (!s) return ''
  const [h, mn] = s.split(':').map(Number)
  const sf = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  return `${h12}:${String(mn).padStart(2, '0')} ${sf}`
}

// ─── Helpers de color ─────────────────────────────────────────────────────

export function hexToRgb(h) {
  return [parseInt(h.slice(1,3),16), parseInt(h.slice(3,5),16), parseInt(h.slice(5,7),16)]
}

function rgbToHex(r,g,b) {
  return '#' + [r,g,b].map(v => Math.min(255,Math.max(0,Math.round(v))).toString(16).padStart(2,'0')).join('')
}

export function darken(h, a) {
  const [r,g,b] = hexToRgb(h)
  return rgbToHex(r*(1-a), g*(1-a), b*(1-a))
}

export function lighten(h, a) {
  const [r,g,b] = hexToRgb(h)
  return rgbToHex(r+(255-r)*a, g+(255-g)*a, b+(255-b)*a)
}

export function customPaletteToColors(cp) {
  const { primary: c1, accent: c2, surface: c3, ink: c4 } = cp
  return {
    primary:      c1,
    primaryDark:  darken(c1, 0.2),
    primaryMid:   lighten(c1, 0.15),
    primaryLight: lighten(c1, 0.85),
    accent:       c2,
    accentLight:  lighten(c2, 0.85),
    surface:      lighten(c3, 0.5),
    surface2:     lighten(c3, 0.2),
    kraft:        c3,
    ink:          c4,
    inkMute:      lighten(c4, 0.45),
    sageLight:    lighten(c3, 0.3),
  }
}

// ─── Resolvers de config ──────────────────────────────────────────────────

export function defaultTypoColor(role, p) {
  if (role === 'title')   return p.primaryDark
  if (role === 'display') return p.inkMute
  return p.ink
}

export function resolvePalette(cfg) {
  const pal = cfg?.palette || { primary: '#2A4A7F', accent: '#C4973A', surface: '#E8EBF2', ink: '#1A1F2E' }
  const key = DETECT_PALETTE[pal.primary]
  return key ? PALETTES[key] : customPaletteToColors(pal)
}

export function resolveTypography(cfg) {
  const merged = { ...DEFAULT_TYPOGRAPHY }
  if (cfg?.typography) {
    Object.keys(cfg.typography).forEach(k => {
      if (merged[k]) merged[k] = { ...merged[k], ...cfg.typography[k] }
    })
  }
  return merged
}

export function resolveFrames(cfg) {
  const fm = cfg?.frames
  if (!fm) return DEFAULT_FRAMES
  const getColor = v => typeof v === 'object' ? v.color : v
  const getOn    = v => typeof v === 'object' ? (v.on !== false) : true
  return {
    inv:     fm.inv     ? { color: getColor(fm.inv),     on: getOn(fm.inv)     } : DEFAULT_FRAMES.inv,
    nav:     fm.nav     ? { color: getColor(fm.nav),     on: getOn(fm.nav)     } : DEFAULT_FRAMES.nav,
    qr:      fm.qr      ? { color: getColor(fm.qr),      on: getOn(fm.qr)      } : DEFAULT_FRAMES.qr,
    maps_a:  fm.maps_a  ? { color: getColor(fm.maps_a)  }                        : DEFAULT_FRAMES.maps_a,
    maps_b:  fm.maps_b  ? { color: getColor(fm.maps_b)  }                        : DEFAULT_FRAMES.maps_b,
    maps_on: fm.maps_on !== false,
  }
}