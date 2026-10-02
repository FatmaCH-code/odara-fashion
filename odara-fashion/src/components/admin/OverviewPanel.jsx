import { useAdminProducts } from '../../hooks/useAdminProducts'
import StatsOverview from './StatsOverview'

export default function OverviewPanel() {
  const { products, loading, error } = useAdminProducts()

  if (loading) return <p className="text-2C2C2C/50">Loading…</p>

  return (
    <>
      {error && <div className="admin-notice mb-6">{error}</div>}
      <h1 className="text-2xl font-playfair mb-6">Overview</h1>
      <StatsOverview products={products} />
    </>
  )
}
