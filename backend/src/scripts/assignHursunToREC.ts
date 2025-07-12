import dotenv from 'dotenv'

// Load environment variables first
dotenv.config()

// Initialize Supabase before importing services
import { initializeSupabase } from '../database/supabase'
const supabase = initializeSupabase()

// Import services
import AdminService from '../services/adminService'
import CollegeService from '../services/collegeService'

const assignHursunToREC = async () => {
  try {
    console.log('🎯 Assigning hursun to Rajalakshmi Engineering College...')

    // Find hursun admin
    const hursunAdmin = await AdminService.findByEmail('hursun@gmail.com')
    if (!hursunAdmin) {
      console.log('❌ Hursun admin not found')
      return
    }

    // Find REC college
    const recCollege = await CollegeService.findByCode('REC')
    if (!recCollege) {
      console.log('❌ REC college not found')
      return
    }

    console.log('📋 Assignment Details:')
    console.log(`  Admin: ${hursunAdmin.fullName} (${hursunAdmin.email})`)
    console.log(`  College: ${recCollege.name} (${recCollege.code})`)
    console.log(`  Current Role: ${hursunAdmin.role}`)

    // Assign to college
    console.log('\n🔗 Assigning to college...')
    const assignmentResult = await AdminService.assignAdminToCollege(hursunAdmin.id, recCollege.id)
    
    if (!assignmentResult) {
      console.log('❌ Failed to assign admin to college')
      return
    }

    console.log('✅ Successfully assigned to college!')

    // Now try to convert to regular admin
    console.log('\n🔧 Converting to regular admin role...')
    const { error: updateError } = await supabase
      .from('admins')
      .update({
        role: 'admin',
        permissions: [
          'users.read', 'users.write',
          'events.read', 'events.write', 'events.delete',
          'analytics.read'
        ]
      })
      .eq('id', hursunAdmin.id)

    if (updateError) {
      console.log('⚠️ Could not change role, but admin is assigned to college:', updateError.message)
    } else {
      console.log('✅ Successfully converted to regular admin!')
    }

    // Verify final state
    console.log('\n🔍 Verifying final state...')
    const finalAdmin = await AdminService.findByEmail('hursun@gmail.com')
    if (finalAdmin) {
      console.log('📋 Final Admin Details:')
      console.log(`  Name: ${finalAdmin.fullName}`)
      console.log(`  Role: ${finalAdmin.role}`)
      console.log(`  College: ${finalAdmin.collegeInfo ? `${finalAdmin.collegeInfo.name} (${finalAdmin.collegeInfo.code})` : 'Not assigned'}`)
      console.log(`  Tenure Active: ${finalAdmin.tenureInfo?.isActive}`)
      console.log(`  Permissions: ${finalAdmin.permissions.length} items`)
    }

  } catch (error) {
    console.error('❌ Error assigning hursun to REC:', error)
  }
}

// Run the script
assignHursunToREC()
  .then(() => {
    console.log('✨ Assignment completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Script failed:', error)
    process.exit(1)
  }) 