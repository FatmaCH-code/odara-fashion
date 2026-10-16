import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link, useNavigate } from 'react-router-dom'
import { Search, X } from 'lucide-react'
import { useProducts } from '../hooks/useProducts'
import { searchProducts } from '../utils/search'

const POPULAR = ['Abaya', 'Kaftan', 'Thoub', 'Dress', 'Perfume', 'Oud']

export default function SearchOverlay({ open, onClose }) {
  const { products } = useProducts()
  const navigate = useNavigate()
  const inputRef = useRef(null)
  const [q, setQ] = useState('')

  useEffect(() => {
    if (!open) return
    setQ('')
    const t = setTimeout(() => inputRef.current && inputRef.current.focus(), 50)
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => { clearTimeout(t); window.removeEventListener('keydown', onKey) }
  }, [open])

  const results = useMemo(() => searchProducts(products, q), [products, q])

  if (!open) return null

  const goToResults = (term) => {
    const text = (term ?? q).trim()
    if (!text) return
    onClose()
    navigate(`/search?q=${encodeURIComponent(text)}`)
  }

  // Rendered on <body>: the sticky header uses backdrop-filter, which would otherwise trap a fixed overlay inside the header box.
  return createPortal(
    <div className="search-overlay" role="dialog" aria-modal="true" aria-label="Search products">
      <div className="search-backdrop" onClick={onClose} />
      <div className="search-panel">
        <div className="container-premium">
          <form className="search-form" onSubmit={(e) => { e.preventDefault(); goToResults() }}>
            <Search className="w-5 h-5 search-form-icon" />
            <input
              ref={inputRef}
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search abayas, thoubs, perfumes…"
              aria-label="Search"
              autoComplete="off"
            />
            <button type="button" className="search-close" onClick={onClose} aria-label="Close search">
              <X className="w-5 h-5" />
            </button>
          </form>

          {q.trim() === '' ? (
            <div className="search-popular">
              <p>Popular searches</p>
              <div>
                {POPULAR.map(t => (
                  <button key={t} type="button" onClick={() => goToResults(t)}>{t}</button>
                ))}
              </div>
            </div>
          ) : results.length === 0 ? (
            <p className="search-none">No results for “{q.trim()}”. Try a different word.</p>
          ) : (
            <>
              <ul className="search-results">
                {results.slice(0, 6).map(p => (
                  <li key={p.id}>
                    <Link to={`/product/${p.id}`} onClick={onClose}>
                      <img src={p.image} alt="" />
                      <span className="search-result-text">
                        <span className="search-result-name">{p.name}</span>
                        <span className="search-result-meta">{p.brand || p.category}</span>
                      </span>
                      <span className="search-result-price">${p.price}</span>
                    </Link>
                  </li>
                ))}
              </ul>
              <button type="button" className="search-all" onClick={() => goToResults()}>
                See all {results.length} result{results.length === 1 ? '' : 's'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}
