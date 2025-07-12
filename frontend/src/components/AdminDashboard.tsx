import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import SuperAdminDashboard from './SuperAdminDashboard'
import CollegeAdminDashboard from './CollegeAdminDashboard'
import RegularAdminDashboard from './RegularAdminDashboard'
import { adminApiService, type Admin } from '../services/adminApi'

const AdminDashboard: React.FC = () => {
  const [admin, setAdmin] = useState<Admin | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    loadAdminProfile()
  }, [])

  const loadAdminProfile = async () => {
    try {
      // First check localStorage for admin data
      const adminData = localStorage.getItem('adminUser')
      if (adminData) {
        const parsedAdmin = JSON.parse(adminData)
        setAdmin(parsedAdmin)
        setIsLoading(false)
        return
      }

      // If not in localStorage, fetch from API
      const response = await adminApiService.getProfile()
      if (response.success) {
        setAdmin(response.admin)
        localStorage.setItem('adminUser', JSON.stringify(response.admin))
      } else {
        setError('Failed to load admin profile')
        // Redirect to login if profile fetch fails
        setTimeout(() => {
          localStorage.removeItem('adminToken')
          localStorage.removeItem('adminUser')
          navigate('/admin/login')
        }, 2000)
      }
    } catch (error: any) {
      console.error('Error loading admin profile:', error)
      setError('Authentication failed')
      // Redirect to login on error
      setTimeout(() => {
        localStorage.removeItem('adminToken')
        localStorage.removeItem('adminUser')
        navigate('/admin/login')
      }, 2000)
    } finally {
      setIsLoading(false)
    }
  }

  // Loading screen
  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-purple-500/20 border-t-purple-500 rounded-full animate-spin"></div>
          <p className="text-white">Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  // Error screen
  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-xl mb-2">{error}</div>
          <div className="text-gray-400">Redirecting to login...</div>
        </div>
      </div>
    )
  }

  // No admin data
  if (!admin) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-xl mb-2">No admin data found</div>
          <div className="text-gray-400">Redirecting to login...</div>
        </div>
      </div>
    )
  }

  // Route to appropriate dashboard based on role
  switch (admin.role) {
    case 'super-admin':
      return <SuperAdminDashboard />
    case 'college-admin':
      return <CollegeAdminDashboard />
    case 'admin':
      return <RegularAdminDashboard />
    default:
      return (
        <div className="min-h-screen bg-black flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-400 text-xl mb-2">Invalid admin role: {admin.role}</div>
            <div className="text-gray-400">Please contact system administrator</div>
          </div>
        </div>
      )
  }
}

export default AdminDashboard 