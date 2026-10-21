import { useMemo, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const money = (n) => '$' + (Number(n) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const RANGES = [[7, '7 days'], [30, '30 days'], [90, '90 days'], [0, 'All time']]
const dayKey = (d) => new Date(d).toLocaleDateString('en-CA')   // YYYY-MM-DD in local time

// Money coming in. "Revenue" = paid orders that are not cancelled (product costs are not tracked,
// so this is sales, not profit).
export default function SalesOverview({ orders }) {
  const [range, setRange] = useState(30)

  const data = useMemo(() => {
    const now = Date.now()
    const since = range ? now - range * 86400000 : 0
    const inRange = orders.filter(o => new Date(o.created_at).getTime() >= since)
    const paid = inRange.filter(o => o.payment_status === 'paid' && o.status !== 'cancelled')
    const waiting = inRange.filter(o => o.payment_status !== 'paid' && o.status !== 'cancelled')
    const sum = (list, f) => list.reduce((t, o) => t + (Number(f(o)) || 0), 0)

    const revenue = sum(paid, o => o.total_amount)
    const shipping = sum(paid, o => o.shipping_amount)
    const discounts = sum(paid, o => o.discount_amount)

    // revenue per day (only days in range, filled with 0 so the chart has no gaps)
    const days = range || Math.max(1, Math.ceil((now - Math.min(now, ...paid.map(o => new Date(o.created_at).getTime()))) / 86400000) + 1)
    const shown = Math.min(days, 90)
    const byDay = {}
    paid.forEach(o => { const k = dayKey(o.created_at); byDay[k] = (byDay[k] || 0) + Number(o.total_amount || 0) })
    const chart = []
    for (let i = shown - 1; i >= 0; i--) {
      const d = new Date(now - i * 86400000)
      const k = dayKey(d)
      chart.push({ day: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }), revenue: Math.round((byDay[k] || 0) * 100) / 100 })
    }

    // best sellers and categories (from the paid orders' items)
    const prod = {}, cat = {}
    paid.forEach(o => (Array.isArray(o.items) ? o.items : []).forEach(it => {
      const qty = Number(it.quantity) || 1, line = (Number(it.price) || 0) * qty
      const name = it.name || 'Item'
      prod[name] = prod[name] || { qty: 0, total: 0 }
      prod[name].qty += qty; prod[name].total += line
      const c = it.category || 'Other'
      cat[c] = (cat[c] || 0) + line
    }))
    const top = Object.entries(prod).sort((a, b) => b[1].total - a[1].total).slice(0, 5)
    const cats = Object.entries(cat).sort((a, b) => b[1] - a[1]).slice(0, 5)

    return {
      revenue, shipping, discounts,
      sales: revenue - shipping,
      count: paid.length,
      avg: paid.length ? revenue / paid.length : 0,
      waitingCount: waiting.length, waitingValue: sum(waiting, o => o.total_amount),
      chart, top, cats,
    }
  }, [orders, range])

  return (
    <div className="mb-10">
      <div className="sales-head">
        <h2 className="text-xl font-playfair">Sales</h2>
        <div className="sales-range">
          {RANGES.map(([v, label]) => <button key={v} type="button" className={range === v ? 'is-on' : ''} onClick={() => setRange(v)}>{label}</button>)}
        </div>
      </div>

      <div className="sales-hero">
        <div><small>Money in ({RANGES.find(r => r[0] === range)[1]})</small><strong>{money(data.revenue)}</strong></div>
        <div className="sales-hero-sub"><small>Paid orders</small><strong>{data.count}</strong></div>
        <div className="sales-hero-sub"><small>Average order</small><strong>{money(data.avg)}</strong></div>
      </div>

      <div className="admin-stats-grid">
        <div className="admin-stat-card"><p className="admin-stat-label">Product sales</p><p className="admin-stat-value">{money(data.sales)}</p></div>
        <div className="admin-stat-card"><p className="admin-stat-label">Shipping collected</p><p className="admin-stat-value">{money(data.shipping)}</p></div>
        <div className="admin-stat-card"><p className="admin-stat-label">Discounts given</p><p className="admin-stat-value">{money(data.discounts)}</p></div>
        <div className="admin-stat-card"><p className="admin-stat-label">Waiting for payment</p><p className="admin-stat-value">{money(data.waitingValue)}</p><p className="text-xs text-2C2C2C/50 mt-1">{data.waitingCount} order{data.waitingCount === 1 ? '' : 's'}</p></div>
      </div>

      <div className="admin-charts-grid">
        <div className="admin-chart-card admin-chart-wide">
          <h3 className="admin-chart-title">Money in per day</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.chart}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0E6D6" />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => '$' + v} width={56} />
              <Tooltip formatter={(v) => money(v)} />
              <Bar dataKey="revenue" name="Money in" fill="#C9A876" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="admin-chart-card">
          <h3 className="admin-chart-title">Best sellers</h3>
          {data.top.length === 0 ? <p className="text-sm text-2C2C2C/50">No paid orders in this period yet.</p> : (
            <ul className="sales-list">
              {data.top.map(([name, v]) => <li key={name}><span>{name} <small className="text-2C2C2C/50">× {v.qty}</small></span><span>{money(v.total)}</span></li>)}
            </ul>
          )}
        </div>

        <div className="admin-chart-card">
          <h3 className="admin-chart-title">Money by category</h3>
          {data.cats.length === 0 ? <p className="text-sm text-2C2C2C/50">No paid orders in this period yet.</p> : (
            <ul className="sales-list">
              {data.cats.map(([name, v]) => <li key={name}><span>{name}</span><span>{money(v)}</span></li>)}
            </ul>
          )}
        </div>
      </div>
      <p className="sales-note">“Money in” counts paid orders that are not cancelled. It is sales, not profit — your product costs are not tracked here.</p>
    </div>
  )
}
