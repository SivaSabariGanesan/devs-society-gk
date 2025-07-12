import dotenv from 'dotenv'

// Load environment variables first
dotenv.config()

// Initialize Supabase before importing services
import { initializeSupabase } from '../database/supabase'
initializeSupabase()

// Import services
import AdminService from '../services/adminService'

const testAdminCreation = async () => {
  try {
    console.log('🔍 Testing admin creation and role assignment...')

    // Create a test admin with unique but short credentials
    const timestamp = Date.now().toString().slice(-8)  // Last 8 digits
    const testAdminData = {
      username: `test${timestamp}`,  // test + 8 digits = 12 chars (within 20 limit)
      email: `test${timestamp}@devs-society.com`,
      password: 'TestPassword123!',
      fullName: 'Test Admin User',
      role: 'admin' as const
    }

    console.log(`\n📝 Creating admin: ${testAdminData.fullName}`)
    console.log(`   Username: ${testAdminData.username}`)
    console.log(`   Email: ${testAdminData.email}`)
    console.log(`   Expected Role: ${testAdminData.role}`)

    // Create the admin
    const createdAdmin = await AdminService.createAdmin(testAdminData)

    console.log('\n✅ Admin created successfully!')
    console.log(`   ID: ${createdAdmin.id}`)
    console.log(`   Name: ${createdAdmin.fullName}`)
    console.log(`   Email: ${createdAdmin.email}`)
    console.log(`   Role: ${createdAdmin.role}`)
    console.log(`   Assigned College: ${createdAdmin.assignedCollege || 'None'}`)
    console.log(`   Active: ${createdAdmin.isActive}`)

    // Verify the role is correct
    if (createdAdmin.role === 'admin') {
      console.log('✅ Role assignment successful: admin')
    } else {
      console.log(`❌ Role assignment failed: expected 'admin' but got '${createdAdmin.role}'`)
    }

    // Test admin lookup
    console.log('\n🔍 Testing admin lookup...')
    const foundAdmin = await AdminService.findByEmail(testAdminData.email)
    if (foundAdmin) {
      console.log(`✅ Admin lookup successful`)
      console.log(`   Found Role: ${foundAdmin.role}`)
      console.log(`   Found College: ${foundAdmin.collegeInfo ? `${foundAdmin.collegeInfo.name} (${foundAdmin.collegeInfo.code})` : 'No college assigned'}`)
    } else {
      console.log('❌ Admin lookup failed')
    }

    // Test admin appears in admin list
    console.log('\n📋 Testing admin list inclusion...')
    const allAdmins = await AdminService.getAdminsByRole('admin')
    const adminInList = allAdmins.find(admin => admin.email === testAdminData.email)
    
    if (adminInList) {
      console.log('✅ Admin appears in admin list')
      console.log(`   List Role: ${adminInList.role}`)
    } else {
      console.log('❌ Admin does not appear in admin list')
      
      // Check if they appear in super-admin list instead
      const superAdmins = await AdminService.getAdminsByRole('super-admin')
      const adminInSuperList = superAdmins.find(admin => admin.email === testAdminData.email)
      
      if (adminInSuperList) {
        console.log('⚠️  Admin appears in SUPER-ADMIN list instead!')
        console.log(`   Super List Role: ${adminInSuperList.role}`)
      }
    }

    // Clean up
    console.log('\n🗑️  Cleaning up test admin...')
    await AdminService.deleteAdmin(createdAdmin.id)
    console.log('✅ Test admin deleted')

  } catch (error) {
    console.error('❌ Error testing admin creation:', error)
    if (error instanceof Error) {
      console.error('Error message:', error.message)
    }
  }
}

// Run the test
testAdminCreation()
  .then(() => {
    console.log('\n✨ Admin creation test completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Test failed:', error)
    process.exit(1)
  }) 