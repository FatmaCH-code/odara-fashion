import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, Check, X, ChevronDown, ChevronRight } from 'lucide-react'
import { adminListProducts } from '../../services/products'
import {
  adminGetExtraCategories, adminSaveExtraCategories,
  adminRenameCategory, adminMoveProductCategory,
} from '../../services/categories'
import { PERFUME_CATEGORY, OIL_CATEGORY } from '../../utils/categories'

const BUILT_IN = [PERFUME_CATEGORY, OIL_CATEGORY]
const same = (a, b) => (a || '').trim().toLowerCase() === (b || '').trim().toLowerCase()

export default function CategoriesPanel() {
  const [products, setProducts] = useState([])
  const [extras, setExtras] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [newName, setNewName] = useState('')
  const [renaming, setRenaming] = useState(null)   // category being renamed
  const [renameValue, setRenameValue] = useState('')
  const [open, setOpen] = useState(null)           // category whose products are expanded
  const [busy, setBusy] = useState(false)

  const load = async () => {
    try {
      const [p, e] = await Promise.all([adminListProducts(), adminGetExtraCategories().catch(() => [])])
      setProducts(p)
      setExtras(e)
      setError('')
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  // One row per category: built-ins, every category used by a product, and the saved extras.
  const names = []
  ;[...BUILT_IN, ...products.map(p => p.category).filter(Boolean), ...extras].forEach(n => {
    if (!names.some(x => same(x, n))) names.push(n)
  })
  const rows = names.map(name => ({
    name,
    builtIn: BUILT_IN.some(b => same(b, name)),
    items: products.filter(p => same(p.category, name)),
  })).sort((a, b) => (b.builtIn - a.builtIn) || a.name.localeCompare(b.name))

  const run = async (fn, okMsg) => {
    setBusy(true); setError(''); setMessage('')
    try { await fn(); await load(); setMessage(okMsg) } catch (err) { setError(err.message) }
    setBusy(false)
  }

  const addCategory = (e) => {
    e.preventDefault()
    const name = newName.trim()
    if (!name) return
    if (names.some(n => same(n, name))) { setError(`"${name}" already exists.`); return }
    run(async () => { await adminSaveExtraCategories([...extras, name]); setNewName('') }, `Category "${name}" added.`)
  }

  const submitRename = (oldName) => {
    const value = renameValue.trim()
    if (!value || value === oldName) { setRenaming(null); return }
    run(async () => {
      await adminRenameCategory(oldName, value)
      await adminSaveExtraCategories([...extras.filter(x => !same(x, oldName)), value])
      setRenaming(null)
    }, `"${oldName}" is now "${value}" on every product.`)
  }

  const removeCategory = (name) => {
    if (!confirm(`Delete the empty category "${name}"?`)) return
    run(() => adminSaveExtraCategories(extras.filter(x => !same(x, name))), `Category "${name}" deleted.`)
  }

  const moveProduct = (productId, category) =>
    run(() => adminMoveProductCategory(productId, category), 'Product moved.')

  if (loading) return <p className="text-2C2C2C/50">Loading…</p>

  return (
    <>
      <div className="flex items-center justify-between mb-2 flex-wrap gap-4">
        <h1 className="text-2xl font-playfair">Categories ({rows.length})</h1>
      </div>
      <p className="text-sm text-2C2C2C/60 mb-6 max-w-2xl">
        Rename a category and every product in it follows. Open a category to move single products to another one.
        “{PERFUME_CATEGORY}” and “{OIL_CATEGORY}” are built in (they power the Perfumes and Oils pages), so they can't be renamed or deleted.
      </p>

      {error && <div className="admin-notice mb-4">{error}</div>}
      {message && <div className="admin-notice mb-4" style={{ background: '#ecf6ee', color: '#2f6b3d' }}>{message}</div>}

      <form onSubmit={addCategory} className="flex gap-2 mb-6 max-w-md">
        <input className="admin-input flex-1" placeholder="New category (e.g. Scarves)" value={newName} onChange={(e) => setNewName(e.target.value)} />
        <button type="submit" disabled={busy} className="admin-btn-primary flex items-center gap-2"><Plus className="w-4 h-4" /> Add</button>
      </form>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead><tr><th></th><th>Category</th><th>Products</th><th></th></tr></thead>
          <tbody>
            {rows.map(r => (
              <>
                <tr key={r.name}>
                  <td style={{ width: 36 }}>
                    <button className="admin-icon-btn" onClick={() => setOpen(open === r.name ? null : r.name)} aria-label="Show products">
                      {open === r.name ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>
                  </td>
                  <td className="font-medium">
                    {renaming === r.name ? (
                      <div className="flex gap-2">
                        <input className="admin-input" autoFocus value={renameValue} onChange={(e) => setRenameValue(e.target.value)}
                               onKeyDown={(e) => { if (e.key === 'Enter') submitRename(r.name); if (e.key === 'Escape') setRenaming(null) }} />
                        <button className="admin-icon-btn" onClick={() => submitRename(r.name)} disabled={busy}><Check className="w-4 h-4" /></button>
                        <button className="admin-icon-btn" onClick={() => setRenaming(null)}><X className="w-4 h-4" /></button>
                      </div>
                    ) : (<>{r.name}{r.builtIn && <span className="admin-badge admin-badge-shipped ml-2">Built in</span>}</>)}
                  </td>
                  <td>{r.items.length}</td>
                  <td>
                    {!r.builtIn && renaming !== r.name && (
                      <div className="flex gap-2 justify-end">
                        <button className="admin-icon-btn" title="Rename" onClick={() => { setRenaming(r.name); setRenameValue(r.name) }}><Pencil className="w-4 h-4" /></button>
                        {r.items.length === 0 && (
                          <button className="admin-icon-btn admin-icon-btn-danger" title="Delete" onClick={() => removeCategory(r.name)}><Trash2 className="w-4 h-4" /></button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
                {open === r.name && (
                  <tr key={r.name + '-items'}>
                    <td></td>
                    <td colSpan={3}>
                      {r.items.length === 0 ? (
                        <p className="text-sm text-2C2C2C/50 py-2">No products in this category yet.</p>
                      ) : (
                        <div className="space-y-2 py-2">
                          {r.items.map(p => (
                            <div key={p.id} className="flex items-center gap-3">
                              {p.image ? <img src={p.image} alt="" className="admin-table-thumb" /> : <div className="admin-table-thumb-empty" />}
                              <span className="flex-1 text-sm">{p.name}</span>
                              <select className="admin-input" style={{ maxWidth: 220 }} value={r.name} disabled={busy}
                                      onChange={(e) => moveProduct(p.id, e.target.value)}>
                                {names.map(n => <option key={n} value={n}>{n}</option>)}
                              </select>
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
