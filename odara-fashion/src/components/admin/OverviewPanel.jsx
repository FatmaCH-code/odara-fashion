import { useEffect, useState } from 'react'
import { useAdminProducts } from '../../hooks/useAdminProducts'
import { adminListOrders } from '../../services/orders'
import StatsOverview from './StatsOverview'
import SalesOverview from './SalesOverview'

export default function OverviewPanel() {
  const { products, loading, error } = useAdminProducts()
  const [orders, setOrders] = useState(null)      // null = still loading, [] = none / unavailable
  const [ordersError, setOrdersError] = useState('')

  useEffect(() => {
    adminListOrders().then(setOrders).catch((err) => { setOrders([]); setOrdersError(err.message) })
  }, [])

  if (loading) return <p className="text-2C2C2C/50">Loading…</p>

  return (
    <>
      {error && <div className="admin-notice mb-6">{error}</div>}
      <h1 className="text-2xl font-playfair mb-6">Overview</h1>
      {ordersError && <div className="admin-notice mb-6">Could not load orders: {ordersError}</div>}
      {orders && <SalesOverview orders={orders} />}
      <h2 className="text-xl font-playfair mb-4">Catalogue</h2>
      <StatsOverview products={products} />
    </>
  )
}
