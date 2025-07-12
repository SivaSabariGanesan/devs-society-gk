import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye, 
  Calendar,
  MapPin,
  Users,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react'
import { eventsAPI } from '../../services/api'
import type { Event } from '../../services/api'

export function AdminEvents() {
  const [events, setEvents] = useState<Event[]>([])
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    date: '',
    location: '',
    maxAttendees: ''
  })

  useEffect(() => {
    loadEvents()
  }, [])

  useEffect(() => {
    filterEvents()
  }, [events, searchTerm])

  const loadEvents = async () => {
    try {
      const response = await eventsAPI.getEvents()
      if (response.success) {
        setEvents(response.events || [])
      }
    } catch (error) {
      console.error('Failed to load events:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filterEvents = () => {
    let filtered = events

    if (searchTerm) {
      filtered = filtered.filter(event =>
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.location.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredEvents(filtered)
  }

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await eventsAPI.createEvent({
        title: newEvent.title,
        description: newEvent.description,
        date: newEvent.date,
        location: newEvent.location,
        maxAttendees: newEvent.maxAttendees ? parseInt(newEvent.maxAttendees) : undefined
      })

      if (response.success) {
        setEvents([...events, response.event])
        setNewEvent({ title: '', description: '', date: '', location: '', maxAttendees: '' })
        setShowCreateForm(false)
      }
    } catch (error) {
      console.error('Failed to create event:', error)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const isUpcoming = (dateString: string) => {
    return new Date(dateString) > new Date()
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-white text-lg">Loading events...</div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-techie text-gradient mb-2">Event Management</h1>
          <p className="text-gray-400">Create and manage DEVS community events</p>
        </div>
        <Button 
          variant="gradient" 
          className="w-fit"
          onClick={() => setShowCreateForm(!showCreateForm)}
        >
          <Plus className="h-4 w-4" />
          Create New Event
        </Button>
      </div>

      {/* Create Event Form */}
      {showCreateForm && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="backdrop-glass rounded-xl p-6 border border-gradient-cyber"
        >
          <h2 className="text-xl font-bold text-white mb-4">Create New Event</h2>
          <form onSubmit={handleCreateEvent} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                placeholder="Event Title"
                value={newEvent.title}
                onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                required
              />
              <Input
                type="datetime-local"
                value={newEvent.date}
                onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                required
              />
              <Input
                placeholder="Location"
                value={newEvent.location}
                onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                required
              />
              <Input
                type="number"
                placeholder="Max Attendees (optional)"
                value={newEvent.maxAttendees}
                onChange={(e) => setNewEvent({ ...newEvent, maxAttendees: e.target.value })}
              />
            </div>
            <textarea
              placeholder="Event Description"
              value={newEvent.description}
              onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
              className="w-full h-24 px-4 py-3 rounded-lg border border-gray-700 bg-black/30 backdrop-blur-sm text-white placeholder:text-gray-400 focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400 resize-none"
              required
            />
            <div className="flex gap-2">
              <Button type="submit" variant="gradient">
                Create Event
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowCreateForm(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Search */}
      <div className="backdrop-glass rounded-xl p-6 border border-gradient-cyber">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <Input
              placeholder="Search events by title, description, or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4" />
            Filters
          </Button>
        </div>
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredEvents.map((event, index) => (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
            className="backdrop-glass rounded-xl p-6 border border-gradient-cyber hover:shadow-xl transition-all duration-300"
          >
            {/* Event Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="font-bold text-lg text-white mb-1">{event.title}</h3>
                <div className="flex items-center gap-4 text-sm text-gray-400">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {formatDate(event.date)}
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {event.location}
                  </div>
                </div>
              </div>
              <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                isUpcoming(event.date)
                  ? 'text-green-400 bg-green-500/20'
                  : 'text-gray-400 bg-gray-500/20'
              }`}>
                {isUpcoming(event.date) ? (
                  <CheckCircle className="h-3 w-3" />
                ) : (
                  <XCircle className="h-3 w-3" />
                )}
                {isUpcoming(event.date) ? 'Upcoming' : 'Past'}
              </div>
            </div>

            {/* Event Description */}
            <p className="text-gray-300 text-sm mb-4 line-clamp-2">{event.description}</p>

            {/* Event Stats */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1 text-sm text-gray-400">
                  <Users className="h-4 w-4" />
                  {event.attendees?.length || 0}
                  {event.maxAttendees && ` / ${event.maxAttendees}`}
                </div>
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                  event.isActive
                    ? 'text-green-400 bg-green-500/20'
                    : 'text-red-400 bg-red-500/20'
                }`}>
                  {event.isActive ? 'Active' : 'Inactive'}
                </div>
              </div>
            </div>

            {/* Progress Bar (if max attendees is set) */}
            {event.maxAttendees && (
              <div className="mb-4">
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>Registration Progress</span>
                  <span>{Math.round(((event.attendees?.length || 0) / event.maxAttendees) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-cyan-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(((event.attendees?.length || 0) / event.maxAttendees) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1">
                <Eye className="h-4 w-4" />
                View Details
              </Button>
              <Button variant="cyan" size="sm" className="flex-1">
                <Edit className="h-4 w-4" />
                Edit
              </Button>
              <Button variant="outline" size="sm" className="border-red-500/50 text-red-400 hover:bg-red-500/10">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* No Results */}
      {filteredEvents.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-lg mb-2">No events found</div>
          <p className="text-gray-500">Create your first event to get started</p>
        </div>
      )}

      {/* Stats */}
      <div className="backdrop-glass rounded-xl p-6 border border-gradient-cyber">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-white">{events.length}</div>
            <div className="text-sm text-gray-400">Total Events</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-400">
              {events.filter(e => isUpcoming(e.date)).length}
            </div>
            <div className="text-sm text-gray-400">Upcoming</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-cyan-400">
              {events.reduce((total, event) => total + (event.attendees?.length || 0), 0)}
            </div>
            <div className="text-sm text-gray-400">Total Attendees</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-400">
              {events.filter(e => e.isActive).length}
            </div>
            <div className="text-sm text-gray-400">Active Events</div>
          </div>
        </div>
      </div>
    </motion.div>
  )
} 