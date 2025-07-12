import dotenv from 'dotenv'

// Load environment variables first
dotenv.config()

// Initialize Supabase before importing services
import { initializeSupabase } from '../database/supabase'
const supabase = initializeSupabase()

// Import services
import AdminService from '../services/adminService'

const fixHursunAdmin = async () => {
  try {
    console.log('🔍 Finding and fixing hursun admin...')

    // Find the existing hursun admin
    let hursunAdmin = await AdminService.findByEmail('hursun@gmail.com')
    
    if (!hursunAdmin) {
      // Try finding by username
      hursunAdmin = await AdminService.findByUsername('hursun')
    }

    if (!hursunAdmin) {
      console.log('❌ Hursun admin not found')
      return
    }

    console.log('👤 Current Hursun Admin Details:')
    console.log(`  ID: ${hursunAdmin.id}`)
    console.log(`  Username: ${hursunAdmin.username}`)
    console.log(`  Email: ${hursunAdmin.email}`)
    console.log(`  Full Name: ${hursunAdmin.fullName}`)
    console.log(`  Current Role: ${hursunAdmin.role}`)
    console.log(`  Permissions: ${hursunAdmin.permissions.length} items`)

    if (hursunAdmin.role === 'super-admin') {
      console.log('\n🔧 Converting from super-admin to regular admin...')
      
      // Update the admin to regular admin role with proper permissions
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
        console.error('❌ Error updating admin role:', updateError)
        
        if (updateError.code === '23514') {
          console.log('⚠️ Constraint issue detected. Admin will remain as super-admin for now.')
          console.log('💡 You can assign them to a college which should allow role change.')
        }
      } else {
        console.log('✅ Successfully updated to regular admin!')
        
        // Verify the change
        const updatedAdmin = await AdminService.findByEmail('hursun@gmail.com')
        if (updatedAdmin) {
          console.log('\n📋 Updated Admin Details:')
          console.log(`  Role: ${updatedAdmin.role}`)
          console.log(`  Permissions: ${updatedAdmin.permissions.length} items`)
          console.log(`  College: ${updatedAdmin.collegeInfo ? updatedAdmin.collegeInfo.name : 'Not assigned'}`)
        }
      }
    } else {
      console.log('✅ Admin already has correct role!')
    }

    // Show available colleges for assignment
    console.log('\n🏫 Available colleges for assignment:')
    const { data: colleges, error: collegeError } = await supabase
      .from('colleges')
      .select('id, name, code, location')
      .eq('is_active', true)

    if (collegeError) {
      console.error('Error fetching colleges:', collegeError)
    } else if (colleges) {
      colleges.forEach((college, index) => {
        console.log(`  ${index + 1}. ${college.name} (${college.code}) - ${college.location}`)
      })
      
      console.log('\n💡 To assign hursun to a college, you can use the SuperAdmin dashboard or run:')
      console.log(`   AdminService.assignAdminToCollege('${hursunAdmin.id}', 'COLLEGE_ID')`)
    }

  } catch (error) {
    console.error('❌ Error fixing hursun admin:', error)
  }
}

// Run the script
fixHursunAdmin()
  .then(() => {
    console.log('✨ Fix completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Script failed:', error)
    process.exit(1)
  }) 