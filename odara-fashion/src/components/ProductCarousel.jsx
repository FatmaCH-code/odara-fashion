import { useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import ProductCard from './ProductCard'

// A swipeable row of product cards with arrows on desktop.
export default function ProductCarousel({ items }) {
  const ref = useRef(null)
  const scrollBy = (dir) => {
    const el = ref.current
    if (!el) return
    el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: 'smooth' })
  }
  return (
    <div className="carousel">
      <button type="button" className="carousel-arrow is-prev" onClick={() => scrollBy(-1)} aria-label="Previous"><ChevronLeft className="w-5 h-5" /></button>
      <div className="carousel-track" ref={ref}>
        {items.map(p => (
          <div className="carousel-item" key={p.id}><ProductCard product={p} /></div>
        ))}
      </div>
      <button type="button" className="carousel-arrow is-next" onClick={() => scrollBy(1)} aria-label="Next"><ChevronRight className="w-5 h-5" /></button>
    </div>
  )
}
