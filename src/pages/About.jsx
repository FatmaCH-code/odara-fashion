import { Link } from 'react-router-dom'
import { Instagram, MapPin, Mail } from 'lucide-react'
import heroImage from '../assets/hero-traditional-dress.jpg'
import odaraEmblem from '../assets/odara-emblem.png'

export default function About() {
  return (
    <div className="bg-FEFDF9">
      {/* Header */}
      <div
        className="about-hero"
        style={{ backgroundImage: `url(${heroImage})` }}
      >
        <div className="about-hero-scrim"></div>
        <div className="container-premium relative z-10 text-center">
          <img src={odaraEmblem} alt="Odara" className="w-20 h-20 rounded-full mx-auto mb-6 shadow-lg" />
          <h1 className="text-5xl font-playfair text-white mb-4">Our Story</h1>
          <p className="text-lg text-white/85 max-w-xl mx-auto">
            Where timeless Arabic fashion meets the art of fragrance
          </p>
        </div>
      </div>

      {/* Story */}
      <section className="section-premium">
        <div className="container-premium max-w-3xl mx-auto text-center">
          <p className="text-lg text-2C2C2C/80 leading-relaxed mb-6">
            Odara was born from a simple belief: that the way a woman dresses and the scent she
            wears are both expressions of the same story. We curate flowing kaftans and abayas
            rich with heritage craftsmanship, alongside signature fragrances and oils blended to
            linger long after you've left the room.
          </p>
          <p className="text-lg text-2C2C2C/80 leading-relaxed">
            Every piece in our collection is chosen for the woman who values elegance without
            excess — quality fabrics, hand-finished embroidery, and scents built from real oud,
            amber and floral notes. This is fashion and fragrance, woven together.
          </p>
        </div>
      </section>

      {/* Values */}
      <section className="section-premium bg-F5EFE0">
        <div className="container-premium">
          <h2 className="section-title">What We Value</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mt-12">
            <div className="text-center">
              <div className="text-4xl font-playfair text-C9A876 mb-4">01</div>
              <h3 className="text-xl font-semibold mb-2">Heritage Craftsmanship</h3>
              <p className="text-2C2C2C/70">Every kaftan and abaya is chosen for its embroidery, fabric and finish — pieces meant to last.</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-playfair text-C9A876 mb-4">02</div>
              <h3 className="text-xl font-semibold mb-2">Authentic Fragrance</h3>
              <p className="text-2C2C2C/70">Our perfumes and oils are built from real oud, amber and floral notes — no shortcuts.</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-playfair text-C9A876 mb-4">03</div>
              <h3 className="text-xl font-semibold mb-2">Personal Elegance</h3>
              <p className="text-2C2C2C/70">From ready-to-wear pieces to custom-blended scents, we help you build a look that's entirely yours.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Visit / Contact */}
      <section className="section-premium">
        <div className="container-premium">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto text-center">
            <div>
              <MapPin className="w-6 h-6 text-C9A876 mx-auto mb-3" />
              <h3 className="text-sm uppercase tracking-widest font-semibold mb-2">Visit Us</h3>
              <p className="text-2C2C2C/70">1500 Polaris Place<br />Columbus, Ohio</p>
            </div>
            <div>
              <Mail className="w-6 h-6 text-C9A876 mx-auto mb-3" />
              <h3 className="text-sm uppercase tracking-widest font-semibold mb-2">Email Us</h3>
              <a href="mailto:hello@odarafashion.com" className="text-2C2C2C/70 hover:text-C9A876">hello@odarafashion.com</a>
            </div>
            <div>
              <Instagram className="w-6 h-6 text-C9A876 mx-auto mb-3" />
              <h3 className="text-sm uppercase tracking-widest font-semibold mb-2">Follow Us</h3>
              <a
                href="https://www.instagram.com/odarafashionplace/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-2C2C2C/70 hover:text-C9A876"
              >
                @odarafashionplace
              </a>
            </div>
          </div>
          <div className="text-center mt-14">
            <Link to="/shop" className="btn-gold">Explore The Collection</Link>
          </div>
        </div>
      </section>
    </div>
  )
}
