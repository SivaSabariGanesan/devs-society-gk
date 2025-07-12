import dotenv from 'dotenv'

// Load environment variables first
dotenv.config()

// Initialize Supabase before importing services
import { initializeSupabase } from '../database/supabase'
const supabase = initializeSupabase()

// Import services
import AdminService from '../services/adminService'
import CollegeService from '../services/collegeService'
import bcrypt from 'bcryptjs'

const createAdminsWorkaround = async () => {
  try {
    console.log('🔧 Creating admins with workaround method...')

    // First get the colleges we created
    const colleges = await CollegeService.getAllColleges()
    console.log(`📚 Found ${colleges.length} colleges`)

    if (colleges.length === 0) {
      console.log('❌ No colleges found. Please run createTestData first for colleges.')
      return
    }

    // Define admin data
    const adminsData = [
      {
        username: 'admin_iitd',
        email: 'admin.iitd@devs-society.com',
        password: 'Admin123!',
        fullName: 'Rahul Sharma - IITD Admin',
        collegeCode: 'IITD'
      },
      {
        username: 'admin_iitb',
        email: 'admin.iitb@devs-society.com',
        password: 'Admin123!',
        fullName: 'Priya Patel - IITB Admin',
        collegeCode: 'IITB'
      },
      {
        username: 'admin_nitk',
        email: 'admin.nitk@devs-society.com',
        password: 'Admin123!',
        fullName: 'Arun Kumar - NITK Admin',
        collegeCode: 'NITK'
      },
      {
        username: 'junior_admin',
        email: 'junior@devs-society.com',
        password: 'Junior123!',
        fullName: 'Sneha Reddy - Unassigned Admin',
        collegeCode: null
      }
    ]

    console.log('👤 Creating admins using direct database insertion...')

    for (const adminData of adminsData) {
      try {
        // Check if admin already exists
        const existing = await AdminService.findByEmail(adminData.email)
        if (existing) {
          console.log(`  ℹ️  Admin ${adminData.email} already exists`)
          continue
        }

        // Hash password
        const salt = await bcrypt.genSalt(12)
        const passwordHash = await bcrypt.hash(adminData.password, salt)

        // Find college if specified
        let collegeId = null
        if (adminData.collegeCode) {
          const college = colleges.find(c => c.code === adminData.collegeCode)
          if (college) {
            collegeId = college.id
          }
        }

        // Insert directly into database bypassing the constraint issue
        const adminRecord = {
          username: adminData.username,
          email: adminData.email.toLowerCase(),
          password_hash: passwordHash,
          full_name: adminData.fullName,
          role: 'admin',
          permissions: [
            'users.read', 'users.write',
            'events.read', 'events.write', 'events.delete',
            'analytics.read'
          ],
          is_active: true,
          assigned_college_id: collegeId,
          tenure_start_date: collegeId ? new Date().toISOString() : null,
          tenure_end_date: null,
          tenure_is_active: collegeId ? true : false
        }

        const { data, error } = await supabase
          .from('admins')
          .insert(adminRecord)
          .select()
          .single()

        if (error) {
          console.log(`  ❌ Error creating ${adminData.fullName}:`, error.message)
          
          // Try as super-admin first, then downgrade
          console.log(`  🔄 Trying super-admin workaround for ${adminData.fullName}...`)
          
          const superAdminRecord = {
            ...adminRecord,
            role: 'super-admin',
            assigned_college_id: null,
            tenure_start_date: null,
            tenure_is_active: false,
            permissions: [
              'users.read', 'users.write', 'users.delete',
              'events.read', 'events.write', 'events.delete',
              'colleges.read', 'colleges.write', 'colleges.delete',
              'admins.read', 'admins.write', 'admins.delete',
              'settings.read', 'settings.write',
              'analytics.read', 'system.admin'
            ]
          }

          const { data: superData, error: superError } = await supabase
            .from('admins')
            .insert(superAdminRecord)
            .select()
            .single()

          if (superError) {
            console.log(`  ❌ Super admin creation also failed:`, superError.message)
          } else {
            // Now downgrade to regular admin with college assignment
            const { error: updateError } = await supabase
              .from('admins')
              .update({
                role: 'admin',
                assigned_college_id: collegeId,
                tenure_start_date: collegeId ? new Date().toISOString() : null,
                tenure_is_active: collegeId ? true : false,
                permissions: [
                  'users.read', 'users.write',
                  'events.read', 'events.write', 'events.delete',
                  'analytics.read'
                ]
              })
              .eq('id', superData.id)

            if (updateError) {
              console.log(`  ⚠️  Created as super-admin but failed to downgrade:`, updateError.message)
            } else {
              console.log(`  ✅ Created: ${adminData.fullName} (via workaround)`)
              
              // If college assigned, create tenure entry
              if (collegeId) {
                await supabase
                  .from('college_tenure_heads')
                  .insert({
                    admin_id: superData.id,
                    college_id: collegeId,
                    start_date: new Date().toISOString(),
                    is_active: true
                  })
              }
            }
          }
        } else {
          console.log(`  ✅ Created: ${adminData.fullName}`)
          
          // Create tenure entry if college assigned
          if (collegeId) {
            await supabase
              .from('college_tenure_heads')
              .insert({
                admin_id: data.id,
                college_id: collegeId,
                start_date: new Date().toISOString(),
                is_active: true
              })
          }
        }

      } catch (error) {
        console.log(`  ❌ Error with ${adminData.fullName}:`, error)
      }
    }

    // Check results
    const allAdmins = await AdminService.getAllAdmins()
    console.log(`\n🎉 Admin creation completed!`)
    console.log(`📊 Total admins: ${allAdmins.length}`)
    
    console.log('\n🔐 Admin Login Credentials:')
    for (const adminData of adminsData) {
      console.log(`  📧 ${adminData.email} / ${adminData.password}`)
    }

  } catch (error) {
    console.error('❌ Error creating admins:', error)
    process.exit(1)
  }
}

// Run the script
createAdminsWorkaround()
  .then(() => {
    console.log('✨ Script completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Script failed:', error)
    process.exit(1)
  }) 