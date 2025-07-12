"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const userService_1 = __importDefault(require("../services/userService"));
const auth_1 = __importDefault(require("../middleware/auth"));
const eventService_1 = __importDefault(require("../services/eventService"));
const router = express_1.default.Router();
// @route   GET /api/users/profile
// @desc    Get current user profile
// @access  Private
router.get('/profile', auth_1.default, async (req, res) => {
    try {
        const user = await userService_1.default.findById(req.user.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        res.json({
            success: true,
            user
        });
    }
    catch (error) {
        console.error('Profile fetch error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});
// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', auth_1.default, async (req, res) => {
    try {
        const updates = req.body;
        const allowedUpdates = ['fullName', 'phone', 'college', 'batchYear'];
        const filteredUpdates = {};
        // Only allow certain fields to be updated
        allowedUpdates.forEach(field => {
            if (updates[field] !== undefined) {
                filteredUpdates[field] = updates[field];
            }
        });
        const user = await userService_1.default.updateUser(req.user.id, filteredUpdates);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        res.json({
            success: true,
            message: 'Profile updated successfully',
            user
        });
    }
    catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});
// @route   DELETE /api/users/:id
// @desc    Delete user (soft delete)
// @access  Private
router.delete('/:id', auth_1.default, async (req, res) => {
    try {
        // In a real app, you'd check if user has admin privileges
        const result = await userService_1.default.deleteUser(req.params.id);
        if (!result) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        res.json({
            success: true,
            message: 'User deleted successfully'
        });
    }
    catch (error) {
        console.error('User deletion error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});
// @route   GET /api/users
// @desc    Get all users (admin only)
// @access  Private
router.get('/', auth_1.default, async (req, res) => {
    try {
        const { page = 1, limit = 50, search, role, college } = req.query;
        let users;
        let totalCount = 0;
        if (search) {
            users = await userService_1.default.searchUsers(search);
            totalCount = users.length;
        }
        else if (college) {
            users = await userService_1.default.getUsersByCollege(college);
            totalCount = users.length;
        }
        else {
            const result = await userService_1.default.getAllUsers(Number(page), Number(limit));
            users = result.users;
            totalCount = result.totalCount;
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
        });
    }
    catch (error) {
        console.error('Users fetch error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});
// @route   GET /api/users/stats
// @desc    Get user statistics and dashboard data
// @access  Private
router.get('/stats', auth_1.default, async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await userService_1.default.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        // Get user's event registrations
        const registrations = await eventService_1.default.getUserRegistrations(userId);
        // Get event details for each registration
        const registrationsWithEvents = await Promise.all(registrations.map(async (reg) => {
            const event = await eventService_1.default.findById(reg.eventId);
            return { ...reg, event };
        }));
        // Calculate statistics
        const now = new Date();
        const eventsAttended = registrationsWithEvents.filter(reg => reg.status === 'confirmed' && reg.event && new Date(reg.event.date) < now).length;
        const upcomingEvents = registrationsWithEvents.filter(reg => reg.status === 'confirmed' && reg.event && new Date(reg.event.date) > now).length;
        const registeredEvents = registrationsWithEvents.filter(reg => reg.status === 'confirmed').length;
        const totalEvents = await eventService_1.default.getAllEvents().then(events => events.length);
        // Calculate member since date
        const memberSince = new Date(user.createdAt);
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const memberSinceFormatted = `${monthNames[memberSince.getMonth()]} ${memberSince.getFullYear()}`;
        // Calculate points (based on events attended and role)
        let points = eventsAttended * 10; // 10 points per event
        if (user.role === 'core-member')
            points += 100;
        else if (user.role === 'board-member')
            points += 50;
        else if (user.role === 'special-member')
            points += 25;
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
        });
    }
    catch (error) {
        console.error('User stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});
// @route   GET /api/users/registrations
// @desc    Get user's event registrations
// @access  Private
router.get('/registrations', auth_1.default, async (req, res) => {
    try {
        const userId = req.user.id;
        const registrations = await eventService_1.default.getUserRegistrations(userId);
        res.json({
            success: true,
            registrations
        });
    }
    catch (error) {
        console.error('User registrations error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});
exports.default = router;
//# sourceMappingURL=users.js.map