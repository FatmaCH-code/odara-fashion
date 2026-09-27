import { useState } from 'react'
import ProductCard from '../components/ProductCard'
import { fashionProducts as allProducts } from '../data/products'

export default function Shop() {
  const [sortBy, setSortBy] = useState('newest')
  const [categoryFilter, setCategoryFilter] = useState('all')

  const filtered = categoryFilter === 'all' 
    ? allProducts 
    : allProducts.filter(p => p.category === categoryFilter)

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'price-low') return a.price - b.price
    if (sortBy === 'price-high') return b.price - a.price
    return 0
  })

  const categories = ['all', ...new Set(allProducts.map(p => p.category))]

  return (
    <div>
      {/* Header */}
      <div className="bg-F5EFE0 py-12">
        <div className="container-premium">
          <h1 className="text-5xl font-playfair text-2C2C2C mb-4">Fashion</h1>
          <p className="text-lg text-2C2C2C/70">Curated luxury fashion collection</p>
        </div>
      </div>

      {/* Shop Content */}
      <div className="section-premium">
        <div className="container-premium">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            {/* Sidebar */}
            <div className="md:col-span-1">
              <div className="mb-8">
                <h3 className="text-sm uppercase tracking-widest font-semibold mb-4 text-2C2C2C">Category</h3>
                <div className="space-y-3">
                  {categories.map(cat => (
                    <label key={cat} className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="category"
                        value={cat}
                        checked={categoryFilter === cat}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="mr-3"
                      />
                      <span className="text-sm capitalize">{cat}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm uppercase tracking-widest font-semibold mb-4 text-2C2C2C">Sort By</h3>
                <select 
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full p-2 border border-E8D9C4 text-sm"
                >
                  <option value="newest">Newest</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                </select>
              </div>
            </div>

            {/* Products */}
            <div className="md:col-span-3">
              <div key={categoryFilter} className="products-grid-fade grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6">
                {sorted.map(product => (
                  <ProductCard key={product.id} product={product} isSale={product.isSale} isNew={product.isNew} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
