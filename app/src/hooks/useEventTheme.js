import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
 
/**
 * useEventTheme
 * Carga el config del evento desde Supabase y aplica los tokens de diseño
 * como CSS variables en :root. Úsalo en cualquier página del invitado.
 * 23/06 22:21
 * @param {string} eventId - UUID del evento
 * @returns {{ event, config, loading, error }}
 */
export function useEventTheme(eventId) {
  const [event, setEvent]   = useState(null)
  const [config, setConfig] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState(null)
 
  useEffect(() => {
    if (!eventId) return
 
    async function loadTheme() {
      setLoading(true)
      setError(null)
 
      const { data, error: err } = await supabase
        .from('events')
        .select('id, name, title, subtitle, start_date, start_time, venue, venue_url, bg_url, flyer_url, config')
        .eq('id', eventId)
        .single()
 
      if (err || !data) {
        setError(err?.message || 'Evento no encontrado')
        setLoading(false)
        return
      }
 
      setEvent(data)
      setConfig(data.config || {})
      applyTheme(data)
      setLoading(false)
    }
 
    loadTheme()
  }, [eventId])
 
  return { event, config, loading, error }
}
 
// ─── Aplicar tokens al :root ───────────────────────────────────────────────
 
function applyTheme(data) {
  const cfg = data.config || {}
  const root = document.documentElement
 
  // ── Paleta ──────────────────────────────────────────────────────────────
  const palette = cfg.palette || {}
  if (palette.primary) root.style.setProperty('--color-primary', palette.primary)
  if (palette.accent)  root.style.setProperty('--color-accent',  palette.accent)
  if (palette.surface) root.style.setProperty('--color-surface', palette.surface)
  if (palette.ink)     root.style.setProperty('--color-ink',     palette.ink)
 
  // Derivados automáticos (versiones claras para hover, fondos, etc.)
  if (palette.primary) {
    root.style.setProperty('--color-primary-light', hexWithAlpha(palette.primary, 0.12))
    root.style.setProperty('--color-primary-mid',   hexWithAlpha(palette.primary, 0.35))
  }
  if (palette.accent) {
    root.style.setProperty('--color-accent-light', hexWithAlpha(palette.accent, 0.12))
  }
  if (palette.ink) {
    root.style.setProperty('--color-ink-soft', hexWithAlpha(palette.ink, 0.60))
    root.style.setProperty('--color-ink-mute', hexWithAlpha(palette.ink, 0.38))
  }
 
  // ── Tipografía ──────────────────────────────────────────────────────────
  const typo = cfg.typography || {}
 
  // Carga Google Fonts dinámicamente según las fuentes del evento
  loadGoogleFonts(typo)
 
  // Aplica variables por rol tipográfico
  const roles = ['title', 'display', 'label', 'caption']
  roles.forEach(role => {
    const t = typo[role]
    if (!t) return
    root.style.setProperty(`--typo-${role}-font`,   t.font   || 'DM Sans')
    root.style.setProperty(`--typo-${role}-size`,   `${t.size || 16}px`)
    root.style.setProperty(`--typo-${role}-color`,  t.color  || palette.ink || '#2A1F1A')
    root.style.setProperty(`--typo-${role}-weight`, t.bold   ? '600' : '400')
    root.style.setProperty(`--typo-${role}-transform`, t.caps ? 'uppercase' : 'none')
  })
 
  // ── Fondo del evento ────────────────────────────────────────────────────
  if (data.bg_url) {
    root.style.setProperty('--event-bg-url', `url("${data.bg_url}")`)
    root.style.setProperty('--event-bg-type', 'image')
  } else {
    root.style.setProperty('--event-bg-url', 'none')
    root.style.setProperty('--event-bg-type', 'color')
  }
 
  // ── Frames / barra maps ─────────────────────────────────────────────────
  const frames = cfg.frames || {}
  if (frames.maps_a) root.style.setProperty('--maps-color-a', frames.maps_a.color || frames.maps_a)
  if (frames.maps_b) root.style.setProperty('--maps-color-b', frames.maps_b.color || frames.maps_b)
}
 
// ─── Helpers ───────────────────────────────────────────────────────────────
 
/**
 * Convierte hex + alpha a rgba para derivados de color
 * hex: "#7D2935"  alpha: 0.12  →  "rgba(125, 41, 53, 0.12)"
 */
function hexWithAlpha(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}
 
/**
 * Carga las Google Fonts que usa el evento (sin duplicar si ya están cargadas)
 */
function loadGoogleFonts(typo) {
  const FONT_MAP = {
    'Great Vibes':          'Great+Vibes',
    'Cormorant Garamond':   'Cormorant+Garamond:wght@400;500;600',
    'DM Sans':              'DM+Sans:wght@300;400;500',
    'Playfair Display':     'Playfair+Display:wght@400;600',
    'Lora':                 'Lora:wght@400;500',
    'Montserrat':           'Montserrat:wght@300;400;500',
    'Raleway':              'Raleway:wght@300;400;500',
    'EB Garamond':          'EB+Garamond:wght@400;500',
    'Dancing Script':       'Dancing+Script:wght@400;600',
    'Josefin Sans':         'Josefin+Sans:wght@300;400;600',
  }
 
  // Recolecta fuentes únicas del evento
  const needed = new Set()
  Object.values(typo).forEach(t => {
    if (t?.font && FONT_MAP[t.font]) needed.add(FONT_MAP[t.font])
  })
 
  needed.forEach(family => {
    const id = `gfont-${family.split(':')[0]}`
    if (document.getElementById(id)) return // ya cargada
 
    const link = document.createElement('link')
    link.id   = id
    link.rel  = 'stylesheet'
    link.href = `https://fonts.googleapis.com/css2?family=${family}&display=swap`
    document.head.appendChild(link)
  })
}