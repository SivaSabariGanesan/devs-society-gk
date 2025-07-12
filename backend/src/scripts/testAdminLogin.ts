import { initializeSupabase } from '../database/supabase'
import AdminService from '../services/adminService'

// Initialize Supabase
const supabase = initializeSupabase()

const testAdminLogin = async () => {
  try {
    console.log('🔍 Testing Admin Login Functionality...\n')

    // 1. Check all admins in database
    console.log('1. Checking all admins in database:')
    const allAdmins = await AdminService.getAllAdmins()
    console.log(`   Total admins found: ${allAdmins.length}`)
    
    allAdmins.forEach((admin, index) => {
      console.log(`   ${index + 1}. ${admin.fullName} (${admin.email})`)
      console.log(`      Username: ${admin.username}`)
      console.log(`      Role: ${admin.role}`)
      console.log(`      Active: ${admin.isActive}`)
      console.log(`      Assigned College: ${admin.assignedCollege || 'None'}`)
      console.log('')
    })

    // 2. Test finding admin by email
    console.log('2. Testing findByEmail:')
    const testEmails = ['admin@devs-society.com', 'superadmin@devs.society', 'hursun@gmail.com']
    
    for (const email of testEmails) {
      const admin = await AdminService.findByEmail(email)
      if (admin) {
        console.log(`   ✅ Found admin by email "${email}": ${admin.fullName}`)
        console.log(`      Role: ${admin.role}, Active: ${admin.isActive}`)
      } else {
        console.log(`   ❌ No admin found by email "${email}"`)
      }
    }

    // 3. Test finding admin by username
    console.log('\n3. Testing findByUsername:')
    const testUsernames = ['admin', 'superadmin', 'hursun']
    
    for (const username of testUsernames) {
      const admin = await AdminService.findByUsername(username)
      if (admin) {
        console.log(`   ✅ Found admin by username "${username}": ${admin.fullName}`)
        console.log(`      Role: ${admin.role}, Active: ${admin.isActive}`)
      } else {
        console.log(`   ❌ No admin found by username "${username}"`)
      }
    }

    // 4. Test password comparison
    console.log('\n4. Testing password comparison:')
    const testAdmin = allAdmins[0]
    if (testAdmin) {
      console.log(`   Testing with admin: ${testAdmin.fullName}`)
      
      // Test with correct password (we don't know the actual password, so this will likely fail)
      const isValidPassword = await AdminService.comparePassword(testAdmin, 'testpassword')
      console.log(`   Password comparison result: ${isValidPassword}`)
    }

    // 5. Check admin roles
    console.log('\n5. Checking admin roles:')
    const superAdmins = await AdminService.getAdminsByRole('super-admin')
    const regularAdmins = await AdminService.getAdminsByRole('admin')
    
    console.log(`   Super Admins: ${superAdmins.length}`)
    superAdmins.forEach(admin => {
      console.log(`      - ${admin.fullName} (${admin.email})`)
    })
    
    console.log(`   Regular Admins: ${regularAdmins.length}`)
    regularAdmins.forEach(admin => {
      console.log(`      - ${admin.fullName} (${admin.email})`)
    })

    console.log('\n✅ Admin login test completed!')

  } catch (error) {
    console.error('❌ Error testing admin login:', error)
  }
}

// Run the test
testAdminLogin() 