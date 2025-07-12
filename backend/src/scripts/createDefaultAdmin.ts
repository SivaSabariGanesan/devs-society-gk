import dotenv from 'dotenv'

// Load environment variables first
dotenv.config()

// Initialize Supabase before importing services
import { initializeSupabase } from '../database/supabase'
initializeSupabase()

// Import AdminService
import AdminService from '../services/adminService'

const createDefaultAdmin = async () => {
  try {
    console.log('🚀 Creating default admin account...')

    // Check if admin already exists
    const existingAdmin = await AdminService.findByEmail('admin@devs-society.com')
    if (existingAdmin) {
      console.log('✅ Admin account already exists')
      return
    }

    // Create default admin
    const adminData = {
      username: 'admin',
      email: 'admin@devs-society.com',
      password: 'DevsSociety2024!',
      fullName: 'System Administrator',
      role: 'super-admin' as const,
      permissions: [
        'users.read', 'users.write', 'users.delete',
        'events.read', 'events.write', 'events.delete',
        'colleges.read', 'colleges.write', 'colleges.delete',
        'admins.read', 'admins.write', 'admins.delete',
        'settings.read', 'settings.write',
        'analytics.read', 'system.admin'
      ]
    }

    const admin = await AdminService.createAdmin(adminData)
    console.log('✅ Default admin created successfully!')
    console.log('📧 Email:', admin.email)
    console.log('👤 Username:', admin.username)
    console.log('🔑 Password: DevsSociety2024!')
    console.log('🎯 Role:', admin.role)

  } catch (error) {
    console.error('❌ Error creating default admin:', error)
    process.exit(1)
  }
}

// Run the script
createDefaultAdmin()
  .then(() => {
    console.log('🎉 Script completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Script failed:', error)
    process.exit(1)
  }) 