import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import odaraEmblem from '../assets/odara-emblem.png'

export default function AdminLogin() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!isSupabaseConfigured) {
      setError('Supabase is not connected yet. See SETUP.md in the project for the steps to enable the admin panel.')
      return
    }

    setLoading(true)
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)

    if (authError) {
      setError('Incorrect email or password.')
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', data.user.id)
      .single()

    if (!profile?.is_admin) {
      setError("This account doesn't have admin access. Ask the store owner to enable it (see SETUP.md).")
      await supabase.auth.signOut()
      return
    }

    navigate('/admin')
  }

  return (
    <div className="admin-login-page">
      <div className="admin-login-card">
        <img src={odaraEmblem} alt="Odara" className="w-16 h-16 rounded-full mx-auto mb-4" />
        <h1 className="text-2xl font-playfair text-center mb-1">Odara Admin</h1>
        <p className="text-center text-sm text-2C2C2C/50 mb-8">Sign in to manage products</p>

        {!isSupabaseConfigured && (
          <div className="admin-notice">
            Supabase isn't connected yet, so sign-in is disabled. See <code>SETUP.md</code> in the project root for the exact steps.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="admin-label">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="admin-input"
              placeholder="you@odarafashion.com"
            />
          </div>
          <div>
            <label className="admin-label">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="admin-input"
              placeholder="••••••••"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={loading} className="admin-btn-primary w-full">
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <Link to="/" className="block text-center text-xs text-2C2C2C/45 mt-8 hover:text-2C2C2C/70">
          ← Back to store
        </Link>
      </div>
    </div>
  )
}
