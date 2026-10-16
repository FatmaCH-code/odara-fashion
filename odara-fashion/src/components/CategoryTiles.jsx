import { Link } from 'react-router-dom'
import { useProducts } from '../hooks/useProducts'
import { isFashion, isPerfume, isOil } from '../utils/categories'

// "Shop by category": built from the live catalog, so a new category (or a new
// photo on its first product) shows up here on its own.
export default function CategoryTiles() {
  const { products } = useProducts()

  const groups = new Map()
  products.filter(isFashion).forEach((p) => {
    if (!p.category) return
    const g = groups.get(p.category) || { name: p.category, count: 0, image: '' }
    g.count += 1
    if (!g.image && p.image) g.image = p.image
    groups.set(p.category, g)
  })

  const tiles = [...groups.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, 6)
    .map(g => ({ key: g.name, name: g.name, count: g.count, image: g.image, to: `/shop?category=${encodeURIComponent(g.name)}` }))

  const perfumes = products.filter(isPerfume)
  const oils = products.filter(isOil)
  if (perfumes.length) tiles.push({ key: 'perfumes', name: 'Perfumes', count: perfumes.length, image: (perfumes.find(p => p.image) || {}).image, to: '/perfumes' })
  if (oils.length) tiles.push({ key: 'oils', name: 'Perfumery Oils', count: oils.length, image: (oils.find(p => p.image) || {}).image, to: '/perfumery-oils' })

  if (tiles.length === 0) return null

  return (
    <div className="category-grid">
      {tiles.map(t => (
        <Link key={t.key} to={t.to} className="category-tile">
          {t.image && <img src={t.image} alt="" loading="lazy" />}
          <span className="category-tile-info">
            <span className="category-tile-name">{t.name}</span>
            <span className="category-tile-count">{t.count} style{t.count === 1 ? '' : 's'}</span>
          </span>
        </Link>
      ))}
    </div>
  )
}
