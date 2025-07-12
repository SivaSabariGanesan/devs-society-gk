import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { 
  Search, 
  Filter, 
  UserPlus, 
  Edit, 
  Trash2, 
  Eye, 
  Crown,
  Mail,
  Phone,
  Building,
  Calendar,
  Shield
} from 'lucide-react'
import { usersAPI } from '../../services/api'
import type { User } from '../../services/api'

export function AdminUsers() {
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState('all')

  useEffect(() => {
    loadUsers()
  }, [])

  useEffect(() => {
    filterUsers()
  }, [users, searchTerm, filterRole])

  const loadUsers = async () => {
    try {
      const response = await usersAPI.getAllUsers()
      if (response.success) {
        setUsers(response.users || [])
      }
    } catch (error) {
      console.error('Failed to load users:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filterUsers = () => {
    let filtered = users

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.memberId.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filter by role
    if (filterRole !== 'all') {
      filtered = filtered.filter(user => user.role === filterRole)
    }

    setFilteredUsers(filtered)
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'core-member':
        return 'text-purple-400 bg-purple-500/20'
      case 'board-member':
        return 'text-cyan-400 bg-cyan-500/20'
      case 'special-member':
        return 'text-green-400 bg-green-500/20'
      default:
        return 'text-gray-400 bg-gray-500/20'
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'core-member':
        return <Crown className="h-4 w-4" />
      case 'board-member':
        return <Shield className="h-4 w-4" />
      default:
        return <Crown className="h-4 w-4" />
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-white text-lg">Loading users...</div>
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
          <h1 className="text-3xl font-bold font-techie text-gradient mb-2">User Management</h1>
          <p className="text-gray-400">Manage DEVS community members</p>
        </div>
        <Button variant="gradient" className="w-fit">
          <UserPlus className="h-4 w-4" />
          Add New User
        </Button>
      </div>

      {/* Filters */}
      <div className="backdrop-glass rounded-xl p-6 border border-gradient-cyber">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <Input
              placeholder="Search users by name, email, or member ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="px-4 py-3 rounded-lg border border-gray-700 bg-black/30 backdrop-blur-sm text-white focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400"
            >
              <option value="all">All Roles</option>
              <option value="core-member">Core Members</option>
              <option value="board-member">Board Members</option>
              <option value="special-member">Special Members</option>
              <option value="regular-member">Regular Members</option>
            </select>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4" />
              More Filters
            </Button>
          </div>
        </div>
      </div>

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredUsers.map((user, index) => (
          <motion.div
            key={user.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
            className="backdrop-glass rounded-xl p-6 border border-gradient-cyber hover:shadow-xl transition-all duration-300"
          >
            {/* User Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 flex items-center justify-center text-white font-bold">
                  {user.fullName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-semibold text-white">{user.fullName}</h3>
                  <p className="text-sm text-gray-400">{user.memberId}</p>
                </div>
              </div>
              <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                {getRoleIcon(user.role)}
                {user.role.replace('-', ' ')}
              </div>
            </div>

            {/* User Info */}
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <Mail className="h-4 w-4" />
                {user.email}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <Phone className="h-4 w-4" />
                {user.phone}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <Building className="h-4 w-4" />
                {user.college}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <Calendar className="h-4 w-4" />
                {user.batchYear}
              </div>
            </div>

            {/* Status */}
            <div className="mb-4">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                user.isActive 
                  ? 'text-green-400 bg-green-500/20' 
                  : 'text-red-400 bg-red-500/20'
              }`}>
                {user.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1">
                <Eye className="h-4 w-4" />
                View
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
      {filteredUsers.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-lg mb-2">No users found</div>
          <p className="text-gray-500">Try adjusting your search or filter criteria</p>
        </div>
      )}

      {/* Stats */}
      <div className="backdrop-glass rounded-xl p-6 border border-gradient-cyber">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-white">{users.length}</div>
            <div className="text-sm text-gray-400">Total Users</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-400">{users.filter(u => u.isActive).length}</div>
            <div className="text-sm text-gray-400">Active</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-400">{users.filter(u => u.role === 'core-member').length}</div>
            <div className="text-sm text-gray-400">Core Members</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-cyan-400">{users.filter(u => u.role === 'board-member').length}</div>
            <div className="text-sm text-gray-400">Board Members</div>
          </div>
        </div>
      </div>
    </motion.div>
  )
} 