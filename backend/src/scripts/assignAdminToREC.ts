// Initialize Supabase before importing services
import { initializeSupabase } from '../database/supabase'
const supabase = initializeSupabase()

// Import services
import AdminService from '../services/adminService'
import CollegeService from '../services/collegeService'

const assignAdminToREC = async () => {
  try {
    console.log('🎯 Assigning admin to Rajalakshmi Engineering College (REC)...')

    // Find REC college
    const recCollege = await CollegeService.findByCode('REC')
    if (!recCollege) {
      console.log('❌ REC college not found')
      return
    }

    console.log(`✅ Found REC college: ${recCollege.name} (${recCollege.code})`)

    // Check if REC already has an admin
    const currentAdmin = await AdminService.getAdminByCollege(recCollege.id)
    if (currentAdmin) {
      console.log(`✅ REC already has an admin: ${currentAdmin.fullName} (${currentAdmin.email})`)
      return
    }

    // Find an unassigned admin or create one
    const unassignedAdmins = await AdminService.getUnassignedAdmins()
    let adminToAssign = null

    if (unassignedAdmins.length > 0) {
      adminToAssign = unassignedAdmins[0]
      console.log(`📋 Found unassigned admin: ${adminToAssign.fullName} (${adminToAssign.email})`)
    } else {
      console.log('📋 No unassigned admins found, creating a new admin for REC...')
      
      // Create a new admin for REC
      const newAdmin = await AdminService.createAdmin({
        username: 'admin_rec',
        email: 'admin.rec@devs-society.com',
        password: 'Admin123!',
        fullName: 'REC Admin',
        role: 'admin',
        assignedCollege: recCollege.id
      })
      
      adminToAssign = newAdmin
      console.log(`✅ Created new admin: ${adminToAssign.fullName} (${adminToAssign.email})`)
    }

    // Assign admin to REC
    console.log('\n🔗 Assigning admin to REC...')
    const assignmentResult = await AdminService.assignAdminToCollege(adminToAssign.id, recCollege.id)
    
    if (!assignmentResult) {
      console.log('❌ Failed to assign admin to REC')
      return
    }

    console.log('✅ Successfully assigned admin to REC!')

    // Verify the assignment
    console.log('\n🔍 Verifying assignment...')
    const verifiedAdmin = await AdminService.getAdminByCollege(recCollege.id)
    if (verifiedAdmin) {
      console.log(`✅ Verification successful: ${verifiedAdmin.fullName} is now assigned to ${recCollege.name}`)
      console.log(`   Email: ${verifiedAdmin.email}`)
      console.log(`   Tenure Start: ${verifiedAdmin.tenureInfo?.startDate}`)
      console.log(`   Tenure Active: ${verifiedAdmin.tenureInfo?.isActive}`)
    } else {
      console.log('❌ Verification failed: No admin found for REC')
    }

  } catch (error) {
    console.error('❌ Error assigning admin to REC:', error)
  }
}

// Run the script
assignAdminToREC()
  .then(() => {
    console.log('\n🎉 Script completed!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Script failed:', error)
    process.exit(1)
  }) 