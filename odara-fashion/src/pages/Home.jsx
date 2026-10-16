import { Link } from 'react-router-dom'
import { Ruler, Gem, Droplets, MapPin } from 'lucide-react'
import ProductCard from '../components/ProductCard'
import NewsletterForm from '../components/NewsletterForm'
import MuseShowcase from '../components/MuseShowcase'
import CategoryTiles from '../components/CategoryTiles'
import heroImage from '../assets/hero-traditional-dress.jpg'
import odaraEmblem from '../assets/odara-emblem.png'
import { useProducts } from '../hooks/useProducts'
import { useSiteSettings } from '../hooks/useSiteSettings'
import { isPerfume, isOil } from '../utils/categories'

function SectionHead({ title, subtitle, to, linkLabel = 'View all' }) {
  return (
    <div className="section-head">
      <div>
        <h2 className="section-head-title">{title}</h2>
        {subtitle && <p className="section-head-sub">{subtitle}</p>}
      </div>
      {to && <Link to={to} className="section-head-link">{linkLabel} →</Link>}
    </div>
  )
}

function ProductRow({ items }) {
  return (
    <div className="products-grid-fade grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
      {items.map(p => <ProductCard key={p.id} product={p} />)}
    </div>
  )
}

export default function Home() {
  // Everything below reads the live (admin-managed) catalog.
  const { products } = useProducts()
  const { settings } = useSiteSettings()
  const percent = settings.welcomeOffer.percent

  const newest = (list) => [...list].sort((a, b) => b.id - a.id)
  const newArrivals = newest(products.filter(p => p.isNew)).slice(0, 8)
  const bestSellers = newest(products.filter(p => p.isBest)).slice(0, 8)
  const perfumes = products.filter(isPerfume).slice(0, 4)
  const oils = products.filter(isOil).slice(0, 4)

  return (
    <div className="bg-FEFDF9">
      {/* Hero */}
      <section className="hero-split">
        <div className="container-premium hero-split-grid">
          <div className="hero-split-copy">
            <span className="hero-split-kicker">Fashion &amp; Fragrance</span>
            <h1 className="hero-split-title">Elegance woven in every thread &amp; scent.</h1>
            <p className="hero-split-text">
              Heritage-embroidered thobes, kaftans and abayas, alongside authentic Arabian perfumes and pure
              perfumery oils — curated for the modern woman.
            </p>
            <div className="hero-split-cta">
              <Link to="/shop?tag=new" className="btn-gold">Shop New Arrivals</Link>
              <Link to="/perfumes" className="btn-outline">Explore Perfumes</Link>
            </div>
          </div>
          <div className="hero-split-media">
            <img src={heroImage} alt="Women wearing embroidered Odara kaftans" />
            <div className="hero-split-badge">
              <img src={odaraEmblem} alt="" />
              <span>ODARA</span>
            </div>
          </div>
        </div>
      </section>

      {/* Value strip */}
      <section className="value-strip">
        <div className="container-premium value-strip-grid">
          <div><Gem className="w-5 h-5" /><span>Heritage embroidery</span></div>
          <div><Droplets className="w-5 h-5" /><span>Authentic perfumes &amp; oils</span></div>
          <div><Ruler className="w-5 h-5" /><span>Sizes 1–8 &amp; S–XXXL</span></div>
          <div><MapPin className="w-5 h-5" /><span>Visit us in Columbus, OH</span></div>
        </div>
      </section>

      {/* Shop by category */}
      <section className="home-section">
        <div className="container-premium">
          <SectionHead title="Shop by Category" subtitle="Find your everyday — or your next occasion" />
          <CategoryTiles />
        </div>
      </section>

      {/* New arrivals (admin: tick "New" on a product) */}
      {newArrivals.length > 0 && (
        <section className="home-section home-section-alt">
          <div className="container-premium">
            <SectionHead title="New Arrivals" subtitle="Fresh pieces, just landed" to="/shop?tag=new" />
            <ProductRow items={newArrivals} />
          </div>
        </section>
      )}

      {/* Best sellers (admin: tick "Best Seller" on a product) */}
      {bestSellers.length > 0 && (
        <section className="home-section">
          <div className="container-premium">
            <SectionHead title="Best Sellers" subtitle="The pieces our customers love most" to="/shop?tag=best" />
            <ProductRow items={bestSellers} />
          </div>
        </section>
      )}

      {/* Perfumes */}
      {perfumes.length > 0 && (
        <section className="home-section home-section-alt">
          <div className="container-premium">
            <SectionHead title="Perfumes" subtitle="Authentic Arabian perfumes from the world's best-loved houses" to="/perfumes" linkLabel="Shop all perfumes" />
            <ProductRow items={perfumes} />
          </div>
        </section>
      )}

      {/* Perfumery oils */}
      {oils.length > 0 && (
        <section className="home-section">
          <div className="container-premium">
            <SectionHead title="Perfumery Oils" subtitle="Pure, luxurious oil blends for your personal collection" to="/perfumery-oils" linkLabel="Shop all oils" />
            <ProductRow items={oils} />
          </div>
        </section>
      )}

      {/* The Odara Muse — how the pieces look on real customers (admin: Muse tab) */}
      <section className="muse-home-section">
        <div className="container-premium">
          <MuseShowcase limit={5} showAllLink />
        </div>
      </section>

      {/* Make Your Own */}
      <section className="section-premium bg-E8D9C4">
        <div className="container-premium text-center">
          <h2 className="section-title text-2C2C2C">Create Your Signature Scent</h2>
          <p className="text-lg text-2C2C2C/70 mb-12 max-w-2xl mx-auto">
            Blend your own luxury fragrance with our premium oil collection. Choose from our selection of pure essential oils and create a personalized scent that's uniquely yours.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div>
              <div className="text-4xl font-playfair text-C9A876 mb-4">1</div>
              <h3 className="text-xl font-semibold mb-2">Select Base</h3>
              <p className="text-2C2C2C/70">Choose from 8 premium base oils</p>
            </div>
            <div>
              <div className="text-4xl font-playfair text-C9A876 mb-4">2</div>
              <h3 className="text-xl font-semibold mb-2">Add Notes</h3>
              <p className="text-2C2C2C/70">Mix top, middle, and base notes</p>
            </div>
            <div>
              <div className="text-4xl font-playfair text-C9A876 mb-4">3</div>
              <h3 className="text-xl font-semibold mb-2">Receive</h3>
              <p className="text-2C2C2C/70">Get your custom blend in 7 days</p>
            </div>
          </div>
          <Link to="/make-perfume" className="btn-gold">Start Creating</Link>
        </div>
      </section>

      {/* Newsletter */}
      <section className="newsletter-premium">
        <div className="container-premium">
          <h2 className="text-4xl font-playfair mb-4">{settings.welcomeOffer.enabled ? `${percent}% off your first order` : 'Stay Updated'}</h2>
          <p className="mb-6">Join the list for early access to new arrivals, best sellers and exclusive offers</p>
          <NewsletterForm source="home" inputPlaceholder="Enter your email" buttonLabel="Subscribe" />
        </div>
      </section>
    </div>
  )
}
