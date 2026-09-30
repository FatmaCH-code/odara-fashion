import { useState } from 'react'
import { Navigate, useNavigate, Link } from 'react-router-dom'
import { Lock, Mail, Eye, EyeOff } from 'lucide-react'
import { useAdminStore } from '../store/adminStore'
import { backendMode, DEMO_ADMIN } from '../services/api'
import emblem from '../assets/odara-emblem.png'

export default function AdminLogin() {
  const { admin, ready, login } = useAdminStore()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  if (ready && admin) return <Navigate to="/admin" replace />

  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setError('')
    try { await login(email, password); navigate('/admin', { replace: true }) }
    catch (err) { setError(err.message) } finally { setBusy(false) }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute -top-40 -left-40 w-[28rem] h-[28rem] rounded-full bg-C9A876/15 blur-3xl" />
      <div className="absolute -bottom-40 -right-40 w-[28rem] h-[28rem] rounded-full bg-C9A876/10 blur-3xl" />
      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <img src={emblem} alt="Odara" className="w-20 h-20 rounded-full mx-auto mb-4 ring-2 ring-C9A876/60 shadow-2xl" />
          <h1 className="text-3xl font-playfair text-white tracking-widest">ODARA</h1>
          <p className="text-C9A876 text-xs uppercase tracking-[0.3em] mt-1">Manager Console</p>
        </div>

        <form onSubmit={submit} className="bg-slate-900/80 backdrop-blur border border-slate-800 rounded-2xl p-6 md:p-8 shadow-2xl space-y-4">
          <h2 className="text-xl text-white font-semibold">Sign in</h2>
          <label className="block">
            <span className="text-xs uppercase tracking-wider text-slate-400">Email</span>
            <div className="mt-1 relative"><Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input type="email" required autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)}
                     className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-3 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-C9A876" placeholder="manager@odara.com" /></div>
          </label>
          <label className="block">
            <span className="text-xs uppercase tracking-wider text-slate-400">Password</span>
            <div className="mt-1 relative"><Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input type={show ? 'text' : 'password'} required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)}
                     className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-11 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-C9A876" placeholder="••••••••" />
              <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300" aria-label="Show password">{show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button></div>
          </label>
          {error && <p className="text-sm text-red-300 bg-red-950/50 border border-red-900 rounded-xl p-3">{error}</p>}
          <button disabled={busy} className="w-full bg-C9A876 hover:bg-[#b8945f] text-slate-950 font-semibold rounded-xl py-3 transition disabled:opacity-60">{busy ? 'Signing in…' : 'Sign in'}</button>
        </form>

        {backendMode === 'local' && (
          <div className="mt-4 text-xs text-amber-200/90 bg-amber-950/40 border border-amber-900/60 rounded-xl p-3 leading-relaxed">
            <b>Demo mode</b> — the database isn't connected yet, so data is stored in this browser only.
            Sign in with <span className="font-mono">{DEMO_ADMIN.email}</span> / <span className="font-mono">{DEMO_ADMIN.password}</span>.
          </div>
        )}
        <p className="text-center mt-6"><Link to="/" className="text-slate-500 hover:text-C9A876 text-sm">← Back to store</Link></p>
      </div>
    </div>
  )
}
