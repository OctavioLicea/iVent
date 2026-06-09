import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Login from './pages/Login'
import Events from './pages/Events'
import EventDesigner from './pages/EventDesigner'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/events" element={<Events />} />
        <Route path="/event-designer/:eventId" element={<EventDesigner />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
