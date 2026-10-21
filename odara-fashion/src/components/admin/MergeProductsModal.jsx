import { useState } from 'react'

const PALETTE = ['#c9a876', '#2c2c2c', '#7a3b3b', '#2f4f6f', '#4d6b4d', '#8a6f9e', '#d98aa0', '#9a9a9a', '#e8d9c4', '#b5651d']

// Turns several products (e.g. "Recovered product 1..5" = the same item in different colors)
// into ONE product with a color per original. Photos are kept; the extra products are deleted.
export default function MergeProductsModal({ products, categories, onMerge, onCancel }) {
  const [mainId, setMainId] = useState(products[0].id)
  const main = products.find(p => p.id === mainId) || products[0]
  const [name, setName] = useState(main.name.startsWith('Recovered') ? '' : main.name)
  const [price, setPrice] = useState(main.price > 0 ? String(main.price) : '')
  const [category, setCategory] = useState(main.category === 'Recovered' ? '' : main.category)
  const [colors, setColors] = useState(() => products.map((p, i) => ({ id: p.id, name: '', hex: PALETTE[i % PALETTE.length] })))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const setColor = (id, patch) => setColors(cs => cs.map(c => (c.id === id ? { ...c, ...patch } : c)))
  const catOptions = categories.filter(c => c !== 'Recovered')

  const submit = async () => {
    setError('')
    if (!name.trim()) return setError('Give the merged product a name.')
    if (!(parseFloat(price) > 0)) return setError('Set a price above 0.')
    if (!category.trim()) return setError('Choose a category.')
    if (colors.some(c => !c.name.trim())) return setError('Name every color (for example Black, Beige, Brown).')
    const names = colors.map(c => c.name.trim().toLowerCase())
    if (new Set(names).size !== names.length) return setError('Each color needs a different name.')
    setBusy(true)
    try {
      await onMerge({ mainId, name: name.trim(), price: parseFloat(price), category: category.trim(), colors })
    } catch (err) {
      setError(err.message || 'Merge failed.')
      setBusy(false)
    }
  }

  // main product first, then the others in the order selected
  const ordered = [products.find(p => p.id === mainId), ...products.filter(p => p.id !== mainId)]

  return (
    <div className="admin-modal-backdrop" onClick={busy ? undefined : onCancel}>
      <div className="admin-modal" style={{ maxWidth: 640, maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-playfair mb-1">Merge {products.length} products into one</h2>
        <p className="text-sm text-2C2C2C/60 mb-5">
          The products below become <strong>one product with {products.length} colors</strong>. All their photos are kept.
          The other {products.length - 1} products are removed from the shop.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
          <div className="sm:col-span-2">
            <label className="admin-label">Product name</label>
            <input className="admin-input w-full" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Leopard Print Hijab" />
          </div>
          <div>
            <label className="admin-label">Price ($)</label>
            <input type="number" min="0" step="0.01" className="admin-input w-full" value={price} onChange={(e) => setPrice(e.target.value)} />
          </div>
          <div>
            <label className="admin-label">Category</label>
            <select className="admin-input w-full" value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">Choose…</option>
              {catOptions.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <p className="text-sm font-medium mb-2">Name each color</p>
        <div className="space-y-2 mb-5">
          {ordered.map((p, i) => {
            const c = colors.find(x => x.id === p.id)
            return (
              <div key={p.id} className="flex items-center gap-3 p-2 border border-E8D9C4 rounded-lg">
                {p.image ? <img src={p.image} alt="" className="admin-table-thumb" /> : <div className="admin-table-thumb-empty" />}
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-2C2C2C/50 truncate">{p.name}{i === 0 ? ' · main product (keeps the description)' : ''}</p>
                  <input className="admin-input w-full" placeholder="Color name, e.g. Black" value={c.name} onChange={(e) => setColor(p.id, { name: e.target.value })} />
                </div>
                <input type="color" value={c.hex} onChange={(e) => setColor(p.id, { hex: e.target.value })} className="admin-color-picker" title="Color dot shown to customers" />
              </div>
            )
          })}
        </div>

        <label className="admin-label">Which product keeps the description and flags?</label>
        <select className="admin-input w-full mb-5" value={mainId} onChange={(e) => setMainId(parseInt(e.target.value))}>
          {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>

        {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
        <div className="flex gap-3">
          <button className="admin-btn-secondary flex-1" disabled={busy} onClick={onCancel}>Cancel</button>
          <button className="admin-btn-primary flex-1" disabled={busy} onClick={submit}>{busy ? 'Merging…' : 'Merge into one product'}</button>
        </div>
      </div>
    </div>
  )
}
