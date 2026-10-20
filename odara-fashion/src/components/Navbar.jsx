import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ShoppingBag, Menu, X, Search, ChevronDown } from 'lucide-react'
import { useCartStore } from '../store/cartStore'
import { useUiStore } from '../store/uiStore'
import { useProducts } from '../hooks/useProducts'
import { isFashion, isPerfume, getBrandTabs } from '../utils/categories'
import odaraEmblem from '../assets/odara-emblem.png'
import SearchOverlay from './SearchOverlay'

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [mobileGroup, setMobileGroup] = useState(null)
  const [searchOpen, setSearchOpen] = useState(false)
  const cartCount = useCartStore(state => state.items.reduce((s, i) => s + i.quantity, 0))
  const openCart = useUiStore(s => s.openCart)
  const { products } = useProducts()
  const { pathname, search } = useLocation()

  // Close the phone menu whenever the page changes.
  useEffect(() => { setMobileOpen(false); setMobileGroup(null) }, [pathname, search])

  const categories = [...new Set(products.filter(isFashion).map(p => p.category).filter(Boolean))].sort()
  const brands = getBrandTabs(products.filter(isPerfume))

  const CartButton = (
    <button type="button" className="nav-icon-btn nav-cart" onClick={openCart} aria-label={`Open bag, ${cartCount} item${cartCount === 1 ? '' : 's'}`}>
      <ShoppingBag className="w-[22px] h-[22px]" />
      {cartCount > 0 && <span className="nav-cart-count">{cartCount}</span>}
    </button>
  )

  return (
    <nav className="navbar-premium" aria-label="Main">
      <div className="container-premium nav-bar">
        <Link to="/" className="nav-logo-container flex items-center gap-3">
          <img src={odaraEmblem} alt="Odara Fashion" className="w-11 h-11 rounded-full object-cover shadow-md ring-1 ring-C9A876/40" />
          <span className="font-playfair text-2xl font-semibold tracking-widest text-2C2C2C">ODARA</span>
        </Link>

        {/* Desktop menu */}
        <div className="nav-desktop">
          <Link to="/shop?tag=new" className="nav-link">New Arrivals</Link>
          <Link to="/shop?tag=best" className="nav-link">Best Sellers</Link>

          <div className="nav-dd">
            <Link to="/shop" className="nav-link">Shop <ChevronDown className="nav-caret" /></Link>
            <div className="nav-dd-panel">
              <Link to="/shop">All Fashion</Link>
              {categories.map(c => <Link key={c} to={`/shop?category=${encodeURIComponent(c)}`}>{c}</Link>)}
            </div>
          </div>

          <div className="nav-dd">
            <Link to="/perfumes" className="nav-link">Perfumes <ChevronDown className="nav-caret" /></Link>
            <div className="nav-dd-panel">
              <Link to="/perfumes">All Perfumes</Link>
              {brands.map(b => <Link key={b} to={`/perfumes?brand=${encodeURIComponent(b)}`}>{b}</Link>)}
            </div>
          </div>

          <Link to="/perfumery-oils" className="nav-link">Perfumery Oils</Link>
          <Link to="/muse" className="nav-link">Muse</Link>
          <Link to="/make-perfume" className="nav-link">Create</Link>
          <Link to="/about" className="nav-link">About</Link>
        </div>

        <div className="nav-actions">
          <button type="button" onClick={() => setSearchOpen(true)} aria-label="Search" className="nav-icon-btn nav-search-btn">
            <Search className="w-[22px] h-[22px]" />
          </button>
          {CartButton}
          <button type="button" className="nav-icon-btn nav-burger" onClick={() => setMobileOpen(o => !o)} aria-label="Menu" aria-expanded={mobileOpen}>
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Phone menu */}
      {mobileOpen && (
        <div className="nav-mobile">
          <Link to="/shop?tag=new">New Arrivals</Link>
          <Link to="/shop?tag=best">Best Sellers</Link>

          <button type="button" className="nav-mobile-group" onClick={() => setMobileGroup(g => g === 'shop' ? null : 'shop')} aria-expanded={mobileGroup === 'shop'}>
            Shop <ChevronDown className={`nav-caret ${mobileGroup === 'shop' ? 'is-open' : ''}`} />
          </button>
          {mobileGroup === 'shop' && (
            <div className="nav-mobile-sub">
              <Link to="/shop">All Fashion</Link>
              {categories.map(c => <Link key={c} to={`/shop?category=${encodeURIComponent(c)}`}>{c}</Link>)}
            </div>
          )}

          <button type="button" className="nav-mobile-group" onClick={() => setMobileGroup(g => g === 'perfumes' ? null : 'perfumes')} aria-expanded={mobileGroup === 'perfumes'}>
            Perfumes <ChevronDown className={`nav-caret ${mobileGroup === 'perfumes' ? 'is-open' : ''}`} />
          </button>
          {mobileGroup === 'perfumes' && (
            <div className="nav-mobile-sub">
              <Link to="/perfumes">All Perfumes</Link>
              {brands.map(b => <Link key={b} to={`/perfumes?brand=${encodeURIComponent(b)}`}>{b}</Link>)}
            </div>
          )}

          <Link to="/perfumery-oils">Perfumery Oils</Link>
          <Link to="/muse">Muse</Link>
          <Link to="/make-perfume">Create Your Scent</Link>
          <Link to="/about">About</Link>
        </div>
      )}
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </nav>
  )
}
