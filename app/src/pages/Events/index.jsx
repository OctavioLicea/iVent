// Página: Events — app/src/pages/Events/index.jsx
// Cambio: agregar thumbnail (flyer_url / bg_url) a cada card de evento
// 2026-06-12 20:10
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

const C = {
  navy:      '#0F1E35',
  navyMid:   '#1E3352',
  gold:      '#C9A84C',
  goldDark:  '#A8832A',
  goldLight: 'rgba(201,168,76,0.12)',
  ink:       '#1A1714',
  inkMute:   '#8A837A',
  border:    'rgba(15,30,53,0.10)',
  surface:   '#fff',
  bg:        '#F4F5F7',
  green:     '#2D7A4F',
  greenBg:   '#EEF7F2',
}

function statusLabel(event) {
  // Por ahora derivamos el status de la fecha
  const today = new Date()
  const start = event.start_date ? new Date(event.start_date) : null
  if (!start) return { label: 'Borrador', bg: C.bg, color: C.inkMute }
  const diff = (start - today) / (1000 * 60 * 60 * 24)
  if (diff < -1)  return { label: 'Finalizado', bg: '#F4F5F7',    color: C.inkMute }
  if (diff <= 1)  return { label: 'Live',        bg: C.greenBg,    color: C.green }
  if (diff <= 30) return { label: 'En prep.',    bg: C.goldLight,  color: C.goldDark }
  return              { label: 'Borrador',    bg: C.bg,         color: C.inkMute }
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function Events() {
  const [events,  setEvents]  = useState([])
  const [loading, setLoading] = useState(true)
  const [user,    setUser]    = useState(null)
  const [creating, setCreating] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user))
    loadEvents()
  }, [])

  async function loadEvents() {
    const { data, error } = await supabase
      .from('events')
      .select('id, name, title, start_date, venue, flyer_url, bg_url')
      .order('start_date', { ascending: true })
    if (!error && data) setEvents(data)
    setLoading(false)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  async function handleNewEvent() {
    setCreating(true)
    const { data, error } = await supabase
      .from('events')
      .insert({
        name: 'Nuevo evento',
        title: 'Nuevo evento',
        created_by: user?.id,
        start_date: new Date().toISOString().slice(0, 10),
      })
      .select('id')
      .single()
    setCreating(false)
    if (error) { alert('Error al crear evento: ' + error.message); return }
    navigate(`/event-designer/${data.id}`)
  }

  function getInitials(email) {
    if (!email) return '?'
    return email.slice(0, 2).toUpperCase()
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Tenor+Sans&family=DM+Sans:wght@300;400;500&display=swap');
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
          cursor:pointer;
          transition:color .15s;
          padding:0;
        }
        .logout-btn:hover { color:#EDE0CB; }

        .new-btn {
          background:${C.navy}; color:${C.gold};
          border:none; border-radius:8px;
          padding:9px 18px;
          font-family:'Tenor Sans',sans-serif;
          font-size:12px; letter-spacing:0.1em;
          cursor:pointer;
          transition:background .15s;
        }
        .new-btn:hover { background:${C.navyMid}; }

        .card-action-btn {
          background:none;
          border:0.5px solid ${C.border};
          border-radius:6px;
          padding:5px 10px;
          font-family:'DM Sans',sans-serif;
          font-size:11px;
          color:${C.inkMute};
          cursor:pointer;
          white-space:nowrap;
          transition:border-color .15s, color .15s, background .15s;
        }
        .card-action-btn:hover {
          border-color:${C.gold};
          color:${C.goldDark};
          background:${C.goldLight};
        }
      `}</style>

      {/* Topnav */}
      <nav style={{
        background: C.navy,
        padding: '0 32px',
        height: 52,
        display: 'flex',
        alignItems: 'center',
        gap: 0,
        borderBottom: '0.5px solid rgba(255,255,255,0.06)',
      }}>
        {/* Logo */}
        <img
          src="/ivent_logo_transp.png"
          alt="iVent"
          style={{ height:28, filter:'invert(1) brightness(10)', mixBlendMode:'screen', cursor:'pointer' }}
          onClick={() => navigate('/events')}
        />

        {/* Separador */}
        <div style={{ width:'0.5px', height:18, background:'rgba(255,255,255,0.15)', margin:'0 20px' }} />

        {/* Breadcrumb */}
        <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:'rgba(237,224,203,0.55)' }}>
          Mis eventos
        </span>

        {/* Spacer */}
        <div style={{ flex:1 }} />

        {/* User chip */}
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

        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:28 }}>
          <div>
            <h1 style={{ fontFamily:"'Tenor Sans',sans-serif", fontSize:26, fontWeight:400, color:C.navy, letterSpacing:'-0.01em' }}>
              Mis eventos
            </h1>
            {!loading && (
              <p style={{ fontSize:12, color:C.inkMute, marginTop:4 }}>
                {events.length} evento{events.length !== 1 ? 's' : ''} creado{events.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>
          <button className="new-btn" onClick={handleNewEvent} disabled={creating}>
            {creating ? 'Creando…' : '+ Nuevo evento'}
          </button>
        </div>

        {/* Lista */}
        {loading ? (
          <p style={{ fontSize:13, color:C.inkMute, textAlign:'center', padding:'40px 0' }}>Cargando…</p>
        ) : events.length === 0 ? (
          <div style={{ textAlign:'center', padding:'60px 0' }}>
            <p style={{ fontSize:32, marginBottom:12 }}>🎉</p>
            <p style={{ fontFamily:"'Tenor Sans',sans-serif", fontSize:18, color:C.navy, marginBottom:8 }}>No tienes eventos aún</p>
            <p style={{ fontSize:13, color:C.inkMute }}>Crea tu primer evento con el botón de arriba.</p>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {events.map(event => {
              const st = statusLabel(event)
              return (
                <div
                  key={event.id}
                  className="event-card"
                  onClick={() => navigate(`/event-designer/${event.id}`)}
                >
                  <div className="event-thumb" style={{
                    backgroundImage: `url("${event.flyer_url || event.bg_url || ''}")`,
                  }}>
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
                    <button
                      className="card-action-btn"
                      onClick={(e) => { e.stopPropagation(); navigate(`/e/${event.id}`) }}
                    >
                      Ver portada
                    </button>
                    <button
                      className="card-action-btn"
                      onClick={(e) => { e.stopPropagation(); navigate(`/event-designer/${event.id}`) }}
                    >
                      Editar evento
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
