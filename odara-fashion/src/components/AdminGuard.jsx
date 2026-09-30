import { Navigate } from 'react-router-dom'
import { useAdminAuth } from '../hooks/useAdminAuth'

export default function AdminGuard({ children }) {
  const { loading, session, isAdmin, isSupabaseConfigured } = useAdminAuth()

  if (!isSupabaseConfigured) {
    return <Navigate to="/admin/login" replace />
  }

  if (loading) {
    return (
      <div className="admin-shell flex items-center justify-center min-h-screen">
        <p className="text-2C2C2C/50">Loading…</p>
      </div>
    )
  }

  if (!session || !isAdmin) {
    return <Navigate to="/admin/login" replace />
  }

  return children
}
