"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const userService_1 = __importDefault(require("../services/userService"));
const collegeService_1 = __importDefault(require("../services/collegeService"));
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const router = express_1.default.Router();
// Configure multer for file uploads
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/photos/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path_1.default.extname(file.originalname));
    }
});
const upload = (0, multer_1.default)({
    storage,
    limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        }
        else {
            cb(new Error('Only image files are allowed'));
        }
    }
});
// @route   POST /api/auth/register
// @desc    Register a new user with batch year validation
// @access  Public
router.post('/register', upload.single('photo'), [
    (0, express_validator_1.body)('fullName').trim().isLength({ min: 2 }).withMessage('Full name must be at least 2 characters'),
    (0, express_validator_1.body)('email').isEmail().normalizeEmail().withMessage('Please include a valid email'),
    (0, express_validator_1.body)('phone').trim().isLength({ min: 10 }).withMessage('Phone number must be at least 10 characters'),
    (0, express_validator_1.body)('college').trim().isLength({ min: 2 }).withMessage('College name is required'),
    (0, express_validator_1.body)('batchYear').trim().notEmpty().withMessage('Batch year is required'),
    (0, express_validator_1.body)('role').isIn(['core-member', 'board-member', 'special-member', 'other']).withMessage('Invalid role')
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
        const { fullName, email, phone, college, batchYear, role } = req.body;
        // Check if user already exists
        const existingUser = await userService_1.default.findByEmail(email);
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User with this email already exists'
            });
        }
        // Find college by name and get college ID
        let collegeRef = null;
        try {
            const colleges = await collegeService_1.default.getAllColleges();
            const foundCollege = colleges.find(c => c.name.toLowerCase() === college.toLowerCase());
            if (foundCollege) {
                collegeRef = foundCollege.id;
                // Validate batch year assignment
                const validation = await userService_1.default.validateBatchYearAssignment(collegeRef, batchYear);
                if (!validation.valid) {
                    return res.status(400).json({
                        success: false,
                        message: validation.error || 'Invalid batch year assignment'
                    });
                }
            }
        }
        catch (error) {
            console.error('Error validating college and batch year:', error);
            // Continue without validation if there's an error
        }
        // Create new user
        const userData = {
            fullName,
            email,
            phone,
            college,
            collegeRef,
            batchYear,
            role: role || 'other'
        };
        if (req.file) {
            userData.photoUrl = `/uploads/photos/${req.file.filename}`;
        }
        const user = await userService_1.default.createUser(userData);
        // Generate JWT token
        const payload = {
            id: user.id,
            email: user.email,
            role: user.role
        };
        const token = jsonwebtoken_1.default.sign(payload, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '7d' });
        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            token,
            user: {
                id: user.id,
                fullName: user.fullName,
                email: user.email,
                role: user.role,
                memberId: user.memberId,
                college: user.college,
                batchYear: user.batchYear,
                photoUrl: user.photoUrl
            }
        });
    }
    catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during registration'
        });
    }
});
// @route   POST /api/auth/login
// @desc    Login user (simplified - just email lookup)
// @access  Public
router.post('/login', [
    (0, express_validator_1.body)('email').isEmail().normalizeEmail().withMessage('Please include a valid email')
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
        const { email } = req.body;
        // Find user by email
        const user = await userService_1.default.findByEmail(email);
        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Invalid credentials or user not found'
            });
        }
        // Generate JWT token
        const payload = {
            id: user.id,
            email: user.email,
            role: user.role
        };
        const token = jsonwebtoken_1.default.sign(payload, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '7d' });
        res.json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                fullName: user.fullName,
                email: user.email,
                role: user.role,
                memberId: user.memberId,
                college: user.college,
                batchYear: user.batchYear,
                photoUrl: user.photoUrl
            }
        });
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during login'
        });
    }
});
exports.default = router;
//# sourceMappingURL=auth.js.map