import mongoose, { Document, Schema } from 'mongoose'

export interface ICollege extends Document {
  name: string
  code: string // Short code like "RIT", "PES" etc
  location: string
  address: string
  tenureHeads: {
    adminId: mongoose.Types.ObjectId
    startDate: Date
    endDate?: Date
    isActive: boolean
  }[]
  contactInfo: {
    email: string
    phone: string
    website?: string
  }
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

const CollegeSchema: Schema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  code: {
    type: String,
    required: true,
    trim: true,
    unique: true,
    uppercase: true,
    maxlength: 10
  },
  location: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    type: String,
    required: true,
    trim: true
  },
  tenureHeads: [{
    adminId: {
      type: Schema.Types.ObjectId,
      ref: 'Admin',
      required: true
    },
    startDate: {
      type: Date,
      required: true,
      default: Date.now
    },
    endDate: {
      type: Date
    },
    isActive: {
      type: Boolean,
      default: true
    }
  }],
  contactInfo: {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },
    phone: {
      type: String,
      required: true,
      trim: true
    },
    website: {
      type: String,
      trim: true
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
})

// Index for efficient queries
CollegeSchema.index({ code: 1 })
CollegeSchema.index({ 'tenureHeads.adminId': 1 })
CollegeSchema.index({ isActive: 1 })

// Get current tenure head
CollegeSchema.methods.getCurrentTenureHead = function() {
  const now = new Date()
  return this.tenureHeads.find((tenure: any) => 
    tenure.isActive && 
    tenure.startDate <= now && 
    (!tenure.endDate || tenure.endDate >= now)
  )
}

// Set new tenure head (automatically deactivates previous)
CollegeSchema.methods.setNewTenureHead = function(adminId: mongoose.Types.ObjectId, startDate?: Date) {
  // Deactivate current tenure head
  this.tenureHeads.forEach((tenure: any) => {
    if (tenure.isActive) {
      tenure.isActive = false
      tenure.endDate = startDate || new Date()
    }
  })

  // Add new tenure head
  this.tenureHeads.push({
    adminId,
    startDate: startDate || new Date(),
    isActive: true
  })
}

export default mongoose.model<ICollege>('College', CollegeSchema) 