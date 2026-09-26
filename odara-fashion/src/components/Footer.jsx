import { Link } from 'react-router-dom'
import { Instagram } from 'lucide-react'
import odaraEmblem from '../assets/odara-emblem.png'

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container-premium">
        <div className="footer-grid-new">
          {/* Brand */}
          <div className="footer-brand">
            <Link to="/" className="flex items-center gap-3 mb-4">
              <img src={odaraEmblem} alt="Odara Fashion" className="w-10 h-10 rounded-full object-cover" />
              <span className="font-playfair text-xl tracking-widest text-white">ODARA</span>
            </Link>
            <p className="footer-desc">
              Curated Arabic women's fashion and signature fragrances — timeless pieces and
              custom-blended scents, crafted for the modern woman.
            </p>
            <div className="footer-contact">
              <p className="footer-contact-label">Visit Us</p>
              <p>1500 Polaris Place<br />Columbus, Ohio</p>
            </div>
            <div className="footer-contact">
              <p className="footer-contact-label">Email</p>
              <a href="mailto:hello@odarafashion.com">hello@odarafashion.com</a>
            </div>
          </div>

          {/* Collections */}
          <div>
            <h4>Collections</h4>
            <ul>
              <li><Link to="/shop">Fashion</Link></li>
              <li><Link to="/perfumes">Fragrances</Link></li>
              <li><Link to="/perfumes">Essential Oils</Link></li>
              <li><Link to="/make-perfume">Create Your Scent</Link></li>
            </ul>
          </div>

          {/* Menu */}
          <div>
            <h4>Menu</h4>
            <ul>
              <li><Link to="/">Home</Link></li>
              <li><Link to="/about">About Us</Link></li>
              <li><Link to="/shop">Shop All</Link></li>
              <li><Link to="/cart">Cart</Link></li>
            </ul>
          </div>

          {/* Subscribe */}
          <div className="footer-subscribe">
            <h4>Subscribe To Our Emails</h4>
            <p className="footer-desc mb-4">New arrivals, roasting-day... er, restock drops, and exclusive offers — no spam.</p>
            <form className="newsletter-form-footer" onSubmit={(e) => e.preventDefault()}>
              <input type="email" placeholder="Email" required />
              <button type="submit">Join</button>
            </form>
            <div className="footer-socials">
              <a
                href="https://www.instagram.com/odarafashionplace/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Odara on Instagram"
                className="footer-social-icon"
              >
                <Instagram className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>

        <div className="footer-bottom-new">
          <p>&copy; 2026 Odara Fashion. All rights reserved.</p>
          <div className="footer-payments">
            <span>Visa</span>
            <span>Mastercard</span>
            <span>Amex</span>
            <span>Apple Pay</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
