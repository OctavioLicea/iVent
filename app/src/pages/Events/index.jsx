// Página: Events — app/src/pages/Events/index.jsx
// Razón: modal de tipo de evento al crear; config default elegante (marino, módulos OFF, maps OFF)
// 2026-06-25 20:10

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import iventLogo from '../../assets/ivent-logo-light.svg'
import { appEventPath, BRAND as C } from '../../lib/constants'
import { formatDate, PALETTES, DEFAULT_TYPOGRAPHY } from '../../lib/eventHelpers'

// ─── Paleta default por tipo de evento ───────────────────────────────────
const PALETTE_BY_SLUG = {
  boda:        'boda',      // Romance — vino & kraft
  xv:          'quince',    // Lila & Rosa
  graduacion:  'botanico',  // Jardín — verde & crema
  escolar:     'botanico',
  social:      'marino',    // Marino & Oro (default para el resto)
  deportivo:   'marino',
  politico:    'marino',
  empresarial: 'marino',
  otro:        'marino',
}

const TITLE_BY_SLUG = {
  boda:        'Mi boda',
  xv:          'Mis XV Años',
  graduacion:  'Mi graduación',
  deportivo:   'Mi evento',
  escolar:     'Mi evento',
  politico:    'Mi evento',
  empresarial: 'Mi evento',
  social:      'Mi celebración',
  otro:        'Mi evento',
}

function buildDefaultConfig(slug) {
  const paletteKey = PALETTE_BY_SLUG[slug] || 'marino'
  const palette    = PALETTES[paletteKey]
  return {
    palette,
    typography: DEFAULT_TYPOGRAPHY,
    frames: {
      inv:     { color: palette.kraft,       on: true  },
      nav:     { color: palette.surface,     on: true  },
      qr:      { color: palette.surface2,    on: true  },
      maps_a:  { color: palette.primaryDark },
      maps_b:  { color: palette.accent      },
      maps_on: false,   // OFF — se activa cuando el org. pega una URL
    },
    modules: {
      fotos:   false,   // El org. activa uno por uno
      collage: false,
      crono:   false,
      deseos:  false,
      mesas:   false,
    },
  }
}

// ─── Status chip ─────────────────────────────────────────────────────────
function statusLabel(event) {
  const today = new Date()
  const start = event.start_date ? new Date(event.start_date) : null
  if (!start) return { label: 'Borrador', bg: C.bg, color: C.inkMute }
  const diff = (start - today) / (1000 * 60 * 60 * 24)
  if (diff < -1)  return { label: 'Finalizado', bg: '#F4F5F7',   color: C.inkMute }
  if (diff <= 1)  return { label: 'Live',        bg: C.greenBg,   color: C.green   }
  if (diff <= 30) return { label: 'En prep.',    bg: C.goldLight, color: C.goldDark }
  return              { label: 'Borrador',    bg: C.bg,        color: C.inkMute }
}

// ─── Modal de tipo de evento ──────────────────────────────────────────────
function TypeModal({ eventTypes, onConfirm, onCancel, creating }) {
  const [selected, setSelected] = useState(null)

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(6,17,29,0.65)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24,
    }}>
      <div style={{
        background: C.surface, borderRadius: 16,
        padding: '32px 28px', width: '100%', maxWidth: 480,
        boxShadow: '0 24px 60px rgba(0,0,0,0.25)',
      }}>
        <h2 style={{
          fontFamily: "'Tenor Sans', sans-serif", fontSize: 20,
          fontWeight: 400, color: C.navy, marginBottom: 6,
        }}>
          ¿Qué tipo de evento es?
        </h2>
        <p style={{ fontSize: 13, color: C.inkMute, marginBottom: 24 }}>
          Esto define la paleta y el diseño inicial.
        </p>

        {/* Grid de tipos */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 28,
        }}>
          {eventTypes.map(t => (
            <button
              key={t.id}
              onClick={() => setSelected(t)}
              style={{
                border: selected?.id === t.id
                  ? `2px solid ${C.navy}`
                  : `1.5px solid ${C.border}`,
                borderRadius: 12,
                padding: '14px 8px',
                background: selected?.id === t.id ? C.bg : C.surface,
                cursor: 'pointer',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: 8,
                transition: 'border-color .12s, background .12s',
              }}
            >
              <span style={{ fontSize: 26 }}>{t.icon}</span>
              <span style={{
                fontSize: 12, fontFamily: "'DM Sans', sans-serif",
                color: selected?.id === t.id ? C.navy : C.inkMid,
                fontWeight: selected?.id === t.id ? 600 : 400,
              }}>{t.label}</span>
            </button>
          ))}
        </div>

        {/* Acciones */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', alignItems: 'center' }}>
          <button
            onClick={onCancel}
            style={{
              background: 'none', border: 'none',
              fontSize: 13, color: C.inkMute,
              fontFamily: "'DM Sans', sans-serif", cursor: 'pointer', padding: '8px 12px',
            }}
          >
            Cancelar
          </button>
          <button
            onClick={() => selected && onConfirm(selected)}
            disabled={!selected || creating}
            style={{
              background: selected ? C.navy : C.bg,
              color: selected ? C.gold : C.inkMute,
              border: 'none', borderRadius: 8,
              padding: '10px 22px',
              fontFamily: "'Tenor Sans', sans-serif",
              fontSize: 13, letterSpacing: '0.08em',
              cursor: selected && !creating ? 'pointer' : 'default',
              transition: 'background .15s',
            }}
          >
            {creating ? 'Creando…' : 'Crear evento'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────
export default function Events() {
  const [events,      setEvents]      = useState([])
  const [loading,     setLoading]     = useState(true)
  const [user,        setUser]        = useState(null)
  const [creating,    setCreating]    = useState(false)
  const [showArchived,setShowArchived] = useState(false)
  const [showModal,   setShowModal]   = useState(false)
  const [eventTypes,  setEventTypes]  = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user))
    loadEvents()
    loadEventTypes()
  }, [])

  async function loadEvents() {
    const { data, error } = await supabase
      .from('events')
      .select('id, name, title, start_date, venue, flyer_url, bg_url, archived')
      .order('start_date', { ascending: true })
    if (!error && data) setEvents(data)
    setLoading(false)
  }

  async function loadEventTypes() {
    const { data } = await supabase.from('event_types').select('id, slug, label, icon').order('id')
    if (data) setEventTypes(data)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  async function handleConfirmType(type) {
    setCreating(true)
    const slug    = type.slug
    const title   = TITLE_BY_SLUG[slug] || 'Mi evento'
    const config  = buildDefaultConfig(slug)

    const { data, error } = await supabase
      .from('events')
      .insert({
        name:       title,
        title:      title,
        created_by: user?.id,
        type_id:    type.id,
        start_date: new Date().toISOString().slice(0, 10),
        config,
      })
      .select('id')
      .single()

    setCreating(false)
    setShowModal(false)

    if (error) { alert('Error al crear evento: ' + error.message); return }
    navigate(`/event-designer/${data.id}?new=1`)
  }

  async function toggleArchived(eventId, current) {
    const { error } = await supabase.from('events').update({ archived: !current }).eq('id', eventId)
    if (!error) setEvents(prev => prev.map(e => e.id === eventId ? { ...e, archived: !current } : e))
  }

  function getInitials(email) {
    if (!email) return '?'
    return email.slice(0, 2).toUpperCase()
  }

  const archivedCount  = events.filter(e => e.archived).length
  const visibleEvents  = showArchived ? events : events.filter(e => !e.archived)

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
        html, body, #root { height:100%; }
        body { font-family:'DM Sans',sans-serif; background:${C.bg}; color:${C.ink}; }

        .event-card {
          background:${C.surface};
          border:0.5px solid ${C.border};
          border-radius:12px;
          padding:16px 20px;
          display:flex;
          justify-content:space-between;
          align-items:center;
          cursor:pointer;
          transition:box-shadow .15s, border-color .15s;
          text-decoration:none;
        }
        .event-card:hover {
          border-color:rgba(15,30,53,0.2);
          box-shadow:0 2px 16px rgba(15,30,53,0.07);
        }

        .event-thumb {
          width:48px; height:48px; border-radius:8px; flex-shrink:0;
          background-color:${C.bg};
          background-size:cover; background-position:center;
          display:flex; align-items:center; justify-content:center;
          font-size:20px; margin-right:14px;
        }

        .logout-btn {
          background:none; border:none;
          font-family:'DM Sans',sans-serif;
          font-size:13px; color:rgba(237,224,203,0.5);
          cursor:pointer; transition:color .15s; padding:0;
        }
        .logout-btn:hover { color:#EDE0CB; }

        .new-btn {
          background:${C.navy}; color:${C.gold};
          border:none; border-radius:8px;
          padding:9px 18px;
          font-family:'Tenor Sans',sans-serif;
          font-size:12px; letter-spacing:0.1em;
          cursor:pointer; transition:background .15s;
        }
        .new-btn:hover { background:${C.navyMid}; }

        .card-action-btn {
          background:none;
          border:0.5px solid ${C.border};
          border-radius:6px;
          padding:5px 10px;
          font-family:'DM Sans',sans-serif;
          font-size:11px; color:${C.inkMute};
          cursor:pointer; white-space:nowrap;
          transition:border-color .15s, color .15s, background .15s;
        }
        .card-action-btn:hover {
          border-color:${C.gold};
          color:${C.goldDark};
          background:${C.goldLight};
        }
      `}</style>

      {/* Modal de tipo */}
      {showModal && (
        <TypeModal
          eventTypes={eventTypes}
          onConfirm={handleConfirmType}
          onCancel={() => setShowModal(false)}
          creating={creating}
        />
      )}

      {/* Topnav */}
      <nav style={{
        background: C.navy, padding: '0 32px', height: 52,
        display: 'flex', alignItems: 'center', gap: 0,
        borderBottom: '0.5px solid rgba(255,255,255,0.06)',
      }}>
        <img src={iventLogo} alt="iVent" style={{ height:28, cursor:'pointer' }} onClick={() => navigate('/events')} />
        <div style={{ width:'0.5px', height:18, background:'rgba(255,255,255,0.15)', margin:'0 20px' }} />
        <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:'rgba(237,224,203,0.55)' }}>
          Mis eventos
        </span>
        <div style={{ flex:1 }} />
        {user && (
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, background:'rgba(255,255,255,0.06)', border:'0.5px solid rgba(255,255,255,0.1)', borderRadius:30, padding:'5px 12px 5px 6px' }}>
              <div style={{ width:26, height:26, borderRadius:'50%', background:C.goldLight, border:`0.5px solid rgba(201,168,76,0.3)`, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'DM Sans',sans-serif", fontSize:10, fontWeight:600, color:C.gold }}>
                {getInitials(user.email)}
              </div>
              <span style={{ fontSize:12, color:'rgba(237,224,203,0.7)', fontFamily:"'DM Sans',sans-serif" }}>
                {user.email}
              </span>
            </div>
            <button className="logout-btn" onClick={handleLogout}>Cerrar sesión</button>
          </div>
        )}
      </nav>

      {/* Content */}
      <div style={{ maxWidth:680, margin:'0 auto', padding:'40px 24px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:28 }}>
          <div>
            <h1 style={{ fontFamily:"'Tenor Sans',sans-serif", fontSize:26, fontWeight:400, color:C.navy, letterSpacing:'-0.01em' }}>
              Mis eventos
            </h1>
            {!loading && (
              <p style={{ fontSize:12, color:C.inkMute, marginTop:4 }}>
                {visibleEvents.length} evento{visibleEvents.length !== 1 ? 's' : ''}
                {archivedCount > 0 && (
                  <button onClick={() => setShowArchived(s => !s)} style={{ marginLeft:10, fontSize:11, color:C.goldDark, background:'none', border:'none', cursor:'pointer', fontFamily:"'DM Sans',sans-serif", textDecoration:'underline' }}>
                    {showArchived ? 'Ver activos' : `Ver todos (incl. ${archivedCount} ocultos)`}
                  </button>
                )}
              </p>
            )}
          </div>
          <button className="new-btn" onClick={() => setShowModal(true)} disabled={creating}>
            + Nuevo evento
          </button>
        </div>

        {loading ? (
          <p style={{ fontSize:13, color:C.inkMute, textAlign:'center', padding:'40px 0' }}>Cargando…</p>
        ) : visibleEvents.length === 0 ? (
          <div style={{ textAlign:'center', padding:'60px 0' }}>
            <p style={{ fontSize:32, marginBottom:12 }}>🎉</p>
            <p style={{ fontFamily:"'Tenor Sans',sans-serif", fontSize:18, color:C.navy, marginBottom:8 }}>
              {events.length === 0 ? 'No tienes eventos aún' : 'No tienes eventos activos'}
            </p>
            <p style={{ fontSize:13, color:C.inkMute }}>
              {events.length === 0 ? 'Crea tu primer evento con el botón de arriba.' : 'Todos tus eventos están ocultos.'}
            </p>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {visibleEvents.map(event => {
              const st = statusLabel(event)
              return (
                <div
                  key={event.id}
                  className="event-card"
                  style={{ opacity: event.archived ? 0.5 : 1 }}
                  onClick={() => navigate(`/event-designer/${event.id}`)}
                >
                  <div className="event-thumb" style={{ backgroundImage: `url("${event.flyer_url || event.bg_url || ''}")` }}>
                    {!event.flyer_url && !event.bg_url && '🎉'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily:"'Tenor Sans',sans-serif", fontSize:16, color:C.navy, marginBottom:4 }}>
                      {event.title || event.name}
                    </div>
                    <div style={{ fontSize:12, color:C.inkMute }}>
                      {formatDate(event.start_date)}
                      {event.venue ? ` · ${event.venue}` : ''}
                    </div>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <span style={{ fontSize:11, background:st.bg, color:st.color, padding:'3px 10px', borderRadius:20, fontFamily:"'DM Sans',sans-serif", whiteSpace:'nowrap' }}>
                      {st.label}
                    </span>
                    <button className="card-action-btn" onClick={(e) => { e.stopPropagation(); window.open(appEventPath(event.id), '_blank', 'noopener,noreferrer') }}>
                      Ver portada
                    </button>
                    <button className="card-action-btn" onClick={(e) => { e.stopPropagation(); navigate(`/event-designer/${event.id}`) }}>
                      Editar evento
                    </button>
                    <button className="card-action-btn" onClick={(e) => { e.stopPropagation(); toggleArchived(event.id, event.archived) }}>
                      {event.archived ? 'Mostrar' : 'Ocultar'}
                    </button>
                    <span style={{ color:C.inkMute, fontSize:18, lineHeight:1 }}>›</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
