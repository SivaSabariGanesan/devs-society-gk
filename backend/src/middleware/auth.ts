import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user: {
        id: string
        email: string
        role: string
      }
    }
  }
}

interface JwtPayload {
  id: string
  email: string
  role: string
}

const auth = (req: Request, res: Response, next: NextFunction) => {
  // Get token from header
  const token = req.header('x-auth-token') || req.header('Authorization')?.replace('Bearer ', '')

  // Check if no token
  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'No token, authorization denied' 
    })
  }

  try {
    // Verify token
    const decoded = jwt.verify(
      token, 
      process.env.JWT_SECRET || 'fallback_secret'
    ) as JwtPayload

    // Add user to request
    req.user = decoded
    next()
  } catch (error) {
    res.status(401).json({ 
      success: false, 
      message: 'Token is not valid' 
    })
  }
}

export default auth 