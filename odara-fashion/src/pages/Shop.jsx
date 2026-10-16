import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import ProductCard from '../components/ProductCard'
import { useProducts } from '../hooks/useProducts'
import { isFashion } from '../utils/categories'

const TAGS = [
  { key: '', label: 'All' },
  { key: 'new', label: 'New Arrivals' },
  { key: 'best', label: 'Best Sellers' },
  { key: 'sale', label: 'On Sale' },
]

export default function Shop() {
  const { products } = useProducts()
  const allProducts = products.filter(isFashion)
  const [sortBy, setSortBy] = useState('newest')
  const [params, setParams] = useSearchParams()

  // Category + tag live in the URL, so tiles/links from the home page work and Back behaves.
  const categoryFilter = params.get('category') || 'all'
  const tag = params.get('tag') || ''

  const setParam = (key, value) => {
    const next = new URLSearchParams(params)
    if (!value || value === 'all') next.delete(key)
    else next.set(key, value)
    setParams(next, { replace: true })
  }

  const tagged = allProducts.filter(p => {
    if (tag === 'new') return p.isNew
    if (tag === 'best') return p.isBest
    if (tag === 'sale') return p.isSale
    return true
  })

  const filtered = categoryFilter === 'all'
    ? tagged
    : tagged.filter(p => p.category === categoryFilter)

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'price-low') return a.price - b.price
    if (sortBy === 'price-high') return b.price - a.price
    return b.id - a.id
  })

  const categories = ['all', ...new Set(allProducts.map(p => p.category))]
  const heading = (TAGS.find(t => t.key === tag && t.key) || {}).label || (categoryFilter !== 'all' ? categoryFilter : 'Fashion')

  return (
    <div>
      {/* Header */}
      <div className="bg-F5EFE0 py-12">
        <div className="container-premium">
          <h1 className="text-5xl font-playfair text-2C2C2C mb-4">{heading}</h1>
          <p className="text-lg text-2C2C2C/70">Curated luxury fashion collection</p>
        </div>
      </div>

      {/* Shop Content */}
      <div className="section-premium">
        <div className="container-premium">
          <div className="filter-chips">
            {TAGS.map(t => (
              <button
                key={t.key || 'all'}
                type="button"
                className={`filter-chip ${tag === t.key ? 'is-active' : ''}`}
                onClick={() => setParam('tag', t.key)}
              >
                {t.label}
              </button>
            ))}
          </div>

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
                        onChange={(e) => setParam('category', e.target.value)}
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
              {sorted.length === 0 ? (
                <p className="text-center text-2C2C2C/60 py-16">Nothing here yet — check back soon.</p>
              ) : (
                <div key={`${categoryFilter}-${tag}`} className="products-grid-fade grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6">
                  {sorted.map(product => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
