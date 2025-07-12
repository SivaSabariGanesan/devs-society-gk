import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { ParticlesComponent } from '../components/particles'
import { Code, Calendar, MapPin, CheckCircle, Clock, LogOut, Users, Star, ExternalLink, ArrowLeft, Search, Filter, Plus, RefreshCw, AlertCircle, UserCheck, UserX, Calendar as CalendarIcon } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { eventsAPI } from '../services/api'
import type { Event } from '../services/api'

interface EventWithRegistration extends Event {
  isRegistered?: boolean
  registrationStatus?: 'registered' | 'waitlisted' | 'cancelled'
}

export function Events() {
  const { user, logout } = useAuth()
  const [events, setEvents] = useState<EventWithRegistration[]>([])
  const [filteredEvents, setFilteredEvents] = useState<EventWithRegistration[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState('all') // all, upcoming, past, registered
  const [registeringEventId, setRegisteringEventId] = useState<string | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    loadEvents()
  }, [])

  useEffect(() => {
    filterEvents()
  }, [events, searchTerm, filter])

  const loadEvents = async () => {
    try {
      setIsLoading(true)
      setError('')
      const response = await eventsAPI.getEvents()
      
      if (response.success) {
        // Get real registration status for each event
        const eventsWithRegistration = await Promise.all(
          response.events.map(async (event) => {
            try {
              const registrationResponse = await eventsAPI.checkRegistrationStatus(event.id)
              return {
                ...event,
                isRegistered: registrationResponse.success ? registrationResponse.isRegistered : false,
                registrationStatus: registrationResponse.success && registrationResponse.isRegistered 
                  ? registrationResponse.status 
                  : undefined
              }
            } catch (error) {
              console.error(`Failed to check registration status for event ${event.id}:`, error)
              return {
                ...event,
                isRegistered: false,
                registrationStatus: undefined
              }
            }
          })
        )
        setEvents(eventsWithRegistration)
      }
    } catch (error: any) {
      console.error('Failed to load events:', error)
      setError('Failed to load events. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const filterEvents = () => {
    let filtered = events

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(event =>
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.location.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filter by category
    const now = new Date()
    switch (filter) {
      case 'upcoming':
        filtered = filtered.filter(event => new Date(event.date) > now)
        break
      case 'past':
        filtered = filtered.filter(event => new Date(event.date) <= now)
        break
      case 'registered':
        filtered = filtered.filter(event => event.isRegistered)
        break
      default:
        // Show all events
        break
    }

    // Sort by date (upcoming first)
    filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    setFilteredEvents(filtered)
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await loadEvents()
    setIsRefreshing(false)
  }

  const handleRegister = async (eventId: string) => {
    if (!user) return

    setRegisteringEventId(eventId)
    try {
      const response = await eventsAPI.registerForEvent(eventId)
      if (response.success) {
        // Update local state
        setEvents(prev => prev.map(event => 
          event.id === eventId 
            ? { ...event, isRegistered: true, registrationStatus: 'registered' }
            : event
        ))
      }
    } catch (error: any) {
      console.error('Registration failed:', error)
      setError(error.response?.data?.message || 'Registration failed. Please try again.')
    } finally {
      setRegisteringEventId(null)
    }
  }

  const handleUnregister = async (eventId: string) => {
    if (!user) return

    setRegisteringEventId(eventId)
    try {
      const response = await eventsAPI.unregisterFromEvent(eventId)
      if (response.success) {
        // Update local state
        setEvents(prev => prev.map(event => 
          event.id === eventId 
            ? { ...event, isRegistered: false, registrationStatus: undefined }
            : event
        ))
      }
    } catch (error: any) {
      console.error('Unregistration failed:', error)
      setError(error.response?.data?.message || 'Unregistration failed. Please try again.')
    } finally {
      setRegisteringEventId(null)
    }
  }

  const handleLogout = () => {
    if (confirm('Are you sure you want to logout?')) {
      logout()
    }
  }

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'registered':
        return <UserCheck className="h-5 w-5 text-green-400" />
      case 'waitlisted':
        return <Clock className="h-5 w-5 text-yellow-400" />
      case 'cancelled':
        return <UserX className="h-5 w-5 text-red-400" />
      default:
        return <Clock className="h-5 w-5 text-gray-400" />
    }
  }

  const getStatusText = (status?: string) => {
    switch (status) {
      case 'registered':
        return 'Registered'
      case 'waitlisted':
        return 'Waitlisted'
      case 'cancelled':
        return 'Cancelled'
      default:
        return 'Not Registered'
    }
  }

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'registered':
        return 'text-green-400'
      case 'waitlisted':
        return 'text-yellow-400'
      case 'cancelled':
        return 'text-red-400'
      default:
        return 'text-gray-400'
    }
  }

  const isEventPast = (date: string) => {
    return new Date(date) < new Date()
  }

  const canRegister = (event: EventWithRegistration) => {
    return !isEventPast(event.date) && !event.isRegistered && event.isActive
  }

  const addToCalendar = (event: Event) => {
    const startDate = new Date(event.date)
    const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000) // Assume 2 hour duration
    
    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${startDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z/${endDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z&details=${encodeURIComponent(event.description)}&location=${encodeURIComponent(event.location)}`
    
    window.open(googleCalendarUrl, '_blank')
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading events...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden relative">
      <ParticlesComponent className="fixed inset-0" />
      
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-950/20 via-black to-cyan-950/20"></div>
      
      {/* Header */}
      <header className="relative z-10 p-6 border-b border-gray-800/50 backdrop-blur-md">
        <div className="container mx-auto flex justify-between items-center">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center gap-3"
          >
            <Link to="/portal">
              <Button variant="ghost" size="sm" className="text-gray-300 hover:text-cyan-400">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
            </Link>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 0 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="flex items-center gap-3"
          >
            <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-cyan-500 animate-pulse-glow">
              <Code className="h-8 w-8 text-white" />
            </div>
            <div>
              <span className="text-2xl font-bold font-techie">DEVS</span>
              <span className="text-lg text-gray-400 ml-2">Events</span>
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex items-center gap-4"
          >
            {/* Refresh Button */}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="text-gray-300 hover:text-cyan-400"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>

            <Link to="/card" className="text-sm text-gray-300 hover:text-cyan-400 transition-colors">
              My Card
            </Link>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleLogout}
              className="border-red-500/50 text-red-400 hover:bg-red-500/10 hover:text-red-300"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </motion.div>
        </div>
      </header>

      {/* Error Banner */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="relative z-10 bg-red-500/10 border-b border-red-500/30 p-3"
          >
            <div className="container mx-auto flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-400" />
                <p className="text-red-400 text-sm">{error}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setError('')} className="text-red-400 hover:text-red-300">
                ✕
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="relative z-10 container mx-auto px-6 py-12">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500/10 to-cyan-500/10 rounded-full px-6 py-2 border border-purple-500/20 mb-6">
            <Calendar className="h-5 w-5 text-purple-400" />
            <span className="text-sm text-purple-300 font-medium">Community Events</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold mb-6 font-techie">
            Upcoming <span className="text-gradient">Events</span>
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
            Join workshops, hackathons, and community gatherings. Connect with fellow developers and expand your skills.
          </p>
          
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: 120 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="h-1 bg-gradient-cyber mx-auto rounded-full"
          ></motion.div>
        </motion.div>

        {/* Filters and Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="backdrop-glass rounded-xl p-6 border border-gray-700 mb-8"
        >
          <div className="flex flex-col md:flex-row gap-4 items-center">
            {/* Search */}
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <Input
                type="text"
                placeholder="Search events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 form-field"
              />
            </div>

            {/* Filter Buttons */}
            <div className="flex gap-2">
              {[
                { value: 'all', label: 'All Events' },
                { value: 'upcoming', label: 'Upcoming' },
                { value: 'registered', label: 'My Events' },
                { value: 'past', label: 'Past' }
              ].map((filterOption) => (
                <Button
                  key={filterOption.value}
                  variant={filter === filterOption.value ? 'gradient' : 'ghost'}
                  size="sm"
                  onClick={() => setFilter(filterOption.value)}
                  className={filter === filterOption.value ? '' : 'text-gray-300 hover:text-cyan-400'}
                >
                  {filterOption.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Results count */}
          <div className="mt-4 text-sm text-gray-400">
            Showing {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''}
            {searchTerm && ` for "${searchTerm}"`}
          </div>
        </motion.div>

        {/* Events Grid */}
        {isLoading ? (
          <div className="space-y-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="backdrop-glass rounded-2xl p-8 border border-gray-700">
                  <div className="h-6 bg-gray-700 rounded w-1/3 mb-4"></div>
                  <div className="h-4 bg-gray-800 rounded w-full mb-2"></div>
                  <div className="h-4 bg-gray-800 rounded w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredEvents.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <Calendar className="h-16 w-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">No events found</h3>
            <p className="text-gray-500">
              {searchTerm ? `No events match "${searchTerm}"` : 'No events available at the moment'}
            </p>
          </motion.div>
        ) : (
          <div className="space-y-8">
            {filteredEvents.map((event, index) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 * index }}
                className="relative group"
              >
                <div className={`card-gradient rounded-2xl p-8 hover:scale-[1.02] transition-all duration-300 relative overflow-hidden ${
                  event.isRegistered ? 'border-2 border-green-400/30' : ''
                }`}>
                  {/* Registration status badge */}
                  {event.isRegistered && (
                    <div className="absolute top-4 right-4 bg-green-500/20 border border-green-400/30 rounded-full px-3 py-1 flex items-center gap-1">
                      <UserCheck className="h-3 w-3 text-green-400" />
                      <span className="text-xs text-green-400 font-medium">Registered</span>
                    </div>
                  )}

                  {/* Past event overlay */}
                  {isEventPast(event.date) && (
                    <div className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center">
                      <div className="text-center">
                        <Clock className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-400 font-medium">Event Ended</p>
                      </div>
                    </div>
                  )}

                  {/* Background decoration */}
                  <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-purple-400/10 to-transparent rounded-full blur-2xl"></div>
                  <div className="absolute bottom-0 right-0 w-24 h-24 bg-gradient-to-tl from-cyan-400/10 to-transparent rounded-full blur-2xl"></div>
                  
                  <div className="relative z-10">
                    <div className="flex flex-col lg:flex-row gap-8">
                      <div className="flex-1">
                        {/* Event header */}
                        <div className="mb-6">
                          <h3 className="text-2xl lg:text-3xl font-bold font-techie mb-2">{event.title}</h3>
                          
                          {/* Event meta info */}
                          <div className="grid md:grid-cols-2 gap-4 text-gray-300">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-5 w-5 text-cyan-400" />
                              <span>{new Date(event.date).toLocaleDateString('en-US', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}</span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <MapPin className="h-5 w-5 text-cyan-400" />
                              <span>{event.location}</span>
                            </div>

                            <div className="flex items-center gap-2">
                              <Users className="h-5 w-5 text-cyan-400" />
                              <span>
                                {event.attendees?.length || 0}
                                {event.maxAttendees && ` / ${event.maxAttendees}`} attendees
                              </span>
                            </div>

                            {event.registrationStatus && (
                              <div className="flex items-center gap-2">
                                {getStatusIcon(event.registrationStatus)}
                                <span className={getStatusColor(event.registrationStatus)}>
                                  {getStatusText(event.registrationStatus)}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Event description */}
                        <p className="text-gray-300 mb-6 leading-relaxed">
                          {event.description}
                        </p>

                        {/* Action buttons */}
                        <div className="flex flex-wrap gap-3">
                          {canRegister(event) ? (
                            <Button 
                              variant="gradient" 
                              onClick={() => handleRegister(event.id)}
                              disabled={registeringEventId === event.id}
                              className="group"
                            >
                              {registeringEventId === event.id ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                              ) : (
                                <Plus className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
                              )}
                              {registeringEventId === event.id ? 'Registering...' : 'Register'}
                            </Button>
                          ) : event.isRegistered && !isEventPast(event.date) ? (
                            <Button 
                              variant="outline" 
                              onClick={() => handleUnregister(event.id)}
                              disabled={registeringEventId === event.id}
                              className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                            >
                              {registeringEventId === event.id ? (
                                <div className="w-4 h-4 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin mr-2"></div>
                              ) : (
                                <UserX className="h-4 w-4 mr-2" />
                              )}
                              {registeringEventId === event.id ? 'Unregistering...' : 'Unregister'}
                            </Button>
                          ) : null}

                          <Button 
                            variant="outline" 
                            onClick={() => addToCalendar(event)}
                            className="border-cyan-400/50 text-cyan-400 hover:bg-cyan-500/10"
                          >
                            <CalendarIcon className="h-4 w-4 mr-2" />
                            Add to Calendar
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
} 