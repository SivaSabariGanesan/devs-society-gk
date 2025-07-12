// Initialize Supabase before importing services
import { initializeSupabase } from '../database/supabase'
const supabase = initializeSupabase()

// Import services
import AdminService from '../services/adminService'
import CollegeService from '../services/collegeService'

const testAdminData = async () => {
  try {
    console.log('🧪 Testing admin data structure...')

    // Test 1: Get all admins
    console.log('\n📋 Test 1: Getting all admins...')
    const allAdmins = await AdminService.getAdminsByRole('admin')
    console.log(`Found ${allAdmins.length} admins:`)
    
    allAdmins.forEach((admin, index) => {
      console.log(`  ${index + 1}. ${admin.fullName} (${admin.email})`)
      console.log(`     Role: ${admin.role}`)
      console.log(`     Assigned College: ${admin.assignedCollege ? 
        (typeof admin.assignedCollege === 'object' && admin.assignedCollege !== null ? 
          `${(admin.assignedCollege as any).name} (${(admin.assignedCollege as any).code})` : 
          `ID: ${admin.assignedCollege}`) : 
        'None'}`)
      console.log(`     Tenure Active: ${admin.tenureInfo?.isActive}`)
      console.log(`     Tenure Start: ${admin.tenureInfo?.startDate}`)
      console.log('')
    })

    // Test 2: Get REC college admin specifically
    console.log('\n📋 Test 2: Getting REC college admin...')
    const recCollege = await CollegeService.findByCode('REC')
    if (recCollege) {
      const recAdmin = await AdminService.getAdminByCollege(recCollege.id)
      if (recAdmin) {
        console.log(`✅ REC Admin: ${recAdmin.fullName} (${recAdmin.email})`)
        console.log(`   Assigned College: ${recAdmin.assignedCollege ? 
          (typeof recAdmin.assignedCollege === 'object' && recAdmin.assignedCollege !== null ? 
            `${(recAdmin.assignedCollege as any).name} (${(recAdmin.assignedCollege as any).code})` : 
            `ID: ${recAdmin.assignedCollege}`) : 
          'None'}`)
        console.log(`   Tenure Active: ${recAdmin.tenureInfo?.isActive}`)
        console.log(`   Tenure Start: ${recAdmin.tenureInfo?.startDate}`)
      } else {
        console.log('❌ No admin found for REC')
      }
    } else {
      console.log('❌ REC college not found')
    }

    // Test 3: Get all colleges with their admins
    console.log('\n📋 Test 3: Getting all colleges...')
    const allColleges = await CollegeService.getAllColleges()
    console.log(`Found ${allColleges.length} colleges:`)
    
    for (const college of allColleges) {
      const collegeAdmin = await AdminService.getAdminByCollege(college.id)
      console.log(`  ${college.name} (${college.code}) - ${college.location}`)
      if (collegeAdmin) {
        console.log(`    Admin: ${collegeAdmin.fullName} (${collegeAdmin.email})`)
        console.log(`    Tenure Active: ${collegeAdmin.tenureInfo?.isActive}`)
      } else {
        console.log(`    Admin: No Admin`)
      }
      console.log('')
    }

    console.log('✅ All tests completed!')

  } catch (error) {
    console.error('❌ Error testing admin data:', error)
  }
}

// Run the test
testAdminData()
  .then(() => {
    console.log('\n🎉 Test script completed!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Test script failed:', error)
    process.exit(1)
  }) 