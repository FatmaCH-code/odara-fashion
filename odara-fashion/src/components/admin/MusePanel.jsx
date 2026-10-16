import { useState } from 'react'
import { Navigate, useNavigate, useParams, useLocation } from 'react-router-dom'
import { Plus, Pencil, Trash2, ChevronUp, ChevronDown } from 'lucide-react'
import { useAdminMuse } from '../../hooks/useAdminMuse'
import { useAdminProducts } from '../../hooks/useAdminProducts'
import MuseForm from './MuseForm'

const TAG_LABELS = { new: 'New Arrival', best: 'Best Seller' }

export default function MusePanel() {
  const { items, loading, error, save, remove, toggleActive, move } = useAdminMuse()
  const { products } = useAdminProducts()
  const [deletingId, setDeletingId] = useState(null)
  const navigate = useNavigate()
  const { id } = useParams()
  const { pathname } = useLocation()

  // Like Products: the open form lives in the URL, so refreshing keeps you where you were.
  const isAdding = pathname.endsWith('/new')
  const editing = id ? items.find(i => i.id === parseInt(id)) : null
  const modalOpen = isAdding || (!!id && !loading && !!editing)

  const closeModal = () => navigate('/admin/muse')

  if (loading) return <p className="text-2C2C2C/50">Loading…</p>
  if (id && !editing) return <Navigate to="/admin/muse" replace />

  const handleSave = async (form) => {
    await save(form, editing?.id)
    closeModal()
  }

  return (
    <>
      <div className="flex items-center justify-between mb-2 flex-wrap gap-4">
        <h1 className="text-2xl font-playfair">The Odara Muse ({items.length})</h1>
        <button className="admin-btn-primary flex items-center gap-2" onClick={() => navigate('/admin/muse/new')}>
          <Plus className="w-4 h-4" /> Add Look
        </button>
      </div>
      <p className="text-2C2C2C/60 text-sm mb-6 max-w-2xl">
        The showcase on your home page (first 5 that are switched on) and on the Muse page. Each look is a
        product plus the photo you want to show for it. Until you add one, the section automatically shows
        your newest products.
      </p>

      {error && <div className="admin-notice mb-6">{error}</div>}

      <div className="admin-table-wrap">
        {items.length === 0 ? (
          <p className="text-2C2C2C/45 text-center py-16">No looks yet — click “Add Look” to create the first one.</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th></th>
                <th>Product</th>
                <th>Label</th>
                <th>Shown</th>
                <th>Order</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={item.id}>
                  <td><img src={item.image} alt="" className="admin-muse-thumb" /></td>
                  <td>
                    <div className="font-medium">{item.product?.name}</div>
                    <div className="text-xs text-2C2C2C/50">${item.product?.price}</div>
                  </td>
                  <td>
                    {TAG_LABELS[item.tag]
                      ? <span className="admin-badge admin-badge-shipped">{TAG_LABELS[item.tag]}</span>
                      : <span className="text-2C2C2C/35 text-xs">—</span>}
                  </td>
                  <td>
                    <button
                      className={`admin-toggle ${item.isActive ? 'is-on' : ''}`}
                      onClick={() => toggleActive(item)}
                      aria-label={item.isActive ? 'Hide from site' : 'Show on site'}
                    >
                      <span className="admin-toggle-knob" />
                    </button>
                  </td>
                  <td>
                    <div className="flex gap-1">
                      <button className="admin-icon-btn" disabled={index === 0} onClick={() => move(index, -1)} aria-label="Move up"><ChevronUp className="w-4 h-4" /></button>
                      <button className="admin-icon-btn" disabled={index === items.length - 1} onClick={() => move(index, 1)} aria-label="Move down"><ChevronDown className="w-4 h-4" /></button>
                    </div>
                  </td>
                  <td>
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => navigate(`/admin/muse/${item.id}/edit`)} className="admin-icon-btn"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => setDeletingId(item.id)} className="admin-icon-btn admin-icon-btn-danger"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modalOpen && (
        <MuseForm
          item={isAdding ? null : editing}
          products={products}
          onSave={handleSave}
          onCancel={closeModal}
        />
      )}

      {deletingId !== null && (
        <div className="admin-modal-backdrop" onClick={() => setDeletingId(null)}>
          <div className="admin-modal admin-modal-sm" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-playfair mb-3">Remove this look?</h2>
            <p className="text-2C2C2C/60 text-sm mb-6">The product itself stays in your catalog.</p>
            <div className="flex gap-3">
              <button className="admin-btn-secondary flex-1" onClick={() => setDeletingId(null)}>Cancel</button>
              <button className="admin-btn-danger flex-1" onClick={async () => { const d = deletingId; setDeletingId(null); await remove(d) }}>Remove</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
