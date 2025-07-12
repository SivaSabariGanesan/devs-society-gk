import express from 'express'
import { body, validationResult } from 'express-validator'
import EventService from '../services/eventService'
import UserService from '../services/userService'
import auth from '../middleware/auth'

const router = express.Router()

// @route   GET /api/events
// @desc    Get all active events
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { search, eventType, college } = req.query
    
    let events
    if (search) {
      events = await EventService.searchEvents(search as string)
    } else if (college) {
      events = await EventService.getEventsByCollege(college as string)
    } else {
      events = await EventService.getAllEvents()
    }

    res.json({
      success: true,
      count: events.length,
      events
    })
  } catch (error) {
    console.error('Events fetch error:', error)
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    })
  }
})

// @route   GET /api/events/upcoming
// @desc    Get upcoming events only
// @access  Private
router.get('/upcoming', auth, async (req, res) => {
  try {
    const events = await EventService.getUpcomingEvents()

    res.json({
      success: true,
      count: events.length,
      events
    })
  } catch (error) {
    console.error('Upcoming events fetch error:', error)
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    })
  }
})

// @route   GET /api/events/:id
// @desc    Get single event with registrations
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const event = await EventService.findById(req.params.id)
    if (!event) {
      return res.status(404).json({ 
        success: false, 
        message: 'Event not found' 
      })
    }

    // Get registrations for this event
    const registrations = await EventService.getEventRegistrations(req.params.id)

    res.json({
      success: true,
      event: {
        ...event,
        registrations
      }
    })
  } catch (error) {
    console.error('Event fetch error:', error)
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    })
  }
})

// @route   POST /api/events
// @desc    Create a new event (admin only)
// @access  Private
router.post('/',
  auth,
  [
    body('title').trim().isLength({ min: 3 }).withMessage('Title must be at least 3 characters'),
    body('description').trim().isLength({ min: 10 }).withMessage('Description must be at least 10 characters'),
    body('date').isISO8601().withMessage('Invalid date format'),
    body('location').trim().isLength({ min: 3 }).withMessage('Location must be at least 3 characters'),
    body('eventType').isIn(['workshop', 'seminar', 'competition', 'social', 'other']).withMessage('Invalid event type'),
    body('maxAttendees').optional().isInt({ min: 1 }).withMessage('Max attendees must be a positive number')
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

      const { 
        title, 
        description, 
        date, 
        time,
        location, 
        eventType, 
        category,
        maxAttendees, 
        targetCollege,
        requirements,
        prizes,
        registrationDeadline
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
        targetCollege,
        organizer: {
          adminId: req.user.id,
          name: 'Admin',
          contact: req.user.email
        },
        requirements: requirements || [],
        prizes: prizes || [],
        registrationDeadline: registrationDeadline || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // Default to 7 days from now
      }

      const event = await EventService.createEvent(eventData)

      res.status(201).json({
        success: true,
        message: 'Event created successfully',
        event
      })
    } catch (error) {
      console.error('Event creation error:', error)
      res.status(500).json({ 
        success: false, 
        message: 'Server error' 
      })
    }
  }
)

// @route   PUT /api/events/:id
// @desc    Update event details
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const { title, description, date, location, eventType, maxAttendees, isActive } = req.body

    const event = await EventService.updateEvent(req.params.id, {
      title,
      description,
      date,
      location,
      eventType,
      maxAttendees,
      isActive
    })

    if (!event) {
      return res.status(404).json({ 
        success: false, 
        message: 'Event not found' 
      })
    }

    res.json({
      success: true,
      message: 'Event updated successfully',
      event
    })
  } catch (error) {
    console.error('Event update error:', error)
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    })
  }
})

// @route   POST /api/events/:id/register
// @desc    Register for an event
// @access  Private
router.post('/:id/register', auth, async (req, res) => {
  try {
    const eventId = req.params.id
    const userId = req.user.id

    // Check if event exists and if user can register
    const canRegister = await EventService.canUserRegister(eventId, userId)
    if (!canRegister.canRegister) {
      return res.status(400).json({ 
        success: false, 
        message: canRegister.reason 
      })
    }

    // Register user for event
    const registration = await EventService.registerForEvent(eventId, userId)

    res.json({
      success: true,
      message: 'Successfully registered for event',
      registration
    })
  } catch (error) {
    console.error('Event registration error:', error)
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    })
  }
})

// @route   DELETE /api/events/:id/register
// @desc    Unregister from an event
// @access  Private
router.delete('/:id/register', auth, async (req, res) => {
  try {
    const eventId = req.params.id
    const userId = req.user.id

    // Unregister user from event
    const success = await EventService.unregisterFromEvent(eventId, userId)

    if (success) {
      res.json({
        success: true,
        message: 'Successfully unregistered from event'
      })
    } else {
      res.status(400).json({ 
        success: false, 
        message: 'Failed to unregister from event' 
      })
    }
  } catch (error) {
    console.error('Event unregistration error:', error)
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    })
  }
})

// @route   GET /api/events/:id/registration-status
// @desc    Check user's registration status for an event
// @access  Private
router.get('/:id/registration-status', auth, async (req, res) => {
  try {
    const eventId = req.params.id
    const userId = req.user.id

    // Get user's registrations for this event
    const registrations = await EventService.getUserRegistrations(userId)
    const userRegistration = registrations.find(reg => reg.eventId === eventId)

    if (!userRegistration) {
      return res.json({
        success: true,
        isRegistered: false
      })
    }

    res.json({
      success: true,
      isRegistered: true,
      status: userRegistration.status
    })
  } catch (error) {
    console.error('Registration status check error:', error)
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    })
  }
})

export default router 