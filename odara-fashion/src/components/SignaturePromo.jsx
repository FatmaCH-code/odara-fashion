import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Flower2, Sparkles, Scale, FlaskConical, Truck } from 'lucide-react'
import Reveal from './Reveal'
import { loadBlendConfig } from '../services/blend'
import PerfumeBottle from './PerfumeBottle'

const STEPS = [
  [Flower2, 'Choose your main scent', 'Rose, oud, musk and more — each in its own types.'],
  [Sparkles, 'Add a twist', 'A second scent to make it yours, or keep it simple.'],
  [Scale, 'Pick its character', 'Softer, balanced or bolder — you decide how it feels.'],
  [FlaskConical, 'Select your bottle & name it', 'Your name on the label, blended to order.'],
]

// Home page invitation to the Signature Scent builder.
export default function SignaturePromo() {
  const [from, setFrom] = useState(null)
  useEffect(() => {
    loadBlendConfig().then(c => {
      const prices = (c.sizes || []).filter(s => s.active !== false && Number(s.price) > 0).map(s => Number(s.price))
      if (prices.length) setFrom(Math.min(...prices))
    })
  }, [])

  return (
    <section className="sig-promo">
      <div className="sig-promo-glow sig-promo-glow-a" />
      <div className="sig-promo-glow sig-promo-glow-b" />
      <div className="container-premium relative">
        <div className="sig-promo-grid">
          <Reveal className="sig-promo-copy">
            <p className="about-eyebrow" style={{ textAlign: 'left' }}>Made for you</p>
            <h2 className="sig-promo-title">Create Your Signature Scent</h2>
            <div className="sig-promo-rule" />
            <p className="sig-promo-lead">
              Blend your own luxury fragrance from our premium oils. Two favorites, one scent that is uniquely yours.
            </p>

            <ol className="sig-steps">
              {STEPS.map(([Icon, title, text], i) => (
                <li key={title} className="sig-step">
                  <span className="sig-step-num">{i + 1}</span>
                  <span className="sig-step-body">
                    <strong><Icon className="w-4 h-4" strokeWidth={1.6} /> {title}</strong>
                    <span>{text}</span>
                  </span>
                </li>
              ))}
            </ol>

            <div className="sig-promo-actions">
              <Link to="/make-perfume" className="btn-gold">Start Creating</Link>
              <span className="sig-promo-note"><Truck className="w-4 h-4" strokeWidth={1.5} /> Delivered within 7 days{from ? ` · from $${from.toFixed(2)}` : ''}</span>
            </div>
          </Reveal>

          <Reveal delay={120} className="sig-promo-visual">
            <div className="sig-promo-frame">
              <PerfumeBottle name="Velvet Rose" size="50 ML" />
              <span className="sig-promo-tag">Your name · Your blend</span>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
