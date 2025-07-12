import { getSupabase } from '../database/supabase'
import CollegeService from '../services/collegeService'

async function fixCollegeData() {
  try {
    console.log('🔧 Fixing college data in user records...\n')

    const supabase = getSupabase()
    
    // Get all users
    const { data: users, error } = await supabase
      .from('users')
      .select('*')

    if (error) {
      console.error('❌ Error fetching users:', error)
      return
    }

    console.log(`📊 Found ${users?.length || 0} users to check\n`)

    let fixedCount = 0

    for (const user of users || []) {
      console.log(`👤 Checking user: ${user.full_name} (${user.email})`)
      console.log(`   Current college field: "${user.college}"`)
      console.log(`   Current college_ref_id: "${user.college_ref_id}"`)

      // Check if college field contains a UUID (college ID)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      
      if (uuidRegex.test(user.college) && !user.college_ref_id) {
        console.log(`   🔧 Found college ID in college field, updating college_ref_id...`)
        
        try {
          // Verify this is a valid college ID
          const college = await CollegeService.findById(user.college)
          if (college) {
            console.log(`   ✅ Found college: "${college.name}"`)
            
            // Update the user record
            const { error: updateError } = await supabase
              .from('users')
              .update({ 
                college_ref_id: user.college,
                college: college.name // Also update college field to contain the name
              })
              .eq('id', user.id)

            if (updateError) {
              console.log(`   ❌ Error updating user: ${updateError.message}`)
            } else {
              console.log(`   ✅ Successfully updated user`)
              fixedCount++
            }
          } else {
            console.log(`   ❌ College not found for ID: ${user.college}`)
          }
        } catch (collegeError) {
          console.log(`   ❌ Error fetching college: ${collegeError}`)
        }
      } else if (user.college_ref_id) {
        console.log(`   ✅ User already has college_ref_id set`)
      } else {
        console.log(`   ⚠️  College field doesn't look like a UUID, skipping`)
      }
      
      console.log('---')
    }

    console.log(`\n🎉 Fix completed!`)
    console.log(`   Fixed ${fixedCount} user records`)

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

// Run the fix
fixCollegeData()
  .then(() => {
    console.log('\n✅ Fix completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Fix failed:', error)
    process.exit(1)
  }) 