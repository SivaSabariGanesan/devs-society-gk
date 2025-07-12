import dotenv from 'dotenv'
import AdminService from '../services/adminService'

// Load environment variables
dotenv.config()

async function createSuperAdmin() {
  try {
    console.log('Creating super admin...')
    
    // Check if super admin already exists
    const existingAdmin = await AdminService.findByEmail('superadmin@devs.society')
    if (existingAdmin) {
      console.log('Super admin already exists!')
      return
    }

    const superAdminData = {
      username: 'superadmin',
      email: 'superadmin@devs.society',
      password: 'SuperAdmin123!',
      fullName: 'Super Administrator',
      role: 'super-admin' as const
    }

    const admin = await AdminService.createAdmin(superAdminData)
    
    console.log('Super admin created successfully!')
    console.log('Username:', admin.username)
    console.log('Email:', admin.email)
    console.log('Role:', admin.role)
    console.log('ID:', admin.id)
    
  } catch (error) {
    console.error('Error creating super admin:', error)
    process.exit(1)
  }
}

// Run the script
createSuperAdmin()
  .then(() => {
    console.log('Script completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Script failed:', error)
    process.exit(1)
  }) 