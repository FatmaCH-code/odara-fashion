import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, BarChart, Bar, Legend } from 'recharts'
import { DollarSign, ShoppingBag, Package, AlertTriangle, TrendingUp, Boxes } from 'lucide-react'
import { listOrders } from '../services/api'
import { useProductsStore } from '../store/productsStore'
import { money } from '../lib/utils'
import { LOW_STOCK_THRESHOLD } from '../config'
import { Card, StatusBadge, Empty, CHART_COLORS } from './ui'

const Kpi = ({ icon: Icon, label, value, sub, tone = 'text-C9A876 bg-C9A876/15' }) => (
  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex items-start gap-4">
    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${tone}`}><Icon className="w-5 h-5" /></div>
    <div className="min-w-0"><p className="text-xs uppercase tracking-wider text-slate-500">{label}</p>
      <p className="text-2xl font-semibold text-slate-900 truncate">{value}</p>{sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}</div>
  </div>
)
const tip = { borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 8px 24px rgba(0,0,0,.08)', fontSize: 12 }

export default function Dashboard() {
  const products = useProductsStore((s) => s.products)
  const [orders, setOrders] = useState(null)
  const [range, setRange] = useState(30)
  useEffect(() => { listOrders().then(setOrders).catch(() => setOrders([])) }, [])

  const d = useMemo(() => {
    const all = orders || []
    const live = all.filter((o) => o.status !== 'cancelled')
    const revenue = live.reduce((s, o) => s + o.total, 0)
    // revenue per day for the selected range
    const days = Array.from({ length: range }, (_, i) => { const dt = new Date(); dt.setHours(0, 0, 0, 0); dt.setDate(dt.getDate() - (range - 1 - i)); return dt })
    const byDay = days.map((dt) => {
      const key = dt.toDateString()
      const list = live.filter((o) => new Date(o.createdAt).toDateString() === key)
      return { label: dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), revenue: +list.reduce((s, o) => s + o.total, 0).toFixed(2), orders: list.length }
    })
    const rangeRevenue = byDay.reduce((s, x) => s + x.revenue, 0)
    const status = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'].map((s) => ({ name: s, value: all.filter((o) => o.status === s).length })).filter((x) => x.value)
    const catRev = {}, units = {}
    live.forEach((o) => o.items.forEach((i) => { catRev[i.category] = (catRev[i.category] || 0) + i.price * i.quantity; units[i.name] = (units[i.name] || 0) + i.quantity }))
    const revByCat = Object.entries(catRev).map(([name, value]) => ({ name, value: +value.toFixed(2) })).sort((a, b) => b.value - a.value)
    const top = Object.entries(units).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 5)
    const catCount = {}; products.forEach((p) => { catCount[p.category] = (catCount[p.category] || 0) + 1 })
    const byCat = Object.entries(catCount).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)
    const active = products.filter((p) => p.active)
    const low = active.filter((p) => p.stock <= LOW_STOCK_THRESHOLD).sort((a, b) => a.stock - b.stock)
    const stockValue = products.reduce((s, p) => s + p.price * p.stock, 0)
    return { all, live, revenue, byDay, rangeRevenue, status, revByCat, top, byCat, active, low, stockValue }
  }, [orders, products, range])

  if (!orders) return <div className="text-slate-400 py-20 text-center">Loading dashboard…</div>
  const aov = d.live.length ? d.revenue / d.live.length : 0
  const sample = d.all.some((o) => o.sample)

  return (
    <div className="space-y-6">
      {sample && <p className="text-xs bg-amber-50 border border-amber-200 text-amber-800 rounded-xl px-4 py-2.5">These orders are <b>sample data</b> so you can preview the dashboard. Real orders from your store appear here automatically.</p>}

      <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
        <Kpi icon={DollarSign} label="Revenue" value={money(d.revenue)} sub={`${money(d.rangeRevenue)} last ${range} days`} />
        <Kpi icon={ShoppingBag} label="Orders" value={d.all.length} sub={`${d.all.filter((o) => o.status === 'pending').length} pending`} tone="text-sky-600 bg-sky-100" />
        <Kpi icon={TrendingUp} label="Avg. order" value={money(aov)} sub="excluding cancelled" tone="text-emerald-600 bg-emerald-100" />
        <Kpi icon={Package} label="Products" value={`${d.active.length}`} sub={`${products.length - d.active.length} hidden · ${new Set(products.map((p) => p.category)).size} categories`} tone="text-violet-600 bg-violet-100" />
        <Kpi icon={Boxes} label="Inventory value" value={money(d.stockValue)} sub={`${products.reduce((s, p) => s + p.stock, 0)} units in stock`} tone="text-slate-700 bg-slate-200" />
        <Kpi icon={AlertTriangle} label="Low stock" value={d.low.length} sub={`≤ ${LOW_STOCK_THRESHOLD} units left`} tone="text-red-600 bg-red-100" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-2" title="Revenue"
              right={<div className="flex bg-slate-100 rounded-full p-1 text-xs">{[7, 30, 90].map((r) => <button key={r} onClick={() => setRange(r)} className={`px-3 py-1 rounded-full ${range === r ? 'bg-white shadow font-semibold' : 'text-slate-500'}`}>{r}d</button>)}</div>}>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={d.byDay} margin={{ left: -10, right: 8, top: 8 }}>
                <defs><linearGradient id="rev" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#C9A876" stopOpacity={0.5} /><stop offset="100%" stopColor="#C9A876" stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} interval={range > 30 ? 9 : range > 7 ? 4 : 0} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                <Tooltip contentStyle={tip} formatter={(v, n) => [n === 'revenue' ? money(v) : v, n === 'revenue' ? 'Revenue' : 'Orders']} />
                <Area type="monotone" dataKey="revenue" stroke="#B8945F" strokeWidth={2.5} fill="url(#rev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Orders by status">
          {d.status.length ? (
            <div className="h-72"><ResponsiveContainer width="100%" height="100%">
              <PieChart><Pie data={d.status} dataKey="value" nameKey="name" innerRadius="55%" outerRadius="80%" paddingAngle={3} stroke="none">
                {d.status.map((s, i) => <Cell key={s.name} fill={['#f59e0b', '#0ea5e9', '#6366f1', '#10b981', '#94a3b8'][['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'].indexOf(s.name)]} />)}
              </Pie><Tooltip contentStyle={tip} /><Legend iconType="circle" wrapperStyle={{ fontSize: 12, textTransform: 'capitalize' }} /></PieChart>
            </ResponsiveContainer></div>
          ) : <Empty>No orders yet</Empty>}
        </Card>

        <Card title="Products by category">
          <div className="h-72"><ResponsiveContainer width="100%" height="100%">
            <PieChart><Pie data={d.byCat} dataKey="value" nameKey="name" outerRadius="80%" stroke="#fff" strokeWidth={2} label={({ value }) => value} labelLine={false}>
              {d.byCat.map((c, i) => <Cell key={c.name} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
            </Pie><Tooltip contentStyle={tip} /><Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} /></PieChart>
          </ResponsiveContainer></div>
        </Card>

        <Card title="Revenue by category">
          {d.revByCat.length ? (
            <div className="h-72"><ResponsiveContainer width="100%" height="100%">
              <BarChart data={d.revByCat} layout="vertical" margin={{ left: 10, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                <YAxis type="category" dataKey="name" width={92} tick={{ fontSize: 11, fill: '#475569' }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tip} formatter={(v) => money(v)} cursor={{ fill: '#f1f5f9' }} />
                <Bar dataKey="value" radius={[0, 8, 8, 0]} fill="#C9A876" />
              </BarChart>
            </ResponsiveContainer></div>
          ) : <Empty>No sales yet</Empty>}
        </Card>

        <Card title="Best sellers (units)">
          {d.top.length ? (
            <ul className="space-y-3">{d.top.map((t, i) => (
              <li key={t.name} className="flex items-center gap-3"><span className="w-6 h-6 rounded-full bg-C9A876/20 text-[#8B6B3E] text-xs font-bold flex items-center justify-center">{i + 1}</span>
                <div className="flex-1 min-w-0"><p className="text-sm truncate">{t.name}</p>
                  <div className="h-1.5 bg-slate-100 rounded-full mt-1"><div className="h-full bg-C9A876 rounded-full" style={{ width: `${(t.value / d.top[0].value) * 100}%` }} /></div></div>
                <span className="text-sm font-semibold">{t.value}</span></li>))}
            </ul>
          ) : <Empty>No sales yet</Empty>}
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card title="Low stock alerts" right={<Link to="/admin/products" className="text-xs text-C9A876 hover:underline">Manage →</Link>}>
          {d.low.length ? (
            <ul className="divide-y divide-slate-100">{d.low.slice(0, 6).map((p) => (
              <li key={p.id} className="flex items-center gap-3 py-2.5"><img src={p.image} alt="" className="w-9 h-12 rounded-lg object-cover bg-slate-100" />
                <div className="flex-1 min-w-0"><p className="text-sm truncate">{p.name}</p><p className="text-xs text-slate-500">{p.category}</p></div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${p.stock === 0 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-800'}`}>{p.stock === 0 ? 'Sold out' : `${p.stock} left`}</span></li>))}
            </ul>
          ) : <Empty>Everything is well stocked 🎉</Empty>}
        </Card>

        <Card title="Recent orders" right={<Link to="/admin/orders" className="text-xs text-C9A876 hover:underline">View all →</Link>}>
          {d.all.length ? (
            <ul className="divide-y divide-slate-100">{d.all.slice(0, 6).map((o) => (
              <li key={o.id} className="flex items-center gap-3 py-2.5">
                <div className="flex-1 min-w-0"><p className="text-sm font-medium truncate">#{o.id} · {o.customerName}</p><p className="text-xs text-slate-500">{new Date(o.createdAt).toLocaleDateString()} · {o.items.reduce((n, i) => n + i.quantity, 0)} items</p></div>
                <StatusBadge status={o.status} /><span className="text-sm font-semibold w-20 text-right">{money(o.total)}</span></li>))}
            </ul>
          ) : <Empty>No orders yet</Empty>}
        </Card>
      </div>
    </div>
  )
}
