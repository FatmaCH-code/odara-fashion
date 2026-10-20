import { useEffect, useState } from 'react'
import { Plus, Trash2, ImagePlus } from 'lucide-react'
import { loadBlendConfig, adminSaveBlendConfig, DEFAULT_LABELS } from '../../services/blend'
import { adminUploadProductImage } from '../../services/products'

// hasPrice: show a price box. hasImage: show a photo box. hasSubs: each item can have types (e.g. Oud -> Royal).
const GROUPS = [
  { key: 'bases', title: 'Main scents', hint: 'Step 1 — “Choose your main scent”. Required. No price: only the bottle size has a price. Use “Add a type” to create sub-categories (e.g. Oud → Royal, Cambodian).', prefix: 'b', nameField: 'name', hasPrice: false, hasImage: true, hasSubs: true },
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

function PhotoBox({ image, size = 56, busy, disabled, onFile }) {
  return (
    <label className="relative flex-shrink-0 cursor-pointer" title="Upload a photo" style={{ width: size, height: size }}>
      {image ? (
        <img src={image} alt="" className="w-full h-full object-cover rounded-md border border-E8D9C4" />
      ) : (
        <span className="w-full h-full rounded-md border border-dashed border-C9A876 flex items-center justify-center text-C9A876 bg-white">
          <ImagePlus className="w-5 h-5" />
        </span>
      )}
      {busy && <span className="absolute inset-0 flex items-center justify-center rounded-md bg-white/80 text-xs">…</span>}
      <input type="file" accept="image/*" className="sr-only" disabled={disabled} onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = '' }} />
    </label>
  )
}

const okUrl = (u) => (/^(https?:\/\/|\/)/.test(u || '') ? u : '')
const cleanText = (v, n = 40) => String(v || '').trim().slice(0, n)

export default function BlendPanel() {
  const [cfg, setCfg] = useState(null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState('')   // id of the row/type being uploaded
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
      [g.key]: [...c[g.key], { id: `${g.prefix}${Date.now().toString(36)}`, [g.nameField]: '', price: 0, image: '', tagline: '', active: true, ...(g.hasSubs ? { subs: [] } : {}) }],
    }))

  // Types (sub-categories) of a main scent
  const updateSub = (index, si, patch) =>
    update('bases', index, { subs: (cfg.bases[index].subs || []).map((x, j) => (j === si ? { ...x, ...patch } : x)) })
  const removeSub = (index, si) => update('bases', index, { subs: (cfg.bases[index].subs || []).filter((_, j) => j !== si) })
  const addSub = (index) =>
    update('bases', index, { subs: [...(cfg.bases[index].subs || []), { id: `x${Date.now().toString(36)}`, name: '', image: '', tagline: '', active: true }] })

  const upload = async (file, id, apply) => {
    if (!file) return
    setError(''); setMessage(''); setUploading(id)
    try {
      apply(await adminUploadProductImage(file))
    } catch (err) {
      setError('Photo upload failed: ' + err.message)
    }
    setUploading('')
  }

  const save = async (e) => {
    e.preventDefault()
    setError(''); setMessage('')
    const clean = { labels: {} }
    for (const k of Object.keys(DEFAULT_LABELS)) clean.labels[k] = cleanText((cfg.labels || {})[k], 60) || DEFAULT_LABELS[k]
    for (const g of GROUPS) {
      clean[g.key] = cfg[g.key]
        .map(r => {
          const out = {
            id: String(r.id),
            [g.nameField]: cleanText(r[g.nameField]),
            price: g.hasPrice ? Math.min(1000, Math.max(0, Math.round((parseFloat(r.price) || 0) * 100) / 100)) : 0,
            active: r.active !== false,
          }
          if (g.hasImage) { out.image = okUrl(r.image); out.tagline = cleanText(r.tagline) }
          if (g.hasSubs) {
            out.subs = (r.subs || [])
              .map(x => ({ id: String(x.id), name: cleanText(x.name), image: okUrl(x.image), tagline: cleanText(x.tagline), active: x.active !== false }))
              .filter(x => x.name)
          }
          return out
        })
        .filter(r => r[g.nameField])
    }
    if (!clean.bases.some(b => b.active)) { setError('Keep at least one active main scent — it is required for every blend.'); return }
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

      <div className="admin-panel-card mb-6">
        <h2 className="font-playfair text-lg">Section names</h2>
        <p className="text-xs text-2C2C2C/50 mb-4">The titles customers see on the Signature page. Rename them however you like (for example “Choose your oud”).</p>
        <div className="space-y-3">
          {[
            ['base', 'Step 1 title (main scents)'],
            ['baseName', 'Short name used in the summary (e.g. “Main scent”)'],
            ['twist', 'Step 2 title (twists)'],
            ['character', 'Step 3 title (softer / balanced / bolder)'],
            ['size', 'Step 4 title (bottle sizes)'],
            ['name', 'Step 5 title (name your creation)'],
          ].map(([k, label]) => (
            <div key={k}>
              <label className="admin-label">{label}</label>
              <input className="admin-input w-full" maxLength={60} value={(cfg.labels || {})[k] ?? DEFAULT_LABELS[k]}
                onChange={(e) => setCfg(c => ({ ...c, labels: { ...(c.labels || {}), [k]: e.target.value } }))} />
            </div>
          ))}
        </div>
      </div>

      {GROUPS.map(g => (
        <div key={g.key} className="admin-panel-card mb-6">
          <h2 className="font-playfair text-lg">{g.key === 'bases' ? ((cfg.labels && cfg.labels.base) || g.title) : g.key === 'sizes' ? ((cfg.labels && cfg.labels.size) || g.title) : g.title}</h2>
          <p className="text-xs text-2C2C2C/50 mb-4">{g.hint}</p>
          <div className="space-y-4">
            {cfg[g.key].map((row, i) => (
              <div key={row.id}>
                <div className="flex items-center gap-2">
                  {g.hasImage && (
                    <PhotoBox image={row.image} busy={uploading === row.id} disabled={!!uploading}
                      onFile={(f) => upload(f, row.id, (url) => update(g.key, i, { image: url }))} />
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
                      <span className="text-sm text-2C2C2C/50">$</span>
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

                {g.hasSubs && (
                  <div className="ml-8 mt-2 pl-4 border-l-2 border-E8D9C4 space-y-2">
                    {(row.subs || []).length > 0 && (
                      <p className="text-xs text-2C2C2C/50">Types of {row[g.nameField] || 'this scent'} — the customer must pick one.</p>
                    )}
                    {(row.subs || []).map((x, si) => (
                      <div key={x.id} className="flex items-center gap-2">
                        <PhotoBox size={44} image={x.image} busy={uploading === x.id} disabled={!!uploading}
                          onFile={(f) => upload(f, x.id, (url) => updateSub(i, si, { image: url }))} />
                        <div className="flex-1 space-y-1">
                          <input className="admin-input w-full" placeholder="Type name, e.g. Cambodian" value={x.name || ''} onChange={(e) => updateSub(i, si, { name: e.target.value })} />
                          <input className="admin-input w-full" style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem' }} placeholder="Short description (optional)" value={x.tagline || ''} onChange={(e) => updateSub(i, si, { tagline: e.target.value })} />
                        </div>
                        <Toggle on={x.active !== false} onChange={(v) => updateSub(i, si, { active: v })} label={`${x.name || 'Type'} visible`} />
                        <button type="button" className="admin-icon-btn" onClick={() => removeSub(i, si)} aria-label="Delete type"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    ))}
                    <button type="button" className="text-sm underline text-C9A876 inline-flex items-center gap-1" onClick={() => addSub(i)}>
                      <Plus className="w-3.5 h-3.5" /> Add a type
                    </button>
                  </div>
                )}
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
