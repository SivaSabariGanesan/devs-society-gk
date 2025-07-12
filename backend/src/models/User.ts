import mongoose, { Document, Schema } from 'mongoose'

export interface IUser extends Document {
  fullName: string
  email: string
  phone: string
  college: string
  collegeRef?: mongoose.Types.ObjectId // Reference to College model
  batchYear: string
  role: 'core-member' | 'board-member' | 'special-member' | 'other'
  photoUrl?: string
  memberId: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

const UserSchema: Schema = new Schema({
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  college: {
    type: String,
    required: true,
    trim: true
  },
  collegeRef: {
    type: Schema.Types.ObjectId,
    ref: 'College'
  },
  batchYear: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    required: true,
    enum: ['core-member', 'board-member', 'special-member', 'other'],
    default: 'other'
  },
  photoUrl: {
    type: String,
    trim: true
  },
  memberId: {
    type: String,
    unique: true,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
})

// Generate member ID before saving
UserSchema.pre('save', async function(next) {
  if (!this.memberId) {
    const year = new Date().getFullYear()
    const count = await mongoose.model('User').countDocuments()
    this.memberId = `DEVS-${year}-${String(count + 1).padStart(4, '0')}`
  }
  next()
})

export default mongoose.model<IUser>('User', UserSchema) 