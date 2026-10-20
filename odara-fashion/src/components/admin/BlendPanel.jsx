import { useEffect, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { loadBlendConfig, adminSaveBlendConfig } from '../../services/blend'

const GROUPS = [
  { key: 'bases', title: 'Base oils', hint: 'Step 1 — required. The price is the starting price of the blend.', prefix: 'b', nameField: 'name' },
  { key: 'topNotes', title: 'Top notes (citrus & herbs)', hint: 'Step 2 — optional. The price is added to the blend.', prefix: 't', nameField: 'name' },
  { key: 'middleNotes', title: 'Middle notes (florals)', hint: 'Step 3 — optional. The price is added to the blend.', prefix: 'm', nameField: 'name' },
  { key: 'baseNotes', title: 'Base notes (woody & amber)', hint: 'Step 4 — optional. The price is added to the blend.', prefix: 'n', nameField: 'name' },
  { key: 'sizes', title: 'Bottle sizes', hint: 'The price is an EXTRA added to the blend (use 0 for the smallest bottle).', prefix: 's', nameField: 'label' },
]

const Toggle = ({ on, onChange, label }) => (
  <button type="button" className={`admin-toggle ${on ? 'is-on' : ''}`} onClick={() => onChange(!on)} aria-label={label} aria-pressed={on}>
    <span className="admin-toggle-knob" />
  </button>
)

export default function BlendPanel() {
  const [cfg, setCfg] = useState(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => { loadBlendConfig(true).then(setCfg) }, [])
  if (!cfg) return <p className="text-2C2C2C/50">Loading…</p>

  const update = (key, index, patch) =>
    setCfg(c => ({ ...c, [key]: c[key].map((row, i) => (i === index ? { ...row, ...patch } : row)) }))
  const remove = (key, index) => setCfg(c => ({ ...c, [key]: c[key].filter((_, i) => i !== index) }))
  const add = (g) =>
    setCfg(c => ({
      ...c,
      [g.key]: [...c[g.key], { id: `${g.prefix}${Date.now().toString(36)}`, [g.nameField]: '', price: 0, active: true }],
    }))

  const save = async (e) => {
    e.preventDefault()
    setError(''); setMessage('')
    const clean = {}
    for (const g of GROUPS) {
      const rows = cfg[g.key]
        .map(r => ({
          id: String(r.id),
          [g.nameField]: String(r[g.nameField] || '').trim().slice(0, 40),
          price: Math.min(1000, Math.max(0, Math.round((parseFloat(r.price) || 0) * 100) / 100)),
          active: r.active !== false,
        }))
        .filter(r => r[g.nameField])
      clean[g.key] = rows
    }
    if (!clean.bases.some(b => b.active)) { setError('Keep at least one active base oil — it is required for every blend.'); return }
    setSaving(true)
    try {
      await adminSaveBlendConfig(clean)
      setCfg(clean)
      setMessage('Saved — the Signature page updates on the next page load.')
    } catch (err) {
      setError(err.message)
    }
    setSaving(false)
  }

  return (
    <form onSubmit={save} className="max-w-2xl">
      <h1 className="text-2xl font-playfair mb-2">Signature scent builder</h1>
      <p className="text-2C2C2C/60 text-sm mb-8">
        Everything customers can pick on <strong>Create Your Signature Scent</strong>. Switch an item off to hide it
        without deleting it. Prices are checked on the server when the order is placed.
      </p>

      {GROUPS.map(g => (
        <div key={g.key} className="admin-panel-card mb-6">
          <h2 className="font-playfair text-lg">{g.title}</h2>
          <p className="text-xs text-2C2C2C/50 mb-4">{g.hint}</p>
          <div className="space-y-2">
            {cfg[g.key].map((row, i) => (
              <div key={row.id} className="flex items-center gap-2">
                <input
                  className="admin-input flex-1"
                  placeholder={g.key === 'sizes' ? 'e.g. 50ml' : 'Name'}
                  value={row[g.nameField] || ''}
                  onChange={(e) => update(g.key, i, { [g.nameField]: e.target.value })}
                />
                <div className="flex items-center gap-1">
                  <span className="text-sm text-2C2C2C/50">{g.key === 'sizes' ? '+$' : '$'}</span>
                  <input
                    type="number" min="0" step="0.01" className="admin-input" style={{ width: 96 }}
                    value={row.price}
                    onChange={(e) => update(g.key, i, { price: e.target.value })}
                  />
                </div>
                <Toggle on={row.active !== false} onChange={(v) => update(g.key, i, { active: v })} label={`${row[g.nameField] || 'Item'} visible`} />
                <button type="button" className="admin-icon-btn" onClick={() => remove(g.key, i)} aria-label="Delete"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
          <button type="button" className="admin-btn-secondary mt-4 inline-flex items-center gap-2" onClick={() => add(g)}>
            <Plus className="w-4 h-4" /> Add {g.key === 'sizes' ? 'a size' : 'an option'}
          </button>
        </div>
      ))}

      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
      {message && <p className="text-sm text-green-700 mb-3">{message}</p>}
      <button type="submit" className="admin-btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button>
    </form>
  )
}
