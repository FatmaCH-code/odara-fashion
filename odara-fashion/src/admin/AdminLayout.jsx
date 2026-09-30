import { useEffect, useState } from 'react'
import { Navigate, NavLink, Outlet, Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, Package, ShoppingBag, LogOut, Menu, X, ExternalLink, RotateCcw } from 'lucide-react'
import { useAdminStore } from '../store/adminStore'
import { useProductsStore } from '../store/productsStore'
import { backendMode, resetDemoData } from '../services/api'
import emblem from '../assets/odara-emblem.png'

const nav = [['/admin', 'Dashboard', LayoutDashboard, true], ['/admin/products', 'Products', Package], ['/admin/orders', 'Orders', ShoppingBag]]

export default function AdminLayout() {
  const { admin, ready, logout } = useAdminStore()
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()
  useEffect(() => setOpen(false), [pathname])
  useEffect(() => { if (admin) useProductsStore.getState().load(true) }, [admin])

  if (!ready) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-500">Loading…</div>
  if (!admin) return <Navigate to="/admin/login" replace />

  const sidebar = (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-5 h-16 border-b border-slate-800">
        <img src={emblem} alt="" className="w-9 h-9 rounded-full ring-1 ring-C9A876/50" />
        <div><p className="font-playfair text-white tracking-widest leading-none">ODARA</p><p className="text-[10px] uppercase tracking-[0.25em] text-C9A876 mt-1">Manager</p></div>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {nav.map(([to, label, Icon, end]) => (
          <NavLink key={to} to={to} end={end} className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition ${isActive ? 'bg-C9A876 text-slate-950 font-semibold' : 'text-slate-300 hover:bg-slate-800'}`}>
            <Icon className="w-[18px] h-[18px]" />{label}
          </NavLink>
        ))}
        <a href="/" target="_blank" rel="noreferrer" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-400 hover:bg-slate-800 mt-4"><ExternalLink className="w-[18px] h-[18px]" />View store</a>
      </nav>
      <div className="p-3 border-t border-slate-800 space-y-2">
        {backendMode === 'local' && (
          <button onClick={() => { if (confirm('Reset all demo products and orders to the starting data?')) { resetDemoData(); location.reload() } }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-amber-200/80 hover:bg-slate-800"><RotateCcw className="w-4 h-4" />Reset demo data</button>
        )}
        <p className="px-3 text-xs text-slate-500 truncate">{admin.email}</p>
        <button onClick={logout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-300 hover:bg-slate-800"><LogOut className="w-[18px] h-[18px]" />Sign out</button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800">
      <aside className="hidden lg:block fixed inset-y-0 left-0 w-64 bg-slate-950">{sidebar}</aside>
      {open && <div className="lg:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setOpen(false)} />}
      <aside className={`lg:hidden fixed inset-y-0 left-0 z-50 w-64 bg-slate-950 transition-transform duration-300 ${open ? 'translate-x-0' : '-translate-x-full'}`}>{sidebar}</aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-slate-200 h-16 flex items-center justify-between px-4 lg:px-8">
          <button className="lg:hidden p-2 -ml-2" onClick={() => setOpen(!open)} aria-label="Menu">{open ? <X /> : <Menu />}</button>
          <h1 className="font-semibold text-slate-800 hidden lg:block">{nav.find(([to, , , end]) => (end ? pathname === to : pathname.startsWith(to)))?.[1] || 'Admin'}</h1>
          <Link to="/admin" className="lg:hidden font-playfair tracking-widest">ODARA</Link>
          <span className={`text-xs px-3 py-1 rounded-full ${backendMode === 'supabase' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>{backendMode === 'supabase' ? '● Live database' : '● Demo mode'}</span>
        </header>
        <main className="p-4 lg:p-8 max-w-[1400px]"><Outlet /></main>
      </div>
    </div>
  )
}
