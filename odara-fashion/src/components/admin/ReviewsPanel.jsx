import { useEffect, useState } from 'react'
import { Check, X, Trash2 } from 'lucide-react'
import { adminListReviews, adminSetReviewStatus, adminDeleteReview, adminAddReview } from '../../services/reviews'
import { useAdminProducts } from '../../hooks/useAdminProducts'
import StarRating, { StarInput } from '../StarRating'

const TABS = [['pending', 'To review'], ['approved', 'Published'], ['rejected', 'Rejected']]

export default function ReviewsPanel() {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tab, setTab] = useState('pending')
  const [adding, setAdding] = useState(false)
  const { products } = useAdminProducts()

  const load = async () => {
    try { setReviews(await adminListReviews()); setError('') } catch (e) { setError(e.message) }
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const act = async (fn) => { try { await fn(); await load() } catch (e) { setError(e.message) } }
  const productName = (id) => (id ? (products.find(p => p.id === id) || {}).name || `Product #${id}` : 'The store in general')
  const count = (s) => reviews.filter(r => r.status === s).length
  const shown = reviews.filter(r => r.status === tab)

  if (loading) return <p className="text-2C2C2C/50">Loading…</p>

  return (
    <div>
      <div className="flex items-center justify-between mb-2 flex-wrap gap-4">
        <h1 className="text-2xl font-playfair">Reviews</h1>
        <button type="button" className="admin-btn-primary" onClick={() => setAdding(a => !a)}>{adding ? 'Close' : 'Add a review'}</button>
      </div>
      <p className="text-2C2C2C/60 text-sm mb-6 max-w-2xl">
        Customers can send reviews from the product pages. They stay hidden until you <strong>publish</strong> them here.
        You can also add a genuine review you received elsewhere (WhatsApp, Instagram…).
      </p>
      {error && <div className="admin-notice mb-6">{error}</div>}

      {adding && <AddReview products={products} onSaved={() => { setAdding(false); setTab('approved'); load() }} onError={setError} />}

      <div className="filter-chips">
        {TABS.map(([key, label]) => (
          <button key={key} type="button" className={`filter-chip ${tab === key ? 'is-active' : ''}`} onClick={() => setTab(key)}>
            {label} ({count(key)})
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <div className="admin-panel-card"><p className="text-2C2C2C/45 text-center py-10">Nothing here.</p></div>
      ) : (
        <ul className="admin-reviews">
          {shown.map(r => (
            <li key={r.id} className="admin-panel-card">
              <div className="admin-review-top">
                <StarRating value={r.rating} size={16} />
                <strong>{r.name}</strong>
                <span className="admin-review-meta">{productName(r.productId)} · {new Date(r.createdAt).toLocaleDateString()}{r.source === 'admin' ? ' · added by you' : ''}</span>
              </div>
              <p className="admin-review-body">{r.body}</p>
              <div className="admin-review-actions">
                {r.status !== 'approved' && <button type="button" className="admin-btn-primary flex items-center gap-1" onClick={() => act(() => adminSetReviewStatus(r.id, 'approved'))}><Check className="w-4 h-4" /> Publish</button>}
                {r.status !== 'rejected' && <button type="button" className="admin-btn-secondary flex items-center gap-1" onClick={() => act(() => adminSetReviewStatus(r.id, 'rejected'))}><X className="w-4 h-4" /> {r.status === 'approved' ? 'Unpublish' : 'Reject'}</button>}
                <button type="button" className="admin-icon-btn admin-icon-btn-danger" aria-label="Delete review" onClick={() => { if (window.confirm('Delete this review for good?')) act(() => adminDeleteReview(r.id)) }}><Trash2 className="w-4 h-4" /></button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function AddReview({ products, onSaved, onError }) {
  const [name, setName] = useState('')
  const [rating, setRating] = useState(5)
  const [body, setBody] = useState('')
  const [productId, setProductId] = useState('')
  const [saving, setSaving] = useState(false)

  const save = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await adminAddReview({ productId: productId ? parseInt(productId) : null, name, rating, body })
      onSaved()
    } catch (err) {
      onError(err.message)
      setSaving(false)
    }
  }

  return (
    <form onSubmit={save} className="admin-panel-card mb-6 max-w-2xl">
      <h2 className="font-playfair text-lg mb-1">Add a real review</h2>
      <p className="text-xs text-2C2C2C/55 mb-4">Only add reviews that real customers actually wrote or sent you.</p>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="admin-label">Customer name</label>
          <input className="admin-input" required maxLength={80} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Noor K." />
        </div>
        <div>
          <label className="admin-label">About which product? (optional)</label>
          <select className="admin-input" value={productId} onChange={(e) => setProductId(e.target.value)}>
            <option value="">The store in general</option>
            {[...products].sort((a, b) => a.name.localeCompare(b.name)).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
      </div>
      <label className="admin-label">Rating</label>
      <StarInput value={rating} onChange={setRating} />
      <label className="admin-label mt-4">Review</label>
      <textarea className="admin-input" required minLength={3} maxLength={1000} rows={4} value={body} onChange={(e) => setBody(e.target.value)} />
      <button type="submit" className="admin-btn-primary mt-4" disabled={saving}>{saving ? 'Saving…' : 'Publish review'}</button>
    </form>
  )
}
