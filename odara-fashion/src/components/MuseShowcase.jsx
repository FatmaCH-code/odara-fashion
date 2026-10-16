import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Heart } from 'lucide-react'
import { useMuseItems } from '../hooks/useMuseItems'

const TAG_LABELS = { new: 'New Arrival', best: 'Best Seller' }

// Hearts are saved on the shopper's own device (no account needed).
function useSavedLooks() {
  const [saved, setSaved] = useState(() => {
    try { return JSON.parse(localStorage.getItem('odara-saved-looks') || '[]') } catch { return [] }
  })
  const toggle = (id) => setSaved(prev => {
    const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    try { localStorage.setItem('odara-saved-looks', JSON.stringify(next)) } catch { /* private mode */ }
    return next
  })
  return [saved, toggle]
}

function MuseCard({ item, isSaved, onToggle }) {
  const { product } = item
  return (
    <div className="muse-card">
      <Link to={`/product/${product.id}`} className="muse-card-link" aria-label={product.name}>
        <img src={item.image} alt={product.name} loading="lazy" />
        {TAG_LABELS[item.tag] && <span className="muse-tag">{TAG_LABELS[item.tag]}</span>}
        <div className="muse-card-info">
          <p className="muse-card-name">{product.name}</p>
          <p className="muse-card-price">
            ${product.price}
            {product.originalPrice && <span className="muse-card-was">${product.originalPrice}</span>}
          </p>
        </div>
      </Link>
      <button
        type="button"
        className={`muse-heart ${isSaved ? 'is-saved' : ''}`}
        aria-label={isSaved ? 'Remove from saved looks' : 'Save this look'}
        aria-pressed={isSaved}
        onClick={() => onToggle(item.id)}
      >
        <Heart className="w-6 h-6" />
      </button>
    </div>
  )
}

// limit: how many to show (omit for all). mode: 'row' (swipeable on phones) or 'grid'.
export default function MuseShowcase({ limit, mode = 'row', showAllLink = false }) {
  const { items, loading } = useMuseItems()
  const [saved, toggleSaved] = useSavedLooks()
  const shown = limit ? items.slice(0, limit) : items

  return (
    <div className="muse-panel">
      <div className="muse-heading">
        <span className="muse-line" />
        <h2 className="muse-title">THE <span className="muse-title-gold">ODARA</span> MUSE</h2>
        <span className="muse-line is-right" />
      </div>
      <p className="muse-tagline">Real women. Beautiful moments. Timeless elegance.</p>
      <div className="muse-divider"><span /><i>✦</i><span /></div>

      {loading ? (
        <div className={`muse-row ${mode === 'grid' ? 'is-grid' : ''}`} aria-hidden="true">
          {Array.from({ length: limit || 5 }, (_, i) => <div key={i} className="muse-card muse-card-skeleton" />)}
        </div>
      ) : shown.length > 0 ? (
        <div className={`muse-row ${mode === 'grid' ? 'is-grid' : ''}`}>
          {shown.map(item => (
            <MuseCard key={item.id} item={item} isSaved={saved.includes(item.id)} onToggle={toggleSaved} />
          ))}
        </div>
      ) : (
        <p className="muse-empty">New looks are being added — check back soon.</p>
      )}

      {showAllLink && shown.length > 0 && (
        <div className="muse-all">
          <Link to="/muse" className="btn-gold">View All Looks</Link>
        </div>
      )}
    </div>
  )
}
