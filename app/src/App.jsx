// Página: App — app/src/App.jsx
// Cambio: basename cambiado de "/ivent" a "/ivent/app" — la app funcional vive un nivel más adentro; /ivent a secas es la landing de venta
// 2026-06-19 19:30
import { BrowserRouter, Routes, Route } from 'react-router-dom'

// Organizador
import Login         from './pages/Login'
import Events        from './pages/Events'
import EventDesigner from './pages/EventDesigner'

// Invitado (rutas públicas)
import EventFrontPage from './pages/EventFrontPage'
import PhotoUpload    from './pages/PhotoUpload'
import LiveBoard      from './pages/LiveBoard'

function App() {
  return (
    <BrowserRouter basename="/ivent/app">
      <Routes>

        {/* ── Organizador ─────────────────────────────── */}
        <Route path="/"                            element={<Login />} />
        <Route path="/login"                       element={<Login />} />
        <Route path="/events"                      element={<Events />} />
        <Route path="/event-designer/:eventId"     element={<EventDesigner />} />

        {/* ── Invitado (públicas, sin auth) ───────────── */}
        <Route path="/e/:eventId"                  element={<EventFrontPage />} />
        <Route path="/e/:eventId/fotos"            element={<PhotoUpload />} />
        <Route path="/e/:eventId/liveboard"        element={<LiveBoard />} />

      </Routes>
    </BrowserRouter>
  )
}

export default App
