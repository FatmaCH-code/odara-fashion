import { Link } from 'react-router-dom'
import ProductCard from '../components/ProductCard'
import { useProducts } from '../hooks/useProducts'
import { isOil } from '../utils/categories'

export default function PerfumeryOils() {
  const { products } = useProducts()
  const oils = products.filter(isOil)

  return (
    <div>
      {/* Header */}
      <div className="bg-F5EFE0 py-12">
        <div className="container-premium">
          <h1 className="text-5xl font-playfair text-2C2C2C mb-4">Perfumery Oils</h1>
          <p className="text-lg text-2C2C2C/70">Pure, luxurious oil blends for your personal collection</p>
        </div>
      </div>

      {/* Products (no sub-categories) */}
      <div className="section-premium">
        <div className="container-premium">
          {oils.length > 0 ? (
            <div className="products-grid-fade grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
              {oils.map(product => (
                <ProductCard key={product.id} product={product} isNew={product.isNew} isSale={product.isSale} />
              ))}
            </div>
          ) : (
            <p className="text-center text-2C2C2C/60 py-16">New oils are on the way — check back soon.</p>
          )}
        </div>
      </div>

      {/* Custom Blend CTA */}
      <section className="section-premium bg-F5EFE0">
        <div className="container-premium text-center">
          <h2 className="text-4xl font-playfair text-2C2C2C mb-6">Create Your Own Blend</h2>
          <p className="text-lg text-2C2C2C/70 mb-8 max-w-2xl mx-auto">
            Mix and match our premium oils to create a fragrance that's uniquely yours
          </p>
          <Link to="/make-perfume" className="btn-gold">Start Creating</Link>
        </div>
      </section>
    </div>
  )
}
