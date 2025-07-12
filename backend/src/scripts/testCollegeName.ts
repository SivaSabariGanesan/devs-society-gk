import { getSupabase } from '../database/supabase'
import UserService from '../services/userService'
import CollegeService from '../services/collegeService'

async function testCollegeName() {
  try {
    console.log('🔍 Testing College Name Resolution...\n')

    // Get all users
    const { users } = await UserService.getAllUsers(1, 10, false)
    
    console.log(`📊 Found ${users.length} users:\n`)

    for (const user of users) {
      console.log(`👤 User: ${user.fullName}`)
      console.log(`   Email: ${user.email}`)
      console.log(`   College field: "${user.college}"`)
      console.log(`   CollegeRef: "${user.collegeRef}"`)
      console.log(`   Batch Year: ${user.batchYear}`)
      console.log('')

      // If collegeRef exists, try to fetch the college name
      if (user.collegeRef) {
        try {
          const college = await CollegeService.findById(user.collegeRef)
          if (college) {
            console.log(`   ✅ College name from ID: "${college.name}"`)
          } else {
            console.log(`   ❌ College not found for ID: ${user.collegeRef}`)
          }
        } catch (error) {
          console.log(`   ❌ Error fetching college: ${error}`)
        }
      } else {
        console.log(`   ⚠️  No collegeRef found`)
      }
      console.log('---')
    }

    // Test a specific user by email
    const testEmail = '230701091@rajalakshmi.edu.in'
    console.log(`\n🔍 Testing specific user: ${testEmail}`)
    
    const specificUser = await UserService.findByEmail(testEmail)
    if (specificUser) {
      console.log(`   Name: ${specificUser.fullName}`)
      console.log(`   College: "${specificUser.college}"`)
      console.log(`   CollegeRef: "${specificUser.collegeRef}"`)
      
      if (specificUser.collegeRef) {
        const college = await CollegeService.findById(specificUser.collegeRef)
        if (college) {
          console.log(`   ✅ Resolved college name: "${college.name}"`)
        }
      }
    } else {
      console.log(`   ❌ User not found`)
    }

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

// Run the test
testCollegeName()
  .then(() => {
    console.log('\n✅ Test completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Test failed:', error)
    process.exit(1)
  }) 