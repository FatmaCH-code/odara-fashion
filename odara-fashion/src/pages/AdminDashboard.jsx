import { useState } from 'react'
import { Link, NavLink, Routes, Route } from 'react-router-dom'
import { LayoutDashboard, Package, ShoppingBag, Mail, Users, LogOut, ExternalLink, Menu, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import OverviewPanel from '../components/admin/OverviewPanel'
import ProductsPanel from '../components/admin/ProductsPanel'
import OrdersPanel from '../components/admin/OrdersPanel'
import SubscribersPanel from '../components/admin/SubscribersPanel'
import TeamPanel from '../components/admin/TeamPanel'
import odaraEmblem from '../assets/odara-emblem.png'

const NAV_ITEMS = [
  { to: '/admin', end: true, icon: LayoutDashboard, label: 'Overview' },
  { to: '/admin/products', icon: Package, label: 'Products' },
  { to: '/admin/orders', icon: ShoppingBag, label: 'Orders' },
  { to: '/admin/subscribers', icon: Mail, label: 'Subscribers' },
  { to: '/admin/team', icon: Users, label: 'Team' },
]

export default function AdminDashboard() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/admin/login'
  }

  return (
    <div className="admin-shell">
      {/* Mobile-only top bar with hamburger toggle — the sidebar below is
          off-screen by default on narrow viewports, this is the only way in. */}
      <div className="admin-mobile-topbar">
        <div className="flex items-center gap-2">
          <img src={odaraEmblem} alt="Odara" className="w-7 h-7 rounded-full" />
          <span className="font-playfair text-base">Odara Admin</span>
        </div>
        <button className="admin-icon-btn" onClick={() => setMobileNavOpen(true)} aria-label="Open menu">
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {mobileNavOpen && <div className="admin-sidebar-backdrop" onClick={() => setMobileNavOpen(false)} />}

      <aside className={`admin-sidebar ${mobileNavOpen ? 'is-open' : ''}`}>
        <div className="flex items-center justify-between">
          <div className="admin-sidebar-brand">
            <img src={odaraEmblem} alt="Odara" className="w-9 h-9 rounded-full" />
            <span className="font-playfair text-lg">Odara Admin</span>
          </div>
          <button className="admin-icon-btn admin-sidebar-close" onClick={() => setMobileNavOpen(false)} aria-label="Close menu">
            <X className="w-4 h-4" />
          </button>
        </div>

        <nav className="admin-nav">
          {NAV_ITEMS.map(({ to, end, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setMobileNavOpen(false)}
            >
              <Icon className="w-4 h-4" /> {label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto space-y-2">
          <Link to="/" className="admin-nav-item" target="_blank">
            <ExternalLink className="w-4 h-4" /> View Store
          </Link>
          <button className="admin-nav-item" onClick={handleLogout}>
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <Routes>
          <Route index element={<OverviewPanel />} />
          <Route path="products" element={<ProductsPanel />} />
          <Route path="products/new" element={<ProductsPanel />} />
          <Route path="products/:id/edit" element={<ProductsPanel />} />
          <Route path="orders" element={<OrdersPanel />} />
          <Route path="subscribers" element={<SubscribersPanel />} />
          <Route path="team" element={<TeamPanel />} />
        </Routes>
      </main>
    </div>
  )
}
