import { useState } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { useAdminProducts } from '../../hooks/useAdminProducts'
import ProductForm from './ProductForm'

export default function ProductsPanel() {
  const { products, loading, error, saveProduct, deleteProduct } = useAdminProducts()
  const [search, setSearch] = useState('')
  const [deletingId, setDeletingId] = useState(null)
  const navigate = useNavigate()
  const { id } = useParams()
  const { pathname } = useLocation()

  // Which product (if any) is being edited/added lives in the URL itself
  // (/admin/products/new or /admin/products/:id/edit) rather than in local
  // component state — so navigating away and back (or refreshing) re-opens
  // the exact same form instead of silently losing it.
  const isAdding = pathname.endsWith('/new')
  const editingProduct = isAdding ? {} : (id ? products.find(p => p.id === parseInt(id)) : null)
  const modalOpen = isAdding || (!!id && !loading)

  const categories = [...new Set(products.map(p => p.category))].sort()

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  )

  const closeModal = () => navigate('/admin/products')

  const handleSave = async (form) => {
    await saveProduct(form, editingProduct?.id)
    closeModal()
  }

  const handleDelete = async (productId) => {
    setDeletingId(null)
    await deleteProduct(productId)
  }

  if (loading) return <p className="text-2C2C2C/50">Loading…</p>

  // Deep-linked straight to an edit URL for a product that doesn't exist
  // (bad id, or it was deleted elsewhere) — bounce back to the list instead
  // of showing a broken empty form.
  if (id && !editingProduct) {
    closeModal()
    return null
  }

  return (
    <>
      {error && <div className="admin-notice mb-6">{error}</div>}

      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <h1 className="text-2xl font-playfair">Products ({products.length})</h1>
        <div className="flex gap-3">
          <input
            className="admin-input admin-search"
            placeholder="Search products…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button className="admin-btn-primary flex items-center gap-2" onClick={() => navigate('/admin/products/new')}>
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
                    <button onClick={() => navigate(`/admin/products/${p.id}/edit`)} className="admin-icon-btn"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => setDeletingId(p.id)} className="admin-icon-btn admin-icon-btn-danger"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <p className="text-2C2C2C/45 text-center py-12">No products match your search.</p>}
      </div>

      {modalOpen && (
        <ProductForm
          product={editingProduct?.id ? editingProduct : null}
          categories={categories}
          onSave={handleSave}
          onCancel={closeModal}
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
    </>
  )
}
