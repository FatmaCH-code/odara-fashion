import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ShoppingCart, Menu, X, Search } from 'lucide-react'
import { useCartStore } from '../store/cartStore'
import odaraEmblem from '../assets/odara-emblem.png'
import SearchOverlay from './SearchOverlay'

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const cartCount = useCartStore(state => state.items.length)

  return (
    <nav className="navbar-premium">
      <div className="container-premium h-20 flex justify-between items-center">
        <Link to="/" className="nav-logo-container flex items-center gap-3">
          <img
            src={odaraEmblem}
            alt="Odara Fashion"
            className="w-11 h-11 rounded-full object-cover shadow-md ring-1 ring-C9A876/40"
          />
          <span className="font-playfair text-2xl font-semibold tracking-widest text-2C2C2C">
            ODARA
          </span>
        </Link>

        {/* Desktop Menu */}
        <div className="hidden lg:flex gap-6 xl:gap-8 items-center">
          <Link to="/" className="text-sm uppercase tracking-widest text-2C2C2C hover:text-C9A876">Home</Link>
          <Link to="/shop" className="text-sm uppercase tracking-widest text-2C2C2C hover:text-C9A876">Shop</Link>
          <Link to="/muse" className="text-sm uppercase tracking-widest text-2C2C2C hover:text-C9A876">Muse</Link>
          <Link to="/perfumes" className="text-sm uppercase tracking-widest text-2C2C2C hover:text-C9A876">Perfumes</Link>
          <Link to="/perfumery-oils" className="text-sm uppercase tracking-widest text-2C2C2C hover:text-C9A876">Perfumery Oils</Link>
          <Link to="/make-perfume" className="text-sm uppercase tracking-widest text-2C2C2C hover:text-C9A876">Create</Link>
          <Link to="/about" className="text-sm uppercase tracking-widest text-2C2C2C hover:text-C9A876">About</Link>
        </div>

        <div className="hidden lg:flex items-center gap-6">
          <button type="button" onClick={() => setSearchOpen(true)} aria-label="Search" className="nav-search-btn">
            <Search className="w-5 h-5 text-2C2C2C hover:text-C9A876" />
          </button>
          <Link to="/cart" className="relative">
            <ShoppingCart className="w-5 h-5 text-2C2C2C hover:text-C9A876" />
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-C9A876 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                {cartCount}
              </span>
            )}
          </Link>
        </div>

        {/* Mobile Menu */}
        <div className="lg:hidden flex items-center gap-4">
          <button type="button" onClick={() => setSearchOpen(true)} aria-label="Search" className="nav-search-btn">
            <Search className="w-6 h-6" />
          </button>
          <button onClick={() => setIsOpen(!isOpen)} aria-label="Menu">
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="lg:hidden border-t border-E8D9C4 p-4 space-y-4">
          <Link to="/" className="block text-sm uppercase tracking-widest hover:text-C9A876">Home</Link>
          <Link to="/shop" className="block text-sm uppercase tracking-widest hover:text-C9A876">Shop</Link>
          <Link to="/muse" className="block text-sm uppercase tracking-widest hover:text-C9A876">Muse</Link>
          <Link to="/perfumes" className="block text-sm uppercase tracking-widest hover:text-C9A876">Perfumes</Link>
          <Link to="/perfumery-oils" className="block text-sm uppercase tracking-widest hover:text-C9A876">Perfumery Oils</Link>
          <Link to="/make-perfume" className="block text-sm uppercase tracking-widest hover:text-C9A876">Create</Link>
          <Link to="/about" className="block text-sm uppercase tracking-widest hover:text-C9A876">About</Link>
          <Link to="/cart" className="block text-sm uppercase tracking-widest hover:text-C9A876">Cart ({cartCount})</Link>
        </div>
      )}
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </nav>
  )
}
