import { useState } from 'react'
import ProductCard from '../components/ProductCard'
import { Link } from 'react-router-dom'
import { perfumeProducts, oilProducts } from '../data/products'

const perfumeAndOilProducts = [...perfumeProducts, ...oilProducts]

export default function Perfumes() {
  const [categoryFilter, setCategoryFilter] = useState('all')

  const filtered = categoryFilter === 'all' 
    ? perfumeAndOilProducts 
    : perfumeAndOilProducts.filter(p => p.category === categoryFilter)

  const categories = ['all', ...new Set(perfumeAndOilProducts.map(p => p.category))]

  return (
    <div>
      {/* Header */}
      <div className="bg-F5EFE0 py-12">
        <div className="container-premium">
          <h1 className="text-5xl font-playfair text-2C2C2C mb-4">Fragrances & Perfumery Oils</h1>
          <p className="text-lg text-2C2C2C/70">Luxury scents from around the world</p>
        </div>
      </div>

      {/* Content */}
      <div className="section-premium">
        <div className="container-premium">
          {/* Category Filter */}
          <div className="mb-12">
            <div className="flex flex-wrap gap-3">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-6 py-2 uppercase text-xs tracking-widest font-semibold transition ${
                    categoryFilter === cat 
                      ? 'bg-C9A876 text-white' 
                      : 'border border-C9A876 text-C9A876 hover:bg-C9A876 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Products Grid */}
          <div key={categoryFilter} className="products-grid-fade grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
            {filtered.map(product => (
              <ProductCard key={product.id} product={product} isNew={product.isNew} isSale={product.isSale} />
            ))}
          </div>
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

      {/* Custom Blend CTA */}
      <section className="section-premium">
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
