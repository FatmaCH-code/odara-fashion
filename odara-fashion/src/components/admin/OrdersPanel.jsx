import { useEffect, useState, Fragment } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { adminListOrders, adminUpdateOrderStatus } from '../../services/orders'

const STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled']

const STATUS_STYLES = {
  pending: 'admin-badge-pending',
  processing: 'admin-badge-processing',
  shipped: 'admin-badge-shipped',
  delivered: 'admin-badge-delivered',
  cancelled: 'admin-badge-cancelled',
}

export default function OrdersPanel() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expandedId, setExpandedId] = useState(null)

  const load = async () => {
    setLoading(true)
    try {
      const data = await adminListOrders()
      setOrders(data)
      setError('')
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }

  useEffect(() => {
    load()
    // New orders / payments appear without a manual reload.
    const t = setInterval(() => adminListOrders().then(setOrders).catch(() => {}), 30000)
    return () => clearInterval(t)
  }, [])

  const handleStatusChange = async (id, status) => {
    setOrders(orders.map(o => o.id === id ? { ...o, status } : o))
    try {
      await adminUpdateOrderStatus(id, status)
    } catch (err) {
      setError(err.message)
      load()
    }
  }

  if (loading) return <p className="text-2C2C2C/50">Loading…</p>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-playfair">Orders ({orders.length})</h1>
        <button onClick={load} className="text-sm underline">Refresh</button>
      </div>
      {error && <div className="admin-notice mb-6">{error}</div>}

      {orders.length === 0 ? (
        <div className="admin-table-wrap">
          <p className="text-2C2C2C/45 text-center py-16">
            No orders yet — they'll show up here the moment a customer checks out.
          </p>
        </div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th></th>
                <th>Order</th>
                <th>Customer</th>
                <th>Total</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(o => (
                <Fragment key={o.id}>
                  <tr className="admin-table-row-clickable" onClick={() => setExpandedId(expandedId === o.id ? null : o.id)}>
                    <td>{expandedId === o.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}</td>
                    <td className="font-medium">{o.order_number}</td>
                    <td>
                      <div>{o.customer_name}</div>
                      <div className="text-2C2C2C/50 text-xs">{o.customer_email}</div>
                    </td>
                    <td>${Number(o.total_amount).toFixed(2)}</td>
                    <td>
                      <span className={`admin-badge ${o.payment_status === 'paid' ? 'admin-badge-delivered' : o.payment_status === 'failed' ? 'admin-badge-cancelled' : 'admin-badge-pending'}`}>
                        {o.payment_status || 'unpaid'}
                      </span>
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <select
                        value={o.status}
                        onChange={(e) => handleStatusChange(o.id, e.target.value)}
                        className={`admin-status-select ${STATUS_STYLES[o.status] || ''}`}
                      >
                        {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td className="text-2C2C2C/60 text-xs">{new Date(o.created_at).toLocaleDateString()}</td>
                  </tr>
                  {expandedId === o.id && (
                    <tr>
                      <td colSpan={7} className="admin-order-detail">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <p className="admin-label">Contact</p>
                            <p>{o.customer_name}</p>
                            <p className="text-2C2C2C/60">{o.customer_email}</p>
                            {o.customer_phone && <p className="text-2C2C2C/60">{o.customer_phone}</p>}
                            <p className="admin-label mt-4">Shipping Address</p>
                            <p className="text-2C2C2C/60">{o.shipping_address}</p>
                          </div>
                          <div>
                            <p className="admin-label">Items</p>
                            {(o.items || []).map((it, i) => (
                              <div key={i} className="flex justify-between text-sm mb-1">
                                <span>{it.name} × {it.quantity}</span>
                                <span>${(it.price * it.quantity).toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
