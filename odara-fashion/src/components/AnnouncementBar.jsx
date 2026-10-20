import { useEffect, useState } from 'react'
import { useSiteSettings } from '../hooks/useSiteSettings'

const fmt = (n) => (Number.isInteger(Number(n)) ? String(Number(n)) : Number(n).toFixed(2))

// The thin line above the menu. It rotates through the REAL offers set in Admin → Offers:
// free shipping over $X (only when the admin has set a free-shipping amount), the welcome
// discount, and any custom message.
export default function AnnouncementBar() {
  const { settings } = useSiteSettings()
  const { announcement: a, welcomeOffer: w, shipping: s } = settings
  const [index, setIndex] = useState(0)

  const messages = []
  if (a.enabled) {
    if (Number(s.freeOver) > 0 && Number(s.flatFee) > 0) messages.push(`Free shipping on orders over $${fmt(s.freeOver)}`)
    if (w.enabled) messages.push(`Enjoy ${w.percent}% off your first order — join our list`)
    const custom = (a.text || '').trim()
    if (custom && !messages.some(m => m.toLowerCase() === custom.toLowerCase())) messages.push(custom)
  }

  useEffect(() => {
    if (messages.length < 2) return
    const t = setInterval(() => setIndex(i => i + 1), 4500)
    return () => clearInterval(t)
  }, [messages.length])

  if (messages.length === 0) return null
  const current = messages[index % messages.length]

  return (
    <div className="announcement-bar" role="region" aria-label="Announcements">
      <p key={current} className="announcement-msg">{current}</p>
    </div>
  )
}
