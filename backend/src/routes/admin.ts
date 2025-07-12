import express from 'express'
import { body, validationResult } from 'express-validator'
import jwt from 'jsonwebtoken'
import AdminService from '../services/adminService'
import UserService from '../services/userService'
import EventService from '../services/eventService'
import CollegeService from '../services/collegeService'
import { adminAuth, requireSuperAdmin, requirePermissions, addCollegeFilter } from '../middleware/roleBasedAuth'

const router = express.Router()

// @route   POST /api/admin/login
// @desc    Admin login with username/email and password
// @access  Public
router.post('/login',
  [
    body('identifier').trim().notEmpty().withMessage('Username or email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
  ],
  async (req: express.Request, res: express.Response) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false, 
          message: 'Validation failed', 
          errors: errors.array() 
        })
      }

      const { identifier, password } = req.body

      // Find admin by username or email
      const adminByEmail = await AdminService.findByEmail(identifier.toLowerCase())
      const adminByUsername = await AdminService.findByUsername(identifier.toLowerCase())
      const admin = adminByEmail || adminByUsername
      
      if (!admin) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid credentials' 
        })
      }

      // Verify password
      const isValidPassword = await AdminService.comparePassword(admin, password)
      if (!isValidPassword) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid credentials' 
        })
      }

      // Check if admin is active
      if (!admin.isActive) {
        return res.status(400).json({ 
          success: false, 
          message: 'Account is deactivated' 
        })
      }

      // Update last login
      await AdminService.updateLastLogin(admin.id)

      // Generate JWT token
      const payload = {
        id: admin.id,
        username: admin.username,
        email: admin.email,
        role: admin.role,
        permissions: admin.permissions || [],
        assignedCollege: admin.assignedCollege
      }

      const token = jwt.sign(
        payload, 
        process.env.JWT_SECRET || 'fallback_secret',
        { expiresIn: '7d' }
      )

      res.json({
        success: true,
        message: 'Login successful',
        token,
        admin: {
          id: admin.id,
          username: admin.username,
          fullName: admin.fullName,
          email: admin.email,
          role: admin.role,
          permissions: admin.permissions || [],
          assignedCollege: admin.assignedCollege,
          tenureInfo: admin.tenureInfo
        }
      })

    } catch (error) {
      console.error('Admin login error:', error)
      res.status(500).json({ 
        success: false, 
        message: 'Server error during login' 
      })
    }
  }
)

// @route   GET /api/admin/profile
// @desc    Get admin profile information
// @access  Private
router.get('/profile', adminAuth, async (req, res) => {
  try {
    const admin = await AdminService.findById(req.admin!.id)
    if (!admin) {
      return res.status(404).json({ 
        success: false, 
        message: 'Admin not found' 
      })
    }

    res.json({
      success: true,
      admin: {
        id: admin.id,
        username: admin.username,
        fullName: admin.fullName,
        email: admin.email,
        role: admin.role,
        permissions: admin.permissions || [],
        assignedCollege: admin.assignedCollege,
        tenureInfo: admin.tenureInfo,
        isActive: admin.isActive
      }
    })
  } catch (error) {
    console.error('Admin profile fetch error:', error)
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    })
  }
})

// @route   PUT /api/admin/profile
// @desc    Update admin profile
// @access  Private
router.put('/profile', adminAuth, async (req, res) => {
  try {
    const { fullName, email } = req.body
    const adminId = req.admin!.id

    const admin = await AdminService.updateAdmin(adminId, { fullName, email })
    if (!admin) {
      return res.status(404).json({ 
        success: false, 
        message: 'Admin not found' 
      })
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      admin
    })
  } catch (error) {
    console.error('Admin profile update error:', error)
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    })
  }
})

// @route   POST /api/admin/change-password
// @desc    Change admin password
// @access  Private
router.post('/change-password',
  adminAuth,
  [
    body('currentPassword').isLength({ min: 6 }).withMessage('Current password is required'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
  ],
  async (req: express.Request, res: express.Response) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false, 
          message: 'Validation failed', 
          errors: errors.array() 
        })
      }

      const { currentPassword, newPassword } = req.body
      const adminId = req.admin!.id

      // Verify current password
      const isValidPassword = await AdminService.verifyPassword(adminId, currentPassword)
      if (!isValidPassword) {
        return res.status(400).json({ 
          success: false, 
          message: 'Current password is incorrect' 
        })
      }

      // Update password
      await AdminService.updatePassword(adminId, newPassword)

      res.json({
        success: true,
        message: 'Password updated successfully'
      })
    } catch (error) {
      console.error('Password change error:', error)
      res.status(500).json({ 
        success: false, 
        message: 'Server error' 
      })
    }
  }
)

// @route   GET /api/admin/dashboard
// @desc    Get admin dashboard statistics
// @access  Private
router.get('/dashboard', adminAuth, addCollegeFilter, async (req, res) => {
  try {
    const adminId = req.admin!.id
    const collegeId = req.admin!.assignedCollege

    // Get basic stats
    const [
      totalUsers,
      totalEvents,
      recentUsers,
      upcomingEvents
    ] = await Promise.all([
      collegeId ? UserService.getUserCount() : 0,
      collegeId ? EventService.getAllEvents().then(events => events.length) : 0,
      collegeId ? UserService.getAllUsers(1, 5).then(result => result.users) : [],
      collegeId ? EventService.getUpcomingEvents().then(events => events.slice(0, 5)) : []
    ])

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalEvents,
        recentUsers,
        upcomingEvents
      }
    })
  } catch (error) {
    console.error('Dashboard stats error:', error)
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    })
  }
})

// @route   GET /api/admin/admins
// @desc    Get all admins (super-admin only)
// @access  Private
router.get('/admins', adminAuth, requireSuperAdmin, async (req, res) => {
  try {
    const { role } = req.query
    
    let admins
    if (role && role !== 'all') {
      admins = await AdminService.getAdminsByRole(role as 'super-admin' | 'admin')
    } else {
      admins = await AdminService.getAllAdmins()
    }

    res.json({
      success: true,
      count: admins.length,
      admins
    })
  } catch (error) {
    console.error('Admins fetch error:', error)
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    })
  }
})

// @route   POST /api/admin/admins
// @desc    Create new admin (super-admin only)
// @access  Private
router.post('/admins', 
  adminAuth, 
  requireSuperAdmin,
  [
    body('username').trim().isLength({ min: 3, max: 20 }).withMessage('Username must be 3-20 characters'),
    body('email').isEmail().normalizeEmail().withMessage('Please include a valid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('fullName').trim().isLength({ min: 2 }).withMessage('Full name is required'),
    body('role').isIn(['admin', 'super-admin']).withMessage('Invalid role')
  ],
  async (req: express.Request, res: express.Response) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false, 
          message: 'Validation failed', 
          errors: errors.array() 
        })
      }

      const { username, email, password, fullName, role, assignedCollege } = req.body

      const admin = await AdminService.createAdmin({
        username,
        email,
        password,
        fullName,
        role: role || 'admin',
        assignedCollege
      })

      res.status(201).json({
        success: true,
        message: 'Admin created successfully',
        admin
      })
    } catch (error) {
      console.error('Admin creation error:', error)
      if (error instanceof Error && error.message.includes('already exists')) {
        return res.status(400).json({ 
          success: false, 
          message: error.message 
        })
      }
      res.status(500).json({ 
        success: false, 
        message: 'Server error' 
      })
    }
  }
)

// @route   PUT /api/admin/admins/:id
// @desc    Update admin account (super-admin only)
// @access  Private
router.put('/admins/:id', adminAuth, requireSuperAdmin, async (req, res) => {
  try {
    const { fullName, role, isActive, assignedCollege } = req.body
    const adminId = req.params.id

    const admin = await AdminService.updateAdmin(adminId, { 
      fullName, 
      role, 
      isActive,
      assignedCollege
    })

    if (!admin) {
      return res.status(404).json({ 
        success: false, 
        message: 'Admin not found' 
      })
    }

    res.json({
      success: true,
      message: 'Admin updated successfully',
      admin
    })
  } catch (error) {
    console.error('Admin update error:', error)
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    })
  }
})

// @route   DELETE /api/admin/admins/:id
// @desc    Delete admin (super-admin only)
// @access  Private
router.delete('/admins/:id', adminAuth, requireSuperAdmin, async (req, res) => {
  try {
    const result = await AdminService.deleteAdmin(req.params.id)
    
    if (!result) {
      return res.status(404).json({ 
        success: false, 
        message: 'Admin not found' 
      })
    }

    res.json({
      success: true,
      message: 'Admin deleted successfully'
    })
  } catch (error) {
    console.error('Admin deletion error:', error)
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    })
  }
})

// ============ USER MANAGEMENT (Admin) ============

// @route   GET /api/admin/users
// @desc    Get users for admin's assigned college
// @access  Admin
router.get('/users', adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, search, role } = req.query
    const admin = await AdminService.findById(req.admin!.id)
    if (!admin?.assignedCollege) {
      return res.status(403).json({ success: false, message: 'No college assignment found' })
    }
    const college = await CollegeService.findById(admin.assignedCollege.id)
    if (!college) {
      return res.status(403).json({ success: false, message: 'College not found' })
    }
    let users
    let totalCount = 0
    if (search) {
      users = await UserService.searchUsers(search as string)
      users = users.filter(user => user.college === college.name)
      totalCount = users.length
      const skip = (Number(page) - 1) * Number(limit)
      users = users.slice(skip, skip + Number(limit))
    } else {
      users = await UserService.getUsersByCollege(college.name)
      if (role && role !== 'all') {
        users = users.filter(user => user.role === role)
      }
      totalCount = users.length
      const skip = (Number(page) - 1) * Number(limit)
      users = users.slice(skip, skip + Number(limit))
    }
    res.json({
      success: true,
      users,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(totalCount / Number(limit)),
        totalCount,
        hasNext: (Number(page) - 1) * Number(limit) + users.length < totalCount,
        hasPrev: Number(page) > 1
      },
      college: {
        name: college.name,
        code: college.code,
        location: college.location
      }
    })
  } catch (error) {
    console.error('Error fetching users:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

// ============ EVENT MANAGEMENT (Admin) ============

// @route   GET /api/admin/events
// @desc    Get events for admin's assigned college
// @access  Admin
router.get('/events', adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, search, eventType } = req.query
    const admin = await AdminService.findById(req.admin!.id)
    if (!admin?.assignedCollege) {
      return res.status(403).json({ success: false, message: 'No college assignment found' })
    }
    let events
    let totalCount = 0
    if (search) {
      events = await EventService.searchEvents(search as string)
      const collegeId = admin.assignedCollege && typeof admin.assignedCollege === 'object' ? admin.assignedCollege.id : admin.assignedCollege
      if (!collegeId) {
        return res.status(403).json({ success: false, message: 'College ID not found' })
      }
      events = events.filter(event => event.targetCollege === collegeId)
      totalCount = events.length
    } else {
      const collegeId = admin.assignedCollege && typeof admin.assignedCollege === 'object' ? admin.assignedCollege.id : admin.assignedCollege
      if (!collegeId) {
        return res.status(403).json({ success: false, message: 'College ID not found' })
      }
      events = await EventService.getEventsByCollege(collegeId)
      totalCount = events.length
    }
    if (eventType && eventType !== 'all') {
      events = events.filter(event => event.eventType === eventType)
      totalCount = events.length
    }
    const skip = (Number(page) - 1) * Number(limit)
    events = events.slice(skip, skip + Number(limit))
    const eventsWithStats = await Promise.all(events.map(async (event) => {
      const registrations = await EventService.getEventRegistrations(event.id)
      return {
        ...event,
        registrationCount: registrations.filter(reg => reg.status === 'confirmed').length,
        waitlistCount: registrations.filter(reg => reg.status === 'waitlisted').length,
        availableSpots: await EventService.getAvailableSpots(event.id)
      }
    }))
    res.json({
      success: true,
      events: eventsWithStats,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(totalCount / Number(limit)),
        totalCount,
        hasNext: (Number(page) - 1) * Number(limit) + events.length < totalCount,
        hasPrev: Number(page) > 1
      }
    })
  } catch (error) {
    console.error('Error fetching events:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

export default router 