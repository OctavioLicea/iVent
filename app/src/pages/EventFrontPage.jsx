// Página: EventFrontPage — app/src/pages/EventFrontPage.jsx
// Cambio: Capa 2 — eliminar código duplicado; importar desde eventHelpers
// 2026-06-23 22:00

import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { supabase } from "../lib/supabase"
import { appEventUrl } from "../lib/constants"
import {
  PALETTES, DEFAULT_TYPOGRAPHY, DEFAULT_FRAMES, DETECT_PALETTE, MODULE_DEFS, BG_PATTERNS,
  formatDate, formatTime, hexToRgb, darken, lighten, customPaletteToColors,
  defaultTypoColor, resolvePalette, resolveTypography, resolveFrames,
} from "../lib/eventHelpers"



export default function EventFrontPage() {
  const { eventId } = useParams()
  const eventUrl = appEventUrl(eventId)
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
    const active = MODULE_DEFS.filter((m) => {
      const mod = modules[m.key]
      return mod === true || mod?.active === true
    })
    setActiveModules(active)
    setLoading(false)
  }

  function copyLink() {
    const link = eventUrl
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
        ...(bg_url
          ? { background: `url("${bg_url}") center/cover no-repeat` }
          : config?.bg_pattern && config.bg_pattern !== 'none'
            ? BG_PATTERNS.find(p => p.id === config.bg_pattern)?.style || { background: palette.surface }
            : { background: palette.surface }),
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
              src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(eventUrl)}`}
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
                src={`https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(eventUrl)}`}
                alt="QR del evento"
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            </div>
            <div style={styles.shareLinkRow}>
              <input readOnly value={eventUrl} style={styles.shareLinkInput} onClick={e => e.target.select()} />
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
