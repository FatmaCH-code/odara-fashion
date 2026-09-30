import { useEffect, useRef, useState } from 'react'
import { X, Plus, Trash2, Loader2, UploadCloud } from 'lucide-react'
import { createProduct, updateProduct, uploadProductImage } from '../services/api'
import { useProductsStore } from '../store/productsStore'
import { FASHION_CATEGORY_ORDER, FRAGRANCE_CATEGORY_ORDER } from '../config'
import { inputCls } from './ui'

const blank = { name: '', section: 'fashion', category: '', price: '', originalPrice: '', description: '', images: [], colors: [], isNew: false, stock: 10, active: true }

export default function ProductEditor({ product, onClose }) {
  const [f, setF] = useState(product ? { ...product, originalPrice: product.originalPrice ?? '' } : blank)
  const [busy, setBusy] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef(null)
  const allCats = [...new Set([...FASHION_CATEGORY_ORDER, ...FRAGRANCE_CATEGORY_ORDER])]
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })

  useEffect(() => { document.body.style.overflow = 'hidden'; return () => { document.body.style.overflow = '' } }, [])

  const addFiles = async (fileList) => {
    setUploading(true); setError('')
    try {
      for (const file of Array.from(fileList)) {
        const url = await uploadProductImage(file)
        setF((cur) => ({ ...cur, images: [...cur.images, url] }))
      }
    } catch (e) { setError(e.message) } finally { setUploading(false) }
  }
  const removeImage = (i) => setF({ ...f, images: f.images.filter((_, idx) => idx !== i) })
  const moveImage = (i, dir) => setF((cur) => {
    const arr = [...cur.images]; const j = i + dir; if (j < 0 || j >= arr.length) return cur
    ;[arr[i], arr[j]] = [arr[j], arr[i]]; return { ...cur, images: arr }
  })
  const addColor = () => setF({ ...f, colors: [...f.colors, { name: '', hex: '#C9A876' }] })
  const setColor = (i, key, val) => setF((cur) => ({ ...cur, colors: cur.colors.map((c, idx) => (idx === i ? { ...c, [key]: val } : c)) }))
  const removeColor = (i) => setF({ ...f, colors: f.colors.filter((_, idx) => idx !== i) })

  const submit = async (e) => {
    e.preventDefault(); setError('')
    if (!f.name.trim() || !f.category.trim() || f.price === '') return setError('Name, category and price are required')
    setBusy(true)
    try {
      const payload = { ...f, colors: f.colors.filter((c) => c.name.trim()) }
      const saved = product ? await updateProduct(product.id, payload) : await createProduct(payload)
      useProductsStore.getState().upsert(saved)
      onClose()
    } catch (e) { setError(e.message) } finally { setBusy(false) }
  }

  return (
    <div className="fixed inset-0 z-[60] bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <form onClick={(e) => e.stopPropagation()} onSubmit={submit}
            className="bg-white w-full sm:max-w-2xl sm:rounded-2xl rounded-t-3xl max-h-[92vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-200 px-5 py-4 flex items-center justify-between z-10">
          <h2 className="font-semibold text-lg">{product ? 'Edit product' : 'Add product'}</h2>
          <button type="button" onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-full"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-5 space-y-5">
          {error && <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl p-3">{error}</p>}

          <div>
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Photos</label>
            <div className="flex flex-wrap gap-3 mt-2">
              {f.images.map((src, i) => (
                <div key={i} className="relative w-20 h-24 rounded-lg overflow-hidden group border border-slate-200">
                  <img src={src} alt="" className="w-full h-full object-cover" />
                  {i === 0 && <span className="absolute top-1 left-1 bg-C9A876 text-white text-[9px] px-1.5 py-0.5 rounded-full">Main</span>}
                  <button type="button" onClick={() => removeImage(i)} className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition"><X className="w-3 h-3" /></button>
                  <div className="absolute bottom-1 inset-x-1 flex justify-between opacity-0 group-hover:opacity-100 transition">
                    <button type="button" disabled={i === 0} onClick={() => moveImage(i, -1)} className="bg-black/60 text-white text-[10px] px-1.5 rounded disabled:opacity-30">‹</button>
                    <button type="button" disabled={i === f.images.length - 1} onClick={() => moveImage(i, 1)} className="bg-black/60 text-white text-[10px] px-1.5 rounded disabled:opacity-30">›</button>
                  </div>
                </div>
              ))}
              <button type="button" onClick={() => fileRef.current.click()} disabled={uploading}
                      className="w-20 h-24 rounded-lg border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 hover:border-C9A876 hover:text-C9A876 transition">
                {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><UploadCloud className="w-5 h-5 mb-1" /><span className="text-[10px]">Add</span></>}
              </button>
              <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => e.target.files.length && addFiles(e.target.files)} />
            </div>
          </div>

          <div><label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Name</label>
            <input required value={f.name} onChange={set('name')} className={inputCls + ' mt-1'} placeholder="e.g. Royal Pearl Thobe" /></div>

          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Section</label>
              <select value={f.section} onChange={set('section')} className={inputCls + ' mt-1'}>
                <option value="fashion">Fashion</option><option value="fragrance">Fragrance</option></select></div>
            <div><label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Category</label>
              <input required value={f.category} onChange={set('category')} list="cats" className={inputCls + ' mt-1'} placeholder="e.g. Kaftans" />
              <datalist id="cats">{allCats.map((c) => <option key={c} value={c} />)}</datalist></div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Price ($)</label>
              <input required type="number" step="0.01" min="0" value={f.price} onChange={set('price')} className={inputCls + ' mt-1'} /></div>
            <div><label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Original price <span className="normal-case font-normal">(optional, for sale)</span></label>
              <input type="number" step="0.01" min="0" value={f.originalPrice} onChange={set('originalPrice')} className={inputCls + ' mt-1'} placeholder="leave blank if not on sale" /></div>
          </div>

          <div><label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Description</label>
            <textarea value={f.description} onChange={set('description')} rows={3} className={inputCls + ' mt-1'} /></div>

          <div>
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Colors</label>
              <button type="button" onClick={addColor} className="text-xs text-C9A876 flex items-center gap-1 hover:underline"><Plus className="w-3.5 h-3.5" />Add color</button>
            </div>
            <div className="space-y-2 mt-2">
              {f.colors.map((c, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input type="color" value={c.hex} onChange={(e) => setColor(i, 'hex', e.target.value)} className="w-9 h-9 rounded-lg border border-slate-300 shrink-0" />
                  <input value={c.name} onChange={(e) => setColor(i, 'name', e.target.value)} placeholder="Color name" className={inputCls} />
                  <button type="button" onClick={() => removeColor(i)} className="p-2 text-slate-400 hover:text-red-600 shrink-0"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Stock</label>
              <input required type="number" min="0" value={f.stock} onChange={set('stock')} className={inputCls + ' mt-1'} /></div>
            <div className="flex flex-col justify-end gap-2 pb-1.5">
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.isNew} onChange={set('isNew')} className="accent-[#C9A876] w-4 h-4" />Mark as "New"</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.active} onChange={set('active')} className="accent-[#C9A876] w-4 h-4" />Visible in shop</label>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t border-slate-200 px-5 py-4 flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-medium">Cancel</button>
          <button disabled={busy || uploading} className="flex-1 py-2.5 rounded-xl bg-C9A876 text-white font-semibold disabled:opacity-60">{busy ? 'Saving…' : 'Save product'}</button>
        </div>
      </form>
    </div>
  )
}
