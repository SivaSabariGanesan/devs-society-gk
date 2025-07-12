"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const roleBasedAuth_1 = require("../middleware/roleBasedAuth");
const adminService_1 = __importDefault(require("../services/adminService"));
const collegeService_1 = __importDefault(require("../services/collegeService"));
const userService_1 = __importDefault(require("../services/userService"));
const eventService_1 = __importDefault(require("../services/eventService"));
const router = express_1.default.Router();
// All routes require super admin access
router.use(roleBasedAuth_1.adminAuth, roleBasedAuth_1.requireSuperAdmin);
// ============ COLLEGE MANAGEMENT ============
// @route   GET /api/superadmin/colleges
// @desc    Get all colleges with tenure head information
// @access  Super Admin
router.get('/colleges', async (req, res) => {
    try {
        const colleges = await collegeService_1.default.getAllColleges();
        const collegesWithStats = await Promise.all(colleges.map(async (college) => {
            const [userCount, eventCount] = await Promise.all([
                userService_1.default.getUsersByCollege(college.name).then(users => users.length),
                eventService_1.default.getEventsByCollege(college.id).then(events => events.length)
            ]);
            return {
                ...college,
                stats: {
                    totalUsers: userCount,
                    totalEvents: eventCount
                }
            };
        }));
        res.json({
            success: true,
            count: colleges.length,
            colleges: collegesWithStats
        });
    }
    catch (error) {
        console.error('Error fetching colleges:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
// @route   POST /api/superadmin/colleges
// @desc    Create a new college
// @access  Super Admin
router.post('/colleges', [
    (0, express_validator_1.body)('name').trim().isLength({ min: 2 }).withMessage('College name is required'),
    (0, express_validator_1.body)('code').trim().isLength({ min: 2, max: 10 }).withMessage('College code (2-10 chars) is required'),
    (0, express_validator_1.body)('location').trim().isLength({ min: 2 }).withMessage('Location is required'),
    (0, express_validator_1.body)('address').trim().isLength({ min: 5 }).withMessage('Address is required'),
    (0, express_validator_1.body)('contactInfo.email').isEmail().withMessage('Valid email is required'),
    (0, express_validator_1.body)('contactInfo.phone').trim().isLength({ min: 10 }).withMessage('Valid phone number is required')
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
        const { name, code, location, address, contactInfo } = req.body;
        const college = await collegeService_1.default.createCollege({
            name,
            code: code.toUpperCase(),
            location,
            address,
            contactInfo
        });
        res.status(201).json({
            success: true,
            message: 'College created successfully',
            college
        });
    }
    catch (error) {
        console.error('Error creating college:', error);
        if (error instanceof Error && error.message.includes('already exists')) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
// @route   PUT /api/superadmin/colleges/:id
// @desc    Update college information
// @access  Super Admin
router.put('/colleges/:id', async (req, res) => {
    try {
        const { name, code, location, address, contactInfo, isActive } = req.body;
        const college = await collegeService_1.default.updateCollege(req.params.id, {
            name,
            code: code?.toUpperCase(),
            location,
            address,
            contactInfo,
            isActive
        });
        if (!college) {
            return res.status(404).json({
                success: false,
                message: 'College not found'
            });
        }
        res.json({
            success: true,
            message: 'College updated successfully',
            college
        });
    }
    catch (error) {
        console.error('Error updating college:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
// @route   DELETE /api/superadmin/colleges/:id
// @desc    Soft delete college (sets isActive to false)
// @access  Super Admin
router.delete('/colleges/:id', async (req, res) => {
    try {
        // First check if college has active tenure head
        const college = await collegeService_1.default.findById(req.params.id);
        if (!college) {
            return res.status(404).json({
                success: false,
                message: 'College not found'
            });
        }
        // Check if college has active tenure head using the new structure
        const collegesWithAdmin = await collegeService_1.default.getAllColleges();
        const collegeWithAdmin = collegesWithAdmin.find(c => c.id === req.params.id);
        if (collegeWithAdmin?.currentTenureHeads && collegeWithAdmin.currentTenureHeads.length > 0) {
            const activeTenures = collegeWithAdmin.currentTenureHeads.filter(tenure => tenure.isActive);
            if (activeTenures.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: `Cannot delete college with active tenure heads: ${activeTenures.map(t => t.adminName).join(', ')}`
                });
            }
        }
        const result = await collegeService_1.default.deleteCollege(req.params.id);
        if (!result) {
            return res.status(404).json({
                success: false,
                message: 'College not found'
            });
        }
        res.json({
            success: true,
            message: 'College deleted successfully'
        });
    }
    catch (error) {
        console.error('Error deleting college:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
// ============ ADMIN MANAGEMENT ============
// @route   POST /api/superadmin/admins
// @desc    Create admin with college assignment and batch year
// @access  Super Admin
router.post('/admins', [
    (0, express_validator_1.body)('username').trim().isLength({ min: 3, max: 20 }).withMessage('Username must be 3-20 characters'),
    (0, express_validator_1.body)('email').isEmail().normalizeEmail().withMessage('Please include a valid email'),
    (0, express_validator_1.body)('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    (0, express_validator_1.body)('fullName').trim().isLength({ min: 2 }).withMessage('Full name is required'),
    (0, express_validator_1.body)('assignedCollege').isUUID().withMessage('Valid college ID is required for admin assignment'),
    (0, express_validator_1.body)('batchYear').isInt({ min: 2000, max: 2030 }).withMessage('Valid batch year (2000-2030) is required')
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
        const { username, email, password, fullName, assignedCollege, batchYear } = req.body;
        // Verify college exists
        const college = await collegeService_1.default.findById(assignedCollege);
        if (!college) {
            return res.status(404).json({
                success: false,
                message: 'College not found'
            });
        }
        // Check if this batch year already has an admin for this college
        const existingAdmins = await adminService_1.default.getAdminsByCollege(assignedCollege, true);
        const existingBatchAdmin = existingAdmins.find(admin => admin.batchYear === batchYear);
        if (existingBatchAdmin) {
            return res.status(400).json({
                success: false,
                message: `Batch year ${batchYear} already has an admin assigned to ${college.name}`
            });
        }
        // Create admin with college assignment and batch year
        const admin = await adminService_1.default.createAdmin({
            username,
            email,
            password,
            fullName,
            assignedCollege,
            batchYear
        });
        res.status(201).json({
            success: true,
            message: 'Admin created successfully',
            admin
        });
    }
    catch (error) {
        console.error('Error creating admin:', error);
        if (error instanceof Error && error.message.includes('already exists')) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
// @route   POST /api/superadmin/assign-tenure
// @desc    Assign admin to college tenure
// @access  Super Admin
router.post('/assign-tenure', [
    (0, express_validator_1.body)('adminId').isUUID().withMessage('Valid admin ID is required'),
    (0, express_validator_1.body)('collegeId').isUUID().withMessage('Valid college ID is required'),
    (0, express_validator_1.body)('startDate').optional().isISO8601().withMessage('Valid start date is required')
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
        const { adminId, collegeId, startDate } = req.body;
        // Verify admin exists
        const admin = await adminService_1.default.findById(adminId);
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: 'Admin not found'
            });
        }
        // Verify college exists
        const college = await collegeService_1.default.findById(collegeId);
        if (!college) {
            return res.status(404).json({
                success: false,
                message: 'College not found'
            });
        }
        // Assign admin to college
        const result = await adminService_1.default.assignAdminToCollege(adminId, collegeId, startDate);
        if (!result) {
            return res.status(500).json({
                success: false,
                message: 'Failed to assign admin to college'
            });
        }
        res.json({
            success: true,
            message: `Admin ${admin.fullName} assigned to ${college.name} successfully`
        });
    }
    catch (error) {
        console.error('Error assigning tenure:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
// @route   GET /api/superadmin/unassigned-admins
// @desc    Get all admins not currently assigned to any college
// @access  Super Admin
router.get('/unassigned-admins', async (req, res) => {
    try {
        const admins = await adminService_1.default.getUnassignedAdmins();
        res.json({
            success: true,
            count: admins.length,
            admins
        });
    }
    catch (error) {
        console.error('Error fetching unassigned admins:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
// @route   GET /api/superadmin/admins
// @desc    Get all admins with college information
// @access  Super Admin
router.get('/admins', async (req, res) => {
    try {
        const admins = await adminService_1.default.getAdminsByRole('admin');
        res.json({
            success: true,
            count: admins.length,
            admins
        });
    }
    catch (error) {
        console.error('Error fetching admins:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
// @route   DELETE /api/superadmin/admins/:id
// @desc    End admin tenure and deactivate admin
// @access  Super Admin
router.delete('/admins/:id', async (req, res) => {
    try {
        const admin = await adminService_1.default.findById(req.params.id);
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: 'Admin not found'
            });
        }
        // End tenure
        const result = await adminService_1.default.endTenure(req.params.id);
        if (!result) {
            return res.status(500).json({
                success: false,
                message: 'Failed to end tenure'
            });
        }
        res.json({
            success: true,
            message: 'Admin tenure ended and admin deactivated successfully'
        });
    }
    catch (error) {
        console.error('Error deleting admin:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
// @route   GET /api/superadmin/colleges/:id
// @desc    Get single college details
// @access  Super Admin  
router.get('/colleges/:id', async (req, res) => {
    try {
        const college = await collegeService_1.default.findById(req.params.id);
        if (!college) {
            return res.status(404).json({
                success: false,
                message: 'College not found'
            });
        }
        res.json({
            success: true,
            college
        });
    }
    catch (error) {
        console.error('Error fetching college:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
// @route   GET /api/superadmin/admins/:id
// @desc    Get single admin details
// @access  Super Admin
router.get('/admins/:id', async (req, res) => {
    try {
        const admin = await adminService_1.default.findById(req.params.id);
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: 'Admin not found'
            });
        }
        res.json({
            success: true,
            admin
        });
    }
    catch (error) {
        console.error('Error fetching admin:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
// ============ USER MANAGEMENT (Global) ============
// @route   GET /api/superadmin/users
// @desc    Get all users across colleges with filtering
// @access  Super Admin
router.get('/users', async (req, res) => {
    try {
        const { page = 1, limit = 20, search, college, role } = req.query;
        let users;
        let totalCount = 0;
        if (search) {
            users = await userService_1.default.searchUsers(search);
            totalCount = users.length;
            // Apply pagination to search results
            const skip = (Number(page) - 1) * Number(limit);
            users = users.slice(skip, skip + Number(limit));
        }
        else if (college) {
            users = await userService_1.default.getUsersByCollege(college);
            totalCount = users.length;
            // Apply pagination
            const skip = (Number(page) - 1) * Number(limit);
            users = users.slice(skip, skip + Number(limit));
        }
        else {
            const result = await userService_1.default.getAllUsers(Number(page), Number(limit));
            users = result.users;
            totalCount = result.totalCount;
        }
        // Get statistics
        const totalUsers = await userService_1.default.getUserCount();
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
        });
    }
    catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
// @route   GET /api/superadmin/users/:id
// @desc    Get single user details
// @access  Super Admin
router.get('/users/:id', async (req, res) => {
    try {
        const user = await userService_1.default.findById(req.params.id);
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
        console.error('Error fetching user:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
// @route   PUT /api/superadmin/users/:id
// @desc    Update user information (super admin)
// @access  Super Admin
router.put('/users/:id', [
    (0, express_validator_1.body)('fullName').optional().trim().isLength({ min: 2 }).withMessage('Full name must be at least 2 characters'),
    (0, express_validator_1.body)('email').optional().isEmail().normalizeEmail().withMessage('Please include a valid email'),
    (0, express_validator_1.body)('phone').optional().trim().isLength({ min: 10 }).withMessage('Phone must be at least 10 characters'),
    (0, express_validator_1.body)('role').optional().isIn(['core-member', 'board-member', 'special-member', 'other']).withMessage('Invalid role'),
    (0, express_validator_1.body)('isActive').optional().isBoolean().withMessage('isActive must be boolean')
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
        const { fullName, email, phone, role, isActive } = req.body;
        // First verify user exists
        const existingUser = await userService_1.default.findById(req.params.id);
        if (!existingUser) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        // Check if email is being changed and if it already exists
        if (email && email !== existingUser.email) {
            const userWithEmail = await userService_1.default.findByEmail(email);
            if (userWithEmail && userWithEmail.id !== req.params.id) {
                return res.status(400).json({
                    success: false,
                    message: 'Email already in use by another user'
                });
            }
        }
        const user = await userService_1.default.updateUser(req.params.id, { fullName, email, phone, role, isActive });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        res.json({
            success: true,
            message: 'User updated successfully',
            user
        });
    }
    catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
// ============ EVENT MANAGEMENT (Global) ============
// @route   GET /api/superadmin/events
// @desc    Get all events across colleges
// @access  Super Admin
router.get('/events', async (req, res) => {
    try {
        const { page = 1, limit = 20, search, college, eventType } = req.query;
        let events;
        let totalCount = 0;
        if (search) {
            events = await eventService_1.default.searchEvents(search);
            totalCount = events.length;
            // Apply pagination
            const skip = (Number(page) - 1) * Number(limit);
            events = events.slice(skip, skip + Number(limit));
        }
        else if (college) {
            events = await eventService_1.default.getEventsByCollege(college);
            totalCount = events.length;
            // Apply pagination
            const skip = (Number(page) - 1) * Number(limit);
            events = events.slice(skip, skip + Number(limit));
        }
        else {
            events = await eventService_1.default.getAllEvents();
            totalCount = events.length;
            // Apply pagination
            const skip = (Number(page) - 1) * Number(limit);
            events = events.slice(skip, skip + Number(limit));
        }
        // Add computed fields
        const eventsWithStats = await Promise.all(events.map(async (event) => {
            const registrations = await eventService_1.default.getEventRegistrations(event.id);
            return {
                ...event,
                registrationCount: registrations.filter(reg => reg.status === 'confirmed').length,
                waitlistCount: registrations.filter(reg => reg.status === 'waitlisted').length
            };
        }));
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
        });
    }
    catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
// @route   POST /api/superadmin/events
// @desc    Create new global event
// @access  Super Admin
router.post('/events', [
    (0, express_validator_1.body)('title').trim().isLength({ min: 3 }).withMessage('Title must be at least 3 characters'),
    (0, express_validator_1.body)('description').trim().isLength({ min: 10 }).withMessage('Description must be at least 10 characters'),
    (0, express_validator_1.body)('date').isISO8601().withMessage('Valid date is required'),
    (0, express_validator_1.body)('location').trim().isLength({ min: 3 }).withMessage('Location must be at least 3 characters'),
    (0, express_validator_1.body)('eventType').isIn(['workshop', 'seminar', 'competition', 'social', 'other', 'open-to-all']).withMessage('Invalid event type'),
    (0, express_validator_1.body)('maxAttendees').optional().isInt({ min: 1 }).withMessage('Max attendees must be a positive number'),
    (0, express_validator_1.body)('targetCollege').optional().isUUID().withMessage('Invalid college ID format')
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
        const { title, description, date, time, location, eventType, category, maxAttendees, requirements, prizes, registrationDeadline, targetCollege } = req.body;
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
                adminId: req.admin.id,
                name: req.admin.username,
                contact: req.admin.email
            }
        };
        const event = await eventService_1.default.createEvent(eventData);
        res.status(201).json({
            success: true,
            message: 'Event created successfully',
            event
        });
    }
    catch (error) {
        console.error('Error creating event:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
// @route   GET /api/superadmin/events/:id
// @desc    Get single event details
// @access  Super Admin
router.get('/events/:id', async (req, res) => {
    try {
        const event = await eventService_1.default.findById(req.params.id);
        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Event not found'
            });
        }
        // Get registrations
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
        console.error('Error fetching event:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
// @route   DELETE /api/superadmin/events/:id
// @desc    Soft delete event (sets isActive to false)
// @access  Super Admin
router.delete('/events/:id', async (req, res) => {
    try {
        const result = await eventService_1.default.deleteEvent(req.params.id);
        if (!result) {
            return res.status(404).json({
                success: false,
                message: 'Event not found'
            });
        }
        res.json({
            success: true,
            message: 'Event deleted successfully'
        });
    }
    catch (error) {
        console.error('Error deleting event:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
// @route   POST /api/superadmin/transfer-tenure
// @desc    Transfer admin tenure to different college
// @access  Super Admin
router.post('/transfer-tenure', [
    (0, express_validator_1.body)('toAdminId').custom((value) => {
        if (value && value.length !== 36) {
            throw new Error('Valid admin ID is required');
        }
        return true;
    }),
    (0, express_validator_1.body)('collegeId').custom((value) => {
        if (value && value.length !== 36) {
            throw new Error('Valid college ID is required');
        }
        return true;
    }),
    (0, express_validator_1.body)('transferReason').trim().isLength({ min: 3 }).withMessage('Transfer reason is required')
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
        const { toAdminId, collegeId, transferReason } = req.body;
        // Get target admin and college
        const [targetAdmin, targetCollege] = await Promise.all([
            adminService_1.default.findById(toAdminId),
            collegeService_1.default.findById(collegeId)
        ]);
        if (!targetAdmin) {
            return res.status(404).json({
                success: false,
                message: 'Target admin not found'
            });
        }
        if (!targetCollege) {
            return res.status(404).json({
                success: false,
                message: 'Target college not found'
            });
        }
        // Transfer admin
        const result = await adminService_1.default.transferAdmin(toAdminId, collegeId);
        if (!result) {
            return res.status(500).json({
                success: false,
                message: 'Failed to transfer admin'
            });
        }
        res.json({
            success: true,
            message: 'Admin tenure transferred successfully',
            admin: targetAdmin,
            college: targetCollege
        });
    }
    catch (error) {
        console.error('Error transferring tenure:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
// @route   POST /api/superadmin/end-tenure
// @desc    End admin tenure
// @access  Super Admin
router.post('/end-tenure', [
    (0, express_validator_1.body)('adminId').custom((value) => {
        if (value && value.length !== 36) {
            throw new Error('Valid admin ID is required');
        }
        return true;
    }),
    (0, express_validator_1.body)('reason').trim().isLength({ min: 3 }).withMessage('Reason is required')
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
        const { adminId, reason } = req.body;
        const admin = await adminService_1.default.findById(adminId);
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: 'Admin not found'
            });
        }
        // End tenure
        const result = await adminService_1.default.endTenure(adminId);
        if (!result) {
            return res.status(500).json({
                success: false,
                message: 'Failed to end tenure'
            });
        }
        res.json({
            success: true,
            message: 'Tenure ended successfully',
            admin
        });
    }
    catch (error) {
        console.error('Error ending tenure:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
// @route   GET /api/superadmin/dashboard
// @desc    Get super admin dashboard statistics
// @access  Super Admin
router.get('/dashboard', async (req, res) => {
    try {
        const [totalColleges, totalAdmins, totalUsers, totalEvents] = await Promise.all([
            collegeService_1.default.getAllColleges().then(colleges => colleges.length),
            adminService_1.default.getAdminsByRole('admin').then(admins => admins.length),
            userService_1.default.getUserCount(),
            eventService_1.default.getAllEvents().then(events => events.length)
        ]);
        res.json({
            success: true,
            stats: {
                totalColleges,
                totalAdmins,
                totalUsers,
                totalEvents
            }
        });
    }
    catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
// @route   POST /api/superadmin/admins/transfer
// @desc    Transfer admin to different college with batch year
// @access  Super Admin
router.post('/admins/transfer', [
    (0, express_validator_1.body)('toAdminId').isUUID().withMessage('Valid admin ID is required'),
    (0, express_validator_1.body)('collegeId').isUUID().withMessage('Valid college ID is required'),
    (0, express_validator_1.body)('batchYear').isInt({ min: 2000, max: 2030 }).withMessage('Valid batch year (2000-2030) is required'),
    (0, express_validator_1.body)('transferReason').optional().isString().withMessage('Transfer reason must be a string')
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
        const { toAdminId, collegeId, batchYear, transferReason } = req.body;
        // Verify admin exists
        const admin = await adminService_1.default.findById(toAdminId);
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: 'Admin not found'
            });
        }
        // Verify college exists
        const college = await collegeService_1.default.findById(collegeId);
        if (!college) {
            return res.status(404).json({
                success: false,
                message: 'College not found'
            });
        }
        // Check if this batch year already has an admin for this college
        const existingAdmins = await adminService_1.default.getAdminsByCollege(collegeId, true);
        const existingBatchAdmin = existingAdmins.find(a => a.batchYear === batchYear && a.id !== toAdminId);
        if (existingBatchAdmin) {
            return res.status(400).json({
                success: false,
                message: `Batch year ${batchYear} already has an admin assigned to ${college.name}`
            });
        }
        // Transfer admin to new college with batch year
        const success = await adminService_1.default.assignAdminToCollege(toAdminId, collegeId, undefined, batchYear);
        if (success) {
            res.json({
                success: true,
                message: `Admin transferred to ${college.name} for batch ${batchYear} successfully`
            });
        }
        else {
            res.status(500).json({
                success: false,
                message: 'Failed to transfer admin'
            });
        }
    }
    catch (error) {
        console.error('Error transferring admin:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
exports.default = router;
//# sourceMappingURL=superAdmin.js.map