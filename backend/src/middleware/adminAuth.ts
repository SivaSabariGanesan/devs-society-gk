import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

interface AdminJwtPayload {
  id: string
  username: string
  email: string
  role: 'super-admin' | 'admin'
  permissions: string[]
  type: string
}

const adminAuth = (req: Request, res: Response, next: NextFunction) => {
  // Get token from header
  const token = req.header('x-auth-token') || req.header('Authorization')?.replace('Bearer ', '')

  // Check if no token
  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'No token, admin authorization denied' 
    })
  }

  try {
    // Verify token
    const decoded = jwt.verify(
      token, 
      process.env.JWT_SECRET || 'fallback_secret'
    ) as AdminJwtPayload

    // Check if token is for admin
    if (decoded.type !== 'admin') {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid admin token' 
      })
    }

    // Add admin to request
    req.admin = decoded
    next()
  } catch (error) {
    res.status(401).json({ 
      success: false, 
      message: 'Admin token is not valid' 
    })
  }
}

export default adminAuth 