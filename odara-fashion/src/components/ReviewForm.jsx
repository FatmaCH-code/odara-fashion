import { useState } from 'react'
import { StarInput } from './StarRating'
import { submitReview } from '../services/reviews'

// Saved as "pending" — it only appears on the site after the owner approves it.
export default function ReviewForm({ productId = null, onDone }) {
  const [name, setName] = useState('')
  const [rating, setRating] = useState(0)
  const [body, setBody] = useState('')
  const [trap, setTrap] = useState('')       // hidden field: real people never fill it in
  const [status, setStatus] = useState('idle') // idle | sending | sent
  const [error, setError] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    if (!rating) { setError('Please tap a star rating.'); return }
    setError('')
    setStatus('sending')
    try {
      if (!trap) await submitReview({ productId, name, rating, body })   // bots get a silent "success"
      setStatus('sent')
      onDone && onDone()
    } catch (err) {
      setError(err.message || 'Something went wrong — please try again.')
      setStatus('idle')
    }
  }

  if (status === 'sent') {
    return <p className="review-thanks" role="status">Thank you! Your review will appear once we've approved it.</p>
  }

  return (
    <form className="review-form" onSubmit={submit}>
      <StarInput value={rating} onChange={setRating} />
      <input
        type="text" required maxLength={80} value={name} onChange={(e) => setName(e.target.value)}
        placeholder="Your name (e.g. Sara A.)" aria-label="Your name" autoComplete="given-name"
      />
      <textarea
        required minLength={3} maxLength={1000} rows={4} value={body} onChange={(e) => setBody(e.target.value)}
        placeholder="Tell others what you thought…" aria-label="Your review"
      />
      <input type="text" tabIndex={-1} autoComplete="off" value={trap} onChange={(e) => setTrap(e.target.value)} className="hp-field" aria-hidden="true" name="website" />
      {error && <p className="review-error" role="alert">{error}</p>}
      <button type="submit" className="btn-gold" disabled={status === 'sending'}>
        {status === 'sending' ? 'Sending…' : 'Submit review'}
      </button>
    </form>
  )
}
