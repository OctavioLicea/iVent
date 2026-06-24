// Página: Login — app/src/pages/Login/index.jsx
// Cambio: panel de marca con sparkles, naipes de invitaciones, labels de eventos eliminados
// 2026-06-22 23:15

import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import iventLogo from '../../assets/ivent-logo-light.svg'
import inviteBoda from '../../assets/invite-boda.png'
import inviteGraduacion from '../../assets/invite-graduacion.png'

const C = {
  navy:        '#0F1E35',
  navyMid:     '#1E3352',
  navyDeep:    '#06111D',
  gold:        '#C9A84C',
  goldDark:    '#A8832A',
  goldLight:   'rgba(201,168,76,0.12)',
  inkMid:      '#4A4540',
  inkMute:     '#8A837A',
  border:      'rgba(15,30,53,0.12)',
  surfaceInput:'#F7F8FA',
  red:         '#C0392B',
  redLight:    '#FDF0EF',
  green:       '#2D7A4F',
  greenLight:  '#EEF7F2',
}

function Sparkles() {
  const canvasRef = useRef(null)
  useEffect(() => {
    const el = canvasRef.current
    if (!el) return
    const rnd = s => { const x = Math.sin(s) * 10000; return x - Math.floor(x) }
    const n = 38
    const dots = []
    for (let i = 0; i < n; i++) {
      dots.push({
        top:    rnd(i * 1.7 + 3) * 100,
        left:   rnd(i * 2.3 + 7) * 100,
        size:   1.5 + rnd(i * 3.1 + 1) * 3,
        tw:     2.4 + rnd(i * 1.3 + 5) * 3.6,
        dr:     7   + rnd(i * 0.9 + 2) * 9,
        delay:  -rnd(i * 4.2 + 6) * 6,
        bright: rnd(i * 5.5 + 4) > 0.72,
      })
    }
    dots.forEach(d => {
      const outer = document.createElement('div')
      outer.style.cssText = `position:absolute;top:${d.top}%;left:${d.left}%;animation:spDrift ${d.dr}s ease-in-out ${d.delay}s infinite;`
      const dot = document.createElement('div')
      const color = d.bright ? '#F4E2A6' : '#C9A84C'
      dot.style.cssText = `width:${d.size}px;height:${d.size}px;border-radius:50%;background:${color};box-shadow:0 0 ${d.size*2.5}px ${d.size*.8}px ${color};animation:spTwinkle ${d.tw}s ease-in-out ${d.delay}s infinite;`
      outer.appendChild(dot)
      el.appendChild(outer)
    })
  }, [])
  return <div ref={canvasRef} style={{ position:'absolute', inset:0, zIndex:1, pointerEvents:'none', overflow:'hidden' }} />
}

export default function Login() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('login')

  const [loginEmail,    setLoginEmail]    = useState('')
  const [loginPass,     setLoginPass]     = useState('')
  const [loginError,    setLoginError]    = useState(null)
  const [loginLoading,  setLoginLoading]  = useState(false)
  const [showLoginPass, setShowLoginPass] = useState(false)

  const [regEmail,   setRegEmail]   = useState('')
  const [regPass,    setRegPass]    = useState('')
  const [regPass2,   setRegPass2]   = useState('')
  const [regError,   setRegError]   = useState(null)
  const [regSuccess, setRegSuccess] = useState(false)
  const [regLoading, setRegLoading] = useState(false)
  const [showRegPass, setShowRegPass] = useState(false)

  const [resetEmail,   setResetEmail]   = useState('')
  const [resetMsg,     setResetMsg]     = useState(null)
  const [resetLoading, setResetLoading] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate('/events')
    })
  }, [])

  function isValidEmail(e) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim()) }
  function onKey(fn) { return (e) => { if (e.key === 'Enter') fn() } }

  async function handleLogin() {
    setLoginError(null)
    if (!isValidEmail(loginEmail) || !loginPass) { setLoginError('Ingresa tu correo y contraseña.'); return }
    setLoginLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email: loginEmail.trim(), password: loginPass })
    setLoginLoading(false)
    if (error) setLoginError('Correo o contraseña incorrectos.')
    else navigate('/events')
  }

  async function handleRegister() {
    setRegError(null); setRegSuccess(false)
    if (!isValidEmail(regEmail)) { setRegError('Ingresa un correo válido.'); return }
    if (regPass.length < 6) { setRegError('La contraseña debe tener al menos 6 caracteres.'); return }
    if (regPass !== regPass2) { setRegError('Las contraseñas no coinciden.'); return }
    setRegLoading(true)
    const { error } = await supabase.auth.signUp({ email: regEmail.trim(), password: regPass })
    setRegLoading(false)
    if (error) setRegError(error.message.includes('already') ? 'Este correo ya está registrado.' : error.message)
    else setRegSuccess(true)
  }

  async function handleReset() {
    setResetMsg(null)
    if (!isValidEmail(resetEmail)) { setResetMsg({ type:'err', text:'Ingresa un correo válido.' }); return }
    setResetLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail.trim())
    setResetLoading(false)
    if (error) setResetMsg({ type:'err', text:'No encontramos una cuenta con ese correo.' })
    else setResetMsg({ type:'ok', text:'Revisa tu correo. El enlace llega en menos de 2 minutos.' })
  }

  return (
    <>
      <style>{`
        @keyframes spTwinkle { 0%,100%{opacity:.15;transform:scale(.7)} 50%{opacity:1;transform:scale(1)} }
        @keyframes spDrift   { 0%{transform:translate(0,0)} 50%{transform:translate(10px,-26px)} 100%{transform:translate(0,0)} }

        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500;1,600&family=Tenor+Sans&family=DM+Sans:wght@300;400;500;600&display=swap');
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
        html, body, #root { height:100%; }
        body { font-family:'DM Sans',sans-serif; }

        .l-input {
          width:100%; padding:11px 14px;
          border-radius:8px;
          border:0.5px solid ${C.border};
          background:${C.surfaceInput};
          color:${C.navy};
          font-size:13px; font-family:'DM Sans',sans-serif;
          outline:none;
          transition:border-color .15s, box-shadow .15s;
        }
        .l-input:hover { border-color:rgba(15,30,53,0.25); }
        .l-input:focus { border-color:${C.gold}; background:#fff; box-shadow:0 0 0 3px ${C.goldLight}; }
        .l-input::placeholder { color:rgba(15,30,53,0.3); }

        .l-btn {
          width:100%; padding:12px;
          background:${C.navy}; color:${C.gold};
          border:none; border-radius:8px;
          font-family:'Tenor Sans',sans-serif;
          font-size:13px; letter-spacing:0.14em;
          cursor:pointer;
          transition:background .15s;
        }
        .l-btn:hover:not(:disabled) { background:${C.navyMid}; }
        .l-btn:disabled { opacity:0.55; cursor:default; }

        .l-tab {
          flex:1; padding:0 0 12px;
          background:none; border:none;
          border-bottom:2px solid transparent; margin-bottom:-1px;
          font-family:'DM Sans',sans-serif; font-size:13px; font-weight:500;
          color:${C.inkMute}; cursor:pointer;
          transition:color .15s, border-color .15s;
        }
        .l-tab.active { color:${C.navy}; border-bottom-color:${C.gold}; }
        .l-tab:hover:not(.active) { color:${C.inkMid}; }

        .naipe {
          position:absolute;
          width:52%;
          max-width:200px;
          border-radius:14px;
          overflow:hidden;
          box-shadow:0 20px 50px rgba(0,0,0,0.5);
          transition:transform .3s;
        }
        .naipe img { width:100%; display:block; }
        .naipe-back  { transform:rotate(-6deg) translate(-30px, 12px); z-index:1; }
        .naipe-front { transform:rotate(5deg)  translate(30px, -12px); z-index:2; }
        .naipes-wrap:hover .naipe-back  { transform:rotate(-9deg) translate(-38px, 18px); }
        .naipes-wrap:hover .naipe-front { transform:rotate(8deg)  translate(38px, -18px); }

        @media (max-width: 860px) {
          .brand-panel { display:none !important; }
          .l-layout { grid-template-columns:1fr !important; }
        }
      `}</style>

      <div className="l-layout" style={{ display:'grid', gridTemplateColumns:'1fr 460px', minHeight:'100vh', width:'100%' }}>

        {/* LEFT — Brand */}
        <div className="brand-panel" style={{
          background: `radial-gradient(120% 90% at 80% 10%, ${C.navyMid} 0%, ${C.navy} 50%, ${C.navyDeep} 100%)`,
          display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center',
          padding:48, position:'relative', overflow:'hidden', gap:40,
        }}>
          <Sparkles />

          {/* Logo */}
          <div style={{ position:'relative', zIndex:2, textAlign:'center' }}>
            <img src={iventLogo} alt="iVent" style={{ width:160, marginBottom:20 }} />
            <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:42, fontWeight:500, color:'#fff', lineHeight:1.2, marginBottom:14 }}>
              Cada evento,<br/>
              <em style={{ fontStyle:'italic', color:C.gold }}>un solo link.</em>
            </div>
            <p style={{ fontSize:14, color:'rgba(255,255,255,0.45)', lineHeight:1.7, maxWidth:340, margin:'0 auto' }}>
              Invitaciones digitales, fotos en vivo y gestión de invitados — todo en un lugar que tus invitados ya tienen en el bolsillo.
            </p>
          </div>

          {/* Naipes */}
          <div className="naipes-wrap" style={{ position:'relative', zIndex:2, width:'100%', height:340, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <div className="naipe naipe-back">
              <img src={inviteGraduacion} alt="Invitación graduación" />
            </div>
            <div className="naipe naipe-front">
              <img src={inviteBoda} alt="Invitación boda" />
            </div>
          </div>
        </div>

        {/* RIGHT — Form */}
        <div style={{ background:'#fff', borderLeft:`1px solid ${C.border}`, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'48px 40px' }}>
          <div style={{ width:'100%', maxWidth:360 }}>

            {tab !== 'reset' && (
              <div style={{ display:'flex', borderBottom:`1px solid ${C.border}`, marginBottom:28 }}>
                <button className={`l-tab${tab==='login' ? ' active' : ''}`} onClick={() => setTab('login')}>Iniciar sesión</button>
                <button className={`l-tab${tab==='register' ? ' active' : ''}`} onClick={() => setTab('register')}>Crear cuenta</button>
              </div>
            )}

            {/* LOGIN */}
            {tab === 'login' && (
              <div>
                <h1 style={s.heading}>Bienvenido, planner</h1>
                <p style={s.sub}>Ingresa a tu cuenta para gestionar tus eventos.</p>
                {loginError && <div style={s.alertErr}>{loginError}</div>}

                <div style={s.field}>
                  <label style={s.label}>Correo electrónico</label>
                  <input className="l-input" type="email" placeholder="tu@correo.com"
                    value={loginEmail} onChange={e => setLoginEmail(e.target.value)}
                    onKeyDown={onKey(handleLogin)} autoComplete="email" />
                </div>

                <div style={s.field}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:5 }}>
                    <label style={s.label}>Contraseña</label>
                    <button onClick={() => setTab('reset')} style={{ fontSize:11, color:C.goldDark, background:'none', border:'none', cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>
                      ¿Olvidaste tu contraseña?
                    </button>
                  </div>
                  <div style={{ position:'relative' }}>
                    <input className="l-input" type={showLoginPass ? 'text' : 'password'}
                      placeholder="••••••••" style={{ paddingRight:40 }}
                      value={loginPass} onChange={e => setLoginPass(e.target.value)}
                      onKeyDown={onKey(handleLogin)} autoComplete="current-password" />
                    <span onClick={() => setShowLoginPass(p => !p)} style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', cursor:'pointer', fontSize:15, color:C.inkMute }}>
                      {showLoginPass ? '🙈' : '👁'}
                    </span>
                  </div>
                </div>

                <button className="l-btn" onClick={handleLogin} disabled={loginLoading} style={{ marginTop:20 }}>
                  {loginLoading ? 'Entrando…' : 'Entrar'}
                </button>
              </div>
            )}

            {/* REGISTER */}
            {tab === 'register' && (
              <div>
                <h1 style={s.heading}>Crear cuenta</h1>
                <p style={s.sub}>Regístrate gratis y crea tu primer evento en minutos.</p>
                {regError   && <div style={s.alertErr}>{regError}</div>}
                {regSuccess && <div style={s.alertOk}>Cuenta creada. Revisa tu correo para confirmar.</div>}

                <div style={s.field}>
                  <label style={s.label}>Correo electrónico</label>
                  <input className="l-input" type="email" placeholder="tu@correo.com"
                    value={regEmail} onChange={e => setRegEmail(e.target.value)} autoComplete="email" />
                </div>

                <div style={s.field}>
                  <label style={s.label}>Contraseña</label>
                  <div style={{ position:'relative' }}>
                    <input className="l-input" type={showRegPass ? 'text' : 'password'}
                      placeholder="Mínimo 6 caracteres" style={{ paddingRight:40 }}
                      value={regPass} onChange={e => setRegPass(e.target.value)} />
                    <span onClick={() => setShowRegPass(p => !p)} style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', cursor:'pointer', fontSize:15, color:C.inkMute }}>
                      {showRegPass ? '🙈' : '👁'}
                    </span>
                  </div>
                </div>

                <div style={s.field}>
                  <label style={s.label}>Confirmar contraseña</label>
                  <input className="l-input" type="password" placeholder="Repite tu contraseña"
                    value={regPass2} onChange={e => setRegPass2(e.target.value)}
                    onKeyDown={onKey(handleRegister)} />
                </div>

                <button className="l-btn" onClick={handleRegister} disabled={regLoading} style={{ marginTop:20 }}>
                  {regLoading ? 'Creando cuenta…' : 'Crear cuenta'}
                </button>

                <p style={{ marginTop:20, fontSize:11, color:C.inkMute, textAlign:'center', lineHeight:1.6 }}>
                  Al registrarte aceptas los <span style={{ color:C.goldDark, cursor:'pointer' }}>Términos de uso</span> y la <span style={{ color:C.goldDark, cursor:'pointer' }}>Política de privacidad</span>.
                </p>
              </div>
            )}

            {/* RESET */}
            {tab === 'reset' && (
              <div>
                <button onClick={() => setTab('login')} style={{ fontSize:13, color:C.inkMute, background:'none', border:'none', cursor:'pointer', fontFamily:"'DM Sans',sans-serif", marginBottom:24, display:'flex', alignItems:'center', gap:6 }}>
                  ← Volver
                </button>
                <h1 style={s.heading}>Recuperar contraseña</h1>
                <p style={s.sub}>Ingresa tu correo y te enviaremos un enlace para restablecerla.</p>
                {resetMsg && <div style={resetMsg.type==='ok' ? s.alertOk : s.alertErr}>{resetMsg.text}</div>}

                <div style={s.field}>
                  <label style={s.label}>Correo electrónico</label>
                  <input className="l-input" type="email" placeholder="tu@correo.com"
                    value={resetEmail} onChange={e => setResetEmail(e.target.value)}
                    onKeyDown={onKey(handleReset)} />
                </div>

                <button className="l-btn" onClick={handleReset} disabled={resetLoading} style={{ marginTop:20 }}>
                  {resetLoading ? 'Enviando…' : 'Enviar enlace'}
                </button>
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  )
}

const s = {
  heading: { fontFamily:"'DM Sans',sans-serif", fontSize:26, fontWeight:500, color:'#0F1E35', marginBottom:6, letterSpacing:'-0.01em' },
  sub:     { fontSize:13, color:'#8A837A', marginBottom:24, lineHeight:1.6 },
  field:   { marginBottom:14 },
  label:   { display:'block', fontSize:11, fontWeight:500, color:'#4A4540', letterSpacing:'0.04em', marginBottom:5, textTransform:'uppercase' },
  alertErr:{ background:'#FDF0EF', color:'#C0392B', border:'1px solid rgba(192,57,43,0.15)', borderRadius:8, padding:'10px 12px', fontSize:12, marginBottom:18, lineHeight:1.5 },
  alertOk: { background:'#EEF7F2', color:'#2D7A4F', border:'1px solid rgba(45,122,79,0.15)',  borderRadius:8, padding:'10px 12px', fontSize:12, marginBottom:18, lineHeight:1.5 },
}
