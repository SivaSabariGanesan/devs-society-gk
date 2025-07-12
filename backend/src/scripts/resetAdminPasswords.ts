import { initializeSupabase } from '../database/supabase'
import AdminService from '../services/adminService'
import bcrypt from 'bcryptjs'

// Initialize Supabase
const supabase = initializeSupabase()

const resetAdminPasswords = async () => {
  try {
    console.log('🔧 Resetting Admin Passwords...\n')

    // Get all admin accounts
    const allAdmins = await AdminService.getAllAdmins()
    console.log(`Found ${allAdmins.length} admin accounts\n`)

    // New password for all admins
    const newPassword = 'Admin123!'
    const salt = await bcrypt.genSalt(12)
    const hashedPassword = await bcrypt.hash(newPassword, salt)

    console.log(`Setting all admin passwords to: ${newPassword}\n`)

    // Update passwords for each admin
    for (const admin of allAdmins) {
      try {
        console.log(`Updating password for: ${admin.fullName} (${admin.email})`)
        
        const { error } = await supabase
          .from('admins')
          .update({ password_hash: hashedPassword })
          .eq('id', admin.id)

        if (error) {
          console.log(`  ❌ Error updating password: ${error.message}`)
        } else {
          console.log(`  ✅ Password updated successfully`)
        }
        
      } catch (error) {
        console.log(`  ❌ Error updating password for ${admin.email}:`, error)
      }
    }

    console.log('\n✅ Password reset completed!')
    console.log(`📝 All admin passwords are now: ${newPassword}`)
    console.log('\nYou can now test admin login with:')
    console.log('- Email/Username: any admin email or username')
    console.log('- Password: Admin123!')

  } catch (error) {
    console.error('❌ Error resetting admin passwords:', error)
  }
}

// Run the script
resetAdminPasswords() 