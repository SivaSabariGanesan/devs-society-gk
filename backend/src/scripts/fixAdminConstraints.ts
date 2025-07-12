import dotenv from 'dotenv'

// Load environment variables first
dotenv.config()

// Initialize Supabase before importing services
import { initializeSupabase } from '../database/supabase'
const supabase = initializeSupabase()

const fixAdminConstraints = async () => {
  try {
    console.log('🔧 Fixing admin constraints...')

    // Drop the existing constraint
    const { error: dropError } = await supabase.rpc('exec_sql', {
      sql: `ALTER TABLE admins DROP CONSTRAINT IF EXISTS admin_college_check;`
    })

    if (dropError) {
      console.log('Note: Constraint might not exist yet:', dropError.message)
    }

    // Create new flexible constraint
    const { error: addError } = await supabase.rpc('exec_sql', {
      sql: `ALTER TABLE admins ADD CONSTRAINT admin_college_check CHECK (
        (role = 'super-admin' AND assigned_college_id IS NULL) OR 
        (role = 'admin')
      );`
    })

    if (addError) {
      console.error('❌ Error adding constraint:', addError.message)
      throw addError
    }

    console.log('✅ Admin constraints fixed successfully!')
    console.log('📝 Admins can now be created without initial college assignment')

  } catch (error) {
    console.error('❌ Error fixing admin constraints:', error)
    process.exit(1)
  }
}

// Run the script
fixAdminConstraints()
  .then(() => {
    console.log('🎉 Script completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Script failed:', error)
    process.exit(1)
  }) 