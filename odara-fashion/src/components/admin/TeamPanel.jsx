import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { adminListProfiles, adminSetIsAdmin } from '../../services/products'

export default function TeamPanel() {
  const [profiles, setProfiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [currentUserId, setCurrentUserId] = useState(null)

  const load = async () => {
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      setCurrentUserId(session?.user?.id)
      const data = await adminListProfiles()
      setProfiles(data)
      setError('')
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const toggle = async (profile) => {
    if (profile.id === currentUserId) {
      alert("You can't remove your own admin access from here.")
      return
    }
    setProfiles(profiles.map(p => p.id === profile.id ? { ...p, is_admin: !p.is_admin } : p))
    try {
      await adminSetIsAdmin(profile.id, !profile.is_admin)
    } catch (err) {
      setError(err.message)
      load()
    }
  }

  if (loading) return <p className="text-2C2C2C/50">Loading…</p>

  return (
    <div>
      <h1 className="text-2xl font-playfair mb-2">Team</h1>
      <p className="text-2C2C2C/60 text-sm mb-6">
        Grant or remove dashboard access. Someone needs to sign in at{' '}
        <code className="bg-FAF6EE px-1.5 py-0.5 rounded">/admin/login</code> once before they show up here.
      </p>
      {error && <div className="admin-notice mb-6">{error}</div>}

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Email</th>
              <th>Joined</th>
              <th>Admin Access</th>
            </tr>
          </thead>
          <tbody>
            {profiles.map(p => (
              <tr key={p.id}>
                <td className="font-medium">
                  {p.email}
                  {p.id === currentUserId && <span className="text-2C2C2C/40 text-xs ml-2">(you)</span>}
                </td>
                <td className="text-2C2C2C/60 text-xs">{new Date(p.created_at).toLocaleDateString()}</td>
                <td>
                  <button
                    className={`admin-toggle ${p.is_admin ? 'is-on' : ''}`}
                    onClick={() => toggle(p)}
                    disabled={p.id === currentUserId}
                  >
                    <span className="admin-toggle-knob" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {profiles.length === 0 && (
          <p className="text-2C2C2C/45 text-center py-16">No accounts have signed in yet.</p>
        )}
      </div>
    </div>
  )
}
