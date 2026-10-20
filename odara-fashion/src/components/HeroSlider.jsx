import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'

import kaftan1 from '../assets/hero/kaftan-1.webp'
import kaftan2 from '../assets/hero/kaftan-2.webp'
import kaftan3 from '../assets/hero/kaftan-3.webp'
import dress1 from '../assets/hero/dress-1.webp'
import dress2 from '../assets/hero/dress-2.webp'
import dress3 from '../assets/hero/dress-3.webp'
import coat1 from '../assets/hero/coat-1.webp'
import coat2 from '../assets/hero/coat-2.webp'
import coat3 from '../assets/hero/coat-3.webp'

// Full-width hero. Each slide is three photos edge to edge on desktop (one on phones).
const SLIDES = [
  {
    eyebrow: 'New season',
    title: 'Heritage, reimagined.',
    text: 'Embroidered kaftans and abayas for every occasion.',
    cta: { label: 'Shop New Arrivals', to: '/shop?tag=new' },
    second: { label: 'Explore Perfumes', to: '/perfumes' },
    images: [kaftan1, kaftan2, kaftan3],
    alt: 'Three women wearing embroidered Odara kaftans in an arched hall',
  },
  {
    eyebrow: 'Everyday elegance',
    title: 'Dresses that move with you.',
    text: 'Flowing silhouettes with delicate embroidered details.',
    cta: { label: 'Shop Best Sellers', to: '/shop?tag=best' },
    second: { label: 'View All Fashion', to: '/shop' },
    images: [dress1, dress2, dress3],
    alt: 'Three women wearing long Odara dresses on a garden path',
  },
  {
    eyebrow: 'Statement pieces',
    title: 'Embroidery you will reach for again.',
    text: 'Embroidered coats layered over simple black.',
    cta: { label: 'Shop the Collection', to: '/shop' },
    second: { label: 'See The Odara Muse', to: '/muse' },
    images: [coat1, coat2, coat3],
    alt: 'Three women wearing embroidered Odara coats',
  },
]

const INTERVAL = 6500

export default function HeroSlider() {
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)
  const touchX = useRef(null)
  const reduced = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const go = useCallback((i) => setActive((i + SLIDES.length) % SLIDES.length), [])

  useEffect(() => {
    if (paused || reduced) return
    const t = setTimeout(() => go(active + 1), INTERVAL)
    return () => clearTimeout(t)
  }, [active, paused, reduced, go])

  const onTouchStart = (e) => { touchX.current = e.touches[0].clientX }
  const onTouchEnd = (e) => {
    if (touchX.current == null) return
    const dx = e.changedTouches[0].clientX - touchX.current
    touchX.current = null
    if (Math.abs(dx) > 50) go(active + (dx < 0 ? 1 : -1))
  }

  return (
    <section
      className="hero-full"
      aria-roledescription="carousel"
      aria-label="Featured collections"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {SLIDES.map((s, i) => (
        <div
          key={s.title}
          className={`hero-slide ${i === active ? 'is-active' : ''}`}
          aria-hidden={i !== active}
          aria-roledescription="slide"
          aria-label={`${i + 1} of ${SLIDES.length}`}
        >
          <div className="hero-panels" role="img" aria-label={s.alt}>
            {s.images.map((src, k) => (
              <div className="hero-panel" key={k}>
                <img src={src} alt="" loading={i === 0 ? 'eager' : 'lazy'} fetchpriority={i === 0 && k === 0 ? 'high' : undefined} decoding="async" />
              </div>
            ))}
          </div>
          <div className="hero-shade" />
          <div className="hero-copy container-premium">
            <span className="hero-eyebrow">{s.eyebrow}</span>
            <h1 className="hero-title">{s.title}</h1>
            <p className="hero-text">{s.text}</p>
            <div className="hero-actions">
              <Link to={s.cta.to} className="btn-gold" tabIndex={i === active ? 0 : -1}>{s.cta.label}</Link>
              <Link to={s.second.to} className="btn-outline-light" tabIndex={i === active ? 0 : -1}>{s.second.label}</Link>
            </div>
          </div>
        </div>
      ))}

      <div className="hero-controls">
        <button type="button" className="hero-arrow" onClick={() => go(active - 1)} aria-label="Previous slide"><ChevronLeft className="w-5 h-5" /></button>
        <div className="hero-dots">
          {SLIDES.map((s, i) => (
            <button key={s.title} type="button" className={i === active ? 'is-active' : ''} onClick={() => go(i)} aria-label={`Go to slide ${i + 1}`} aria-current={i === active} />
          ))}
        </div>
        <button type="button" className="hero-arrow" onClick={() => go(active + 1)} aria-label="Next slide"><ChevronRight className="w-5 h-5" /></button>
      </div>
    </section>
  )
}
