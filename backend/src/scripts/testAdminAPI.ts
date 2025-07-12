import dotenv from 'dotenv'
import axios from 'axios'
import jwt from 'jsonwebtoken'

// Load environment variables first
dotenv.config()

// Initialize Supabase before importing services
import { initializeSupabase } from '../database/supabase'
const supabase = initializeSupabase()

// Import services
import AdminService from '../services/adminService'

const testAdminAPI = async () => {
  try {
    console.log('🔍 Testing /api/super-admin/admins endpoint...')

    // First, get a real super-admin from the database
    const superAdmin = await AdminService.findByEmail('admin@devs-society.com')
    if (!superAdmin) {
      console.error('❌ Default super-admin not found in database')
      return
    }

    console.log(`📋 Using super-admin: ${superAdmin.fullName} (${superAdmin.email})`)
    console.log(`🔑 Admin ID: ${superAdmin.id}`)

    // Create a valid JWT token for super-admin
    const token = jwt.sign(
      {
        id: superAdmin.id,
        username: superAdmin.username,
        email: superAdmin.email,
        role: superAdmin.role,
        permissions: superAdmin.permissions || [],
        assignedCollege: superAdmin.assignedCollege
      },
      process.env.JWT_SECRET || 'your_jwt_secret_key',
      { expiresIn: '1h' }
    )

    console.log('🔑 Generated token:', token.substring(0, 50) + '...')

    // Test the endpoint
    const response = await axios.get('http://localhost:5050/api/super-admin/admins', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })

    console.log('\n✅ API Response:')
    console.log('Status:', response.status)
    console.log('Success:', response.data.success)
    console.log('Count:', response.data.count)
    
    if (response.data.admins && response.data.admins.length > 0) {
      console.log('\n📋 Admins found:')
      response.data.admins.forEach((admin: any, index: number) => {
        console.log(`  ${index + 1}. ${admin.fullName} (${admin.email})`)
        console.log(`     Role: ${admin.role}`)
        console.log(`     College: ${admin.collegeInfo ? `${admin.collegeInfo.name} (${admin.collegeInfo.code})` : 'No college assigned'}`)
        console.log(`     Active: ${admin.isActive}`)
        console.log('')
      })

      // Look specifically for hursun
      const hursunAdmin = response.data.admins.find((admin: any) => admin.email === 'hursun@gmail.com')
      if (hursunAdmin) {
        console.log('🎯 Found hursun admin in API response:')
        console.log('   Name:', hursunAdmin.fullName)
        console.log('   Role:', hursunAdmin.role)
        console.log('   College Info:', hursunAdmin.collegeInfo)
        console.log('   College Assigned:', hursunAdmin.assignedCollege)
        console.log('   Tenure Info:', hursunAdmin.tenureInfo)
        
        // This is what the frontend sees!
        console.log('\n🖥️  FRONTEND DISPLAY:')
        console.log(`   College: ${hursunAdmin.collegeInfo ? `${hursunAdmin.collegeInfo.name} (${hursunAdmin.collegeInfo.code})` : 'No college assigned'}`)
      } else {
        console.log('❌ hursun admin NOT found in API response')
      }
    } else {
      console.log('❌ No admins returned from API')
    }

  } catch (error: any) {
    console.error('❌ Error testing API:', error.response?.data || error.message)
  }
}

// Run the test
testAdminAPI()
  .then(() => {
    console.log('\n✨ API test completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Test failed:', error)
    process.exit(1)
  }) 