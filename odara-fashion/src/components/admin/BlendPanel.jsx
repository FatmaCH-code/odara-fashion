import { useEffect, useState } from 'react'
import { Plus, Trash2, ImagePlus } from 'lucide-react'
import { loadBlendConfig, adminSaveBlendConfig } from '../../services/blend'
import { adminUploadProductImage } from '../../services/products'

// hasPrice: show a price box. hasImage: show a photo box.
const GROUPS = [
  { key: 'bases', title: 'Main scents', hint: 'Step 1 — “Choose your main scent”. Required. No price: only the bottle size has a price.', prefix: 'b', nameField: 'name', hasPrice: false, hasImage: true },
  { key: 'topNotes', title: 'Twist scents — group A (citrus & herbs)', hint: 'Step 2 — “Add a twist”. Customers pick one twist from groups A, B and C together. No price.', prefix: 't', nameField: 'name', hasPrice: false, hasImage: true },
  { key: 'middleNotes', title: 'Twist scents — group B (florals)', hint: 'Shown in the same “Add a twist” step. No price.', prefix: 'm', nameField: 'name', hasPrice: false, hasImage: true },
  { key: 'baseNotes', title: 'Twist scents — group C (woody & amber)', hint: 'Shown in the same “Add a twist” step. No price.', prefix: 'n', nameField: 'name', hasPrice: false, hasImage: true },
  { key: 'sizes', title: 'Bottle sizes', hint: 'Step 4 — “Select your bottle”. This is the ONLY price of the perfume.', prefix: 's', nameField: 'label', hasPrice: true, hasImage: false },
]

const Toggle = ({ on, onChange, label }) => (
  <button type="button" className={`admin-toggle ${on ? 'is-on' : ''}`} onClick={() => onChange(!on)} aria-label={label} aria-pressed={on}>
    <span className="admin-toggle-knob" />
  </button>
)

export default function BlendPanel() {
  const [cfg, setCfg] = useState(null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState('')   // id of the row being uploaded
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
      [g.key]: [...c[g.key], { id: `${g.prefix}${Date.now().toString(36)}`, [g.nameField]: '', price: 0, image: '', active: true }],
    }))

  const upload = async (g, index, file) => {
    if (!file) return
    const row = cfg[g.key][index]
    setError(''); setMessage(''); setUploading(row.id)
    try {
      const url = await adminUploadProductImage(file)
      update(g.key, index, { image: url })
    } catch (err) {
      setError('Photo upload failed: ' + err.message)
    }
    setUploading('')
  }

  const save = async (e) => {
    e.preventDefault()
    setError(''); setMessage('')
    const clean = {}
    for (const g of GROUPS) {
      clean[g.key] = cfg[g.key]
        .map(r => {
          const out = {
            id: String(r.id),
            [g.nameField]: String(r[g.nameField] || '').trim().slice(0, 40),
            price: g.hasPrice ? Math.min(1000, Math.max(0, Math.round((parseFloat(r.price) || 0) * 100) / 100)) : 0,
            active: r.active !== false,
          }
          if (g.hasImage) out.image = /^(https?:\/\/|\/)/.test(r.image || '') ? r.image : ''
          if (g.hasImage) out.tagline = String(r.tagline || '').trim().slice(0, 40)
          return out
        })
        .filter(r => r[g.nameField])
    }
    if (!clean.bases.some(b => b.active)) { setError('Keep at least one active base oil — it is required for every blend.'); return }
    if (!clean.sizes.some(s => s.active && s.price > 0)) { setError('Add at least one bottle size with a price above 0 — it sets the price of the blend.'); return }
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
        Everything customers can pick on <strong>Create Your Signature Scent</strong>. Add a photo and a short description to each scent, and switch an
        item off to hide it without deleting it. Prices are checked on the server when the order is placed.
      </p>

      {GROUPS.map(g => (
        <div key={g.key} className="admin-panel-card mb-6">
          <h2 className="font-playfair text-lg">{g.title}</h2>
          <p className="text-xs text-2C2C2C/50 mb-4">{g.hint}</p>
          <div className="space-y-3">
            {cfg[g.key].map((row, i) => (
              <div key={row.id} className="flex items-center gap-2">
                {g.hasImage && (
                  <label className="relative flex-shrink-0 cursor-pointer" title="Upload a photo" style={{ width: 56, height: 56 }}>
                    {row.image ? (
                      <img src={row.image} alt="" className="w-full h-full object-cover rounded-md border border-E8D9C4" />
                    ) : (
                      <span className="w-full h-full rounded-md border border-dashed border-C9A876 flex items-center justify-center text-C9A876 bg-white">
                        <ImagePlus className="w-5 h-5" />
                      </span>
                    )}
                    {uploading === row.id && (
                      <span className="absolute inset-0 flex items-center justify-center rounded-md bg-white/80 text-xs">…</span>
                    )}
                    <input type="file" accept="image/*" className="sr-only" disabled={!!uploading} onChange={(e) => { upload(g, i, e.target.files?.[0]); e.target.value = '' }} />
                  </label>
                )}
                <div className="flex-1 space-y-1">
                  <input
                    className="admin-input w-full"
                    placeholder={g.key === 'sizes' ? 'e.g. 50ml' : 'Name'}
                    value={row[g.nameField] || ''}
                    onChange={(e) => update(g.key, i, { [g.nameField]: e.target.value })}
                  />
                  {g.hasImage && (
                    <input
                      className="admin-input w-full"
                      style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem' }}
                      placeholder="Short description, e.g. Deep & woody"
                      value={row.tagline || ''}
                      onChange={(e) => update(g.key, i, { tagline: e.target.value })}
                    />
                  )}
                </div>
                {g.hasPrice && (
                  <div className="flex items-center gap-1">
                    <span className="text-sm text-2C2C2C/50">{g.key === 'sizes' ? '$' : '+$'}</span>
                    <input
                      type="number" min="0" step="0.01" className="admin-input" style={{ width: 96 }}
                      value={row.price}
                      onChange={(e) => update(g.key, i, { price: e.target.value })}
                    />
                  </div>
                )}
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
      <button type="submit" className="admin-btn-primary" disabled={saving || !!uploading}>{saving ? 'Saving…' : 'Save changes'}</button>
    </form>
  )
}
