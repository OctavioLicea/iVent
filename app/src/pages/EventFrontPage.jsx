// Página: EventFrontPage — app/src/pages/EventFrontPage.jsx
// Cambio: el QR de la portada ahora se genera dinámicamente (igual que el del modal compartir), ya no depende de qr_url subido
// 2026-06-12 17:50

import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { supabase } from "../lib/supabase"

const PALETTES = {
  boda:     { primary: '#7D2935', primaryDark: '#561820', primaryMid: '#A34455', primaryLight: '#F3E8EA', accent: '#9C6B2E', accentLight: '#F7F0E3', surface: '#FAF7F2', surface2: '#F2EBE0', kraft: '#EDE0CB', ink: '#2A1F1A', inkMute: '#9C8878', sageLight: '#EBF0E8' },
  quince:   { primary: '#7B3FA0', primaryDark: '#5B2D8E', primaryMid: '#9B60C0', primaryLight: '#F5EAF8', accent: '#C97DC0', accentLight: '#FBF0FA', surface: '#FDF8FF', surface2: '#F5ECF8', kraft: '#EFE0F0', ink: '#2A1A2E', inkMute: '#9A7AA0', sageLight: '#F0EAF5' },
  marino:   { primary: '#2A4A7F', primaryDark: '#1B2C4E', primaryMid: '#3D6399', primaryLight: '#EAF0FA', accent: '#C4973A', accentLight: '#FBF5E6', surface: '#F8FAFF', surface2: '#EFF2F8', kraft: '#E8EBF2', ink: '#1A1F2E', inkMute: '#7A8AA0', sageLight: '#E8EFF8' },
  botanico: { primary: '#3D6B20', primaryDark: '#2D5016', primaryMid: '#5A8A35', primaryLight: '#EDF5E8', accent: '#7A9E52', accentLight: '#F2F8EC', surface: '#F8FCF5', surface2: '#EFF5EA', kraft: '#E4EDD8', ink: '#1A2010', inkMute: '#7A8A6A', sageLight: '#E8F0DE' },
}

const DEFAULT_TYPOGRAPHY = {
  title:   { font: 'Great Vibes', size: 52, bold: false, color: '' },
  display: { font: 'Cormorant Garamond', size: 17, bold: true, color: '' },
  caption: { font: 'DM Sans', size: 10, bold: false, color: '' },
  label:   { font: 'Cormorant Garamond', size: 12, bold: true, color: '' },
}

const DEFAULT_FRAMES = {
  inv: { color: '#EDE0CB', on: true },
  nav: { color: '#FAF7F2', on: true },
  qr:  { color: '#F2EBE0', on: true },
  maps_a: { color: '#1B2C4E' },
  maps_b: { color: '#C4973A' },
  maps_on: true,
}

const MODULE_REGISTRY = [
  { key: "fotos",   label: "Sube tus fotos",   sub: "Comparte tu momento",   icon: "📷", path: "fotos",     iconBg: p => p.primaryLight },
  { key: "collage", label: "Collage en vivo",  sub: "Fotos en tiempo real",  icon: "🖼", path: "liveboard", iconBg: p => "#2a1f1a" },
  { key: "crono",   label: "Cronograma",       sub: "Timeline del día",      icon: "🕐", path: "crono",     iconBg: p => p.surface2 },
  { key: "deseos",  label: "¡Escríbenos algo!",sub: "Tus palabras para ellos", icon: "💌", path: "deseos",  iconBg: p => "#F9EEF3" },
  { key: "mesas",   label: "¿Cuál es mi mesa?",sub: "Encuentra tu lugar",    icon: "🪑", path: "mesas",     iconBg: p => p.sageLight },
]

const DIAS = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado']
const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

function formatDate(s) {
  if (!s) return ''
  const [y, m, d] = s.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  return `${DIAS[dt.getDay()]} ${d} · ${MESES[m - 1]} · ${y}`
}
function formatTime(s) {
  if (!s) return ''
  const [h, mn] = s.split(':').map(Number)
  const sf = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  return `${h12}:${String(mn).padStart(2, '0')} ${sf}`
}

function hexToRgb(h) { return [parseInt(h.slice(1,3),16), parseInt(h.slice(3,5),16), parseInt(h.slice(5,7),16)] }
function rgbToHex(r,g,b) { return '#' + [r,g,b].map(v => Math.min(255,Math.max(0,Math.round(v))).toString(16).padStart(2,'0')).join('') }
function darken(h,a) { const [r,g,b]=hexToRgb(h); return rgbToHex(r*(1-a),g*(1-a),b*(1-a)) }
function lighten(h,a) { const [r,g,b]=hexToRgb(h); return rgbToHex(r+(255-r)*a,g+(255-g)*a,b+(255-b)*a) }

function customPaletteToColors(cp) {
  const c1 = cp.primary, c2 = cp.accent, c3 = cp.surface, c4 = cp.ink
  return {
    primary: c1, primaryDark: darken(c1, 0.2), primaryMid: lighten(c1, 0.15), primaryLight: lighten(c1, 0.85),
    accent: c2, accentLight: lighten(c2, 0.85),
    surface: lighten(c3, 0.5), surface2: lighten(c3, 0.2), kraft: c3,
    ink: c4, inkMute: lighten(c4, 0.45), sageLight: lighten(c3, 0.3),
  }
}

const DETECT_PALETTE = {
  '#7D2935': 'boda', '#561820': 'boda',
  '#7B3FA0': 'quince', '#5B2D8E': 'quince',
  '#2A4A7F': 'marino', '#1B2C4E': 'marino',
  '#3D6B20': 'botanico', '#2D5016': 'botanico',
}

function defaultTypoColor(role, p) {
  if (role === 'title') return p.primaryDark
  if (role === 'display') return p.inkMute
  return p.ink
}

function resolvePalette(cfg) {
  const pal = cfg?.palette || { primary: '#2A4A7F', accent: '#C4973A', surface: '#E8EBF2', ink: '#1A1F2E' }
  const key = DETECT_PALETTE[pal.primary]
  return key ? PALETTES[key] : customPaletteToColors(pal)
}

function resolveTypography(cfg) {
  const merged = { ...DEFAULT_TYPOGRAPHY }
  if (cfg?.typography) {
    Object.keys(cfg.typography).forEach(k => { if (merged[k]) merged[k] = { ...merged[k], ...cfg.typography[k] } })
  }
  return merged
}

function resolveFrames(cfg) {
  const fm = cfg?.frames
  if (!fm) return DEFAULT_FRAMES
  const getColor = v => typeof v === 'object' ? v.color : v
  const getOn = v => typeof v === 'object' ? (v.on !== false) : true
  return {
    inv: fm.inv ? { color: getColor(fm.inv), on: getOn(fm.inv) } : DEFAULT_FRAMES.inv,
    nav: fm.nav ? { color: getColor(fm.nav), on: getOn(fm.nav) } : DEFAULT_FRAMES.nav,
    qr: fm.qr ? { color: getColor(fm.qr), on: getOn(fm.qr) } : DEFAULT_FRAMES.qr,
    maps_a: fm.maps_a ? { color: getColor(fm.maps_a) } : DEFAULT_FRAMES.maps_a,
    maps_b: fm.maps_b ? { color: getColor(fm.maps_b) } : DEFAULT_FRAMES.maps_b,
    maps_on: fm.maps_on !== false,
  }
}

export default function EventFrontPage() {
  const { eventId } = useParams()
  const navigate = useNavigate()

  const [event, setEvent] = useState(null)
  const [activeModules, setActiveModules] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showShare, setShowShare] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!eventId) {
      setError("No se encontró el evento.")
      setLoading(false)
      return
    }
    loadEvent()
  }, [eventId])

  async function loadEvent() {
    setLoading(true)
    const { data, error } = await supabase
      .from("events")
      .select("id, name, title, subtitle, start_date, start_time, venue, venue_url, logo_url, flyer_url, bg_url, config")
      .eq("id", eventId)
      .single()

    if (error || !data) {
      setError("Evento no encontrado.")
      setLoading(false)
      return
    }

    setEvent(data)

    const modules = data.config?.modules || {}
    const active = MODULE_REGISTRY.filter((m) => {
      const mod = modules[m.key]
      return mod === true || mod?.active === true
    })
    setActiveModules(active)
    setLoading(false)
  }

  // ── Google Fonts dinámicas según typography ──
  useEffect(() => {
    if (!event) return
    const typography = resolveTypography(event.config)
    const fonts = new Set(Object.values(typography).map(t => t.font))
    fonts.add('DM Sans')
    const families = [...fonts].map(f => `family=${encodeURIComponent(f)}:ital,wght@0,400;0,600;1,400`).join('&')
    const id = 'fp-google-fonts'
    let link = document.getElementById(id)
    if (!link) {
      link = document.createElement('link')
      link.id = id
      link.rel = 'stylesheet'
      document.head.appendChild(link)
    }
    link.href = `https://fonts.googleapis.com/css2?${families}&display=swap`
  }, [event])

  function copyLink() {
    const link = `${window.location.origin}/e/${eventId}`
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  function goToModule(path) {
    navigate(`/e/${eventId}/${path}`)
  }

  if (loading) {
    return (
      <div style={styles.centered}>
        <p style={styles.loadingText}>Cargando evento…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div style={styles.centered}>
        <p style={styles.errorText}>{error}</p>
      </div>
    )
  }

  const { title, subtitle, start_date, start_time, venue, venue_url, logo_url, flyer_url, bg_url, config } = event

  const palette = resolvePalette(config)
  const typography = resolveTypography(config)
  const frames = resolveFrames(config)
  const invFit = config?.inv_fit || 'contain'
  const invSize = config?.inv_size || 140

  const dateLine = [formatDate(start_date), formatTime(start_time?.substring(0,5)), venue].filter(Boolean).join(' · ')

  function typoStyle(role) {
    const t = typography[role]
    return {
      fontFamily: `'${t.font}', serif`,
      fontSize: t.size + 'px',
      fontWeight: t.bold ? 700 : 400,
      color: t.color || defaultTypoColor(role, palette),
    }
  }

  return (
    <div style={styles.page}>
      <div style={{
        ...styles.card,
        background: bg_url ? `url("${bg_url}") center/cover no-repeat` : palette.surface,
      }}>

        {/* Header */}
        <header style={styles.header}>
          <div style={styles.headerRow}>
            {logo_url && <img src={logo_url} alt="" style={styles.logo} />}
            <div style={styles.headerText}>
              <h1 style={{ ...typoStyle('title'), margin: 0, lineHeight: 1 }}>{title || "Evento"}</h1>
              {subtitle && <p style={{ ...typoStyle('display'), margin: '4px 0 0' }}>{subtitle}</p>}
            </div>
          </div>
          <p style={{ ...typoStyle('caption'), letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: 8 }}>
            {dateLine}
          </p>
          <button onClick={() => setShowShare(true)} style={{ ...styles.shareBtn, color: palette.inkMute, borderColor: palette.kraft }}>
            🔗 Compartir evento
          </button>
        </header>

        {/* Barra venue / cómo llegar */}
        {frames.maps_on && (
          <a
            href={venue_url || "#"}
            target="_blank"
            rel="noreferrer"
            style={{ ...styles.venueBar, background: `linear-gradient(90deg, ${frames.maps_a.color} 0%, ${frames.maps_b.color} 100%)` }}
          >
            <span style={styles.venueIcon}>📍</span>
            <span style={{ ...styles.venueText, fontFamily: `'${typography.display.font}', serif` }}>¿Cómo llegar?</span>
          </a>
        )}

        {/* Layout clásico */}
        <div style={styles.central}>
          <div style={{
            ...styles.flyerWrap,
            flex: ((invSize / 140) * 1.5).toFixed(2),
            background: frames.inv.on ? frames.inv.color : 'transparent',
            boxShadow: frames.inv.on ? '0 6px 24px rgba(42,31,26,.14)' : 'none',
          }}>
            {flyer_url ? (
              <img src={flyer_url} alt="Invitación" style={{ ...styles.flyerImg, objectFit: invFit === 'fill' ? 'fill' : invFit }} />
            ) : (
              <div style={styles.flyerPlaceholder}>
                <div style={{ ...typoStyle('title'), lineHeight: 1.1 }} dangerouslySetInnerHTML={{ __html: (title || 'Evento').replace(/&/g, '<br>&<br>') }} />
                <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 13, color: palette.accent, marginTop: 8 }}>
                  Queremos festejar contigo<br />este día especial…
                </p>
              </div>
            )}
          </div>

          <div style={styles.rightCol}>
            {activeModules.length === 0 && (
              <p style={styles.noModules}>No hay módulos activos aún.</p>
            )}
            {activeModules.map((mod) => {
              const customLabel = config?.modules?.[mod.key]?.label
              return (
                <button
                  key={mod.key}
                  style={{
                    ...styles.navItem,
                    background: frames.nav.on ? frames.nav.color : 'transparent',
                    boxShadow: frames.nav.on ? '0 1px 6px rgba(42,31,26,.07)' : 'none',
                  }}
                  onClick={() => goToModule(mod.path)}
                >
                  <span style={{ ...styles.navIcon, background: mod.iconBg(palette) }}>{mod.icon}</span>
                  <span style={styles.navBody}>
                    <span style={{ ...typoStyle('label'), fontSize: Math.min(typography.label.size, 15) + 'px', display: 'block' }}>
                      {customLabel || mod.label}
                    </span>
                    <span style={styles.navSub}>{mod.sub}</span>
                  </span>
                  <span style={styles.navArrow}>›</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* QR */}
        <div style={{
          ...styles.qrCard,
          background: frames.qr.on ? frames.qr.color : 'transparent',
          boxShadow: frames.qr.on ? '0 1px 6px rgba(42,31,26,.07)' : 'none',
        }}>
          <div style={styles.qrSquare}>
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`${window.location.origin}/e/${eventId}`)}`}
              alt="QR del evento"
              style={styles.qrImg}
            />
          </div>
          <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 9, fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase', color: palette.inkMute }}>
            Escanea para unirte
          </span>
        </div>
      </div>

      {showShare && (
        <div style={styles.shareOverlay} onClick={() => setShowShare(false)}>
          <div style={styles.shareModal} onClick={e => e.stopPropagation()}>
            <button style={styles.shareClose} onClick={() => setShowShare(false)}>✕</button>
            <h2 style={{ ...typoStyle('display'), margin: 0, textAlign: 'center' }}>Comparte el evento</h2>
            <p style={{ fontSize: 12, color: palette.inkMute, textAlign: 'center', marginTop: 4, marginBottom: 16 }}>
              Tus invitados pueden escanear el QR o abrir el link.
            </p>
            <div style={styles.shareQrBox}>
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(`${window.location.origin}/e/${eventId}`)}`}
                alt="QR del evento"
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            </div>
            <div style={styles.shareLinkRow}>
              <input readOnly value={`${window.location.origin}/e/${eventId}`} style={styles.shareLinkInput} onClick={e => e.target.select()} />
              <button onClick={copyLink} style={{ ...styles.shareCopyBtn, background: palette.primaryDark }}>
                {copied ? '✓ Copiado' : 'Copiar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px 16px 40px",
    fontFamily: "DM Sans, sans-serif",
    background: "#F7F5F2",
  },
  card: {
    width: "100%",
    maxWidth: 420,
    borderRadius: 20,
    boxShadow: "0 8px 40px rgba(0,0,0,.12), 0 2px 8px rgba(0,0,0,.06)",
    border: "1px solid rgba(0,0,0,.06)",
    padding: "20px 14px 26px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 12,
  },
  centered: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: { color: "#9C8878", fontSize: 14 },
  errorText: { color: "#7D2935", fontSize: 14 },
  header: { textAlign: "center", width: "100%" },
  headerRow: { display: "flex", alignItems: "center", justifyContent: "center", gap: 10, width: "100%" },
  logo: { width: 44, height: 44, objectFit: "contain", borderRadius: 8, flexShrink: 0 },
  headerText: { textAlign: "center", flex: 1 },
  venueBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    width: "100%",
    color: "#fff",
    padding: "12px 16px",
    borderRadius: 10,
    textDecoration: "none",
    fontSize: 15,
    fontWeight: 600,
  },
  venueIcon: { fontSize: 16 },
  venueText: { textAlign: "center" },
  central: { display: "flex", gap: 10, width: "100%", alignItems: "stretch" },
  flyerWrap: {
    borderRadius: 12,
    overflow: "hidden",
    minHeight: 300,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  flyerImg: { width: "100%", height: "100%", objectFit: "cover", display: "block" },
  flyerPlaceholder: { textAlign: "center", padding: 16 },
  rightCol: { flex: 1, display: "flex", flexDirection: "column", gap: 8, minWidth: 0 },
  navItem: {
    border: "none",
    borderRadius: 10,
    padding: "10px 11px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: 9,
    textAlign: "left",
    width: "100%",
    color: "inherit",
  },
  navIcon: {
    fontSize: 15,
    width: 30,
    height: 30,
    borderRadius: 7,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  navBody: { flex: 1, display: "flex", flexDirection: "column", gap: 2, minWidth: 0 },
  navSub: { fontSize: 10, color: "#9C8878", display: "block" },
  navArrow: { fontSize: 15, color: "#9C8878", flexShrink: 0 },
  noModules: { fontSize: 13, color: "#9C8878", textAlign: "center", padding: 20 },
  qrCard: {
    width: "100%",
    borderRadius: 12,
    padding: "12px 14px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 7,
  },
  qrSquare: {
    width: 100,
    height: 100,
    borderRadius: 8,
    background: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 8,
    overflow: "hidden",
  },
  qrImg: { width: "100%", height: "100%", objectFit: "contain" },
  shareBtn: {
    marginTop: 10,
    background: "transparent",
    border: "1px solid",
    borderRadius: 20,
    padding: "6px 14px",
    fontFamily: "DM Sans, sans-serif",
    fontSize: 12,
    cursor: "pointer",
  },
  shareOverlay: {
    position: "fixed", inset: 0, background: "rgba(0,0,0,.45)",
    display: "flex", alignItems: "center", justifyContent: "center",
    zIndex: 100, padding: 16,
  },
  shareModal: {
    background: "#fff", borderRadius: 16, padding: "24px 20px",
    width: "100%", maxWidth: 340, position: "relative",
    display: "flex", flexDirection: "column", alignItems: "center",
    boxShadow: "0 20px 60px rgba(0,0,0,.25)",
  },
  shareClose: {
    position: "absolute", top: 10, right: 10,
    background: "transparent", border: "none", fontSize: 16,
    color: "#9C8878", cursor: "pointer", padding: 4,
  },
  shareQrBox: {
    width: 180, height: 180, borderRadius: 10,
    display: "flex", alignItems: "center", justifyContent: "center",
    marginBottom: 16,
  },
  shareLinkRow: { display: "flex", gap: 8, width: "100%" },
  shareLinkInput: {
    flex: 1, fontSize: 12, padding: "9px 10px", borderRadius: 8,
    border: "1px solid #E6E8EE", background: "#FAFBFD", color: "#4A4F5E",
    fontFamily: "DM Sans, sans-serif", outline: "none",
  },
  shareCopyBtn: {
    color: "#fff", border: "none", borderRadius: 8,
    padding: "9px 16px", fontSize: 12, fontWeight: 600,
    fontFamily: "DM Sans, sans-serif", cursor: "pointer", whiteSpace: "nowrap",
  },
}
