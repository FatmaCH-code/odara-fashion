import SignaturePromo from '../components/SignaturePromo'
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Ruler, Gem, Droplets, MapPin } from 'lucide-react'
import ProductCard from '../components/ProductCard'
import ProductCarousel from '../components/ProductCarousel'
import NewsletterForm from '../components/NewsletterForm'
import MuseShowcase from '../components/MuseShowcase'
import CategoryCircles from '../components/CategoryCircles'
import HeroSlider from '../components/HeroSlider'
import ReviewsSection from '../components/ReviewsSection'
import Reveal from '../components/Reveal'
import storyImage from '../assets/hero/story.webp'
import { useProducts } from '../hooks/useProducts'
import { useSiteSettings } from '../hooks/useSiteSettings'
import { isPerfume, isOil } from '../utils/categories'

function SectionHead({ title, subtitle, to, linkLabel = 'View all', center = false }) {
  return (
    <Reveal className={`section-head ${center ? 'section-head-center' : ''}`}>
      <div>
        <h2 className="section-head-title">{title}</h2>
        {subtitle && <p className="section-head-sub">{subtitle}</p>}
      </div>
      {to && <Link to={to} className="section-head-link">{linkLabel} →</Link>}
    </Reveal>
  )
}

function ProductRow({ items }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
      {items.map((p, i) => <Reveal key={p.id} delay={(i % 4) * 90}><ProductCard product={p} /></Reveal>)}
    </div>
  )
}

// Auto-scrolling strip of best sellers: endless slow slide, pauses when hovered or touched
// (so "Quick add" is easy to press), with a "View all" button underneath.
function BestSellersMarquee({ items }) {
  // Repeat the list until the strip is wide enough, then twice so the loop never shows a gap.
  const base = items.length >= 6 ? items : Array.from({ length: Math.ceil(6 / items.length) * items.length }, (_, i) => items[i % items.length])
  const track = [...base, ...base]
  const seconds = Math.max(24, base.length * 5)
  return (
    <div className="bestsellers-marquee" aria-label="Best sellers">
      <div className="bestsellers-track" style={{ animationDuration: `${seconds}s` }}>
        {track.map((p, i) => (
          <div className="bestsellers-item" key={`${p.id}-${i}`} aria-hidden={i >= base.length ? 'true' : undefined}>
            <ProductCard product={p} />
          </div>
        ))}
      </div>
    </div>
  )
}

// Placed items (set in Admin → New & Best) come first, in the admin's order; anything
// flagged but not placed yet follows, newest first.
const byPlace = (key) => (a, b) => ((a[key] || 1e9) - (b[key] || 1e9)) || (b.id - a.id)

export default function Home() {
  // Everything below reads the live (admin-managed) catalog.
  const { products } = useProducts()
  const { settings } = useSiteSettings()
  const percent = settings.welcomeOffer.percent

  const newArrivals = products.filter(p => p.isNew).sort(byPlace('newOrder')).slice(0, 12)
  // Admin-chosen best sellers. Until the admin picks any, a random selection fills the strip so it is never empty.
  const chosen = products.filter(p => p.isBest).sort(byPlace('bestOrder')).slice(0, 12)
  const randomPick = useMemo(
    () => [...products].filter(p => p.image).sort(() => Math.random() - 0.5).slice(0, 10),
    [products.length] // eslint-disable-line react-hooks/exhaustive-deps
  )
  const bestSellers = chosen.length > 0 ? chosen : randomPick
  const perfumes = products.filter(isPerfume).slice(0, 4)
  const oils = products.filter(isOil).slice(0, 4)

  return (
    <div className="bg-FEFDF9">
      <HeroSlider />

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
          <SectionHead title="Shop by Category" subtitle="Find your everyday — or your next occasion" center />
          <CategoryCircles />
        </div>
      </section>

      {/* Best sellers (admin: Admin → New & Best, or the star on a product) */}
      {bestSellers.length > 0 && (
        <section className="home-section home-section-alt bestsellers-section">
          <div className="container-premium">
            <SectionHead title={<>Best <em>Sellers</em></>} subtitle="The pieces our customers love most" center />
          </div>
          <BestSellersMarquee items={bestSellers} />
          <div className="bestsellers-cta"><Link to="/shop?tag=best" className="btn-outline">View all</Link></div>
        </section>
      )}

      {/* New arrivals (admin: Admin → New & Best) */}
      {newArrivals.length > 0 && (
        <section className="home-section">
          <div className="container-premium">
            <SectionHead title="New Arrivals" subtitle="Fresh pieces, just landed" to="/shop?tag=new" />
            <ProductCarousel items={newArrivals} />
          </div>
        </section>
      )}

      {/* Story — full-width photo + text */}
      <section className="story-banner">
        <div className="story-photo" style={{ backgroundImage: `url(${storyImage})` }} role="img" aria-label="Close-up of embroidered abaya sleeves" />
        <Reveal className="story-copy">
          <span className="story-eyebrow">Our craft</span>
          <h2 className="story-title">Detail you can see — and feel.</h2>
          <p>
            Every piece is chosen for its embroidery, its drape and its finish. Find your fit in sizes 1–8 and
            S–XXXL, in colors for every occasion.
          </p>
          <div className="story-actions">
            <Link to="/shop" className="btn-gold">Shop the Collection</Link>
            <Link to="/about" className="btn-outline">Our Story</Link>
          </div>
        </Reveal>
      </section>

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
      <section className="muse-home-section is-bleed">
        <div className="container-premium">
          <MuseShowcase limit={5} showAllLink />
        </div>
      </section>

      {/* Make Your Own */}
      <SignaturePromo />

      {/* Newsletter */}
      <section className="newsletter-premium">
        <div className="container-premium">
          <h2 className="text-4xl font-playfair mb-4">{settings.welcomeOffer.enabled ? `${percent}% off your first order` : 'Stay Updated'}</h2>
          <p className="mb-6">Join the list for early access to new arrivals, best sellers and exclusive offers</p>
          <NewsletterForm source="home" inputPlaceholder="Enter your email" buttonLabel="Subscribe" />
          <p className="newsletter-review-link">Already shopped with us? <Link to="/about#review">Leave a quick review</Link></p>
        </div>
      </section>

      {/* Real customer reviews — small strip at the very bottom, hidden until there is an approved review */}
      <ReviewsSection />
    </div>
  )
}
