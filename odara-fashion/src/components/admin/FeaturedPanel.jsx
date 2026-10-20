import { useState } from 'react'
import { ChevronUp, ChevronDown, X, Plus } from 'lucide-react'
import { useAdminProducts } from '../../hooks/useAdminProducts'
import { adminSetFeatured, adminReorderFeatured } from '../../services/products'

// Placed items first (in the admin's order), then anything flagged but not placed yet (newest first).
const byPlace = (key) => (a, b) => ((a[key] || 1e9) - (b[key] || 1e9)) || (b.id - a.id)

function Picker({ options, onAdd, busy }) {
  const [q, setQ] = useState('')
  const [id, setId] = useState('')
  const list = options.filter(p => p.name.toLowerCase().includes(q.toLowerCase())).sort((a, b) => a.name.localeCompare(b.name))
  return (
    <div className="featured-picker">
      <input className="admin-input" placeholder="Search products to add…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search products" />
      <select className="admin-input" size={Math.min(5, Math.max(2, list.length))} value={id} onChange={(e) => setId(e.target.value)} aria-label="Product to add">
        {list.map(p => <option key={p.id} value={p.id}>{p.name} — ${p.price}</option>)}
      </select>
      <button type="button" className="admin-btn-primary flex items-center justify-center gap-2" disabled={!id || busy} onClick={() => { onAdd(parseInt(id)); setId(''); setQ('') }}>
        <Plus className="w-4 h-4" /> Add to list
      </button>
    </div>
  )
}

function FeaturedList({ title, blurb, section, flag, orderKey, products, run, busy }) {
  const list = products.filter(p => p[flag]).sort(byPlace(orderKey))
  const others = products.filter(p => !p[flag])

  const add = (id) => run(() => adminSetFeatured(id, section, true, list.length + 1))
  const remove = (id) => run(() => adminSetFeatured(id, section, false))
  const move = (index, dir) => {
    const next = [...list]
    const t = index + dir
    if (t < 0 || t >= next.length) return
    ;[next[index], next[t]] = [next[t], next[index]]
    run(() => adminReorderFeatured(section, next.map(p => p.id)))
  }

  return (
    <div className="admin-panel-card featured-card">
      <div className="featured-head">
        <h2 className="font-playfair text-lg">{title} <span>({list.length})</span></h2>
      </div>
      <p className="text-xs text-2C2C2C/55 mb-4">{blurb}</p>

      {list.length === 0 ? (
        <p className="featured-empty">Nothing here yet — add products below.</p>
      ) : (
        <ul className="featured-list">
          {list.map((p, i) => (
            <li key={p.id}>
              {p.image ? <img src={p.image} alt="" /> : <span className="featured-ph" />}
              <span className="featured-name"><strong>{p.name}</strong><em>${p.price}</em></span>
              <span className="featured-actions">
                <button type="button" className="admin-icon-btn" disabled={busy || i === 0} onClick={() => move(i, -1)} aria-label={`Move ${p.name} up`}><ChevronUp className="w-4 h-4" /></button>
                <button type="button" className="admin-icon-btn" disabled={busy || i === list.length - 1} onClick={() => move(i, 1)} aria-label={`Move ${p.name} down`}><ChevronDown className="w-4 h-4" /></button>
                <button type="button" className="admin-icon-btn admin-icon-btn-danger" disabled={busy} onClick={() => remove(p.id)} aria-label={`Remove ${p.name}`}><X className="w-4 h-4" /></button>
              </span>
            </li>
          ))}
        </ul>
      )}

      <Picker options={others} onAdd={add} busy={busy} />
    </div>
  )
}

export default function FeaturedPanel() {
  const { products, loading, error, reload } = useAdminProducts()
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const run = async (fn) => {
    setBusy(true); setErr('')
    try { await fn(); await reload() } catch (e) { setErr(e.message) }
    setBusy(false)
  }

  if (loading) return <p className="text-2C2C2C/50">Loading…</p>

  return (
    <div>
      <h1 className="text-2xl font-playfair mb-2">New Arrivals &amp; Best Sellers</h1>
      <p className="text-2C2C2C/60 text-sm mb-6 max-w-2xl">
        Choose what appears in the two sections on your home page (and under <strong>New Arrivals</strong> / <strong>Best Sellers</strong> in the menu).
        Use the arrows to set the order — the first one is shown first.
      </p>
      {(error || err) && <div className="admin-notice mb-6">{err || error}</div>}
      <div className="featured-grid">
        <FeaturedList
          title="New Arrivals" section="new" flag="isNew" orderKey="newOrder" products={products} run={run} busy={busy}
          blurb="Shown in the “New Arrivals” row on the home page."
        />
        <FeaturedList
          title="Best Sellers" section="best" flag="isBest" orderKey="bestOrder" products={products} run={run} busy={busy}
          blurb="Shown in the sliding “Best Sellers” strip. If this list is empty, the strip shows a random selection."
        />
      </div>
    </div>
  )
}
