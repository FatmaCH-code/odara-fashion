import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Search as SearchIcon } from 'lucide-react'
import ProductCard from '../components/ProductCard'
import { useProducts } from '../hooks/useProducts'
import { searchProducts } from '../utils/search'

export default function Search() {
  const { products } = useProducts()
  const [params, setParams] = useSearchParams()
  const query = params.get('q') || ''
  const [text, setText] = useState(query)

  useEffect(() => { setText(query) }, [query])

  const results = useMemo(() => searchProducts(products, query), [products, query])

  const submit = (e) => {
    e.preventDefault()
    setParams(text.trim() ? { q: text.trim() } : {})
  }

  return (
    <div>
      <div className="bg-F5EFE0 py-12">
        <div className="container-premium">
          <h1 className="text-4xl md:text-5xl font-playfair text-2C2C2C mb-6">Search</h1>
          <form onSubmit={submit} className="search-page-form">
            <SearchIcon className="w-5 h-5" />
            <input
              type="search"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Search abayas, thoubs, perfumes…"
              aria-label="Search products"
            />
            <button type="submit" className="btn-gold">Search</button>
          </form>
        </div>
      </div>

      <div className="section-premium">
        <div className="container-premium">
          {!query.trim() ? (
            <p className="text-center text-2C2C2C/60 py-12">Type something above to search the whole store.</p>
          ) : results.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-lg text-2C2C2C/70 mb-6">No results for “{query}”.</p>
              <p className="text-2C2C2C/60 mb-6">Try a different word, or browse:</p>
              <div className="flex flex-wrap gap-3 justify-center">
                <Link to="/shop" className="btn-outline">Fashion</Link>
                <Link to="/perfumes" className="btn-outline">Perfumes</Link>
                <Link to="/perfumery-oils" className="btn-outline">Perfumery Oils</Link>
              </div>
            </div>
          ) : (
            <>
              <p className="text-2C2C2C/60 mb-8">{results.length} result{results.length === 1 ? '' : 's'} for “{query}”</p>
              <div className="products-grid-fade grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
                {results.map(p => <ProductCard key={p.id} product={p} />)}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
