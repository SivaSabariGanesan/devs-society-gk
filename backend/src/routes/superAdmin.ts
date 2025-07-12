import express, { Request, Response } from 'express'
import { body, validationResult } from 'express-validator'
import { adminAuth, requireSuperAdmin, requirePermissions } from '../middleware/roleBasedAuth'
import AdminService from '../services/adminService'
import CollegeService from '../services/collegeService'
import UserService from '../services/userService'
import EventService from '../services/eventService'

const router = express.Router()

// All routes require super admin access
router.use(adminAuth, requireSuperAdmin)

// ============ COLLEGE MANAGEMENT ============

// @route   GET /api/superadmin/colleges
// @desc    Get all colleges with tenure head information
// @access  Super Admin
router.get('/colleges', async (req: Request, res: Response) => {
  try {
    const colleges = await CollegeService.getAllColleges()

    const collegesWithStats = await Promise.all(
      colleges.map(async (college) => {
        const [userCount, eventCount] = await Promise.all([
          UserService.getUsersByCollege(college.name).then(users => users.length),
          EventService.getEventsByCollege(college.id).then(events => events.length)
        ])

        return {
          ...college,
          stats: {
            totalUsers: userCount,
            totalEvents: eventCount
          }
        }
      })
    )

    res.json({
      success: true,
      count: colleges.length,
      colleges: collegesWithStats
    })
  } catch (error) {
    console.error('Error fetching colleges:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

// @route   POST /api/superadmin/colleges
// @desc    Create a new college
// @access  Super Admin
router.post('/colleges', [
  body('name').trim().isLength({ min: 2 }).withMessage('College name is required'),
  body('code').trim().isLength({ min: 2, max: 10 }).withMessage('College code (2-10 chars) is required'),
  body('location').trim().isLength({ min: 2 }).withMessage('Location is required'),
  body('address').trim().isLength({ min: 5 }).withMessage('Address is required'),
  body('contactInfo.email').isEmail().withMessage('Valid email is required'),
  body('contactInfo.phone').trim().isLength({ min: 10 }).withMessage('Valid phone number is required')
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Validation failed', 
        errors: errors.array() 
      })
    }

    const { name, code, location, address, contactInfo } = req.body

    const college = await CollegeService.createCollege({
      name,
      code: code.toUpperCase(),
      location,
      address,
      contactInfo
    })

    res.status(201).json({
      success: true,
      message: 'College created successfully',
      college
    })
  } catch (error) {
    console.error('Error creating college:', error)
    if (error instanceof Error && error.message.includes('already exists')) {
      return res.status(400).json({ 
        success: false, 
        message: error.message 
      })
    }
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

// @route   PUT /api/superadmin/colleges/:id
// @desc    Update college information
// @access  Super Admin
router.put('/colleges/:id', async (req: Request, res: Response) => {
  try {
    const { name, code, location, address, contactInfo, isActive } = req.body

    const college = await CollegeService.updateCollege(req.params.id, {
      name, 
      code: code?.toUpperCase(), 
      location, 
      address, 
      contactInfo, 
      isActive
    })

    if (!college) {
      return res.status(404).json({ 
        success: false, 
        message: 'College not found' 
      })
    }

    res.json({
      success: true,
      message: 'College updated successfully',
      college
    })
  } catch (error) {
    console.error('Error updating college:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

// @route   DELETE /api/superadmin/colleges/:id
// @desc    Soft delete college (sets isActive to false)
// @access  Super Admin
router.delete('/colleges/:id', async (req: Request, res: Response) => {
  try {
    // First check if college has active tenure head
    const college = await CollegeService.findById(req.params.id)
    if (!college) {
      return res.status(404).json({ 
        success: false, 
        message: 'College not found' 
      })
    }

    // Check if college has active tenure head using the new structure
    const collegesWithAdmin = await CollegeService.getAllColleges()
    const collegeWithAdmin = collegesWithAdmin.find(c => c.id === req.params.id)
    
    if (collegeWithAdmin?.currentTenureHeads && collegeWithAdmin.currentTenureHeads.length > 0) {
      const activeTenures = collegeWithAdmin.currentTenureHeads.filter(tenure => tenure.isActive)
      if (activeTenures.length > 0) {
        return res.status(400).json({ 
          success: false, 
          message: `Cannot delete college with active tenure heads: ${activeTenures.map(t => t.adminName).join(', ')}` 
        })
      }
    }

    const result = await CollegeService.deleteCollege(req.params.id)
    if (!result) {
      return res.status(404).json({ 
        success: false, 
        message: 'College not found' 
      })
    }

    res.json({
      success: true,
      message: 'College deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting college:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

// ============ ADMIN MANAGEMENT ============

// @route   POST /api/superadmin/admins
// @desc    Create admin with college assignment and batch year
// @access  Super Admin
router.post('/admins', [
  body('username').trim().isLength({ min: 3, max: 20 }).withMessage('Username must be 3-20 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Please include a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('fullName').trim().isLength({ min: 2 }).withMessage('Full name is required'),
  body('assignedCollege').isUUID().withMessage('Valid college ID is required for admin assignment'),
  body('batchYear').isInt({ min: 2000, max: 2030 }).withMessage('Valid batch year (2000-2030) is required')
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Validation failed', 
        errors: errors.array() 
      })
    }

    const { username, email, password, fullName, assignedCollege, batchYear } = req.body

    // Verify college exists
    const college = await CollegeService.findById(assignedCollege)
    if (!college) {
      return res.status(404).json({ 
        success: false, 
        message: 'College not found' 
      })
    }

    // Check if this batch year already has an admin for this college
    const existingAdmins = await AdminService.getAdminsByCollege(assignedCollege, true)
    const existingBatchAdmin = existingAdmins.find(admin => admin.batchYear === batchYear)
    if (existingBatchAdmin) {
      return res.status(400).json({ 
        success: false, 
        message: `Batch year ${batchYear} already has an admin assigned to ${college.name}` 
      })
    }

    // Create admin with college assignment and batch year
    const admin = await AdminService.createAdmin({
      username,
      email,
      password,
      fullName,
      assignedCollege,
      batchYear
    })

    res.status(201).json({
      success: true,
      message: 'Admin created successfully',
      admin
    })
  } catch (error) {
    console.error('Error creating admin:', error)
    if (error instanceof Error && error.message.includes('already exists')) {
      return res.status(400).json({ 
        success: false, 
        message: error.message 
      })
    }
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

// @route   POST /api/superadmin/assign-tenure
// @desc    Assign admin to college tenure
// @access  Super Admin
router.post('/assign-tenure', [
  body('adminId').isUUID().withMessage('Valid admin ID is required'),
  body('collegeId').isUUID().withMessage('Valid college ID is required'),
  body('startDate').optional().isISO8601().withMessage('Valid start date is required')
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Validation failed', 
        errors: errors.array() 
      })
    }

    const { adminId, collegeId, startDate } = req.body

    // Verify admin exists
    const admin = await AdminService.findById(adminId)
    if (!admin) {
      return res.status(404).json({ 
        success: false, 
        message: 'Admin not found' 
      })
    }

    // Verify college exists
    const college = await CollegeService.findById(collegeId)
    if (!college) {
      return res.status(404).json({ 
        success: false, 
        message: 'College not found' 
      })
    }

    // Assign admin to college
    const result = await AdminService.assignAdminToCollege(adminId, collegeId, startDate)
    if (!result) {
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to assign admin to college' 
      })
    }

    res.json({
      success: true,
      message: `Admin ${admin.fullName} assigned to ${college.name} successfully`
    })
  } catch (error) {
    console.error('Error assigning tenure:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

// @route   GET /api/superadmin/unassigned-admins
// @desc    Get all admins not currently assigned to any college
// @access  Super Admin
router.get('/unassigned-admins', async (req: Request, res: Response) => {
  try {
    const admins = await AdminService.getUnassignedAdmins()

    res.json({
      success: true,
      count: admins.length,
      admins
    })
  } catch (error) {
    console.error('Error fetching unassigned admins:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

// @route   GET /api/superadmin/admins
// @desc    Get all admins with college information
// @access  Super Admin
router.get('/admins', async (req: Request, res: Response) => {
  try {
    const admins = await AdminService.getAdminsByRole('admin')

    res.json({
      success: true,
      count: admins.length,
      admins
    })
  } catch (error) {
    console.error('Error fetching admins:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

// @route   DELETE /api/superadmin/admins/:id
// @desc    End admin tenure and deactivate admin
// @access  Super Admin
router.delete('/admins/:id', async (req: Request, res: Response) => {
  try {
    const admin = await AdminService.findById(req.params.id)
    if (!admin) {
      return res.status(404).json({ 
        success: false, 
        message: 'Admin not found' 
      })
    }

    // End tenure
    const result = await AdminService.endTenure(req.params.id)
    if (!result) {
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to end tenure' 
      })
    }

    res.json({
      success: true,
      message: 'Admin tenure ended and admin deactivated successfully'
    })
  } catch (error) {
    console.error('Error deleting admin:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

// @route   GET /api/superadmin/colleges/:id
// @desc    Get single college details
// @access  Super Admin  
router.get('/colleges/:id', async (req: Request, res: Response) => {
  try {
    const college = await CollegeService.findById(req.params.id)
    if (!college) {
      return res.status(404).json({ 
        success: false, 
        message: 'College not found' 
      })
    }

    res.json({
      success: true,
      college
    })
  } catch (error) {
    console.error('Error fetching college:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

// @route   GET /api/superadmin/admins/:id
// @desc    Get single admin details
// @access  Super Admin
router.get('/admins/:id', async (req: Request, res: Response) => {
  try {
    const admin = await AdminService.findById(req.params.id)
    if (!admin) {
      return res.status(404).json({ 
        success: false, 
        message: 'Admin not found' 
      })
    }

    res.json({
      success: true,
      admin
    })
  } catch (error) {
    console.error('Error fetching admin:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

// ============ USER MANAGEMENT (Global) ============

// @route   GET /api/superadmin/users
// @desc    Get all users across colleges with filtering
// @access  Super Admin
router.get('/users', async (req: Request, res: Response) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      search, 
      college, 
      role 
    } = req.query

    let users
    let totalCount = 0

    if (search) {
      users = await UserService.searchUsers(search as string)
      totalCount = users.length
      // Apply pagination to search results
      const skip = (Number(page) - 1) * Number(limit)
      users = users.slice(skip, skip + Number(limit))
    } else if (college) {
      users = await UserService.getUsersByCollege(college as string)
      totalCount = users.length
      // Apply pagination
      const skip = (Number(page) - 1) * Number(limit)
      users = users.slice(skip, skip + Number(limit))
    } else {
      const result = await UserService.getAllUsers(Number(page), Number(limit))
      users = result.users
      totalCount = result.totalCount
    }

    // Get statistics
    const totalUsers = await UserService.getUserCount()

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
      stats: {
        total: totalUsers
      }
    })
  } catch (error) {
    console.error('Error fetching users:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

// @route   GET /api/superadmin/users/:id
// @desc    Get single user details
// @access  Super Admin
router.get('/users/:id', async (req: Request, res: Response) => {
  try {
    const user = await UserService.findById(req.params.id)
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
    console.error('Error fetching user:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

// @route   PUT /api/superadmin/users/:id
// @desc    Update user information (super admin)
// @access  Super Admin
router.put('/users/:id', [
  body('fullName').optional().trim().isLength({ min: 2 }).withMessage('Full name must be at least 2 characters'),
  body('email').optional().isEmail().normalizeEmail().withMessage('Please include a valid email'),
  body('phone').optional().trim().isLength({ min: 10 }).withMessage('Phone must be at least 10 characters'),
  body('role').optional().isIn(['core-member', 'board-member', 'special-member', 'other']).withMessage('Invalid role'),
  body('isActive').optional().isBoolean().withMessage('isActive must be boolean')
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Validation failed', 
        errors: errors.array() 
      })
    }

    const { fullName, email, phone, role, isActive } = req.body

    // First verify user exists
    const existingUser = await UserService.findById(req.params.id)
    if (!existingUser) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      })
    }

    // Check if email is being changed and if it already exists
    if (email && email !== existingUser.email) {
      const userWithEmail = await UserService.findByEmail(email)
      if (userWithEmail && userWithEmail.id !== req.params.id) {
        return res.status(400).json({ 
          success: false, 
          message: 'Email already in use by another user' 
        })
      }
    }

    const user = await UserService.updateUser(req.params.id, { fullName, email, phone, role, isActive })
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      })
    }

    res.json({
      success: true,
      message: 'User updated successfully',
      user
    })
  } catch (error) {
    console.error('Error updating user:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

// ============ EVENT MANAGEMENT (Global) ============

// @route   GET /api/superadmin/events
// @desc    Get all events across colleges
// @access  Super Admin
router.get('/events', async (req: Request, res: Response) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      search, 
      college, 
      eventType 
    } = req.query

    let events
    let totalCount = 0

    if (search) {
      events = await EventService.searchEvents(search as string)
      totalCount = events.length
      // Apply pagination
      const skip = (Number(page) - 1) * Number(limit)
      events = events.slice(skip, skip + Number(limit))
    } else if (college) {
      events = await EventService.getEventsByCollege(college as string)
      totalCount = events.length
      // Apply pagination
      const skip = (Number(page) - 1) * Number(limit)
      events = events.slice(skip, skip + Number(limit))
    } else {
      events = await EventService.getAllEvents()
      totalCount = events.length
      // Apply pagination
      const skip = (Number(page) - 1) * Number(limit)
      events = events.slice(skip, skip + Number(limit))
    }

    // Add computed fields
    const eventsWithStats = await Promise.all(events.map(async (event) => {
      const registrations = await EventService.getEventRegistrations(event.id)
      return {
        ...event,
        registrationCount: registrations.filter(reg => reg.status === 'confirmed').length,
        waitlistCount: registrations.filter(reg => reg.status === 'waitlisted').length
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

// @route   POST /api/superadmin/events
// @desc    Create new global event
// @access  Super Admin
router.post('/events', [
  body('title').trim().isLength({ min: 3 }).withMessage('Title must be at least 3 characters'),
  body('description').trim().isLength({ min: 10 }).withMessage('Description must be at least 10 characters'),
  body('date').isISO8601().withMessage('Valid date is required'),
  body('location').trim().isLength({ min: 3 }).withMessage('Location must be at least 3 characters'),
  body('eventType').isIn(['workshop', 'seminar', 'competition', 'social', 'other', 'open-to-all']).withMessage('Invalid event type'),
  body('maxAttendees').optional().isInt({ min: 1 }).withMessage('Max attendees must be a positive number'),
  body('targetCollege').optional().isUUID().withMessage('Invalid college ID format')
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Validation failed', 
        errors: errors.array() 
      })
    }

    const { 
      title, 
      description, 
      date, 
      time, 
      location, 
      eventType, 
      category, 
      maxAttendees, 
      requirements, 
      prizes, 
      registrationDeadline,
      targetCollege 
    } = req.body

    const eventData = {
      title,
      description,
      date,
      time: time || '10:00',
      location,
      eventType: eventType || 'open-to-all',
      category: category || 'other',
      maxAttendees: maxAttendees || 100,
      requirements: requirements || [],
      prizes: prizes || [],
      registrationDeadline: registrationDeadline || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      targetCollege: targetCollege || null, // null means open to all colleges
      organizer: {
        adminId: req.admin!.id,
        name: req.admin!.username,
        contact: req.admin!.email
      }
    }

    const event = await EventService.createEvent(eventData)

    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      event
    })
  } catch (error) {
    console.error('Error creating event:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

// @route   GET /api/superadmin/events/:id
// @desc    Get single event details
// @access  Super Admin
router.get('/events/:id', async (req: Request, res: Response) => {
  try {
    const event = await EventService.findById(req.params.id)
    if (!event) {
      return res.status(404).json({ 
        success: false, 
        message: 'Event not found' 
      })
    }

    // Get registrations
    const registrations = await EventService.getEventRegistrations(req.params.id)

    res.json({
      success: true,
      event: {
        ...event,
        registrations
      }
    })
  } catch (error) {
    console.error('Error fetching event:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

// @route   DELETE /api/superadmin/events/:id
// @desc    Soft delete event (sets isActive to false)
// @access  Super Admin
router.delete('/events/:id', async (req: Request, res: Response) => {
  try {
    const result = await EventService.deleteEvent(req.params.id)
    
    if (!result) {
      return res.status(404).json({ 
        success: false, 
        message: 'Event not found' 
      })
    }

    res.json({
      success: true,
      message: 'Event deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting event:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

// @route   POST /api/superadmin/transfer-tenure
// @desc    Transfer admin tenure to different college
// @access  Super Admin
router.post('/transfer-tenure', [
  body('toAdminId').custom((value) => {
    if (value && value.length !== 36) {
      throw new Error('Valid admin ID is required')
    }
    return true
  }),
  body('collegeId').custom((value) => {
    if (value && value.length !== 36) {
      throw new Error('Valid college ID is required')
    }
    return true
  }),
  body('transferReason').trim().isLength({ min: 3 }).withMessage('Transfer reason is required')
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Validation failed', 
        errors: errors.array() 
      })
    }

    const { toAdminId, collegeId, transferReason } = req.body

    // Get target admin and college
    const [targetAdmin, targetCollege] = await Promise.all([
      AdminService.findById(toAdminId),
      CollegeService.findById(collegeId)
    ])

    if (!targetAdmin) {
      return res.status(404).json({ 
        success: false, 
        message: 'Target admin not found' 
      })
    }

    if (!targetCollege) {
      return res.status(404).json({ 
        success: false, 
        message: 'Target college not found' 
      })
    }

    // Transfer admin
    const result = await AdminService.transferAdmin(toAdminId, collegeId)
    if (!result) {
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to transfer admin' 
      })
    }

    res.json({
      success: true,
      message: 'Admin tenure transferred successfully',
      admin: targetAdmin,
      college: targetCollege
    })
  } catch (error) {
    console.error('Error transferring tenure:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

// @route   POST /api/superadmin/end-tenure
// @desc    End admin tenure
// @access  Super Admin
router.post('/end-tenure', [
  body('adminId').custom((value) => {
    if (value && value.length !== 36) {
      throw new Error('Valid admin ID is required')
    }
    return true
  }),
  body('reason').trim().isLength({ min: 3 }).withMessage('Reason is required')
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Validation failed', 
        errors: errors.array() 
      })
    }

    const { adminId, reason } = req.body

    const admin = await AdminService.findById(adminId)
    if (!admin) {
      return res.status(404).json({ 
        success: false, 
        message: 'Admin not found' 
      })
    }

    // End tenure
    const result = await AdminService.endTenure(adminId)
    if (!result) {
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to end tenure' 
      })
    }

    res.json({
      success: true,
      message: 'Tenure ended successfully',
      admin
    })
  } catch (error) {
    console.error('Error ending tenure:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

// @route   GET /api/superadmin/dashboard
// @desc    Get super admin dashboard statistics
// @access  Super Admin
router.get('/dashboard', async (req: Request, res: Response) => {
  try {
    const [
      totalColleges,
      totalAdmins,
      totalUsers,
      totalEvents
    ] = await Promise.all([
      CollegeService.getAllColleges().then(colleges => colleges.length),
      AdminService.getAdminsByRole('admin').then(admins => admins.length),
      UserService.getUserCount(),
      EventService.getAllEvents().then(events => events.length)
    ])

    res.json({
      success: true,
      stats: {
        totalColleges,
        totalAdmins,
        totalUsers,
        totalEvents
      }
    })
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

// @route   POST /api/superadmin/admins/transfer
// @desc    Transfer admin to different college with batch year
// @access  Super Admin
router.post('/admins/transfer', [
  body('toAdminId').isUUID().withMessage('Valid admin ID is required'),
  body('collegeId').isUUID().withMessage('Valid college ID is required'),
  body('batchYear').isInt({ min: 2000, max: 2030 }).withMessage('Valid batch year (2000-2030) is required'),
  body('transferReason').optional().isString().withMessage('Transfer reason must be a string')
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Validation failed', 
        errors: errors.array() 
      })
    }

    const { toAdminId, collegeId, batchYear, transferReason } = req.body

    // Verify admin exists
    const admin = await AdminService.findById(toAdminId)
    if (!admin) {
      return res.status(404).json({ 
        success: false, 
        message: 'Admin not found' 
      })
    }

    // Verify college exists
    const college = await CollegeService.findById(collegeId)
    if (!college) {
      return res.status(404).json({ 
        success: false, 
        message: 'College not found' 
      })
    }

    // Check if this batch year already has an admin for this college
    const existingAdmins = await AdminService.getAdminsByCollege(collegeId, true)
    const existingBatchAdmin = existingAdmins.find(a => a.batchYear === batchYear && a.id !== toAdminId)
    if (existingBatchAdmin) {
      return res.status(400).json({ 
        success: false, 
        message: `Batch year ${batchYear} already has an admin assigned to ${college.name}` 
      })
    }

    // Transfer admin to new college with batch year
    const success = await AdminService.assignAdminToCollege(toAdminId, collegeId, undefined, batchYear)
    
    if (success) {
      res.json({
        success: true,
        message: `Admin transferred to ${college.name} for batch ${batchYear} successfully`
      })
    } else {
      res.status(500).json({ 
        success: false, 
        message: 'Failed to transfer admin' 
      })
    }
  } catch (error) {
    console.error('Error transferring admin:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

export default router 