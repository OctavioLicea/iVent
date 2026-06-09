import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

function Events() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    async function loadEvents() {
      const { data, error } = await supabase
        .from('events')
        .select('id, name, start_date')

      if (!error) setEvents(data)
      setLoading(false)
    }

    loadEvents()
  }, [])

  if (loading) return <p>Cargando...</p>

  return (
    <div>
      <h1>Mis eventos</h1>
      {events.map(event => (
        <div key={event.id} onClick={() => navigate(`/event-designer/${event.id}`)} style={{ cursor: 'pointer' }}>
          <h2>{event.name}</h2>
          <p>{event.start_date}</p>
        </div>
      ))}
    </div>
  )
}

export default Events