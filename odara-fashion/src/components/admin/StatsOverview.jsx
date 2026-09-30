import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'

const COLORS = ['#C9A876', '#8a6ea3', '#6e1f2a', '#1f4d3a', '#2b4c7e', '#a4272c', '#8a8a8a', '#5b2a6e', '#1f6b64', '#d9c7a8']

export default function StatsOverview({ products }) {
  const total = products.length
  const totalValue = products.reduce((sum, p) => sum + p.price * (p.stock ?? 0), 0)
  const onSale = products.filter(p => p.isSale).length
  const avgPrice = total ? products.reduce((sum, p) => sum + p.price, 0) / total : 0

  const byCategory = Object.entries(
    products.reduce((acc, p) => {
      acc[p.category] = (acc[p.category] || 0) + 1
      return acc
    }, {})
  ).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)

  const saleData = [
    { name: 'Regular Price', value: total - onSale },
    { name: 'On Sale', value: onSale },
  ]

  const priceByCategory = Object.entries(
    products.reduce((acc, p) => {
      if (!acc[p.category]) acc[p.category] = { total: 0, count: 0 }
      acc[p.category].total += p.price
      acc[p.category].count += 1
      return acc
    }, {})
  ).map(([name, { total, count }]) => ({ name, avgPrice: Math.round((total / count) * 100) / 100 }))
    .sort((a, b) => b.avgPrice - a.avgPrice)

  return (
    <div>
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <p className="admin-stat-label">Total Products</p>
          <p className="admin-stat-value">{total}</p>
        </div>
        <div className="admin-stat-card">
          <p className="admin-stat-label">Est. Inventory Value</p>
          <p className="admin-stat-value">${totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
        </div>
        <div className="admin-stat-card">
          <p className="admin-stat-label">On Sale</p>
          <p className="admin-stat-value">{onSale}</p>
        </div>
        <div className="admin-stat-card">
          <p className="admin-stat-label">Average Price</p>
          <p className="admin-stat-value">${avgPrice.toFixed(2)}</p>
        </div>
      </div>

      <div className="admin-charts-grid">
        <div className="admin-chart-card">
          <h3 className="admin-chart-title">Products by Category</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={byCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={(e) => e.name}>
                {byCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="admin-chart-card">
          <h3 className="admin-chart-title">Sale vs Regular Price</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={saleData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={(e) => `${e.name} (${e.value})`}>
                <Cell fill="#C9A876" />
                <Cell fill="#a4272c" />
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="admin-chart-card admin-chart-wide">
          <h3 className="admin-chart-title">Average Price by Category</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={priceByCategory}>
              <CartesianGrid strokeDasharray="3 3" stroke="#3a332c" />
              <XAxis dataKey="name" stroke="#9a8f7f" fontSize={11} angle={-20} textAnchor="end" height={70} />
              <YAxis stroke="#9a8f7f" fontSize={11} />
              <Tooltip contentStyle={{ background: '#1a1611', border: '1px solid #3a332c' }} />
              <Bar dataKey="avgPrice" fill="#C9A876" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
