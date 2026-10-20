import { Star } from 'lucide-react'

// Read-only stars (rounded to the nearest whole star).
export default function StarRating({ value = 0, size = 16, className = '' }) {
  const full = Math.round(value)
  return (
    <span className={`star-rating ${className}`} role="img" aria-label={`${value.toFixed(1)} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map(n => (
        <Star key={n} width={size} height={size} className={n <= full ? 'is-on' : 'is-off'} />
      ))}
    </span>
  )
}

// Clickable stars for the review form.
export function StarInput({ value, onChange }) {
  return (
    <span className="star-input" role="radiogroup" aria-label="Your rating">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} star${n === 1 ? '' : 's'}`}
          onClick={() => onChange(n)}
        >
          <Star width={28} height={28} className={n <= value ? 'is-on' : 'is-off'} />
        </button>
      ))}
    </span>
  )
}
