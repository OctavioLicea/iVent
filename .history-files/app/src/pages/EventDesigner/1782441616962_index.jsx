// Página: EventDesigner — app/src/pages/EventDesigner/index.jsx
// Razón: fix loading módulos boolean; discard evento nuevo; label Configuración; QR label
// 2026-06-25 20:30
import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import iventLogo from '../../assets/ivent-logo-light.svg'
import { supabase } from '../../lib/supabase'
import { appEventPath, appEventUrl } from '../../lib/constants'
import {
  PALETTES, DEFAULT_TYPOGRAPHY, DEFAULT_FRAMES, DETECT_PALETTE,
  MODULE_DEFS, FONT_OPTIONS, TYPO_ROLES, BG_PATTERNS,
  formatDate, formatTime, darken, lighten, customPaletteToColors, defaultTypoColor,
} from '../../lib/eventHelpers'
import './styles.css'

const STORAGE_BUCKET = 'event-assets'


const SECTIONS = [
  { key: 'identidad', label: 'Identidad', icon: '📋', group: 'Evento' },
  { key: 'imagenes',  label: 'Imágenes',  icon: '🖼', group: 'Evento' },
  { key: 'colores',   label: 'Colores',   icon: '🎨', group: 'Evento' },
  { key: 'tipografia',label: 'Tipografía',icon: '✦',  group: 'Evento' },
  { key: 'modulos',   label: 'Módulos',   icon: '⚙️', group: 'Configuración' },
  { key: 'frames',    label: 'Frames',    icon: '◻',  group: 'Configuración' },
]

export default function EventDesigner() {
  const { eventId } = useParams()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [searchParams] = useSearchParams()
  const isNewEvent  = searchParams.get('new') === '1'
  const hasSavedRef = { current: false }
  const [showDiscardModal, setShowDiscardModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [savedMsg, setSavedMsg] = useState(false)
  const [activeSection, setActiveSection] = useState('identidad')
  const [eventName, setEventName] = useState('Cargando…')
  const [userEmail, setUserEmail] = useState('')

  // Identidad
  const [names, setNames] = useState('')
  const [subtitle, setSubtitle] = useState('')
  const [venue, setVenue] = useState('')
  const [mapsUrl, setMapsUrl] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')

  // Colores
  const [paletteKey, setPaletteKey] = useState('marino')
  const [customPalette, setCustomPalette] = useState({ primary: '#7D2935', accent: '#9C6B2E', surface: '#EDE0CB', ink: '#2A1F1A' })

  // Tipografía
  const [typography, setTypography] = useState(DEFAULT_TYPOGRAPHY)

  // Módulos
  const [modules, setModules] = useState(() => {
    const m = {}
    MODULE_DEFS.forEach(d => { m[d.key] = { active: true, label: d.defaultLabel } })
    return m
  })

  // Frames
  const [frames, setFrames] = useState(DEFAULT_FRAMES)

  // Imágenes
  const [images, setImages] = useState({ logo: '', flyer: '', bg: '' })
  const [logoOn, setLogoOn] = useState(true)
  const [invFit, setInvFit] = useState('contain')
  const [invSize, setInvSize] = useState(140)
  const [imgTab, setImgTab] = useState('logo')
  const [selectedBg, setSelectedBg] = useState('none')

  const bgInputRef = useRef(null)

  const palette = paletteKey === 'custom' ? customPaletteToColors(customPalette) : PALETTES[paletteKey]

  // ── GOOGLE FONTS ──
  useEffect(() => {
    const fonts = new Set(Object.values(typography).map(t => t.font))
    fonts.add('DM Sans')
    const families = [...fonts].map(f => `family=${encodeURIComponent(f)}:ital,wght@0,400;0,600;1,400`).join('&')
    const id = 'ed-google-fonts'
    let link = document.getElementById(id)
    if (!link) {
      link = document.createElement('link')
      link.id = id
      link.rel = 'stylesheet'
      document.head.appendChild(link)
    }
    link.href = `https://fonts.googleapis.com/css2?${families}&display=swap`
  }, [typography])

  // ── LOAD ──
  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { navigate('/login'); return }
      setUserEmail(session.user.email)

      const { data: ev, error } = await supabase.from('events').select('*').eq('id', eventId).single()
      if (error || !ev) { setLoading(false); return }

      setEventName(ev.name || 'Sin nombre')
      setNames(ev.title || ev.name || '')
      setSubtitle(ev.subtitle || '')
      setVenue(ev.venue || '')
      setMapsUrl(ev.venue_url || '')
      setDate(ev.start_date || '')
      setTime(ev.start_time ? ev.start_time.substring(0, 5) : '')

      const cfg = ev.config || {}

      const pal = cfg.palette || { primary: '#7D2935', accent: '#9C6B2E', surface: '#EDE0CB', ink: '#2A1F1A' }
      setCustomPalette(pal)
      const matched = DETECT_PALETTE[pal.primary]
      setPaletteKey(matched || 'custom')

      if (cfg.typography) {
        setTypography(prev => {
          const merged = { ...prev }
          Object.keys(cfg.typography).forEach(k => { if (merged[k]) merged[k] = { ...merged[k], ...cfg.typography[k] } })
          return merged
        })
      }

      if (cfg.modules) {
        setModules(prev => {
          const merged = { ...prev }
          Object.keys(cfg.modules).forEach(k => {
            if (!merged[k]) return
            const v = cfg.modules[k]
            if (typeof v === 'boolean') {
              // Formato nuevo: { fotos: false, collage: true, ... }
              merged[k] = { active: v, label: merged[k].label }
            } else if (v && typeof v === 'object') {
              // Formato viejo: { fotos: { active: true, label: '...' }, ... }
              merged[k] = { active: v.active !== false, label: v.label || merged[k].label }
            }
          })
          return merged
        })
      }

      if (cfg.frames) {
        const fm = cfg.frames
        const getColor = v => typeof v === 'object' ? v.color : v
        const getOn = v => typeof v === 'object' ? (v.on !== false) : true
        setFrames(prev => ({
          inv: fm.inv ? { color: getColor(fm.inv), on: getOn(fm.inv) } : prev.inv,
          nav: fm.nav ? { color: getColor(fm.nav), on: getOn(fm.nav) } : prev.nav,
          qr: fm.qr ? { color: getColor(fm.qr), on: getOn(fm.qr) } : prev.qr,
          maps_a: fm.maps_a ? { color: getColor(fm.maps_a) } : prev.maps_a,
          maps_b: fm.maps_b ? { color: getColor(fm.maps_b) } : prev.maps_b,
          maps_on: fm.maps_on !== false,
        }))
      }

      if (cfg.inv_fit) setInvFit(cfg.inv_fit)
      if (cfg.inv_size) setInvSize(cfg.inv_size)

      setImages({ logo: ev.logo_url || '', flyer: ev.flyer_url || '', bg: ev.bg_url || '' })
      if (ev.bg_url) setSelectedBg('custom')

      setLoading(false)
    }
    load()
  }, [eventId]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── IMAGE UPLOAD ──
  async function handleImgUpload(e, type) {
    const file = e.target.files[0]
    if (!file) return
    const localUrl = URL.createObjectURL(file)
    const field = type === 'invitacion' ? 'flyer' : type
    setImages(prev => ({ ...prev, [field]: localUrl }))

    const ext = file.name.split('.').pop()
    const path = `${eventId}/${type}.${ext}`
    const { error: upErr } = await supabase.storage.from(STORAGE_BUCKET).upload(path, file, { upsert: true })
    if (upErr) { console.error('Storage upload error', upErr); return }
    const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path)
    // Cache-buster: mismo path siempre (upsert), evita que el navegador sirva la versión vieja cacheada
    const publicUrl = `${data.publicUrl}?t=${Date.now()}`
    const col = type === 'logo' ? 'logo_url' : 'flyer_url'
    setImages(prev => ({ ...prev, [field]: publicUrl }))
    await supabase.from('events').update({ [col]: publicUrl }).eq('id', eventId)
  }

  async function handleBgUpload(e) {
    const file = e.target.files[0]
    if (!file) return
    const localUrl = URL.createObjectURL(file)
    setImages(prev => ({ ...prev, bg: localUrl }))
    setSelectedBg('custom')

    const ext = file.name.split('.').pop()
    const path = `${eventId}/bg.${ext}`
    const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(path, file, { upsert: true })
    if (error) { console.error('BG upload error', error); return }
    const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path)
    // Cache-buster: el path es siempre el mismo (upsert), así que el navegador
    // puede servir la versión cacheada de la URL vieja si no la forzamos a refrescar.
    const freshUrl = `${data.publicUrl}?t=${Date.now()}`
    setImages(prev => ({ ...prev, bg: freshUrl }))
    await supabase.from('events').update({ bg_url: freshUrl }).eq('id', eventId)
  }

  // ── SAVE ──
  async function handleSave() {
    setSaving(true)

    const finalPalette = paletteKey === 'custom'
      ? customPalette
      : { primary: PALETTES[paletteKey].primary, accent: PALETTES[paletteKey].accent, surface: PALETTES[paletteKey].kraft, ink: PALETTES[paletteKey].ink }

    const payload = {
      name: names.trim() || 'Sin nombre',
      title: names.trim() || null,
      subtitle: subtitle.trim() || null,
      venue: venue.trim() || null,
      venue_url: mapsUrl.trim() || null,
      start_date: date || null,
      start_time: time || null,
      bg_url: images.bg || null,
      config: {
        palette: finalPalette,
        typography,
        modules,
        inv_fit: invFit,
        inv_size: invSize,
        frames,
        bg_pattern: images.bg ? null : selectedBg,
      },
    }

    const { error } = await supabase.from('events').update(payload).eq('id', eventId)
    setSaving(false)
    if (error) { alert('Error al guardar: ' + error.message); return }
    hasSavedRef.current = true
    setSavedMsg(true)
    setTimeout(() => setSavedMsg(false), 2500)
  }

  async function handleDiscard() {
    await supabase.from('events').delete().eq('id', eventId)
    navigate('/events')
  }

  if (loading) return <div className="ed-loading">Cargando…</div>

  // ── PREVIEW CSS VARS ──
  const previewVars = {
    '--ev-primary': palette.primary,
    '--ev-primary-dark': palette.primaryDark,
    '--ev-primary-mid': palette.primaryMid,
    '--ev-primary-light': palette.primaryLight,
    '--ev-accent': palette.accent,
    '--ev-accent-light': palette.accentLight,
    '--ev-surface': palette.surface,
    '--ev-surface2': palette.surface2,
    '--ev-kraft': palette.kraft,
    '--ev-ink': palette.ink,
    '--ev-ink-mute': palette.inkMute,
    '--ev-sage-light': palette.sageLight,
    '--frame-inv': frames.inv.color,
    '--frame-nav': frames.nav.color,
    '--frame-qr': frames.qr.color,
    '--frame-maps-a': frames.maps_a.color,
    '--frame-maps-b': frames.maps_b.color,
    '--maps-bar-font': `'${typography.display.font}'`,
  }

  const bgStyle = images.bg
    ? { backgroundImage: `url('${images.bg}')`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : (BG_PATTERNS.find(p => p.id === selectedBg)?.style || {})

  const dateLine = [formatDate(date), formatTime(time), venue].filter(Boolean).join(' · ')

  function typoStyle(role) {
    const t = typography[role]
    return {
      fontFamily: `'${t.font}', serif`,
      fontSize: t.size + 'px',
      fontWeight: t.bold ? 700 : 400,
      color: t.color || defaultTypoColor(role, palette),
    }
  }

  function updateTypo(role, prop, val) {
    setTypography(prev => ({ ...prev, [role]: { ...prev[role], [prop]: val } }))
  }

  function toggleModule(key, active) {
    setModules(prev => ({ ...prev, [key]: { ...prev[key], active } }))
  }
  function updateModuleLabel(key, label) {
    setModules(prev => ({ ...prev, [key]: { ...prev[key], label } }))
  }

  return (
    <div className="ed-app">
      {/* TOPNAV */}
      <nav className="ed-topnav">
        <img src={iventLogo} alt="iVent" className="ed-logo-img" />
        <div className="ed-sep" />
        <span className="ed-event-name">{eventName}</span>
        <div className="ed-spacer" />
        {savedMsg && <span className="ed-saved-msg">✓ Guardado</span>}
        <button className="ed-btn-save" onClick={handleSave} disabled={saving}>
          {saving ? 'Guardando…' : 'Guardar cambios'}
        </button>
        <a className="ed-btn-frontpage" href={appEventPath(eventId)} target="_blank" rel="noreferrer">
          ⛶ Ver portada
        </a>
        <div className="ed-user-chip">
          <div className="ed-user-avatar">{userEmail.substring(0, 2).toUpperCase()}</div>
          <span className="ed-user-email">{userEmail}</span>
        </div>
        <button className="ed-topnav-back" onClick={() => {
          if (isNewEvent && !hasSavedRef.current) { setShowDiscardModal(true) }
          else { navigate('/events') }
        }}>← Mis eventos</button>
      </nav>

      <div className="ed-workspace">
        {/* SIDEBAR */}
        <aside className="ed-sidebar">
          {['Evento', 'Configuración'].map(group => (
            <div key={group}>
              {group !== 'Configuración' && <div className="ed-sidebar-label">{group}</div>}
              {SECTIONS.filter(s => s.group === group).map(s => (
                <div key={s.key} className={`ed-nav-item ${activeSection === s.key ? 'active' : ''}`} onClick={() => setActiveSection(s.key)}>
                  <span className="ed-nav-icon">{s.icon}</span>
                  <span className="ed-nav-label">{s.label}</span>
                </div>
              ))}
            </div>
          ))}
        </aside>

        {/* CONTENT */}
        <div className="ed-content">

          {activeSection === 'identidad' && (
            <div className="ed-section">
              <div className="ed-heading">Identidad del evento</div>
              <div className="ed-sub">Información principal que verán tus invitados.</div>
              <div className="ed-field">
                <label>Nombres / título del evento</label>
                <input type="text" value={names} onChange={e => setNames(e.target.value)} />
              </div>
              <div className="ed-fields-row">
                <div className="ed-field">
                  <label>Fecha del evento</label>
                  <input type="date" value={date} onChange={e => setDate(e.target.value)} />
                </div>
                <div className="ed-field">
                  <label>Hora de inicio</label>
                  <input type="time" value={time} onChange={e => setTime(e.target.value)} />
                </div>
              </div>
              <div className="ed-field">
                <label>Venue / lugar</label>
                <input type="text" value={venue} onChange={e => setVenue(e.target.value)} />
              </div>
              <div className="ed-field">
                <label>Subtítulo <span style={{ fontWeight: 400, opacity: .6 }}>(opcional)</span></label>
                <input type="text" value={subtitle} onChange={e => setSubtitle(e.target.value)} />
              </div>
              <div className="ed-field">
                <label>URL ubicación</label>
                <input type="url" placeholder="https://maps.google.com/..." value={mapsUrl} onChange={e => setMapsUrl(e.target.value)} />
              </div>
            </div>
          )}

          {activeSection === 'imagenes' && (
            <div className="ed-section">
              <div className="ed-heading">Imágenes</div>
              <div className="ed-sub">Logo, invitación, QR y fondo del evento.</div>
              <div className="ed-img-tabs">
                {[
                  { id: 'logo', icon: '🏷', label: 'Logo' },
                  { id: 'invitacion', icon: '🖼', label: 'Invitación' },
                  { id: 'fondo', icon: '🌄', label: 'Fondo' },
                ].map(t => (
                  <button key={t.id} className={`ed-img-tab ${imgTab === t.id ? 'active' : ''} ${images[t.id === 'invitacion' ? 'flyer' : t.id] ? 'has-image' : ''}`} onClick={() => setImgTab(t.id)}>
                    <span className="ed-tab-icon">{t.icon}</span>
                    <span className="ed-tab-label">{t.label}</span>
                    <span className="ed-tab-dot" />
                  </button>
                ))}
              </div>

              {imgTab !== 'fondo' ? (
                <>
                  <label className="ed-upload-zone">
                    <input type="file" accept="image/*" onChange={e => handleImgUpload(e, imgTab)} />
                    <div className="ed-zone-icon">{imgTab === 'logo' ? '🏷' : '🖼'}</div>
                    <div className="ed-zone-title">
                      {imgTab === 'logo' ? 'Subir logo' : 'Subir invitación / foto principal'}
                    </div>
                    <div className="ed-zone-sub">
                      {imgTab === 'logo' ? 'PNG · JPG · SVG' : 'JPG · PNG · máx 5MB'}
                    </div>
                    {imgTab === 'logo' && <div className="ed-zone-tip">💡 Usa PNG con fondo transparente</div>}
                  </label>

                  {imgTab === 'logo' && (
                    <div className="ed-setting-row">
                      <span>Mostrar logo en preview</span>
                      <label className="ed-toggle">
                        <input type="checkbox" checked={logoOn} onChange={e => setLogoOn(e.target.checked)} />
                        <div className="ed-toggle-track" /><div className="ed-toggle-thumb" />
                      </label>
                    </div>
                  )}

                  {imgTab === 'invitacion' && images.flyer && (
                    <div className="ed-inv-fit-controls">
                      <div className="ed-inv-fit-label">Ajuste de imagen</div>
                      <div className="ed-inv-fit-row">
                        {[['contain','⬜','Ajustar'],['cover','⬛','Rellenar'],['fill','⬡','Estirar']].map(([id,icon,label]) => (
                          <button key={id} className={`ed-fit-btn ${invFit === id ? 'active' : ''}`} onClick={() => setInvFit(id)}>
                            <span>{icon}</span>{label}
                          </button>
                        ))}
                      </div>
                      <div className="ed-inv-size-row">
                        <span>Ancho</span>
                        <input type="range" min="80" max="220" value={invSize} onChange={e => setInvSize(+e.target.value)} />
                        <span style={{ minWidth: 28 }}>{invSize}</span>
                      </div>
                    </div>
                  )}

                  <div className="ed-thumb-strip">
                    {[['logo','Logo'],['flyer','Invitación']].map(([key,label]) => images[key] && (
                      <div key={key} className="ed-thumb-wrap">
                        <img className="ed-thumb" src={images[key]} alt={label} style={key === 'flyer' ? { objectFit: 'cover' } : {}} />
                        <div className="ed-thumb-label">{label}</div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <div className="ed-sub" style={{ marginBottom: 12 }}>Elige un patrón o sube una imagen de fondo.</div>
                  <div className="ed-bg-grid">
                    {BG_PATTERNS.map(p => (
                      <div key={p.id} className={`ed-bg-opt ${selectedBg === p.id && !images.bg ? 'selected' : ''}`} onClick={() => { setSelectedBg(p.id); setImages(prev => ({ ...prev, bg: '' })) }}>
                        <div className="ed-bg-swatch" style={p.style} />
                        <span className="ed-bg-label">{p.label}</span>
                      </div>
                    ))}
                  </div>
                  <label className="ed-bg-upload">
                    <input type="file" accept="image/*" ref={bgInputRef} onChange={handleBgUpload} />
                    📁 Subir imagen personalizada · JPG · PNG
                  </label>
                </>
              )}
            </div>
          )}

          {activeSection === 'colores' && (
            <div className="ed-section">
              <div className="ed-heading">Paleta de colores</div>
              <div className="ed-sub">Elige una paleta predefinida o personaliza los colores de tu evento.</div>
              <div className="ed-palettes">
                {Object.entries(PALETTES).map(([key, p]) => (
                  <button key={key} className={`ed-palette-opt ${paletteKey === key ? 'active' : ''}`} onClick={() => setPaletteKey(key)}>
                    <div className="ed-palette-swatches">
                      <div className="ed-swatch" style={{ background: p.primaryDark }} />
                      <div className="ed-swatch" style={{ background: p.accent }} />
                      <div className="ed-swatch" style={{ background: p.kraft }} />
                    </div>
                    <div className="ed-palette-name">{p.label}</div>
                  </button>
                ))}
                <button className={`ed-palette-opt ${paletteKey === 'custom' ? 'active' : ''}`} onClick={() => setPaletteKey('custom')}>
                  <div className="ed-palette-swatches">
                    <div className="ed-swatch" style={{ background: customPalette.primary }} />
                    <div className="ed-swatch" style={{ background: customPalette.accent }} />
                    <div className="ed-swatch" style={{ background: customPalette.surface }} />
                  </div>
                  <div className="ed-palette-name">Mi paleta</div>
                </button>
              </div>

              {paletteKey === 'custom' && (
                <div className="ed-color-pickers-grid">
                  {[['primary','Primary'],['accent','Accent'],['surface','Surface'],['ink','Ink']].map(([key,label]) => (
                    <div key={key} className="ed-cp-row">
                      <label>{label}</label>
                      <div className="ed-cp-wrap">
                        <input type="color" value={customPalette[key]} onChange={e => setCustomPalette(prev => ({ ...prev, [key]: e.target.value }))} />
                        <span className="ed-cp-hex">{customPalette[key]}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeSection === 'tipografia' && (
            <div className="ed-section">
              <div className="ed-heading">Tipografía</div>
              <div className="ed-sub">Controla el estilo de texto de cada rol visual del evento.</div>
              <table className="ed-typo-table">
                <thead>
                  <tr><th>Rol</th><th>Muestra</th><th>Font</th><th>Tam</th><th>B</th><th>Color</th></tr>
                </thead>
                <tbody>
                  {TYPO_ROLES.map(role => {
                    const t = typography[role.key]
                    const color = t.color || defaultTypoColor(role.key, palette)
                    return (
                      <tr key={role.key} className="ed-typo-row">
                        <td><span className="ed-typo-badge">{role.label}</span></td>
                        <td>
                          <div className="ed-typo-sample" style={{ fontFamily: `'${t.font}',serif`, fontSize: Math.min(t.size, 17) + 'px', fontWeight: t.bold ? 700 : 400, color }}>
                            {role.sample}
                          </div>
                        </td>
                        <td>
                          <select className="ed-typo-select" value={t.font} onChange={e => updateTypo(role.key, 'font', e.target.value)}>
                            {FONT_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
                          </select>
                        </td>
                        <td><input type="number" className="ed-typo-size" min="8" max="96" value={t.size} onChange={e => updateTypo(role.key, 'size', +e.target.value)} /></td>
                        <td>
                          <button className={`ed-typo-bold ${t.bold ? 'active' : ''}`} onClick={() => updateTypo(role.key, 'bold', !t.bold)}>B</button>
                        </td>
                        <td><input type="color" className="ed-typo-color" value={color.length === 7 ? color : '#2A1F1A'} onChange={e => updateTypo(role.key, 'color', e.target.value)} /></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {activeSection === 'modulos' && (
            <div className="ed-section">
              <div className="ed-heading">Módulos activos</div>
              <div className="ed-sub">Activa o desactiva las secciones que verán tus invitados.</div>
              <div className="ed-module-list">
                {MODULE_DEFS.map(d => {
                  const m = modules[d.key]
                  return (
                    <div key={d.key} className="ed-module-row">
                      <div className="ed-module-icon">{d.icon}</div>
                      <div className="ed-module-info">
                        <div className="ed-module-name">{d.name}</div>
                        <input className="ed-module-input" value={m.label} onChange={e => updateModuleLabel(d.key, e.target.value)} />
                      </div>
                      <label className="ed-toggle">
                        <input type="checkbox" checked={m.active} onChange={e => toggleModule(d.key, e.target.checked)} />
                        <div className="ed-toggle-track" /><div className="ed-toggle-thumb" />
                      </label>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {activeSection === 'frames' && (
            <div className="ed-section">
              <div className="ed-heading">Frames del preview</div>
              <div className="ed-sub">Color de fondo de cada bloque en la vista del invitado.</div>
              <div className="ed-frame-controls">
                {[['inv','🖼 Invitación'],['nav','📱 Opciones de menú'],['qr','📲 QR']].map(([key,label]) => (
                  <div key={key} className="ed-frame-row">
                    <span className="ed-frame-label">{label}</span>
                    <input type="color" className="ed-frame-color" value={frames[key].color} onChange={e => setFrames(prev => ({ ...prev, [key]: { ...prev[key], color: e.target.value } }))} />
                    <label className="ed-toggle" style={{ marginLeft: 4 }}>
                      <input type="checkbox" checked={frames[key].on} onChange={e => setFrames(prev => ({ ...prev, [key]: { ...prev[key], on: e.target.checked } }))} />
                      <div className="ed-toggle-track" /><div className="ed-toggle-thumb" />
                    </label>
                  </div>
                ))}
                <div className="ed-frame-row">
                  <span className="ed-frame-label">📍 Barra Cómo llegar</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 'auto' }}>
                    <input type="color" className="ed-frame-color" value={frames.maps_a.color} onChange={e => setFrames(prev => ({ ...prev, maps_a: { color: e.target.value } }))} />
                    <span style={{ fontSize: 9, color: 'var(--ed-ink-mute)' }}>→</span>
                    <input type="color" className="ed-frame-color" value={frames.maps_b.color} onChange={e => setFrames(prev => ({ ...prev, maps_b: { color: e.target.value } }))} />
                  </div>
                  <label className="ed-toggle" style={{ marginLeft: 8 }}>
                    <input type="checkbox" checked={frames.maps_on} onChange={e => setFrames(prev => ({ ...prev, maps_on: e.target.checked }))} />
                    <div className="ed-toggle-track" /><div className="ed-toggle-thumb" />
                  </label>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* PREVIEW */}
        <div className="ed-preview-area">
          <div className="ed-preview-label">Portada del evento · tiempo real</div>
          <div className="ed-event-page" style={{ ...previewVars, ...bgStyle }}>
            <div className="ed-ev-header">
              <div className="ed-ev-header-row">
                {images.logo && logoOn && <img className="ed-ev-logo" src={images.logo} alt="" />}
                <div className="ed-ev-header-text">
                  <div className="ed-ev-names" style={typoStyle('title')}>{names || 'Nombres'}</div>
                  {subtitle && <div className="ed-ev-display" style={typoStyle('display')}>{subtitle}</div>}
                </div>
              </div>
              <div className="ed-ev-date-row"><span className="ed-ev-date" style={typoStyle('caption')}>{dateLine}</span></div>
            </div>

            {frames.maps_on && (
              <a className="ed-ev-maps-bar" href={mapsUrl || '#'} target="_blank" rel="noreferrer">
                <span>📍</span><span className="ed-ev-maps-label">¿Cómo llegar?</span>
              </a>
            )}

            <div className="ed-ev-central">
              <div className={`ed-ev-inv-wrap ${frames.inv.on ? 'frame-on' : ''}`} style={{ flex: ((invSize/140)*1.4).toFixed(2), background: frames.inv.on ? frames.inv.color : 'transparent' }}>
                {images.flyer ? (
                  <img className={`ed-ev-inv-img fit-${invFit}`} src={images.flyer} alt="" />
                ) : (
                  <div className="ed-ev-inv-placeholder">
                    <div className="ed-ev-ph-names" style={typoStyle('title')} dangerouslySetInnerHTML={{ __html: (names || 'Nombres').replace(/&/g, '<br>&<br>') }} />
                    <div className="ed-ev-ph-copy">Queremos festejar contigo<br />este día especial…</div>
                  </div>
                )}
              </div>
              <div className="ed-ev-right">
                {MODULE_DEFS.filter(d => modules[d.key].active).map(d => (
                  <div key={d.key} className="ed-ev-nav-item" style={{ background: frames.nav.on ? frames.nav.color : 'transparent', boxShadow: frames.nav.on ? '0 1px 6px rgba(42,31,26,.07)' : 'none' }}>
                    <div className={`ed-ev-nav-icon mod-${d.key}`}>{d.icon}</div>
                    <div className="ed-ev-nav-body">
                      <div className="ed-ev-nav-title" style={{ ...typoStyle('label'), fontSize: Math.min(typography.label.size, 13) + 'px' }}>{modules[d.key].label || '—'}</div>
                      <div className="ed-ev-nav-sub">{d.sub}</div>
                    </div>
                    <div className="ed-ev-nav-arrow">›</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="ed-ev-qr-block" style={{ background: frames.qr.on ? frames.qr.color : 'transparent', boxShadow: frames.qr.on ? '0 1px 6px rgba(42,31,26,.07)' : 'none' }}>
              <div className="ed-ev-qr-square">
                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(appEventUrl(eventId))}`} alt="QR" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              </div>
              <div className="ed-ev-qr-label">Comparte el evento</div>
            </div>
          </div>
          <div className="ed-preview-hint">Este es el link que recibirán tus invitados.<br />Cada cambio se refleja al instante.</div>
        </div>
      </div>

      {/* ── Modal descartar evento nuevo ── */}
      {showDiscardModal && (
        <div style={{
          position:'fixed', inset:0, zIndex:300,
          background:'rgba(6,17,29,0.65)',
          display:'flex', alignItems:'center', justifyContent:'center', padding:24,
        }}>
          <div style={{
            background:'#fff', borderRadius:16, padding:'28px 24px',
            width:'100%', maxWidth:360,
            boxShadow:'0 24px 60px rgba(0,0,0,0.25)',
            textAlign:'center',
          }}>
            <div style={{ fontSize:32, marginBottom:12 }}>🗑</div>
            <h3 style={{ fontFamily:"'Tenor Sans',sans-serif", fontSize:18, fontWeight:400, color:'#0F1E35', marginBottom:8 }}>
              ¿Descartar este evento?
            </h3>
            <p style={{ fontSize:13, color:'#8A837A', marginBottom:24, lineHeight:1.6 }}>
              El evento no tiene cambios guardados.<br />Se eliminará permanentemente.
            </p>
            <div style={{ display:'flex', gap:10, justifyContent:'center' }}>
              <button
                onClick={() => setShowDiscardModal(false)}
                style={{ background:'none', border:'1px solid #E0E0E0', borderRadius:8, padding:'10px 20px', fontSize:13, fontFamily:"'DM Sans',sans-serif", cursor:'pointer', color:'#4A4540' }}
              >
                Seguir editando
              </button>
              <button
                onClick={handleDiscard}
                style={{ background:'#C0392B', border:'none', borderRadius:8, padding:'10px 20px', fontSize:13, fontFamily:"'DM Sans',sans-serif", cursor:'pointer', color:'#fff', fontWeight:500 }}
              >
                Sí, descartar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
