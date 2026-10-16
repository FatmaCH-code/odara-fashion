// Simple, forgiving product search: ignores case/accents/punctuation, treats
// "abayas" and "abaya" alike, and ranks name matches above description matches.
const norm = (s) => (s || '').toString().toLowerCase()
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9\s]/g, ' ')

const stem = (t) => (t.length > 3 && t.endsWith('s') ? t.slice(0, -1) : t)

export function searchProducts(products, query) {
  const tokens = norm(query).split(/\s+/).filter(Boolean).map(stem)
  if (tokens.length === 0) return []

  return products
    .map((p) => {
      const name = norm(p.name)
      const cat = norm(p.category)
      const brand = norm(p.brand)
      const colors = (p.colors || []).map(c => norm(c.name)).join(' ')
      const hay = `${name} ${cat} ${brand} ${colors} ${norm(p.description)}`
      if (!tokens.every(t => hay.includes(t))) return null

      let score = 0
      tokens.forEach((t) => {
        if (name.includes(t)) score += 5
        if (name.startsWith(t)) score += 2
        if (cat.includes(t) || brand.includes(t)) score += 3
        if (colors.includes(t)) score += 1
      })
      return { p, score }
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score)
    .map(x => x.p)
}
