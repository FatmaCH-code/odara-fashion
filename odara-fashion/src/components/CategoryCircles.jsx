import { Link } from 'react-router-dom'
import { useProducts } from '../hooks/useProducts'
import { isFashion, isPerfume, isOil } from '../utils/categories'
import Reveal from './Reveal'

// "Shop by category": a round photo per category, built from the live catalog —
// a new category (or a new photo on its first product) shows up here by itself.
export default function CategoryCircles() {
  const { products } = useProducts()

  const groups = new Map()
  products.filter(isFashion).forEach((p) => {
    if (!p.category) return
    const g = groups.get(p.category) || { name: p.category, count: 0, image: '' }
    g.count += 1
    if (!g.image && p.image) g.image = p.image
    groups.set(p.category, g)
  })

  const items = [...groups.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, 6)
    .map(g => ({ key: g.name, name: g.name, image: g.image, to: `/shop?category=${encodeURIComponent(g.name)}` }))

  const perfumes = products.filter(isPerfume)
  const oils = products.filter(isOil)
  if (perfumes.length) items.push({ key: 'perfumes', name: 'Perfumes', image: (perfumes.find(p => p.image) || {}).image, to: '/perfumes' })
  if (oils.length) items.push({ key: 'oils', name: 'Perfumery Oils', image: (oils.find(p => p.image) || {}).image, to: '/perfumery-oils' })

  if (items.length === 0) return null

  return (
    <div className="circles-row">
      {items.map((c, i) => (
        <Reveal key={c.key} delay={Math.min(i, 8) * 60} className="circle-wrap">
          <Link to={c.to} className="circle-item">
            <span className="circle-photo">{c.image && <img src={c.image} alt="" loading="lazy" />}</span>
            <span className="circle-name">{c.name}</span>
          </Link>
        </Reveal>
      ))}
    </div>
  )
}
