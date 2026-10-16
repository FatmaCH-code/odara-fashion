import { useState } from 'react'
import { adminUploadProductImage } from '../../services/products'

export default function MuseForm({ item, products, onSave, onCancel }) {
  const [productId, setProductId] = useState(item?.productId ? String(item.productId) : '')
  const [image, setImage] = useState(item?.image || '')
  const [tag, setTag] = useState(item?.tag || '')
  const [isActive, setIsActive] = useState(item ? item.isActive : true)
  const [search, setSearch] = useState('')
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const options = [...products]
    .filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name))

  const handleUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError('')
    try {
      setImage(await adminUploadProductImage(file))
    } catch (err) {
      setError('Photo upload failed: ' + err.message)
    }
    setUploading(false)
    e.target.value = ''
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!productId) return setError('Choose which product this look is for.')
    if (!image) return setError('Add a photo for this look.')
    setSaving(true)
    setError('')
    try {
      await onSave({ productId: parseInt(productId), image, tag, isActive })
    } catch (err) {
      setError(err.message)
      setSaving(false)
    }
  }

  return (
    <div className="admin-modal-backdrop" onClick={onCancel}>
      <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-playfair mb-6">{item ? 'Edit Muse Look' : 'Add Muse Look'}</h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="admin-label">Product *</label>
            <input
              className="admin-input mb-2"
              placeholder="Search products…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              className="admin-input"
              size={Math.min(6, Math.max(2, options.length))}
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
            >
              {options.map(p => (
                <option key={p.id} value={p.id}>{p.name} — ${p.price}</option>
              ))}
            </select>
            {options.length === 0 && <p className="text-xs text-2C2C2C/45 mt-1">No products match.</p>}
          </div>

          <div>
            <label className="admin-label">Photo *</label>
            <p className="text-xs text-2C2C2C/45 mb-2">
              Tall photos look best (like a woman wearing the piece). This can be a different picture from the product's catalog photo.
            </p>
            <div className="flex items-start gap-4">
              {image && <img src={image} alt="" className="admin-muse-preview" />}
              <div className="flex-1">
                <input type="file" accept="image/*" onChange={handleUpload} className="admin-input" disabled={uploading} />
                <p className="text-xs text-2C2C2C/45 mt-1 mb-2">{uploading ? 'Uploading…' : 'Uploads straight to Supabase Storage.'}</p>
                <input
                  className="admin-input"
                  placeholder="...or paste an image URL"
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="admin-label">Label</label>
              <select className="admin-input" value={tag} onChange={(e) => setTag(e.target.value)}>
                <option value="">No label</option>
                <option value="new">New Arrival</option>
                <option value="best">Best Seller</option>
              </select>
            </div>
            <label className="flex items-end gap-2 text-sm pb-2">
              <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
              Show on the site
            </label>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onCancel} className="admin-btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={saving || uploading} className="admin-btn-primary flex-1">
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
