import { ORDER_STATUSES } from '../config'

export const STATUS_STYLE = {
  pending: 'bg-amber-100 text-amber-800', confirmed: 'bg-sky-100 text-sky-800', shipped: 'bg-indigo-100 text-indigo-800',
  delivered: 'bg-emerald-100 text-emerald-800', cancelled: 'bg-slate-200 text-slate-600',
}
export const CHART_COLORS = ['#C9A876', '#2C2C2C', '#8B6B3E', '#B23A48', '#4A6FA5', '#5B8C5A', '#8A6EA3', '#D9C7A8', '#1F6B64']

export const Card = ({ title, right, children, className = '' }) => (
  <section className={`bg-white rounded-2xl border border-slate-200 shadow-sm ${className}`}>
    {(title || right) && <header className="flex items-center justify-between px-5 pt-5">
      <h3 className="font-semibold text-slate-800">{title}</h3>{right}
    </header>}
    <div className="p-5">{children}</div>
  </section>
)

export const StatusBadge = ({ status }) => (
  <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${STATUS_STYLE[status] || 'bg-slate-100'}`}>{status}</span>
)

export const StatusSelect = ({ value, onChange }) => (
  <select value={value} onChange={(e) => onChange(e.target.value)} onClick={(e) => e.stopPropagation()}
          className={`rounded-full px-3 py-1.5 text-xs font-medium capitalize border-0 cursor-pointer focus:ring-2 focus:ring-C9A876 ${STATUS_STYLE[value]}`}>
    {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
  </select>
)

export const Empty = ({ children }) => <p className="text-center text-slate-400 text-sm py-10">{children}</p>
export const inputCls = 'w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-C9A876 focus:border-C9A876'
