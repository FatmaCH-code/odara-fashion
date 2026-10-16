// Store sections. Everything that isn't a perfume or a perfumery oil is
// "fashion" — so ANY new category the admin types (e.g. "Scarves") shows up in the Shop automatically.
export const PERFUME_CATEGORY = 'Perfumes'
export const OIL_CATEGORY = 'Perfumery Oils'

// Perfume sub-categories (by company). Admin can also type a new brand and
// it will appear as its own tab automatically.
export const PERFUME_BRANDS = ['Almas', 'Lattafa', 'Armaf', 'Afnan', 'Rasasi', 'Al Haramain', 'Ard Al Zaafaran']

const norm = (s) => (s || '').trim().toLowerCase()

export const isOilCategory = (c) => /\boils?\b/i.test(c || '')
// "Fragrances" / "Dubai Fragrances" are the old names — still treated as perfumes
// so nothing disappears if the database hasn't been tidied yet.
export const isPerfumeCategory = (c) => norm(c) === norm(PERFUME_CATEGORY) || /fragrance/i.test(c || '')

export const isOil = (p) => isOilCategory(p.category)
export const isPerfume = (p) => !isOil(p) && (isPerfumeCategory(p.category) || !!p.brand)
export const isFashion = (p) => !isOil(p) && !isPerfume(p)

export const sameBrand = (a, b) => norm(a) === norm(b)

// The 7 official brands first (always shown), then any extra brand the admin has used.
export const getBrandTabs = (perfumes) => {
  const extras = [...new Set(perfumes.map(p => (p.brand || '').trim()).filter(Boolean))]
    .filter(b => !PERFUME_BRANDS.some(x => sameBrand(x, b)))
  return [...PERFUME_BRANDS, ...extras]
}
