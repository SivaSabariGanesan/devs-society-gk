import { useEffect } from 'react'
import { Navigate } from 'react-router-dom'
 
export function AdminDashboard() {
  // This component now redirects to the main admin dashboard
  // which handles role-based routing internally
  return <Navigate to="/admin/dashboard" replace />
} 