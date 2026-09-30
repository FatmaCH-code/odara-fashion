import { useMemo, useState } from 'react'
import { Search, Plus, Pencil, Trash2, ChevronUp, ChevronDown } from 'lucide-react'
import { useProductsStore } from '../store/productsStore'
import { deleteProduct } from '../services/api'
import { money, isSale } from '../lib/utils'
import { Card, Empty, inputCls } from './ui'
import ProductEditor from './ProductEditor'

export default function AdminProducts() {
  const products = useProductsStore((s) => s.products)
  const loading = useProductsStore((s) => s.loading && !s.loaded)
  const [q, setQ] = useState('')
  const [section, setSection] = useState('all')
  const [sort, setSort] = useState({ key: 'id', dir: -1 })
  const [editing, setEditing] = useState(null)   // product being edited, or {} for "new"
  const [busyId, setBusyId] = useState(null)

  const list = useMemo(() => {
    let l = products.filter((p) => (section === 'all' || p.section === section) && (p.name.toLowerCase().includes(q.toLowerCase()) || p.category.toLowerCase().includes(q.toLowerCase())))
    const { key, dir } = sort
    l = [...l].sort((a, b) => (typeof a[key] === 'string' ? a[key].localeCompare(b[key]) : a[key] - b[key]) * dir)
    return l
  }, [products, q, section, sort])

  const toggleSort = (key) => setSort((s) => ({ key, dir: s.key === key ? -s.dir : 1 }))
  const Th = ({ k, children, className = '' }) => (
    <th onClick={() => toggleSort(k)} className={`text-left font-medium text-slate-500 text-xs uppercase tracking-wide px-3 py-3 cursor-pointer select-none whitespace-nowrap ${className}`}>
      <span className="inline-flex items-center gap-1">{children}{sort.key === k && (sort.dir === 1 ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}</span>
    </th>
  )

  const remove = async (p) => {
    if (!confirm(`Delete "${p.name}"? This can't be undone.`)) return
    setBusyId(p.id)
    try { await deleteProduct(p.id); useProductsStore.getState().remove(p.id) }
    catch (e) { alert(e.message) } finally { setBusyId(null) }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Products</h2>
          <p className="text-sm text-slate-500">{products.length} total · {products.filter((p) => p.active).length} visible in shop</p>
        </div>
        <button onClick={() => setEditing({})} className="inline-flex items-center gap-2 bg-C9A876 text-white font-semibold px-4 py-2.5 rounded-xl hover:bg-[#b8945f] transition"><Plus className="w-4 h-4" />Add product</button>
      </div>

      <Card>
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1"><Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name or category…" className={inputCls + ' pl-9'} /></div>
          <select value={section} onChange={(e) => setSection(e.target.value)} className={inputCls + ' sm:w-52'}>
            <option value="all">All sections</option><option value="fashion">Fashion</option><option value="fragrance">Fragrance</option>
          </select>
        </div>

        {loading ? (
          <div className="space-y-2">{Array.from({ length: 6 }, (_, i) => <div key={i} className="skeleton h-14 rounded-xl" />)}</div>
        ) : !list.length ? <Empty>No products match your search.</Empty> : (
          <div className="overflow-x-auto -mx-5">
            <table className="w-full min-w-[720px]">
              <thead><tr className="border-b border-slate-200">
                <th className="w-14"></th>
                <Th k="name">Product</Th><Th k="category">Category</Th><Th k="price">Price</Th><Th k="stock">Stock</Th><Th k="active">Status</Th><th className="w-24"></th>
              </tr></thead>
              <tbody>
                {list.map((p) => (
                  <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50 group">
                    <td className="pl-3"><img src={p.image} alt="" className="w-9 h-12 rounded-lg object-cover bg-slate-100" /></td>
                    <td className="px-3 py-2.5"><p className="font-medium text-sm text-slate-800 max-w-[220px] truncate">{p.name}</p>{p.isNew && <span className="text-[10px] text-emerald-700">NEW</span>}</td>
                    <td className="px-3 text-sm text-slate-600 whitespace-nowrap">{p.category}</td>
                    <td className="px-3 text-sm whitespace-nowrap">{money(p.price)}{isSale(p) && <span className="ml-1.5 line-through text-slate-400 text-xs">{money(p.originalPrice)}</span>}</td>
                    <td className="px-3 text-sm"><span className={p.stock === 0 ? 'text-red-600 font-medium' : p.stock <= 3 ? 'text-amber-700 font-medium' : 'text-slate-600'}>{p.stock}</span></td>
                    <td className="px-3"><span className={`text-xs px-2 py-1 rounded-full font-medium ${p.active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>{p.active ? 'Visible' : 'Hidden'}</span></td>
                    <td className="px-3 text-right whitespace-nowrap">
                      <button onClick={() => setEditing(p)} className="p-2 hover:bg-slate-200 rounded-lg text-slate-500 hover:text-slate-800"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => remove(p)} disabled={busyId === p.id} className="p-2 hover:bg-red-100 rounded-lg text-slate-500 hover:text-red-600 disabled:opacity-40"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {editing && <ProductEditor product={editing.id ? editing : null} onClose={() => setEditing(null)} />}
    </div>
  )
}
