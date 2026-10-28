import { Link } from 'react-router-dom'
import { Instagram, Facebook, MapPin, Mail, Gem, Droplets, Sparkles } from 'lucide-react'
import heroImage from '../assets/hero-traditional-dress.jpg'
import odaraEmblem from '../assets/odara-emblem.png'
import ReviewForm from '../components/ReviewForm'

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
      <section className="about-values">
        <div className="container-premium">
          <p className="about-eyebrow">Our promise</p>
          <h2 className="section-title">What We Value</h2>
          <div className="about-values-grid">
            {[
              [Gem, '01', 'Heritage Craftsmanship', 'Every kaftan and abaya is chosen for its embroidery, fabric and finish — pieces meant to last.'],
              [Droplets, '02', 'Authentic Fragrance', 'Our perfumes and oils are built from real oud, amber and floral notes — no shortcuts.'],
              [Sparkles, '03', 'Personal Elegance', "From ready-to-wear pieces to custom-blended scents, we help you build a look that's entirely yours."],
            ].map(([Icon, n, title, text]) => (
              <article key={n} className="value-card">
                <span className="value-card-num">{n}</span>
                <span className="value-card-icon"><Icon className="w-6 h-6" strokeWidth={1.4} /></span>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* A small box to leave a review (saved as pending until it is approved in Admin → Reviews) */}
      <section className="about-review" id="review">
        <div className="container-premium">
          <div className="review-box-small">
            <h3>Share your experience</h3>
            <p>Bought from Odara? Tell us what you thought — we read every one.</p>
            <ReviewForm compact />
          </div>
        </div>
      </section>

      {/* Visit / Contact */}
      <section className="about-contact">
        <div className="container-premium">
          <p className="about-eyebrow">Say hello</p>
          <h2 className="section-title">Find Us</h2>
          <div className="contact-grid">
            <div className="contact-card">
              <span className="contact-icon"><MapPin className="w-5 h-5" strokeWidth={1.5} /></span>
              <h3>Visit Us</h3>
              <p>1500 Polaris Place<br />Columbus, Ohio</p>
            </div>
            <div className="contact-card">
              <span className="contact-icon"><Mail className="w-5 h-5" strokeWidth={1.5} /></span>
              <h3>Email Us</h3>
              <a href="mailto:Odarafashionplace@gmail.com">Odarafashionplace@gmail.com</a>
            </div>
            <div className="contact-card">
              <span className="contact-icon"><Instagram className="w-5 h-5" strokeWidth={1.5} /></span>
              <h3>Follow Us</h3>
              <a href="https://www.instagram.com/odarafashionplace/" target="_blank" rel="noopener noreferrer">
                <Instagram className="w-4 h-4" /> @odarafashionplace
              </a>
              <a href="https://www.facebook.com/odaraFashionPlace" target="_blank" rel="noopener noreferrer">
                <Facebook className="w-4 h-4" /> Odara Fashion Place
              </a>
            </div>
          </div>
          <div className="text-center mt-12">
            <Link to="/shop" className="btn-gold">Explore The Collection</Link>
          </div>
        </div>
      </section>
    </div>
  )
}
