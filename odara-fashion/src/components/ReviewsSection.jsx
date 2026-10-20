import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Quote } from 'lucide-react'
import { useReviews, summarize } from '../hooks/useReviews'
import { useProducts } from '../hooks/useProducts'
import StarRating from './StarRating'
import ReviewForm from './ReviewForm'
import Reveal from './Reveal'

// Home page "Loved by our customers". Shows ONLY approved, real reviews —
// and stays hidden until there is at least one.
export default function ReviewsSection() {
  const { reviews } = useReviews()
  const { products } = useProducts()
  const [showForm, setShowForm] = useState(false)
  if (reviews.length === 0) return null

  const { count, average } = summarize(reviews)
  const latest = reviews.slice(0, 6)

  return (
    <section className="home-section reviews-section">
      <div className="container-premium">
        <Reveal className="reviews-head">
          <h2 className="section-head-title">Loved by our customers</h2>
          <p className="reviews-score">
            <StarRating value={average} size={20} />
            <strong>{average.toFixed(1)}</strong>
            <span>from {count} review{count === 1 ? '' : 's'}</span>
          </p>
        </Reveal>

        <div className="reviews-grid">
          {latest.map((r, i) => {
            const product = r.productId ? products.find(p => p.id === r.productId) : null
            return (
              <Reveal key={r.id} delay={i * 80} className="review-card">
                <Quote className="review-quote" />
                <StarRating value={r.rating} size={15} />
                <p className="review-body">{r.body}</p>
                <p className="review-by">
                  <strong>{r.name}</strong>
                  {product && <> · <Link to={`/product/${product.id}`}>{product.name}</Link></>}
                </p>
              </Reveal>
            )
          })}
        </div>

        <div className="reviews-cta">
          <button type="button" className="btn-outline" onClick={() => setShowForm(s => !s)}>{showForm ? 'Close' : 'Write a review'}</button>
          {showForm && <div className="reviews-form-wrap"><ReviewForm /></div>}
        </div>
      </div>
    </section>
  )
}
