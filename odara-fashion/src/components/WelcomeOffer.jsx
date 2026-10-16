import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { X, Copy, Check } from 'lucide-react'
import { useSiteSettings } from '../hooks/useSiteSettings'
import { subscribeToNewsletter } from '../services/newsletter'
import offerImage from '../assets/hero-traditional-dress.jpg'

const KEY = 'odara-offer'
const DAY = 24 * 60 * 60 * 1000
const HIDE_ON = ['/admin', '/checkout', '/cart', '/order-success']

const read = () => { try { return JSON.parse(localStorage.getItem(KEY) || 'null') } catch { return null } }
const write = (v) => { try { localStorage.setItem(KEY, JSON.stringify(v)) } catch { /* private mode */ } }

// The "10% off your first order" popup: appears a few seconds after someone lands on the
// site, asks for an email, then reveals the code. Settings come from Admin → Offers.
export default function WelcomeOffer() {
  const { settings } = useSiteSettings()
  const offer = settings.welcomeOffer
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('form') // form | loading | done
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  const eligible = offer.enabled && !HIDE_ON.some(p => pathname.startsWith(p))

  useEffect(() => {
    if (!eligible || open) return
    const saved = read()
    if (saved && saved.status === 'claimed') return
    if (saved && saved.status === 'dismissed' && Date.now() - saved.at < 7 * DAY) return
    const t = setTimeout(() => setOpen(true), Math.max(1, Number(offer.delaySeconds) || 6) * 1000)
    return () => clearTimeout(t)
  }, [eligible, offer.delaySeconds])

  // Never leave it hanging open if they wander into checkout.
  useEffect(() => { if (!eligible && open) setOpen(false) }, [eligible])

  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape') close() }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = '' }
  }, [open])

  const close = () => {
    if (status !== 'done') write({ status: 'dismissed', at: Date.now() })
    setOpen(false)
  }

  const submit = async (e) => {
    e.preventDefault()
    setStatus('loading')
    setError('')
    try {
      await subscribeToNewsletter(email, 'popup')
    } catch (err) {
      // Already on the list (or no database connected yet) is fine — they still get their code.
      if (!/already subscribed|isn't connected/i.test(err.message || '')) {
        setError(err.message || 'Something went wrong — please try again.')
        setStatus('form')
        return
      }
    }
    try { localStorage.setItem('odara-promo', offer.code) } catch { /* private mode */ }
    write({ status: 'claimed', at: Date.now() })
    setStatus('done')
  }

  const copy = async () => {
    try { await navigator.clipboard.writeText(offer.code) } catch { /* ignore */ }
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  if (!open) return null

  return (
    <div className="offer-overlay" role="dialog" aria-modal="true" aria-label={`${offer.percent}% off your first order`}>
      <div className="offer-backdrop" onClick={close} />
      <div className="offer-card">
        <button className="offer-close" onClick={close} aria-label="Close"><X className="w-5 h-5" /></button>
        <div className="offer-media" style={{ backgroundImage: `url(${offerImage})` }} />
        <div className="offer-body">
          {status !== 'done' ? (
            <>
              <p className="offer-kicker">The Odara List</p>
              <h2 className="offer-title">{offer.percent}% off your <em>first</em> order</h2>
              <p className="offer-text">
                Join for early access to new arrivals, best sellers and exclusive offers — plus {offer.percent}% off your first order.
              </p>
              <form onSubmit={submit} className="offer-form">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your email address"
                  aria-label="Email address"
                  disabled={status === 'loading'}
                />
                <button type="submit" className="btn-gold" disabled={status === 'loading'}>
                  {status === 'loading' ? '…' : 'Reveal my code'}
                </button>
              </form>
              {error && <p className="offer-error">{error}</p>}
              <button type="button" className="offer-later" onClick={close}>No thanks, maybe later</button>
              <p className="offer-fine">Unsubscribe anytime. We only send the good stuff.</p>
            </>
          ) : (
            <>
              <p className="offer-kicker">You're in</p>
              <h2 className="offer-title">Welcome to <em>Odara</em></h2>
              <p className="offer-text">
                Your code is ready — it's applied automatically at checkout for {offer.percent}% off your first order.
              </p>
              <div className="offer-code">
                <span>{offer.code}</span>
                <button type="button" onClick={copy} aria-label="Copy code">
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />} {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
              <button type="button" className="btn-gold offer-start" onClick={() => setOpen(false)}>Start shopping</button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
