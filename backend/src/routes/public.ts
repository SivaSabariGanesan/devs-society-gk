import express, { Request, Response } from 'express'
import CollegeService from '../services/collegeService'

const router = express.Router()

// ============ PUBLIC ENDPOINTS ============

// @route   GET /api/public/colleges
// @desc    Get all colleges with tenure head information for registration
// @access  Public
router.get('/colleges', async (req: Request, res: Response) => {
  try {
    const colleges = await CollegeService.getAllColleges()

    // Return only the necessary information for registration
    const collegesForRegistration = colleges.map(college => ({
      id: college.id,
      name: college.name,
      code: college.code,
      location: college.location,
      currentTenureHeads: college.currentTenureHeads
    }))

    res.json({
      success: true,
      count: colleges.length,
      colleges: collegesForRegistration
    })
  } catch (error) {
    console.error('Error fetching colleges for registration:', error)
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

export default router 