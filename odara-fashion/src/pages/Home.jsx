import { Link } from 'react-router-dom'
import ProductCard from '../components/ProductCard'
import NewsletterForm from '../components/NewsletterForm'
import heroImage from '../assets/hero-traditional-dress.jpg'
import odaraEmblem from '../assets/odara-emblem.png'
import { embroideryProducts, kaftanProducts, jacketProducts, abayaProducts, dressProducts, setProducts, hijabProducts, perfumeProducts, oilProducts } from '../data/products'

// A curated mix across categories for the homepage teaser
const fashionPreview = [
  ...embroideryProducts.slice(0, 2),
  ...kaftanProducts.slice(0, 2),
  ...abayaProducts.slice(0, 2),
  ...dressProducts.slice(0, 2),
  ...setProducts.slice(0, 1),
  ...jacketProducts.slice(0, 1),
  ...hijabProducts.slice(0, 2),
]

export default function Home() {
  return (
    <div className="bg-FEFDF9">
      {/* Hero - Traditional Dress Photo Background */}
      <section
        className="hero-premium relative"
        style={{ backgroundImage: `url(${heroImage})` }}
      >
        <div className="hero-scrim"></div>
        <div className="relative z-10 container-premium">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center min-h-screen py-16">
            {/* Left: Logo Emblem - soft, round, no hard edges */}
            <div className="hero-logo-wrap flex justify-center md:justify-start items-center order-2 md:order-1">
              <div className="hero-emblem-stack">
                <div className="hero-emblem-glow"></div>
                <img
                  src={odaraEmblem}
                  alt="Odara"
                  className="hero-emblem-img"
                />
                <h2 className="hero-emblem-word">ODARA</h2>
                <p className="hero-emblem-tagline">In Arabic Women's Clothing</p>
              </div>
            </div>

            {/* Right: Content */}
            <div className="hero-content text-left order-1 md:order-2">
              <span className="hero-kicker">Fashion &amp; Fragrance</span>
              <h1 className="text-4xl md:text-5xl font-playfair text-white mb-4 leading-tight">
                Elegance Woven in<br />Every Thread &amp; Scent
              </h1>
              <p className="text-lg text-white/85 mb-8 max-w-md leading-relaxed">
                Discover curated collections of luxury Arabic fashion and signature fragrances. Elegance redefined for the modern woman.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/shop" className="btn-gold text-center">Shop Collection</Link>
                <Link to="/perfumes" className="btn-outline-light text-center">Explore Scents</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Fashion Collection */}
      <section className="section-premium">
        <div className="container-premium">
          <h2 className="section-title">Fashion</h2>
          <div className="collections-grid">
            {fashionPreview.map(product => (
              <ProductCard key={product.id} product={product} isSale={product.isSale} isNew={product.isNew} />
            ))}
          </div>
          <div className="text-center mt-12">
            <Link to="/shop" className="btn-gold">View All</Link>
          </div>
        </div>
      </section>

      {/* Perfumes Section */}
      <section className="section-premium bg-F5EFE0">
        <div className="container-premium">
          <h2 className="section-title">Fragrances</h2>
          <p className="text-center text-lg text-2C2C2C/70 mb-8 max-w-xl mx-auto">
            Experience the essence of luxury with our curated fragrance collection
          </p>
          <div className="collections-grid">
            {perfumeProducts.slice(0, 4).map(product => (
              <ProductCard key={product.id} product={product} isNew={product.isNew} />
            ))}
          </div>
          <div className="text-center mt-12">
            <Link to="/perfumes" className="btn-gold">Explore More</Link>
          </div>
        </div>
      </section>

      {/* Oils Section */}
      <section className="section-premium">
        <div className="container-premium">
          <h2 className="section-title">Perfumery Oils</h2>
          <p className="text-center text-lg text-2C2C2C/70 mb-8 max-w-xl mx-auto">
            Pure, luxurious oil blends for your personal collection
          </p>
          <div className="collections-grid">
            {oilProducts.map(product => (
              <ProductCard key={product.id} product={product} isNew={product.isNew} />
            ))}
          </div>
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
          <h2 className="text-4xl font-playfair mb-4">Stay Updated</h2>
          <p className="mb-6">Subscribe for exclusive offers and new collections</p>
          <NewsletterForm source="home" inputPlaceholder="Enter your email" buttonLabel="Subscribe" />
        </div>
      </section>
    </div>
  )
}
