import { useEffect, useRef, useState } from 'react'
import { adminUploadProductImage } from '../../services/products'
import { NUMERIC_SIZES, LETTER_SIZES, ML_SIZES } from '../../utils/sizes'
import SizePicker from './SizePicker'
import { sortSizes } from '../../utils/sizes'
import { PERFUME_BRANDS, PERFUME_CATEGORY, OIL_CATEGORY, isPerfumeCategory, isOilCategory, getBrandTabs } from '../../utils/categories'

const EMPTY = {
  name: '', price: '', originalPrice: '', category: '', brand: '', images: [],
  isNew: false, isSale: false, isBest: false, stock: 20, description: '', colors: [], sizes: [], sizePrices: {},
}

// What an untouched form looks like for this product.
const buildBase = (product) => product ? {
  ...EMPTY,
  ...product,
  price: product.price ?? '',
  originalPrice: product.originalPrice ?? '',
  images: product.images && product.images.length > 0 ? product.images : (product.image ? [product.image] : []),
} : EMPTY

// Unsaved edits are kept on this device while you work, so leaving the page and coming back
// (or a refresh, or the browser reloading the tab) never loses what you typed.
const DRAFT_PREFIX = 'odara-draft-product-'
const DRAFT_MAX_AGE = 7 * 24 * 60 * 60 * 1000
const readDraft = (key) => {
  try {
    const d = JSON.parse(localStorage.getItem(key) || 'null')
    return d && d.form && Date.now() - d.savedAt < DRAFT_MAX_AGE ? d : null
  } catch { return null }
}
const writeDraft = (key, d) => { try { localStorage.setItem(key, JSON.stringify(d)) } catch { /* storage full / private mode */ } }
const clearDraft = (key) => { try { localStorage.removeItem(key) } catch { /* ignore */ } }

export default function ProductForm({ product, onSave, onCancel, categories, brands }) {
  const draftKey = DRAFT_PREFIX + (product ? product.id : 'new')
  const baseRef = useRef(null)
  if (!baseRef.current) baseRef.current = { form: buildBase(product), sig: JSON.stringify(buildBase(product)) }
  const restoredFrom = useRef(null)

  const [form, setForm] = useState(() => {
    const d = readDraft(draftKey)
    // Only restore a draft made from the SAME saved version of this product — if the product was
    // changed since, the old draft would overwrite newer data, so it is dropped instead.
    if (d && d.base === baseRef.current.sig) { restoredFrom.current = d.savedAt; return d.form }
    if (d) clearDraft(draftKey)
    return baseRef.current.form
  })
  const [restoredAt, setRestoredAt] = useState(restoredFrom.current)
  const dirty = JSON.stringify(form) !== baseRef.current.sig

  useEffect(() => {
    if (!dirty) { clearDraft(draftKey); return }
    const t = setTimeout(() => writeDraft(draftKey, { form, base: baseRef.current.sig, savedAt: Date.now() }), 300)
    return () => clearTimeout(t)
  }, [form])

  const discardDraft = () => {
    clearDraft(draftKey)
    setForm(baseRef.current.form)
    setRestoredAt(null)
  }

  // Cancel asks first if there is something to lose; clicking outside the box never closes it by accident.
  const requestClose = () => {
    if (dirty && !window.confirm('Discard your unsaved changes?')) return
    clearDraft(draftKey)
    onCancel()
  }
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [colorName, setColorName] = useState('')
  const [colorHex, setColorHex] = useState('#c9a876')
  const [variantKind, setVariantKind] = useState(null) // 'color' | 'name' (null = pick a sensible default)
  const [urlInput, setUrlInput] = useState('')

  // Built-in sections are always offered, even before any product uses them.
  const categoryOptions = [...new Set([...(categories || []), PERFUME_CATEGORY, OIL_CATEGORY, form.category].filter(Boolean))]
  const showBrand = isPerfumeCategory(form.category)
  // Perfumes and oils are sold by bottle size (ml), clothes by US/letter size — either way you can add your own.
  const scentMode = isPerfumeCategory(form.category) || isOilCategory(form.category)
  const sizeGroups = scentMode ? [ML_SIZES] : [NUMERIC_SIZES, LETTER_SIZES]
  const kind = variantKind ?? (scentMode ? 'name' : 'color')
  const [newCategory, setNewCategory] = useState(false)
  const brandOptions = getBrandTabs((brands || []).map(b => ({ brand: b })).concat(form.brand ? [{ brand: form.brand }] : []))
  const [otherBrand, setOtherBrand] = useState(false)

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

  // A "variant" is either a COLOR (shows a color dot) or a NAME (shows its name as a button — e.g.
  // the different scents of one perfume). Each has its own photo and its own sizes, fully independent.
  const addVariant = () => {
    const name = colorName.trim()
    if (!name) return
    if ((form.colors || []).some(c => c.name.toLowerCase() === name.toLowerCase())) {
      setError(`"${name}" is already in the list.`)
      return
    }
    setError('')
    setForm(f => ({
      ...f,
      colors: [...(f.colors || []), { name, ...(kind === 'color' ? { hex: colorHex } : {}), sizes: [], image: '' }],
    }))
    setColorName('')
  }

  const removeColor = (idx) => {
    setForm(f => ({ ...f, colors: f.colors.filter((_, i) => i !== idx) }))
  }

  // Every size this product is offered in (general list + each color/name's own list), in order.
  const allSizes = sortSizes([...new Set([...(form.sizes || []), ...(form.colors || []).flatMap(c => c.sizes || [])])])
  const setSizePrice = (size, value) => setForm(f => {
    const sizePrices = { ...(f.sizePrices || {}) }
    if (value === '') delete sizePrices[size]; else sizePrices[size] = value
    return { ...f, sizePrices }
  })

  // General size list — only used for products with no colors/names.
  const setSizes = (sizes) => setForm(f => ({ ...f, sizes }))

  // Each color/name's own size list. Never reads from — or writes to — anything else.
  const setColorSizes = (idx, sizes) => {
    setForm(f => {
      const colors = [...f.colors]
      colors[idx] = { ...colors[idx], sizes }
      return { ...f, colors }
    })
  }

  // The photo customers see when they pick this color/name. It is also added to the product's gallery.
  const setVariantImage = (idx, url) => {
    setForm(f => {
      const colors = [...f.colors]
      colors[idx] = { ...colors[idx], image: url }
      const images = url && !(f.images || []).includes(url) ? [...(f.images || []), url] : f.images
      return { ...f, colors, images }
    })
  }

  const uploadVariantImage = async (idx, e) => {
    const file = e.target.files && e.target.files[0]
    if (!file) return
    setUploading(true)
    setError('')
    try {
      setVariantImage(idx, await adminUploadProductImage(file))
    } catch (err) {
      setError('Photo upload failed: ' + err.message)
    }
    setUploading(false)
    e.target.value = ''
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
        brand: isPerfumeCategory(form.category) ? (form.brand || '').trim() : '',
        price: parseFloat(form.price),
        originalPrice: form.originalPrice ? parseFloat(form.originalPrice) : undefined,
        stock: parseInt(form.stock) || 0,
      })
      clearDraft(draftKey)
    } catch (err) {
      setError(/size_prices/.test(err.message || '')
        ? 'Prices per size need a one-time database update: run sql/size_prices.sql in Supabase (see SETUP.md), then save again.'
        : err.message)
      setSaving(false)
    }
  }

  return (
    <div className="admin-modal-backdrop" onClick={() => { if (!dirty) onCancel() }}>
      <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
        {/* Stays pinned while you scroll, so you always see WHICH item you are editing */}
        <div className="admin-modal-sticky">
          <h2 className="admin-modal-title">{product ? 'Edit Product' : 'Add Product'}</h2>
          <p className="admin-modal-itemname" title={form.name}>{form.name.trim() || 'Untitled item'}</p>
        </div>

        {restoredAt && dirty && (
          <div className="admin-draft-note" role="status">
            <span>Your unsaved changes from {new Date(restoredAt).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })} were restored.</span>
            <button type="button" className="admin-link-btn" onClick={discardDraft}>Discard changes</button>
          </div>
        )}

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
              <select
                className="admin-input"
                value={newCategory ? '__new__' : form.category}
                onChange={(e) => {
                  if (e.target.value === '__new__') { setNewCategory(true); setForm(f => ({ ...f, category: '' })) }
                  else { setNewCategory(false); setForm(f => ({ ...f, category: e.target.value })) }
                }}
                required={!newCategory}
              >
                <option value="">Choose a category…</option>
                {categoryOptions.map(c => <option key={c} value={c}>{c}</option>)}
                <option value="__new__">+ New category…</option>
              </select>
              {newCategory && (
                <input className="admin-input mt-2" autoFocus required value={form.category} onChange={set('category')} placeholder="Type the new category name" />
              )}
            </div>

            {showBrand && (
            <div className="col-span-2">
              <label className="admin-label">Perfume brand</label>
              <select
                className="admin-input"
                value={otherBrand ? '__other__' : (form.brand || '')}
                onChange={(e) => {
                  if (e.target.value === '__other__') { setOtherBrand(true); setForm(f => ({ ...f, brand: '' })) }
                  else { setOtherBrand(false); setForm(f => ({ ...f, brand: e.target.value })) }
                }}
              >
                <option value="">Choose a brand…</option>
                {brandOptions.map(b => <option key={b} value={b}>{b}</option>)}
                <option value="__other__">+ Another brand…</option>
              </select>
              {otherBrand && (
                <input className="admin-input mt-2" autoFocus value={form.brand || ''} onChange={set('brand')} placeholder="Type the brand name" />
              )}
            </div>
            )}

            <div className="col-span-2">
              <label className="admin-label">Description</label>
              <textarea className="admin-input" rows={3} value={form.description} onChange={set('description')} />
            </div>

            <div>
              <label className="admin-label">Stock</label>
              <input type="number" className="admin-input" value={form.stock} onChange={set('stock')} />
            </div>
            <div className="flex items-end gap-4 pb-2 flex-wrap">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.isNew} onChange={setBool('isNew')} /> New Arrival
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.isBest} onChange={setBool('isBest')} /> Best Seller
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
              <label className="admin-label">{scentMode ? 'Sizes (bottle)' : 'Sizes (US)'}</label>
              <p className="text-xs text-2C2C2C/45 mb-2">
                Used only if this product has no colors or names below — once you add one, set its sizes on its own card
                instead (each has its own independent list). Tap a size, or type any size you like and press Enter.
              </p>
              <SizePicker value={form.sizes || []} onChange={setSizes} groups={sizeGroups} placeholder={scentMode ? 'e.g. 75 ml' : 'e.g. One size'} />
            </div>

            <div className="col-span-2">
              <label className="admin-label">Colors &amp; names <span className="admin-label-for">for {form.name.trim() || 'this item'}</span></label>
              <p className="text-xs text-2C2C2C/45 mb-2">
                A <strong>color</strong> shows a color dot. A <strong>name</strong> shows its name as a button — for example the
                different scents of one perfume. Give each one its own photo: customers see it when they pick it.
              </p>
              <div className="flex gap-2 mb-3 flex-wrap">
                <select className="admin-input variant-kind" value={kind} onChange={(e) => setVariantKind(e.target.value)} aria-label="Type of option">
                  <option value="color">Color</option>
                  <option value="name">Name</option>
                </select>
                <input
                  className="admin-input flex-1"
                  placeholder={kind === 'name' ? 'Name (e.g. Khamrah)' : 'Color name (e.g. Black)'}
                  value={colorName}
                  onChange={(e) => setColorName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addVariant() } }}
                />
                {kind === 'color' && (
                  <input type="color" value={colorHex} onChange={(e) => setColorHex(e.target.value)} className="admin-color-picker" />
                )}
                <button type="button" onClick={addVariant} className="admin-btn-secondary">Add</button>
              </div>

              {(form.colors || []).length > 0 && (
                <div className="space-y-3">
                  {form.colors.map((c, i) => (
                    <div key={i} className="admin-color-card">
                      <div className="flex items-center justify-between mb-2">
                        <span className="flex items-center gap-2 font-medium text-sm">
                          {c.hex ? <span className="admin-color-dot" style={{ background: c.hex }} /> : <span className="admin-name-badge">Name</span>}
                          {c.name}
                        </span>
                        <button type="button" className="admin-icon-btn admin-icon-btn-danger" onClick={() => removeColor(i)} aria-label={`Remove ${c.name}`}>
                          <span style={{ fontSize: '14px' }}>&times;</span>
                        </button>
                      </div>

                      <div className="variant-photo">
                        <div className="variant-photo-preview">
                          {c.image ? <img src={c.image} alt={`${c.name} photo`} /> : <span>No photo</span>}
                        </div>
                        <div className="variant-photo-controls">
                          <p className="text-xs text-2C2C2C/45 mb-1.5">Photo shown when a customer picks “{c.name}”</p>
                          {(form.images || []).length > 0 && (
                            <div className="variant-photo-pick" aria-label="Choose from this product's photos">
                              {form.images.map((url, k) => (
                                <button key={k} type="button" className={c.image === url ? 'is-selected' : ''} title="Use this photo" onClick={() => setVariantImage(i, url)}>
                                  <img src={url} alt="" />
                                </button>
                              ))}
                            </div>
                          )}
                          <div className="flex gap-2 items-center flex-wrap">
                            <label className="admin-btn-secondary variant-upload">
                              Upload a photo
                              <input type="file" accept="image/*" hidden disabled={uploading} onChange={(e) => uploadVariantImage(i, e)} />
                            </label>
                            {c.image && <button type="button" className="admin-link-btn" onClick={() => setVariantImage(i, '')}>Remove photo</button>}
                          </div>
                        </div>
                      </div>

                      <p className="text-xs text-2C2C2C/45 mt-3 mb-1.5">Sizes available in {c.name}</p>
                      <SizePicker small value={c.sizes || []} onChange={(sizes) => setColorSizes(i, sizes)} groups={sizeGroups} placeholder={scentMode ? 'e.g. 75 ml' : 'e.g. One size'} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {allSizes.length > 0 && (
              <div className="col-span-2">
                <label className="admin-label">Price for each size</label>
                <p className="text-xs text-2C2C2C/45 mb-2">
                  Give a size its own price — for example 50 ml → 59.99 and 100 ml → 89.99. Leave a size empty to use the
                  normal price{form.price ? ` ($${form.price})` : ''}. Shoppers see the price of the size they pick.
                </p>
                <div className="size-price-list">
                  {allSizes.map(sz => (
                    <div key={sz} className="size-price-row">
                      <span className="size-price-label">{sz}</span>
                      <div className="size-price-input">
                        <span>$</span>
                        <input
                          type="number" step="0.01" min="0" inputMode="decimal" className="admin-input"
                          placeholder={form.price ? String(form.price) : 'Normal price'}
                          value={(form.sizePrices || {})[sz] ?? ''}
                          onChange={(e) => setSizePrice(sz, e.target.value)}
                          aria-label={`Price for ${sz}`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={requestClose} className="admin-btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={saving || uploading} className="admin-btn-primary flex-1">
              {saving ? 'Saving…' : 'Save Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
