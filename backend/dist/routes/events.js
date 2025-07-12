"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const eventService_1 = __importDefault(require("../services/eventService"));
const auth_1 = __importDefault(require("../middleware/auth"));
const router = express_1.default.Router();
// @route   GET /api/events
// @desc    Get all active events
// @access  Private
router.get('/', auth_1.default, async (req, res) => {
    try {
        const { search, eventType, college } = req.query;
        let events;
        if (search) {
            events = await eventService_1.default.searchEvents(search);
        }
        else if (college) {
            events = await eventService_1.default.getEventsByCollege(college);
        }
        else {
            events = await eventService_1.default.getAllEvents();
        }
        res.json({
            success: true,
            count: events.length,
            events
        });
    }
    catch (error) {
        console.error('Events fetch error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});
// @route   GET /api/events/upcoming
// @desc    Get upcoming events only
// @access  Private
router.get('/upcoming', auth_1.default, async (req, res) => {
    try {
        const events = await eventService_1.default.getUpcomingEvents();
        res.json({
            success: true,
            count: events.length,
            events
        });
    }
    catch (error) {
        console.error('Upcoming events fetch error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});
// @route   GET /api/events/:id
// @desc    Get single event with registrations
// @access  Private
router.get('/:id', auth_1.default, async (req, res) => {
    try {
        const event = await eventService_1.default.findById(req.params.id);
        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Event not found'
            });
        }
        // Get registrations for this event
        const registrations = await eventService_1.default.getEventRegistrations(req.params.id);
        res.json({
            success: true,
            event: {
                ...event,
                registrations
            }
        });
    }
    catch (error) {
        console.error('Event fetch error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});
// @route   POST /api/events
// @desc    Create a new event (admin only)
// @access  Private
router.post('/', auth_1.default, [
    (0, express_validator_1.body)('title').trim().isLength({ min: 3 }).withMessage('Title must be at least 3 characters'),
    (0, express_validator_1.body)('description').trim().isLength({ min: 10 }).withMessage('Description must be at least 10 characters'),
    (0, express_validator_1.body)('date').isISO8601().withMessage('Invalid date format'),
    (0, express_validator_1.body)('location').trim().isLength({ min: 3 }).withMessage('Location must be at least 3 characters'),
    (0, express_validator_1.body)('eventType').isIn(['workshop', 'seminar', 'competition', 'social', 'other']).withMessage('Invalid event type'),
    (0, express_validator_1.body)('maxAttendees').optional().isInt({ min: 1 }).withMessage('Max attendees must be a positive number')
], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }
        const { title, description, date, time, location, eventType, category, maxAttendees, targetCollege, requirements, prizes, registrationDeadline } = req.body;
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
        };
        const event = await eventService_1.default.createEvent(eventData);
        res.status(201).json({
            success: true,
            message: 'Event created successfully',
            event
        });
    }
    catch (error) {
        console.error('Event creation error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});
// @route   PUT /api/events/:id
// @desc    Update event details
// @access  Private
router.put('/:id', auth_1.default, async (req, res) => {
    try {
        const { title, description, date, location, eventType, maxAttendees, isActive } = req.body;
        const event = await eventService_1.default.updateEvent(req.params.id, {
            title,
            description,
            date,
            location,
            eventType,
            maxAttendees,
            isActive
        });
        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Event not found'
            });
        }
        res.json({
            success: true,
            message: 'Event updated successfully',
            event
        });
    }
    catch (error) {
        console.error('Event update error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});
// @route   POST /api/events/:id/register
// @desc    Register for an event
// @access  Private
router.post('/:id/register', auth_1.default, async (req, res) => {
    try {
        const eventId = req.params.id;
        const userId = req.user.id;
        // Check if event exists and if user can register
        const canRegister = await eventService_1.default.canUserRegister(eventId, userId);
        if (!canRegister.canRegister) {
            return res.status(400).json({
                success: false,
                message: canRegister.reason
            });
        }
        // Register user for event
        const registration = await eventService_1.default.registerForEvent(eventId, userId);
        res.json({
            success: true,
            message: 'Successfully registered for event',
            registration
        });
    }
    catch (error) {
        console.error('Event registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});
// @route   DELETE /api/events/:id/register
// @desc    Unregister from an event
// @access  Private
router.delete('/:id/register', auth_1.default, async (req, res) => {
    try {
        const eventId = req.params.id;
        const userId = req.user.id;
        // Unregister user from event
        const success = await eventService_1.default.unregisterFromEvent(eventId, userId);
        if (success) {
            res.json({
                success: true,
                message: 'Successfully unregistered from event'
            });
        }
        else {
            res.status(400).json({
                success: false,
                message: 'Failed to unregister from event'
            });
        }
    }
    catch (error) {
        console.error('Event unregistration error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});
// @route   GET /api/events/:id/registration-status
// @desc    Check user's registration status for an event
// @access  Private
router.get('/:id/registration-status', auth_1.default, async (req, res) => {
    try {
        const eventId = req.params.id;
        const userId = req.user.id;
        // Get user's registrations for this event
        const registrations = await eventService_1.default.getUserRegistrations(userId);
        const userRegistration = registrations.find(reg => reg.eventId === eventId);
        if (!userRegistration) {
            return res.json({
                success: true,
                isRegistered: false
            });
        }
        res.json({
            success: true,
            isRegistered: true,
            status: userRegistration.status
        });
    }
    catch (error) {
        console.error('Registration status check error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});
exports.default = router;
//# sourceMappingURL=events.js.map