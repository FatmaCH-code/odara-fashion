import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { LayoutDashboard, Package, ShoppingBag, Mail, LogOut, Plus, Pencil, Trash2, ExternalLink } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { adminListProducts, adminCreateProduct, adminUpdateProduct, adminDeleteProduct } from '../services/products'
import StatsOverview from '../components/admin/StatsOverview'
import ProductForm from '../components/admin/ProductForm'
import OrdersPanel from '../components/admin/OrdersPanel'
import SubscribersPanel from '../components/admin/SubscribersPanel'
import odaraEmblem from '../assets/odara-emblem.png'

export default function AdminDashboard() {
  const [tab, setTab] = useState('overview')
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [editingProduct, setEditingProduct] = useState(null) // null = closed, {} = new, {...} = editing
  const [deletingId, setDeletingId] = useState(null)

  const load = async () => {
    setLoading(true)
    try {
      const data = await adminListProducts()
      setProducts(data)
      setError('')
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const categories = [...new Set(products.map(p => p.category))].sort()

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  )

  const handleSave = async (form) => {
    if (editingProduct?.id) {
      await adminUpdateProduct(editingProduct.id, form)
    } else {
      await adminCreateProduct(form)
    }
    setEditingProduct(null)
    await load()
  }

  const handleDelete = async (id) => {
    setDeletingId(null)
    await adminDeleteProduct(id)
    await load()
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/admin/login'
  }

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-brand">
          <img src={odaraEmblem} alt="Odara" className="w-9 h-9 rounded-full" />
          <span className="font-playfair text-lg">Odara Admin</span>
        </div>

        <nav className="admin-nav">
          <button className={`admin-nav-item ${tab === 'overview' ? 'active' : ''}`} onClick={() => setTab('overview')}>
            <LayoutDashboard className="w-4 h-4" /> Overview
          </button>
          <button className={`admin-nav-item ${tab === 'products' ? 'active' : ''}`} onClick={() => setTab('products')}>
            <Package className="w-4 h-4" /> Products
          </button>
          <button className={`admin-nav-item ${tab === 'orders' ? 'active' : ''}`} onClick={() => setTab('orders')}>
            <ShoppingBag className="w-4 h-4" /> Orders
          </button>
          <button className={`admin-nav-item ${tab === 'subscribers' ? 'active' : ''}`} onClick={() => setTab('subscribers')}>
            <Mail className="w-4 h-4" /> Subscribers
          </button>
        </nav>

        <div className="mt-auto space-y-2">
          <Link to="/" className="admin-nav-item" target="_blank">
            <ExternalLink className="w-4 h-4" /> View Store
          </Link>
          <button className="admin-nav-item" onClick={handleLogout}>
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </aside>

      <main className="admin-main">
        {error && (
          <div className="admin-notice mb-6">{error}</div>
        )}

        {loading ? (
          <p className="text-2C2C2C/50">Loading…</p>
        ) : tab === 'overview' ? (
          <>
            <h1 className="text-2xl font-playfair mb-6">Overview</h1>
            <StatsOverview products={products} />
          </>
        ) : tab === 'orders' ? (
          <OrdersPanel />
        ) : tab === 'subscribers' ? (
          <SubscribersPanel />
        ) : (
          <>
            <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
              <h1 className="text-2xl font-playfair">Products ({products.length})</h1>
              <div className="flex gap-3">
                <input
                  className="admin-input admin-search"
                  placeholder="Search products…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <button className="admin-btn-primary flex items-center gap-2" onClick={() => setEditingProduct({})}>
                  <Plus className="w-4 h-4" /> Add Product
                </button>
              </div>
            </div>

            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th></th>
                    <th>Name</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Flags</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(p => (
                    <tr key={p.id}>
                      <td>{p.image ? <img src={p.image} alt="" className="admin-table-thumb" /> : <div className="admin-table-thumb-empty" />}</td>
                      <td className="font-medium">{p.name}</td>
                      <td className="text-2C2C2C/60">{p.category}</td>
                      <td>
                        ${p.price}
                        {p.originalPrice && <span className="text-2C2C2C/45 line-through ml-2 text-xs">${p.originalPrice}</span>}
                      </td>
                      <td>{p.stock}</td>
                      <td className="space-x-1">
                        {p.isNew && <span className="admin-badge admin-badge-new">New</span>}
                        {p.isSale && <span className="admin-badge admin-badge-sale">Sale</span>}
                      </td>
                      <td>
                        <div className="flex gap-2 justify-end">
                          <button onClick={() => setEditingProduct(p)} className="admin-icon-btn"><Pencil className="w-4 h-4" /></button>
                          <button onClick={() => setDeletingId(p.id)} className="admin-icon-btn admin-icon-btn-danger"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filtered.length === 0 && <p className="text-2C2C2C/45 text-center py-12">No products match your search.</p>}
            </div>
          </>
        )}
      </main>

      {editingProduct !== null && (
        <ProductForm
          product={editingProduct.id ? editingProduct : null}
          categories={categories}
          onSave={handleSave}
          onCancel={() => setEditingProduct(null)}
        />
      )}

      {deletingId !== null && (
        <div className="admin-modal-backdrop" onClick={() => setDeletingId(null)}>
          <div className="admin-modal admin-modal-sm" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-playfair mb-3">Delete this product?</h2>
            <p className="text-2C2C2C/60 text-sm mb-6">This can't be undone.</p>
            <div className="flex gap-3">
              <button className="admin-btn-secondary flex-1" onClick={() => setDeletingId(null)}>Cancel</button>
              <button className="admin-btn-danger flex-1" onClick={() => handleDelete(deletingId)}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
