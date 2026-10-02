import { useState } from 'react'
import { adminUploadProductImage } from '../../services/products'

const EMPTY = {
  name: '', price: '', originalPrice: '', category: '', images: [],
  isNew: false, isSale: false, stock: 20, description: '', colors: [], sizes: [],
}

// US sizing — numeric (shoes/kids/some regional garment sizing) and standard
// letter sizing. Admin just picks whichever apply to this product.
const NUMERIC_SIZES = ['1', '2', '3', '4', '5', '6', '7']
const LETTER_SIZES = ['S', 'M', 'L', 'XL', 'XXL', 'XXXL']

export default function ProductForm({ product, onSave, onCancel, categories }) {
  const [form, setForm] = useState(product ? {
    ...EMPTY,
    ...product,
    price: product.price ?? '',
    originalPrice: product.originalPrice ?? '',
    images: product.images && product.images.length > 0 ? product.images : (product.image ? [product.image] : []),
  } : EMPTY)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [colorName, setColorName] = useState('')
  const [colorHex, setColorHex] = useState('#c9a876')
  const [urlInput, setUrlInput] = useState('')

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }))
  const setBool = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.checked }))

  // Multiple photos per product — e.g. one per color variant. The first
  // photo in the list is used as the cover image shown on cards.
  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return
    setUploading(true)
    setError('')
    try {
      const urls = []
      for (const file of files) {
        urls.push(await adminUploadProductImage(file))
      }
      setForm(f => ({ ...f, images: [...(f.images || []), ...urls] }))
    } catch (err) {
      setError('Image upload failed: ' + err.message)
    }
    setUploading(false)
    e.target.value = ''
  }

  const removeImage = (idx) => {
    setForm(f => ({ ...f, images: f.images.filter((_, i) => i !== idx) }))
  }

  const makeCoverImage = (idx) => {
    setForm(f => {
      const images = [...f.images]
      const [chosen] = images.splice(idx, 1)
      return { ...f, images: [chosen, ...images] }
    })
  }

  const addImageUrl = () => {
    if (!urlInput.trim()) return
    setForm(f => ({ ...f, images: [...(f.images || []), urlInput.trim()] }))
    setUrlInput('')
  }

  const addColor = () => {
    if (!colorName.trim()) return
    // Every color starts with its OWN blank size list — never copied from
    // the general list or from any other color. There is no shared state
    // between colors at all, so editing one can never affect another,
    // no matter what order you add colors or pick sizes in.
    setForm(f => ({
      ...f,
      colors: [...(f.colors || []), { name: colorName.trim(), hex: colorHex, sizes: [] }],
    }))
    setColorName('')
  }

  const removeColor = (idx) => {
    setForm(f => ({ ...f, colors: f.colors.filter((_, i) => i !== idx) }))
  }

  // General size list — only used for products with no color variation.
  // Completely separate from colors' own sizes below; toggling this never
  // touches the colors array.
  const toggleSize = (size) => {
    setForm(f => {
      const sizes = f.sizes || []
      return sizes.includes(size)
        ? { ...f, sizes: sizes.filter(s => s !== size) }
        : { ...f, sizes: [...sizes, size] }
    })
  }

  // Each color's own size list, toggled independently. Never reads from —
  // or writes to — the general list or any other color.
  const toggleColorSize = (colorIdx, size) => {
    setForm(f => {
      const colors = [...f.colors]
      const color = colors[colorIdx]
      const current = color.sizes || []
      const next = current.includes(size) ? current.filter(s => s !== size) : [...current, size]
      colors[colorIdx] = { ...color, sizes: next }
      return { ...f, colors }
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.name || !form.price || !form.category) {
      setError('Name, price and category are required.')
      return
    }
    setSaving(true)
    try {
      await onSave({
        ...form,
        price: parseFloat(form.price),
        originalPrice: form.originalPrice ? parseFloat(form.originalPrice) : undefined,
        stock: parseInt(form.stock) || 0,
      })
    } catch (err) {
      setError(err.message)
      setSaving(false)
    }
  }

  return (
    <div className="admin-modal-backdrop" onClick={onCancel}>
      <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-playfair mb-6">{product ? 'Edit Product' : 'Add Product'}</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="admin-label">Name *</label>
              <input className="admin-input" value={form.name} onChange={set('name')} required />
            </div>

            <div>
              <label className="admin-label">Price *</label>
              <input type="number" step="0.01" className="admin-input" value={form.price} onChange={set('price')} required />
            </div>
            <div>
              <label className="admin-label">Original Price (if on sale)</label>
              <input type="number" step="0.01" className="admin-input" value={form.originalPrice} onChange={set('originalPrice')} />
            </div>

            <div className="col-span-2">
              <label className="admin-label">Category *</label>
              <input className="admin-input" value={form.category} onChange={set('category')} required list="admin-categories" />
              <datalist id="admin-categories">
                {categories.map(c => <option key={c} value={c} />)}
              </datalist>
            </div>

            <div className="col-span-2">
              <label className="admin-label">Description</label>
              <textarea className="admin-input" rows={3} value={form.description} onChange={set('description')} />
            </div>

            <div>
              <label className="admin-label">Stock</label>
              <input type="number" className="admin-input" value={form.stock} onChange={set('stock')} />
            </div>
            <div className="flex items-end gap-4 pb-2">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.isNew} onChange={setBool('isNew')} /> New
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.isSale} onChange={setBool('isSale')} /> On Sale
              </label>
            </div>

            <div className="col-span-2">
              <label className="admin-label">Photos</label>
              <p className="text-xs text-2C2C2C/45 mb-2">Add one photo per color/variant if you like — the first photo is the cover shown on product cards.</p>

              {form.images && form.images.length > 0 && (
                <div className="admin-photo-grid">
                  {form.images.map((url, i) => (
                    <div key={i} className={`admin-photo-thumb ${i === 0 ? 'is-cover' : ''}`}>
                      <img src={url} alt="" />
                      {i === 0 && <span className="admin-photo-cover-badge">Cover</span>}
                      <div className="admin-photo-thumb-actions">
                        {i !== 0 && (
                          <button type="button" onClick={() => makeCoverImage(i)} title="Make cover photo">★</button>
                        )}
                        <button type="button" onClick={() => removeImage(i)} title="Remove">&times;</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="admin-input" disabled={uploading} />
              <p className="text-xs text-2C2C2C/45 mt-1 mb-2">{uploading ? 'Uploading…' : 'Select one or more files — uploads straight to Supabase Storage.'}</p>

              <div className="flex gap-2">
                <input
                  className="admin-input flex-1"
                  placeholder="...or paste an image URL"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                />
                <button type="button" className="admin-btn-secondary" onClick={addImageUrl}>Add</button>
              </div>
            </div>

            <div className="col-span-2">
              <label className="admin-label">Sizes (US)</label>
              <p className="text-xs text-2C2C2C/45 mb-2">
                Used only if this product has no colors below. Once you add a color, set its
                sizes on that color's own card instead — each color has its own independent list.
              </p>
              <div className="admin-size-group">
                {NUMERIC_SIZES.map(s => (
                  <button
                    key={s}
                    type="button"
                    className={`admin-size-chip ${(form.sizes || []).includes(s) ? 'is-selected' : ''}`}
                    onClick={() => toggleSize(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <div className="admin-size-group mt-2">
                {LETTER_SIZES.map(s => (
                  <button
                    key={s}
                    type="button"
                    className={`admin-size-chip ${(form.sizes || []).includes(s) ? 'is-selected' : ''}`}
                    onClick={() => toggleSize(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="col-span-2">
              <label className="admin-label">Colors</label>
              <div className="flex gap-2 mb-3">
                <input className="admin-input flex-1" placeholder="Color name" value={colorName} onChange={(e) => setColorName(e.target.value)} />
                <input type="color" value={colorHex} onChange={(e) => setColorHex(e.target.value)} className="admin-color-picker" />
                <button type="button" onClick={addColor} className="admin-btn-secondary">Add</button>
              </div>

              {(form.colors || []).length > 0 && (
                <div className="space-y-3">
                  {form.colors.map((c, i) => (
                    <div key={i} className="admin-color-card">
                      <div className="flex items-center justify-between mb-2">
                        <span className="flex items-center gap-2 font-medium text-sm">
                          <span className="admin-color-dot" style={{ background: c.hex }} />
                          {c.name}
                        </span>
                        <button type="button" className="admin-icon-btn admin-icon-btn-danger" onClick={() => removeColor(i)}>
                          <span style={{ fontSize: '14px' }}>&times;</span>
                        </button>
                      </div>

                      <p className="text-xs text-2C2C2C/45 mb-1.5">Sizes available in {c.name}</p>
                      <div className="admin-size-group">
                        {NUMERIC_SIZES.map(s => (
                          <button
                            key={s}
                            type="button"
                            className={`admin-size-chip admin-size-chip-sm ${(c.sizes || []).includes(s) ? 'is-selected' : ''}`}
                            onClick={() => toggleColorSize(i, s)}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                      <div className="admin-size-group mt-1.5">
                        {LETTER_SIZES.map(s => (
                          <button
                            key={s}
                            type="button"
                            className={`admin-size-chip admin-size-chip-sm ${(c.sizes || []).includes(s) ? 'is-selected' : ''}`}
                            onClick={() => toggleColorSize(i, s)}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onCancel} className="admin-btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={saving || uploading} className="admin-btn-primary flex-1">
              {saving ? 'Saving…' : 'Save Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
