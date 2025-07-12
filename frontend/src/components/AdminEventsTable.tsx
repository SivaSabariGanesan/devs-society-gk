import React from 'react'

interface AdminEventsTableProps {
  events: any[]
  onView?: (event: any) => void
  onEdit?: (event: any) => void
  onDelete?: (eventId: string) => void
}

const AdminEventsTable: React.FC<AdminEventsTableProps> = ({ events, onView, onEdit, onDelete }) => {
  return (
    <div className="bg-white/5 border border-gray-700 rounded-xl p-6">
      <h3 className="text-xl font-bold text-white mb-6">Events</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-left border border-gray-700">
          <thead>
            <tr className="bg-gray-800">
              <th className="p-2">Title</th>
              <th className="p-2">Date</th>
              <th className="p-2">Location</th>
              <th className="p-2">Status</th>
              <th className="p-2">Attendees</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {events.map((event, idx) => (
              <tr key={event.id || idx} className="border-t border-gray-700">
                <td className="p-2">{event.title}</td>
                <td className="p-2">{event.date ? new Date(event.date).toLocaleDateString() : ''}</td>
                <td className="p-2">{event.location}</td>
                <td className="p-2">
                  {event.date && new Date(event.date) > new Date() ? (
                    <span className="text-green-400">Upcoming</span>
                  ) : (
                    <span className="text-gray-400">Past</span>
                  )}
                </td>
                <td className="p-2">{event.registrationCount ?? event.attendees ?? 0}</td>
                <td className="p-2">
                  <div className="flex gap-2">
                    {onView && <button className="p-2 bg-blue-600/20 text-blue-300 rounded-lg hover:bg-blue-600/30" title="View" onClick={() => onView(event)}>View</button>}
                    {onEdit && <button className="p-2 bg-purple-600/20 text-purple-300 rounded-lg hover:bg-purple-600/30" title="Edit" onClick={() => onEdit(event)}>Edit</button>}
                    {onDelete && <button className="p-2 bg-red-600/20 text-red-300 rounded-lg hover:bg-red-600/30" title="Delete" onClick={() => onDelete(event.id)}>Delete</button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default AdminEventsTable 