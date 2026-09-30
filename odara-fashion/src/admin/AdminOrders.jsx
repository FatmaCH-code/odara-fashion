import { useEffect, useMemo, useState } from 'react'
import { ChevronDown, ChevronUp, Download } from 'lucide-react'
import { listOrders, updateOrderStatus } from '../services/api'
import { money, downloadCSV } from '../lib/utils'
import { Card, StatusBadge, StatusSelect, Empty, inputCls } from './ui'

export default function AdminOrders() {
  const [orders, setOrders] = useState(null)
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('all')
  const [expanded, setExpanded] = useState(null)

  useEffect(() => { listOrders().then(setOrders).catch(() => setOrders([])) }, [])

  const list = useMemo(() => (orders || []).filter((o) =>
    (status === 'all' || o.status === status) &&
    (o.customerName.toLowerCase().includes(q.toLowerCase()) || o.email.toLowerCase().includes(q.toLowerCase()) || String(o.id).includes(q))
  ), [orders, q, status])

  const setStatusFor = async (o, next) => {
    setOrders((cur) => cur.map((x) => (x.id === o.id ? { ...x, status: next } : x)))
    try { await updateOrderStatus(o.id, next) } catch (e) { alert(e.message) }
  }

  const exportCSV = () => downloadCSV('odara-orders.csv', [
    ['Order', 'Date', 'Customer', 'Email', 'City', 'Items', 'Subtotal', 'Shipping', 'Total', 'Status'],
    ...list.map((o) => [o.id, new Date(o.createdAt).toLocaleString(), o.customerName, o.email, o.city, o.items.reduce((n, i) => n + i.quantity, 0), o.subtotal, o.shipping, o.total, o.status]),
  ])

  if (!orders) return <div className="space-y-2">{Array.from({ length: 5 }, (_, i) => <div key={i} className="skeleton h-16 rounded-xl" />)}</div>

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div><h2 className="text-xl font-semibold">Orders</h2><p className="text-sm text-slate-500">{orders.length} total</p></div>
        <button onClick={exportCSV} className="inline-flex items-center gap-2 border border-slate-300 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-50"><Download className="w-4 h-4" />Export CSV</button>
      </div>

      <Card>
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by order #, name or email…" className={inputCls + ' flex-1'} />
          <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputCls + ' sm:w-52'}>
            <option value="all">All statuses</option>{['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'].map((s) => <option key={s} value={s} className="capitalize">{s}</option>)}
          </select>
        </div>

        {!list.length ? <Empty>No orders match.</Empty> : (
          <div className="divide-y divide-slate-100">
            {list.map((o) => {
              const open = expanded === o.id
              return (
                <div key={o.id}>
                  <button onClick={() => setExpanded(open ? null : o.id)} className="w-full flex flex-wrap items-center gap-3 py-3.5 text-left hover:bg-slate-50 -mx-5 px-5">
                    <span className="font-medium text-sm w-20 shrink-0">#{o.id}</span>
                    <div className="flex-1 min-w-[140px]"><p className="text-sm truncate">{o.customerName}</p><p className="text-xs text-slate-500 truncate">{o.email}</p></div>
                    <span className="text-xs text-slate-500 hidden sm:block w-28">{new Date(o.createdAt).toLocaleDateString()}</span>
                    <span className="text-xs text-slate-500 w-16 hidden md:block">{o.items.reduce((n, i) => n + i.quantity, 0)} items</span>
                    <span className="text-sm font-semibold w-20 text-right">{money(o.total)}</span>
                    <span onClick={(e) => e.stopPropagation()}><StatusSelect value={o.status} onChange={(v) => setStatusFor(o, v)} /></span>
                    {open ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </button>
                  {open && (
                    <div className="pb-4 pl-1 pr-1 -mt-1">
                      <div className="bg-slate-50 rounded-xl p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs uppercase tracking-wide text-slate-500 mb-1">Ship to</p>
                          <p className="text-sm">{o.customerName}</p><p className="text-sm text-slate-600">{o.address}, {o.city} {o.postalCode}</p>
                          <p className="text-sm text-slate-600">{o.email}{o.phone ? ` · ${o.phone}` : ''}</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-wide text-slate-500 mb-1">Items</p>
                          <ul className="space-y-1.5">{o.items.map((i, idx) => (
                            <li key={idx} className="flex items-center gap-2 text-sm"><img src={i.image} alt="" className="w-7 h-9 rounded object-cover bg-slate-200" />
                              <span className="flex-1 truncate">{i.name}{i.color ? ` · ${i.color}` : ''} × {i.quantity}</span><span>{money(i.price * i.quantity)}</span></li>))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )
}
