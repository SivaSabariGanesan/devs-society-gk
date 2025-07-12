import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'

// Load environment variables first
dotenv.config()

// Initialize Supabase before importing services
import { initializeSupabase } from '../database/supabase'
const supabase = initializeSupabase()

const applyMigration = async () => {
  try {
    console.log('🔧 Applying admin constraint fix migration...')

    // Read the migration file
    const migrationPath = path.join(__dirname, '../database/migrations/003_fix_admin_constraint.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8')

    console.log('\n📄 Migration SQL:')
    console.log(migrationSQL)

    // Split the migration into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--') && stmt !== '')

    console.log(`\n🔧 Executing ${statements.length} SQL statements...`)

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      console.log(`\n${i + 1}. ${statement.substring(0, 100)}...`)

      try {
        const { error } = await supabase.rpc('exec_sql', {
          sql: statement
        })

        if (error) {
          console.log(`   ⚠️  Statement result: ${error.message}`)
        } else {
          console.log('   ✅ Statement executed successfully')
        }
      } catch (statementError) {
        console.log(`   ❌ Statement failed:`, statementError)
      }
    }

    // Test admin creation after migration
    console.log('\n🧪 Testing admin creation after migration...')
    
    const AdminService = (await import('../services/adminService')).default
    
    const testAdminData = {
      username: `test${Date.now().toString().slice(-6)}`,
      email: `test${Date.now().toString().slice(-6)}@test.com`,
      password: 'TestPass123!',
      fullName: 'Test Migration Admin',
      role: 'admin' as const
    }

    try {
      const testAdmin = await AdminService.createAdmin(testAdminData)
      console.log('✅ Post-migration admin creation successful!')
      console.log(`   Role: ${testAdmin.role}`)
      
      if (testAdmin.role === 'admin') {
        console.log('🎉 MIGRATION SUCCESSFUL! Admin constraint fixed.')
      } else {
        console.log('⚠️  Admin created but role is still incorrect')
      }

      // Clean up
      await AdminService.deleteAdmin(testAdmin.id)
      console.log('   Test admin cleaned up')

    } catch (testError) {
      console.log('❌ Post-migration test failed:', testError)
    }

  } catch (error) {
    console.error('❌ Migration failed:', error)
  }
}

// Run the migration
applyMigration()
  .then(() => {
    console.log('\n✨ Migration completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Migration failed:', error)
    process.exit(1)
  }) 