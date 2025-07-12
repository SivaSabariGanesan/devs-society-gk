import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Users, Calendar, Settings, BarChart3, LogOut, Menu, X, User, Bell } from 'lucide-react'
import axios from 'axios'
import AdminUsersTable from './AdminUsersTable'
import AdminEventsTable from './AdminEventsTable'
import UserModal from './UserModal'
import EventModal from './EventModal'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5050/api'

const RegularAdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [admin, setAdmin] = useState<any>(null)
  const [stats, setStats] = useState<any>(null)
  const [users, setUsers] = useState<any[]>([])
  const [events, setEvents] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [userModalOpen, setUserModalOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<any>(null)
  const [eventModalOpen, setEventModalOpen] = useState(false)
  const [eventModalMode, setEventModalMode] = useState<'view'|'edit'|'create'>('view')
  const [eventSearch, setEventSearch] = useState('')
  const [notification, setNotification] = useState<string|null>(null)

  useEffect(() => {
    loadAdminData()
  }, [])

  useEffect(() => {
    if (activeTab === 'users') loadUsers()
    if (activeTab === 'events') loadEvents()
  }, [activeTab])

  const loadAdminData = async () => {
    setIsLoading(true)
    setError('')
    try {
      const token = localStorage.getItem('adminToken')
      const [profileRes, statsRes] = await Promise.all([
        axios.get(`${API_BASE}/admin/profile`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_BASE}/admin/dashboard`, { headers: { Authorization: `Bearer ${token}` } })
      ])
      if (profileRes.data.success) setAdmin(profileRes.data.admin)
      if (statsRes.data.success) setStats(statsRes.data.stats)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error loading dashboard')
    } finally {
      setIsLoading(false)
    }
  }

  const loadUsers = async () => {
    setIsLoading(true)
    setError('')
    try {
      const token = localStorage.getItem('adminToken')
      const res = await axios.get(`${API_BASE}/admin/users`, { headers: { Authorization: `Bearer ${token}` } })
      if (res.data.success) setUsers(res.data.users)
      else setError('Failed to load users')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error loading users')
    } finally {
      setIsLoading(false)
    }
  }

  const loadEvents = async () => {
    setIsLoading(true)
    setError('')
    try {
      const token = localStorage.getItem('adminToken')
      const res = await axios.get(`${API_BASE}/admin/events`, { headers: { Authorization: `Bearer ${token}` }, params: eventSearch ? { search: eventSearch } : {} })
      if (res.data.success) setEvents(res.data.events)
      else setError('Failed to load events')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error loading events')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('adminToken')
    localStorage.removeItem('adminUser')
    window.location.href = '/admin/login'
  }

  // User CRUD handlers
  const handleViewUser = (user: any) => {
    setSelectedUser(user)
    setUserModalOpen(true)
  }
  const handleSaveUser = async (updatedUser: any) => {
    try {
      const token = localStorage.getItem('adminToken')
      await axios.put(`${API_BASE}/admin/users/${updatedUser.id}`, updatedUser, { headers: { Authorization: `Bearer ${token}` } })
      setUserModalOpen(false)
      loadUsers()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update user')
    }
  }
  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return
    try {
      const token = localStorage.getItem('adminToken')
      await axios.delete(`${API_BASE}/admin/users/${userId}`, { headers: { Authorization: `Bearer ${token}` } })
      setUserModalOpen(false)
      loadUsers()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete user')
    }
  }

  // Event CRUD handlers
  const handleViewEvent = (event: any) => {
    setSelectedEvent(event)
    setEventModalMode('view')
    setEventModalOpen(true)
  }
  const handleEditEvent = (event: any) => {
    setSelectedEvent(event)
    setEventModalMode('edit')
    setEventModalOpen(true)
  }
  const handleCreateEvent = () => {
    setSelectedEvent(null)
    setEventModalMode('create')
    setEventModalOpen(true)
  }
  const handleSaveEvent = async (eventData: any) => {
    try {
      const token = localStorage.getItem('adminToken')
      if (eventModalMode === 'create') {
        await axios.post(`${API_BASE}/admin/events`, eventData, { headers: { Authorization: `Bearer ${token}` } })
        setNotification('Event created successfully!')
      } else {
        await axios.put(`${API_BASE}/admin/events/${eventData.id}`, eventData, { headers: { Authorization: `Bearer ${token}` } })
        setNotification('Event updated successfully!')
      }
      setEventModalOpen(false)
      loadEvents()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save event')
    }
  }
  const handleDeleteEvent = async (eventId: string) => {
    if (!window.confirm('Are you sure you want to delete this event?')) return
    try {
      const token = localStorage.getItem('adminToken')
      await axios.delete(`${API_BASE}/admin/events/${eventId}`, { headers: { Authorization: `Bearer ${token}` } })
      setEventModalOpen(false)
      setNotification('Event deleted successfully!')
      loadEvents()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete event')
    }
  }

  const sidebarItems = [
    { id: 'overview', icon: BarChart3, label: 'Overview', color: 'purple' },
    { id: 'users', icon: Users, label: 'Users', color: 'cyan' },
    { id: 'events', icon: Calendar, label: 'Events', color: 'green' },
    { id: 'settings', icon: Settings, label: 'Settings', color: 'gray' },
  ]

  const renderOverview = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-purple-600/20 to-cyan-600/20 border border-purple-500/20 rounded-xl p-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full flex items-center justify-center">
            <User className="w-8 h-8 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-white">{admin?.fullName}</h2>
            <p className="text-purple-300 text-lg">{admin?.assignedCollege?.name || 'No College Assigned'}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-sm text-gold-300">Admin</span>
              <span className="text-sm text-gray-400">•</span>
              <span className="text-sm text-gray-300">{admin?.email}</span>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2 text-green-300 mb-1">
              <span className="text-sm font-medium">Active</span>
            </div>
            <div className="text-xs text-gray-400">
              {admin?.tenureInfo?.startDate ? `Since ${new Date(admin.tenureInfo.startDate).toLocaleDateString()}` : 'No tenure info'}
            </div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-r from-purple-600/20 to-purple-800/20 border border-purple-500/20 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-300 text-sm">Total Users</p>
              <p className="text-3xl font-bold text-white">{stats?.totalUsers || 0}</p>
            </div>
            <Users className="w-8 h-8 text-purple-400" />
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-gradient-to-r from-cyan-600/20 to-cyan-800/20 border border-cyan-500/20 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-cyan-300 text-sm">Recent Users</p>
              <p className="text-3xl font-bold text-white">{stats?.recentUsers?.length || 0}</p>
            </div>
            <User className="w-8 h-8 text-cyan-400" />
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-gradient-to-r from-green-600/20 to-green-800/20 border border-green-500/20 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-300 text-sm">Total Events</p>
              <p className="text-3xl font-bold text-white">{stats?.totalEvents || 0}</p>
            </div>
            <Calendar className="w-8 h-8 text-green-400" />
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-gradient-to-r from-blue-600/20 to-blue-800/20 border border-blue-500/20 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-300 text-sm">Upcoming Events</p>
              <p className="text-3xl font-bold text-white">{stats?.upcomingEvents?.length || 0}</p>
            </div>
            <Calendar className="w-8 h-8 text-blue-400" />
          </div>
        </motion.div>
      </div>
    </div>
  )

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview()
      case 'users':
        return <div>
          <AdminUsersTable users={users.map((user: any) => ({ ...user, actions: (
            <div className="flex gap-2">
              <button className="p-2 bg-blue-600/20 text-blue-300 rounded-lg hover:bg-blue-600/30" title="View/Edit" onClick={() => handleViewUser(user)}>
                View/Edit
              </button>
              <button className="p-2 bg-red-600/20 text-red-300 rounded-lg hover:bg-red-600/30" title="Delete" onClick={() => handleDeleteUser(user.id)}>
                Delete
              </button>
            </div>
          ) }))} />
          <UserModal user={selectedUser} open={userModalOpen} onClose={() => setUserModalOpen(false)} onSave={handleSaveUser} onDelete={handleDeleteUser} />
        </div>
      case 'events':
        return <div>
          <div className="mb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <button className="bg-purple-600 px-4 py-2 rounded text-white" onClick={handleCreateEvent}>Create Event</button>
            <input
              type="text"
              placeholder="Search events..."
              value={eventSearch}
              onChange={e => setEventSearch(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') loadEvents() }}
              className="p-2 rounded bg-gray-800 text-white border border-gray-700 w-full md:w-64"
            />
          </div>
          {notification && <div className="mb-4 text-green-400">{notification}</div>}
          <AdminEventsTable
            events={events}
            onView={handleViewEvent}
            onEdit={handleEditEvent}
            onDelete={handleDeleteEvent}
          />
          <EventModal
            event={selectedEvent}
            open={eventModalOpen}
            mode={eventModalMode}
            onClose={() => setEventModalOpen(false)}
            onSave={handleSaveEvent}
            onDelete={handleDeleteEvent}
          />
        </div>
      case 'settings':
        return <div className="text-white">Settings coming soon...</div>
      default:
        return renderOverview()
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-purple-500/20 border-t-purple-500 rounded-full animate-spin"></div>
          <p className="text-white">Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="flex">
        {/* Sidebar */}
        <div className={`${sidebarOpen ? 'block' : 'hidden'} lg:block fixed lg:relative z-30 h-screen w-64 transition-all duration-300`}>
          <div className="w-full h-full bg-white/5 border-r border-gray-700 backdrop-blur-xl overflow-y-auto">
            {/* Header */}
            <div className="p-6 border-b border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="font-bold text-white">Admin</h2>
                  <p className="text-sm text-gray-400">DEVS Society</p>
                </div>
              </div>
            </div>
            {/* Admin Info */}
            <div className="p-4 border-b border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">{admin?.fullName}</p>
                  <p className="text-xs text-cyan-400 font-medium">Regular Admin</p>
                </div>
              </div>
              {admin?.assignedCollege && (
                <div className="mt-2 p-2 bg-white/5 rounded-lg">
                  <div className="text-xs text-gray-400">Assigned to</div>
                  <div className="text-sm text-white font-medium">{admin.assignedCollege.name}</div>
                </div>
              )}
            </div>
            {/* Navigation */}
            <nav className="p-4">
              <ul className="space-y-2">
                {sidebarItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <li key={item.id}>
                      <button
                        onClick={() => setActiveTab(item.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
                          activeTab === item.id
                            ? `bg-${item.color}-600 text-white`
                            : 'text-gray-300 hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        {item.label}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </nav>
            {/* Logout */}
            <div className="absolute bottom-4 left-4 right-4">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2 text-red-300 hover:bg-red-500/10 rounded-lg transition-all"
              >
                <LogOut className="w-5 h-5" />
                Logout
              </button>
            </div>
          </div>
        </div>
        {/* Mobile Overlay */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-20 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        {/* Main Content */}
        <div className="flex-1 min-h-screen">
          {/* Header */}
          <header className="bg-white/5 border-b border-gray-700 p-4 lg:p-6 sticky top-0 z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="lg:hidden p-2 text-gray-400 hover:text-white transition-colors"
                >
                  {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-white capitalize flex items-center gap-2">
                    <User className="w-6 h-6 text-cyan-400" />
                    {activeTab.replace('-', ' ')}
                  </h1>
                  <p className="text-gray-400">
                    {activeTab === 'overview' && 'Admin dashboard overview and statistics'}
                    {activeTab === 'users' && 'Manage users from your assigned college'}
                    {activeTab === 'events' && 'Create and manage college-specific events'}
                    {activeTab === 'settings' && 'Admin settings'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <button className="p-2 text-gray-400 hover:text-white transition-colors">
                  <Bell className="w-6 h-6" />
                </button>
                <div className="text-sm text-gray-400">
                  Last login: {admin?.lastLogin ? new Date(admin.lastLogin).toLocaleDateString() : 'N/A'}
                </div>
              </div>
            </div>
          </header>
          {/* Content */}
          <main className="p-4 lg:p-6">
            {error ? (
              <div className="text-red-400">{error}</div>
            ) : (
              renderContent()
            )}
          </main>
        </div>
      </div>
    </div>
  )
}

export default RegularAdminDashboard 