import express from 'express'
import UserService from '../services/userService'
import auth from '../middleware/auth'
import EventService from '../services/eventService'

const router = express.Router()

// @route   GET /api/users/profile
// @desc    Get current user profile
// @access  Private
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await UserService.findById(req.user.id)
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      })
    }

    res.json({
      success: true,
      user
    })
  } catch (error) {
    console.error('Profile fetch error:', error)
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    })
  }
})

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', auth, async (req, res) => {
  try {
    const updates = req.body
    const allowedUpdates = ['fullName', 'phone', 'college', 'batchYear']
    const filteredUpdates: any = {}

    // Only allow certain fields to be updated
    allowedUpdates.forEach(field => {
      if (updates[field] !== undefined) {
        filteredUpdates[field] = updates[field]
      }
    })

    const user = await UserService.updateUser(req.user.id, filteredUpdates)
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      })
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user
    })
  } catch (error) {
    console.error('Profile update error:', error)
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    })
  }
})

// @route   DELETE /api/users/:id
// @desc    Delete user (soft delete)
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    // In a real app, you'd check if user has admin privileges
    const result = await UserService.deleteUser(req.params.id)
    
    if (!result) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      })
    }

    res.json({
      success: true,
      message: 'User deleted successfully'
    })
  } catch (error) {
    console.error('User deletion error:', error)
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    })
  }
})

// @route   GET /api/users
// @desc    Get all users (admin only)
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 50, search, role, college } = req.query
    
    let users
    let totalCount = 0
    
    if (search) {
      users = await UserService.searchUsers(search as string)
      totalCount = users.length
    } else if (college) {
      users = await UserService.getUsersByCollege(college as string)
      totalCount = users.length
    } else {
      const result = await UserService.getAllUsers(Number(page), Number(limit))
      users = result.users
      totalCount = result.totalCount
    }

    res.json({
      success: true,
      count: users.length,
      totalCount,
      users,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(totalCount / Number(limit)),
        hasNext: Number(page) * Number(limit) < totalCount,
        hasPrev: Number(page) > 1
      }
    })
  } catch (error) {
    console.error('Users fetch error:', error)
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    })
  }
})

// @route   GET /api/users/stats
// @desc    Get user statistics and dashboard data
// @access  Private
router.get('/stats', auth, async (req, res) => {
  try {
    const userId = req.user.id
    const user = await UserService.findById(userId)
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      })
    }

    // Get user's event registrations
    const registrations = await EventService.getUserRegistrations(userId)
    
    // Get event details for each registration
    const registrationsWithEvents = await Promise.all(
      registrations.map(async (reg) => {
        const event = await EventService.findById(reg.eventId)
        return { ...reg, event }
      })
    )
    
    // Calculate statistics
    const now = new Date()
    const eventsAttended = registrationsWithEvents.filter(reg => 
      reg.status === 'confirmed' && reg.event && new Date(reg.event.date) < now
    ).length
    
    const upcomingEvents = registrationsWithEvents.filter(reg => 
      reg.status === 'confirmed' && reg.event && new Date(reg.event.date) > now
    ).length
    
    const registeredEvents = registrationsWithEvents.filter(reg => 
      reg.status === 'confirmed'
    ).length
    
    const totalEvents = await EventService.getAllEvents().then(events => events.length)
    
    // Calculate member since date
    const memberSince = new Date(user.createdAt)
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    const memberSinceFormatted = `${monthNames[memberSince.getMonth()]} ${memberSince.getFullYear()}`
    
    // Calculate points (based on events attended and role)
    let points = eventsAttended * 10 // 10 points per event
    if (user.role === 'core-member') points += 100
    else if (user.role === 'board-member') points += 50
    else if (user.role === 'special-member') points += 25

    res.json({
      success: true,
      stats: {
        eventsAttended,
        upcomingEvents,
        memberSince: memberSinceFormatted,
        points,
        totalEvents,
        registeredEvents
      }
    })
  } catch (error) {
    console.error('User stats error:', error)
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    })
  }
})

// @route   GET /api/users/registrations
// @desc    Get user's event registrations
// @access  Private
router.get('/registrations', auth, async (req, res) => {
  try {
    const userId = req.user.id
    const registrations = await EventService.getUserRegistrations(userId)
    
    res.json({
      success: true,
      registrations
    })
  } catch (error) {
    console.error('User registrations error:', error)
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    })
  }
})

export default router 