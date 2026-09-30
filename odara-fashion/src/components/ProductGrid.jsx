import ProductCard from './ProductCard'

export function ProductSkeletons({ count = 8 }) {
  return Array.from({ length: count }, (_, i) => (
    <div key={i} className="product-card-premium">
      <div className="product-image-wrapper skeleton" />
      <div className="product-info-premium">
        <div className="skeleton h-2.5 w-1/3 rounded mb-2" />
        <div className="skeleton h-3.5 w-4/5 rounded mb-2" />
        <div className="skeleton h-3 w-1/4 rounded" />
      </div>
    </div>
  ))
}

export default function ProductGrid({ products, loading, className = '', skeletons = 8, empty = 'No products found.' }) {
  if (loading) return <div className={className}><ProductSkeletons count={skeletons} /></div>
  if (!products.length) return <p className="text-center text-2C2C2C/60 py-16 col-span-full">{empty}</p>
  return <div className={className}>{products.map((p) => <ProductCard key={p.id} product={p} />)}</div>
}
