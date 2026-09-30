import { useState } from 'react'
import { subscribeToNewsletter } from '../services/newsletter'

export default function NewsletterForm({ source, className = 'newsletter-form', inputPlaceholder = 'Enter your email', buttonLabel = 'Subscribe' }) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('idle') // idle | loading | done | error
  const [message, setMessage] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setStatus('loading')
    setMessage('')
    try {
      await subscribeToNewsletter(email, source)
      setStatus('done')
      setMessage("You're subscribed — thank you!")
      setEmail('')
    } catch (err) {
      setStatus('error')
      setMessage(err.message || 'Something went wrong — please try again.')
    }
  }

  return (
    <div>
      <form className={className} onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder={inputPlaceholder}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={status === 'loading'}
        />
        <button type="submit" disabled={status === 'loading'}>
          {status === 'loading' ? '…' : buttonLabel}
        </button>
      </form>
      {message && (
        <p className={`newsletter-feedback ${status === 'error' ? 'is-error' : 'is-success'}`}>{message}</p>
      )}
    </div>
  )
}
