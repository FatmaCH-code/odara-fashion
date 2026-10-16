import { useState } from 'react'
import { Link } from 'react-router-dom'
import ProductCard from '../components/ProductCard'
import { useProducts } from '../hooks/useProducts'
import { isPerfume, getBrandTabs, sameBrand } from '../utils/categories'

export default function Perfumes() {
  const { products } = useProducts()
  const perfumes = products.filter(isPerfume)
  const [brandFilter, setBrandFilter] = useState('all')

  const brands = getBrandTabs(perfumes)
  const filtered = brandFilter === 'all'
    ? perfumes
    : perfumes.filter(p => sameBrand(p.brand, brandFilter))

  return (
    <div>
      {/* Header */}
      <div className="bg-F5EFE0 py-12">
        <div className="container-premium">
          <h1 className="text-5xl font-playfair text-2C2C2C mb-4">Perfumes</h1>
          <p className="text-lg text-2C2C2C/70">Authentic Arabian perfumes from the world's best-loved houses</p>
        </div>
      </div>

      {/* Content */}
      <div className="section-premium">
        <div className="container-premium">
          {/* Brand filter */}
          <div className="mb-12">
            <div className="flex flex-wrap gap-3">
              {['all', ...brands].map(b => (
                <button
                  key={b}
                  onClick={() => setBrandFilter(b)}
                  className={`px-6 py-2 uppercase text-xs tracking-widest font-semibold transition ${
                    brandFilter === b
                      ? 'bg-C9A876 text-white'
                      : 'border border-C9A876 text-C9A876 hover:bg-C9A876 hover:text-white'
                  }`}
                >
                  {b === 'all' ? 'All' : b}
                </button>
              ))}
            </div>
          </div>

          {/* Products Grid */}
          {filtered.length > 0 ? (
            <div key={brandFilter} className="products-grid-fade grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
              {filtered.map(product => (
                <ProductCard key={product.id} product={product} isNew={product.isNew} isSale={product.isSale} />
              ))}
            </div>
          ) : (
            <p key={brandFilter} className="products-grid-fade text-center text-2C2C2C/60 py-16">
              No {brandFilter} perfumes yet — new arrivals are on the way.
            </p>
          )}
        </div>
      </div>

      {/* Info Section */}
      <section className="section-premium bg-F5EFE0">
        <div className="container-premium">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-4xl font-playfair text-C9A876 mb-4">Premium</div>
              <h3 className="text-xl font-semibold mb-2">Quality</h3>
              <p className="text-2C2C2C/70">Every fragrance is carefully selected and tested</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-playfair text-C9A876 mb-4">Authentic</div>
              <h3 className="text-xl font-semibold mb-2">Sourced</h3>
              <p className="text-2C2C2C/70">Direct from luxury fragrance houses</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-playfair text-C9A876 mb-4">Long Lasting</div>
              <h3 className="text-xl font-semibold mb-2">Wearable</h3>
              <p className="text-2C2C2C/70">Enjoy fragrance all day and night</p>
            </div>
          </div>
        </div>
      </section>

      {/* Oils CTA */}
      <section className="section-premium">
        <div className="container-premium text-center">
          <h2 className="text-4xl font-playfair text-2C2C2C mb-6">Prefer a Concentrated Oil?</h2>
          <p className="text-lg text-2C2C2C/70 mb-8 max-w-2xl mx-auto">
            Explore our pure perfumery oils — long-lasting and skin-close.
          </p>
          <Link to="/perfumery-oils" className="btn-gold">Shop Perfumery Oils</Link>
        </div>
      </section>
    </div>
  )
}
