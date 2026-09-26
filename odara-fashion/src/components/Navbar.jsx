import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ShoppingCart, Menu, X } from 'lucide-react'
import { useCartStore } from '../store/cartStore'
import odaraEmblem from '../assets/odara-emblem.png'

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
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
        <div className="hidden md:flex gap-8 items-center">
          <Link to="/" className="text-sm uppercase tracking-widest text-2C2C2C hover:text-C9A876">Home</Link>
          <Link to="/shop" className="text-sm uppercase tracking-widest text-2C2C2C hover:text-C9A876">Shop</Link>
          <Link to="/perfumes" className="text-sm uppercase tracking-widest text-2C2C2C hover:text-C9A876">Perfumes</Link>
          <Link to="/make-perfume" className="text-sm uppercase tracking-widest text-2C2C2C hover:text-C9A876">Create</Link>
          <Link to="/about" className="text-sm uppercase tracking-widest text-2C2C2C hover:text-C9A876">About</Link>
        </div>

        <div className="hidden md:flex items-center gap-6">
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
        <button className="md:hidden" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {isOpen && (
        <div className="md:hidden border-t border-E8D9C4 p-4 space-y-4">
          <Link to="/" className="block text-sm uppercase tracking-widest hover:text-C9A876">Home</Link>
          <Link to="/shop" className="block text-sm uppercase tracking-widest hover:text-C9A876">Shop</Link>
          <Link to="/perfumes" className="block text-sm uppercase tracking-widest hover:text-C9A876">Perfumes</Link>
          <Link to="/make-perfume" className="block text-sm uppercase tracking-widest hover:text-C9A876">Create</Link>
          <Link to="/about" className="block text-sm uppercase tracking-widest hover:text-C9A876">About</Link>
          <Link to="/cart" className="block text-sm uppercase tracking-widest hover:text-C9A876">Cart ({cartCount})</Link>
        </div>
      )}
    </nav>
  )
}
