// Ingredients for "Create Your Signature Scent". The SERVER prices custom blends from these ids
// (sql/schema.sql → price_cart, and the recipe names in supabase/functions/stripe-webhook) —
// if you change a price or add an ingredient here, change it there too.
export const baseOils = [
  { id: 1, name: 'Oud Pure', price: 34.99 },
  { id: 2, name: 'Sandalwood', price: 29.99 },
  { id: 3, name: 'Amber Musk', price: 34.99 },
  { id: 4, name: 'Floral Blend', price: 29.99 },
]

export const topNotes = [
  { id: 101, name: 'Lemon', price: 5 },
  { id: 102, name: 'Bergamot', price: 5 },
  { id: 103, name: 'Grapefruit', price: 5 },
  { id: 104, name: 'Lavender', price: 5 },
]

export const middleNotes = [
  { id: 201, name: 'Rose', price: 8 },
  { id: 202, name: 'Jasmine', price: 8 },
  { id: 203, name: 'Iris', price: 8 },
  { id: 204, name: 'Peach', price: 8 },
]

export const baseNotes = [
  { id: 301, name: 'Vanilla', price: 6 },
  { id: 302, name: 'Musk', price: 6 },
  { id: 303, name: 'Cedar', price: 6 },
  { id: 304, name: 'Patchouli', price: 6 },
]

const SLOTS = [
  ['base', 'Base oil', baseOils],
  ['topNote', 'Top note', topNotes],
  ['middleNote', 'Middle note', middleNotes],
  ['baseNote', 'Base note', baseNotes],
]

// ["Base oil: Oud Pure", "Top note: Lemon", ...] — shown on the admin's order screen.
export function blendRecipe(blend) {
  if (!blend) return []
  return SLOTS.map(([key, label, list]) => {
    const id = blend[key]
    const found = id != null ? list.find(o => String(o.id) === String(id)) : null
    return found ? `${label}: ${found.name}` : null
  }).filter(Boolean)
}
