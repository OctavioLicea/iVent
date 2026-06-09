import { useParams } from 'react-router-dom'

function EventDesigner() {
  const { eventId } = useParams()

  return (
    <div>
      <h1>Event Designer</h1>
      <p>Event ID: {eventId}</p>
    </div>
  )
}

export default EventDesigner