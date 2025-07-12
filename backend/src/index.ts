// Load environment variables FIRST
import dotenv from 'dotenv'
dotenv.config()

import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { initializeSupabase, testConnection } from './database/supabase'
import authRoutes from './routes/auth'
import userRoutes from './routes/users'
import eventRoutes from './routes/events'
import adminRoutes from './routes/admin'
import superAdminRoutes from './routes/superAdmin'
import collegeAdminRoutes from './routes/collegeAdmin'
import publicRoutes from './routes/public'

const app = express()
const PORT = process.env.PORT || 5050

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
})

// Middleware
app.use(helmet())
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}))
app.use(limiter)
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/events', eventRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/super-admin', superAdminRoutes)
app.use('/api/college-admin', collegeAdminRoutes)
app.use('/api/public', publicRoutes)

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Devs Portal API is running' })
})

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack)
  res.status(500).json({ message: 'Something went wrong!' })
})

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Endpoint not found' })
})

// Database connection
const connectDB = async () => {
  try {
    // Initialize Supabase client
    initializeSupabase()
    console.log('✅ Supabase client initialized')
    
    // Test the connection
    const isConnected = await testConnection()
    if (!isConnected) {
      throw new Error('Supabase connection test failed')
    }
    
    console.log('✅ Supabase connection verified')
  } catch (error) {
    console.error('❌ Database connection error:', error)
    process.exit(1)
  }
}

// Start server
const startServer = async () => {
  await connectDB()
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`)
    console.log(`🌐 API available at http://localhost:${PORT}/api`)
    console.log(`💾 Database: Supabase (PostgreSQL)`)
  })
}

startServer().catch(console.error) 