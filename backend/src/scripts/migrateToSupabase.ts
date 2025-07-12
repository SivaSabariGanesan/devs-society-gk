import mongoose from 'mongoose'
import dotenv from 'dotenv'

// Load environment variables first
dotenv.config()

// Initialize Supabase before importing services
import { initializeSupabase } from '../database/supabase'
initializeSupabase()

// Now import services after Supabase is initialized
import UserService from '../services/userService'
import AdminService from '../services/adminService'
import CollegeService from '../services/collegeService'
import EventService from '../services/eventService'
import bcrypt from 'bcryptjs'

// MongoDB models (keeping the old ones for migration)
const MongoUserSchema = new mongoose.Schema({
  fullName: String,
  email: String,
  phone: String,
  college: String,
  collegeRef: { type: mongoose.Schema.Types.ObjectId, ref: 'College' },
  batchYear: String,
  role: { type: String, enum: ['core-member', 'board-member', 'special-member', 'other'] },
  photoUrl: String,
  memberId: String,
  isActive: { type: Boolean, default: true }
}, { timestamps: true })

const MongoAdminSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
  fullName: String,
  role: { type: String, enum: ['super-admin', 'admin'] },
  assignedCollege: { type: mongoose.Schema.Types.ObjectId, ref: 'College' },
  permissions: [String],
  tenureInfo: {
    startDate: Date,
    endDate: Date,
    isActive: Boolean
  },
  isActive: { type: Boolean, default: true },
  lastLogin: Date
}, { timestamps: true })

const MongoCollegeSchema = new mongoose.Schema({
  name: String,
  code: String,
  location: String,
  address: String,
  tenureHeads: [{
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
    startDate: Date,
    endDate: Date,
    isActive: Boolean
  }],
  contactInfo: {
    email: String,
    phone: String,
    website: String
  },
  isActive: { type: Boolean, default: true }
}, { timestamps: true })

const MongoEventSchema = new mongoose.Schema({
  title: String,
  description: String,
  date: Date,
  time: String,
  location: String,
  eventType: { type: String, enum: ['college-specific', 'open-to-all'] },
  targetCollege: { type: mongoose.Schema.Types.ObjectId, ref: 'College' },
  maxAttendees: Number,
  category: { type: String, enum: ['workshop', 'seminar', 'hackathon', 'competition', 'meetup', 'other'] },
  organizer: {
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
    name: String,
    contact: String
  },
  registrations: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    registeredAt: Date,
    status: { type: String, enum: ['confirmed', 'waitlisted', 'cancelled'] }
  }],
  requirements: [String],
  prizes: [String],
  registrationDeadline: Date,
  isActive: { type: Boolean, default: true }
}, { timestamps: true })

const MongoUser = mongoose.model('User', MongoUserSchema)
const MongoAdmin = mongoose.model('Admin', MongoAdminSchema)
const MongoCollege = mongoose.model('College', MongoCollegeSchema)
const MongoEvent = mongoose.model('Event', MongoEventSchema)

interface MigrationStats {
  users: { total: number; migrated: number; errors: number }
  admins: { total: number; migrated: number; errors: number }
  colleges: { total: number; migrated: number; errors: number }
  events: { total: number; migrated: number; errors: number }
}

class DatabaseMigrator {
  private stats: MigrationStats = {
    users: { total: 0, migrated: 0, errors: 0 },
    admins: { total: 0, migrated: 0, errors: 0 },
    colleges: { total: 0, migrated: 0, errors: 0 },
    events: { total: 0, migrated: 0, errors: 0 }
  }

  async connectMongoDB() {
    try {
      const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/devs-portal'
      await mongoose.connect(mongoUri)
      console.log('✅ Connected to MongoDB')
    } catch (error) {
      console.error('❌ MongoDB connection failed:', error)
      throw error
    }
  }

  async connectSupabase() {
    try {
      console.log('✅ Supabase client initialized')
    } catch (error) {
      console.error('❌ Supabase initialization failed:', error)
      throw error
    }
  }

  async migrateColleges() {
    console.log('\n📋 Migrating Colleges...')
    
    try {
      const mongoColleges = await MongoCollege.find()
      this.stats.colleges.total = mongoColleges.length

      for (const mongoCollege of mongoColleges) {
        try {
          // Skip if required fields are missing
          if (!mongoCollege.name || !mongoCollege.code) {
            console.log(`  ⚠️  Skipping college with missing required fields`)
            this.stats.colleges.errors++
            continue
          }

          const collegeData = {
            name: mongoCollege.name,
            code: mongoCollege.code,
            location: mongoCollege.location || '',
            address: mongoCollege.address || '',
            contactInfo: {
              email: mongoCollege.contactInfo?.email || '',
              phone: mongoCollege.contactInfo?.phone || '',
              website: mongoCollege.contactInfo?.website || ''
            }
          }

          await CollegeService.createCollege(collegeData)
          this.stats.colleges.migrated++
          console.log(`  ✅ Migrated college: ${mongoCollege.name}`)
        } catch (error) {
          this.stats.colleges.errors++
          console.log(`  ❌ Error migrating college ${mongoCollege.name}:`, error)
        }
      }
    } catch (error) {
      console.error('❌ Error in college migration:', error)
    }
  }

  async migrateAdmins() {
    console.log('\n👤 Migrating Admins...')
    
    try {
      const mongoAdmins = await MongoAdmin.find()
      this.stats.admins.total = mongoAdmins.length

      for (const mongoAdmin of mongoAdmins) {
        try {
          // Skip if required fields are missing
          if (!mongoAdmin.username || !mongoAdmin.email || !mongoAdmin.fullName) {
            console.log(`  ⚠️  Skipping admin with missing required fields`)
            this.stats.admins.errors++
            continue
          }

          // Find assigned college if exists
          let assignedCollegeId = undefined
          if (mongoAdmin.assignedCollege) {
            const mongoCollege = await MongoCollege.findById(mongoAdmin.assignedCollege)
            if (mongoCollege && mongoCollege.code) {
              const supabaseCollege = await CollegeService.findByCode(mongoCollege.code)
              assignedCollegeId = supabaseCollege?.id
            }
          }

          const adminData = {
            username: mongoAdmin.username,
            email: mongoAdmin.email,
            password: mongoAdmin.password || 'defaultPassword123', // This will be hashed again in the service
            fullName: mongoAdmin.fullName,
            role: mongoAdmin.role || 'admin',
            assignedCollege: assignedCollegeId,
            permissions: mongoAdmin.permissions || []
          }

          await AdminService.createAdmin(adminData)
          this.stats.admins.migrated++
          console.log(`  ✅ Migrated admin: ${mongoAdmin.username}`)
        } catch (error) {
          this.stats.admins.errors++
          console.log(`  ❌ Error migrating admin ${mongoAdmin.username}:`, error)
        }
      }
    } catch (error) {
      console.error('❌ Error in admin migration:', error)
    }
  }

  async migrateUsers() {
    console.log('\n👥 Migrating Users...')
    
    try {
      const mongoUsers = await MongoUser.find()
      this.stats.users.total = mongoUsers.length

      for (const mongoUser of mongoUsers) {
        try {
          // Skip if required fields are missing
          if (!mongoUser.fullName || !mongoUser.email) {
            console.log(`  ⚠️  Skipping user with missing required fields`)
            this.stats.users.errors++
            continue
          }

          // Find college reference
          let collegeRef = undefined
          if (mongoUser.collegeRef) {
            const mongoCollege = await MongoCollege.findById(mongoUser.collegeRef)
            if (mongoCollege && mongoCollege.code) {
              const supabaseCollege = await CollegeService.findByCode(mongoCollege.code)
              collegeRef = supabaseCollege?.id
            }
          }

          const userData = {
            fullName: mongoUser.fullName,
            email: mongoUser.email,
            phone: mongoUser.phone || '',
            college: mongoUser.college || '',
            collegeRef: collegeRef,
            batchYear: mongoUser.batchYear || '',
            role: mongoUser.role || 'other',
            photoUrl: mongoUser.photoUrl || '',
            memberId: mongoUser.memberId || ''
          }

          await UserService.createUser(userData)
          this.stats.users.migrated++
          console.log(`  ✅ Migrated user: ${mongoUser.fullName}`)
        } catch (error) {
          this.stats.users.errors++
          console.log(`  ❌ Error migrating user ${mongoUser.fullName}:`, error)
        }
      }
    } catch (error) {
      console.error('❌ Error in user migration:', error)
    }
  }

  async migrateEvents() {
    console.log('\n📅 Migrating Events...')
    
    try {
      const mongoEvents = await MongoEvent.find()
      this.stats.events.total = mongoEvents.length

      for (const mongoEvent of mongoEvents) {
        try {
          // Skip if required fields are missing
          if (!mongoEvent.title || !mongoEvent.description || !mongoEvent.date) {
            console.log(`  ⚠️  Skipping event with missing required fields`)
            this.stats.events.errors++
            continue
          }

          // Find target college
          let targetCollegeId = undefined
          if (mongoEvent.targetCollege) {
            const mongoCollege = await MongoCollege.findById(mongoEvent.targetCollege)
            if (mongoCollege && mongoCollege.code) {
              const supabaseCollege = await CollegeService.findByCode(mongoCollege.code)
              targetCollegeId = supabaseCollege?.id
            }
          }

          // Find organizer admin
          let organizerId = undefined
          if (mongoEvent.organizer?.adminId) {
            const mongoAdmin = await MongoAdmin.findById(mongoEvent.organizer.adminId)
            if (mongoAdmin && mongoAdmin.username) {
              const supabaseAdmin = await AdminService.findByUsername(mongoAdmin.username)
              organizerId = supabaseAdmin?.id
            }
          }

          const eventData = {
            title: mongoEvent.title,
            description: mongoEvent.description,
            date: mongoEvent.date.toISOString().split('T')[0], // Convert to YYYY-MM-DD
            time: mongoEvent.time || '',
            location: mongoEvent.location || '',
            eventType: mongoEvent.eventType || 'college-specific',
            targetCollege: targetCollegeId,
            maxAttendees: mongoEvent.maxAttendees || 100,
            category: mongoEvent.category || 'other',
            organizer: {
              adminId: organizerId || 'default-organizer-id',
              name: mongoEvent.organizer?.name || 'Unknown Organizer',
              contact: mongoEvent.organizer?.contact || ''
            },
            requirements: mongoEvent.requirements || [],
            prizes: mongoEvent.prizes || [],
            registrationDeadline: mongoEvent.registrationDeadline ? mongoEvent.registrationDeadline.toISOString() : new Date().toISOString()
          }

          const newEvent = await EventService.createEvent(eventData)
          this.stats.events.migrated++

          // Migrate registrations
          if (mongoEvent.registrations && mongoEvent.registrations.length > 0) {
            for (const registration of mongoEvent.registrations) {
              try {
                if (registration.userId) {
                  const mongoUser = await MongoUser.findById(registration.userId)
                  if (mongoUser && mongoUser.email) {
                    const supabaseUser = await UserService.findByEmail(mongoUser.email)
                    if (supabaseUser) {
                      await EventService.registerForEvent(newEvent.id, supabaseUser.id)
                    }
                  }
                }
              } catch (regError) {
                console.log(`    ⚠️  Error migrating registration:`, regError)
              }
            }
          }

          console.log(`  ✅ Migrated event: ${mongoEvent.title}`)
        } catch (error) {
          this.stats.events.errors++
          console.log(`  ❌ Error migrating event ${mongoEvent.title}:`, error)
        }
      }
    } catch (error) {
      console.error('❌ Error in event migration:', error)
    }
  }

  async showStats() {
    console.log('\n' + '='.repeat(50))
    console.log('📊 MIGRATION STATISTICS')
    console.log('='.repeat(50))
    
    console.log(`Colleges: ${this.stats.colleges.migrated}/${this.stats.colleges.total} (${this.stats.colleges.errors} errors)`)
    console.log(`Admins:   ${this.stats.admins.migrated}/${this.stats.admins.total} (${this.stats.admins.errors} errors)`)
    console.log(`Users:    ${this.stats.users.migrated}/${this.stats.users.total} (${this.stats.users.errors} errors)`)
    console.log(`Events:   ${this.stats.events.migrated}/${this.stats.events.total} (${this.stats.events.errors} errors)`)
    
    const totalItems = this.stats.colleges.total + this.stats.admins.total + this.stats.users.total + this.stats.events.total
    const totalMigrated = this.stats.colleges.migrated + this.stats.admins.migrated + this.stats.users.migrated + this.stats.events.migrated
    const totalErrors = this.stats.colleges.errors + this.stats.admins.errors + this.stats.users.errors + this.stats.events.errors
    
    console.log('='.repeat(50))
    console.log(`TOTAL:    ${totalMigrated}/${totalItems} (${totalErrors} errors)`)
    console.log('='.repeat(50))
  }

  async migrate() {
    console.log('🚀 Starting Migration from MongoDB to Supabase...')
    
    try {
      // Connect to both databases
      await this.connectMongoDB()
      await this.connectSupabase()
      
      // Run migrations in order (colleges first, then admins, then users, then events)
      await this.migrateColleges()
      await this.migrateAdmins()
      await this.migrateUsers()
      await this.migrateEvents()
      
      // Show final statistics
      await this.showStats()
      
      console.log('\n✅ Migration completed successfully!')
      
    } catch (error) {
      console.error('\n❌ Migration failed:', error)
      throw error
    } finally {
      // Close MongoDB connection
      await mongoose.disconnect()
      console.log('📝 MongoDB connection closed')
    }
  }
}

const runMigration = async () => {
  const migrator = new DatabaseMigrator()
  try {
    await migrator.migrate()
    process.exit(0)
  } catch (error) {
    console.error('Migration script failed:', error)
    process.exit(1)
  }
}

// Run if this file is executed directly
if (require.main === module) {
  runMigration()
} 