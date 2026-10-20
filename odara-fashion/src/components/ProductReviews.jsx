import { useState } from 'react'
import { useReviews, summarize } from '../hooks/useReviews'
import StarRating from './StarRating'
import ReviewForm from './ReviewForm'

const when = (iso) => { try { return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short' }) } catch { return '' } }

// Reviews for one product (on the product page) + the form to add one.
export default function ProductReviews({ product }) {
  const { reviews } = useReviews()
  const mine = reviews.filter(r => r.productId === product.id)
  const { count, average } = summarize(mine)
  const [showForm, setShowForm] = useState(false)
  const [showAll, setShowAll] = useState(false)
  const shown = showAll ? mine : mine.slice(0, 4)

  return (
    <section className="product-reviews" id="reviews">
      <div className="product-reviews-head">
        <div>
          <h2>Customer reviews</h2>
          {count > 0 ? (
            <p className="product-reviews-summary"><StarRating value={average} size={18} /> <strong>{average.toFixed(1)}</strong> out of 5 · {count} review{count === 1 ? '' : 's'}</p>
          ) : (
            <p className="product-reviews-summary muted">No reviews yet — be the first to share yours.</p>
          )}
        </div>
        <button type="button" className="btn-outline" onClick={() => setShowForm(s => !s)}>{showForm ? 'Cancel' : 'Write a review'}</button>
      </div>

      {showForm && <ReviewForm productId={product.id} />}

      {shown.length > 0 && (
        <ul className="product-reviews-list">
          {shown.map(r => (
            <li key={r.id}>
              <div className="review-line"><StarRating value={r.rating} size={14} /><span>{r.name}</span><time>{when(r.createdAt)}</time></div>
              <p>{r.body}</p>
            </li>
          ))}
        </ul>
      )}
      {mine.length > 4 && (
        <button type="button" className="link-btn" onClick={() => setShowAll(s => !s)}>{showAll ? 'Show fewer' : `Show all ${mine.length} reviews`}</button>
      )}
    </section>
  )
}
