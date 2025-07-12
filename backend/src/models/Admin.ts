import mongoose, { Document, Schema } from 'mongoose'
import bcrypt from 'bcryptjs'

export interface IAdmin extends Document {
  username: string
  email: string
  password: string
  fullName: string
  role: 'super-admin' | 'admin'
  assignedCollege?: mongoose.Types.ObjectId // Only for 'admin' role
  permissions: string[]
  tenureInfo?: {
    startDate: Date
    endDate?: Date
    isActive: boolean
  }
  isActive: boolean
  lastLogin?: Date
  createdAt: Date
  updatedAt: Date
  comparePassword(password: string): Promise<boolean>
}

const AdminSchema: Schema = new Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 20
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    required: true,
    enum: ['super-admin', 'admin'],
    default: 'admin'
  },
  assignedCollege: {
    type: Schema.Types.ObjectId,
    ref: 'College',
    required: function(this: IAdmin) {
      return this.role === 'admin'
    }
  },
  permissions: [{
    type: String,
    enum: [
      'users.read',
      'users.write',
      'users.delete',
      'events.read',
      'events.write',
      'events.delete',
      'colleges.read',
      'colleges.write',
      'colleges.delete',
      'admins.read',
      'admins.write',
      'admins.delete',
      'settings.read',
      'settings.write',
      'analytics.read',
      'system.admin'
    ]
  }],
  tenureInfo: {
    startDate: {
      type: Date
    },
    endDate: {
      type: Date
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  }
}, {
  timestamps: true
})

// Hash password before saving
AdminSchema.pre<IAdmin>('save', async function(next) {
  if (!this.isModified('password')) return next()
  
  try {
    const salt = await bcrypt.genSalt(12)
    this.password = await bcrypt.hash(this.password as string, salt)
    next()
  } catch (error) {
    next(error as Error)
  }
})

// Add tenure info and set default permissions based on role
AdminSchema.pre<IAdmin>('save', function(next) {
  if (this.isNew || this.isModified('role')) {
    switch (this.role) {
      case 'super-admin':
        this.permissions = [
          'users.read', 'users.write', 'users.delete',
          'events.read', 'events.write', 'events.delete',
          'colleges.read', 'colleges.write', 'colleges.delete',
          'admins.read', 'admins.write', 'admins.delete',
          'settings.read', 'settings.write',
          'analytics.read', 'system.admin'
        ]
        break
      case 'admin':
        this.permissions = [
          'users.read', 'users.write', // College-specific
          'events.read', 'events.write', 'events.delete', // College-specific
          'analytics.read' // College-specific
        ]
        // Set tenure info for new admin
        if (this.isNew) {
          this.tenureInfo = {
            startDate: new Date(),
            isActive: true
          }
        }
        break
    }
  }
  next()
})

// Compare password method
AdminSchema.methods.comparePassword = async function(password: string): Promise<boolean> {
  return bcrypt.compare(password, this.password)
}

export default mongoose.model<IAdmin>('Admin', AdminSchema) 