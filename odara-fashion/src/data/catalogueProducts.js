// Real product catalogue supplied by the owner (CatalogueODARA.xlsx).
// Photos are the actual product photos embedded in that file, served from
// /public/catalogue so they have a stable URL (usable from the database too,
// once this data is migrated into Supabase — see sql/schema.sql).
// id range 340-399 reserved for this batch so it never collides with earlier data.
const cat = (n) => `/catalogue/product-${n}.jpg`

export const catalogueEmbroideryProducts = [
  { id: 341, name: 'Royal Pearl Embroidered Thobe', price: 350, category: 'Embroidery', isNew: true, image: cat(1), colors: [{ name: 'Red', hex: '#a4272c' }, { name: 'White', hex: '#f2ede3' }], description: 'Long embroidered thobe in a rich red and white pattern, fully hand-embroidered.' },
  { id: 342, name: 'Al-Sultana Satin Embroidered Thobe', price: 350, category: 'Embroidery', image: cat(2), colors: [{ name: 'Burgundy', hex: '#6e1f2a' }, { name: 'Blue', hex: '#2b4c7e' }, { name: 'Beige', hex: '#d9c7a8' }], description: 'Satin embroidered thobe, available in burgundy/white, blue/red or beige/pink.' },
]

export const catalogueKaftanProducts = [
  { id: 315, name: 'Embroidered Kaftan', price: 350, category: 'Kaftans', image: cat(3), colors: [{ name: 'Blue', hex: '#2b4c7e' }, { name: 'Pink', hex: '#e8a9b8' }], description: 'Wide-sleeved embroidered kaftan in a blue and pink motif.' },
  { id: 316, name: 'Patterned Kaftan', price: 189.99, originalPrice: 289.99, isSale: true, category: 'Kaftans', image: cat(4), colors: [{ name: 'Blue', hex: '#2b4c7e' }, { name: 'Beige', hex: '#d9c7a8' }], description: 'Patterned kaftan, on promotion — available in blue and beige.' },
  { id: 317, name: 'Embroidered Robe Kaftan', price: 350, category: 'Kaftans', image: cat(9), colors: [{ name: 'Brown', hex: '#6b4a34' }, { name: 'Navy', hex: '#1f2d4a' }], description: 'Embroidered robe kaftan in brown/red or navy/pink motifs.' },
  { id: 318, name: 'Embroidered Robe Kaftan (Variant)', price: 350, category: 'Kaftans', image: cat(10), colors: [{ name: 'Beige', hex: '#d9c7a8' }, { name: 'Burgundy', hex: '#6e1f2a' }], description: 'A variant of our embroidered robe kaftan in beige or burgundy.' },
]

export const catalogueAbayaProducts = [
  { id: 351, name: 'Embroidered Abaya Coat', price: 169.99, category: 'Abayas', isNew: true, image: cat(5), colors: [{ name: 'Green', hex: '#1f4d3a' }, { name: 'Red', hex: '#a4272c' }, { name: 'Black', hex: '#1a1a1a' }], description: 'Embroidered coat-style abaya, available in green or red/black.' },
  { id: 352, name: 'Simple Abaya', price: 350.99, category: 'Abayas', image: cat(11), colors: [{ name: 'Gray', hex: '#8a8a8a' }, { name: 'Black', hex: '#1a1a1a' }], description: 'Understated everyday abaya in gray/taupe or black.' },
  { id: 353, name: 'Black Pearl-Trim Abaya', price: 99.99, category: 'Abayas', image: cat(13), colors: [{ name: 'Black', hex: '#1a1a1a' }, { name: 'Gold', hex: '#c9a876' }], description: 'Black abaya finished with a delicate gold pearl-beaded border.' },
  { id: 354, name: 'Kimono Abaya', price: 219.99, category: 'Abayas', isNew: true, image: cat(17), colors: [{ name: 'Pink', hex: '#e8a9b8' }, { name: 'Cream', hex: '#f2ede3' }, { name: 'Navy', hex: '#1f2d4a' }, { name: 'Teal', hex: '#1f6b64' }], description: 'Kimono-style abaya available in four colors: pink, cream, navy or teal.' },
  { id: 355, name: 'Belted Abaya', price: 99.99, category: 'Abayas', image: cat(19), colors: [{ name: 'Burgundy', hex: '#6e1f2a' }, { name: 'Black', hex: '#1a1a1a' }], description: 'Belted abaya in burgundy/black, shown in outdoor styling photos.' },
  { id: 356, name: 'Abaya', price: 189.99, category: 'Abayas', image: cat(22), colors: [{ name: 'Khaki', hex: '#8a8760' }, { name: 'Burgundy', hex: '#6e1f2a' }], description: 'Relaxed-fit abaya in khaki or burgundy, shown in outdoor styling photos.' },
  { id: 357, name: 'Gold-Embroidered Abaya', price: 139.99, category: 'Abayas', image: cat(24), colors: [{ name: 'Black', hex: '#1a1a1a' }, { name: 'Gold', hex: '#c9a876' }], description: 'Black abaya with intricate gold embroidery along the sleeves.' },
]

export const catalogueDressProducts = [
  { id: 371, name: 'Black Floral Embroidered Dress', price: 199.99, category: 'Dresses', image: cat(12), colors: [{ name: 'Black', hex: '#1a1a1a' }], description: 'Black dress with delicate all-over floral embroidery.' },
  { id: 372, name: 'Purple Pleated Dress', price: 89.99, category: 'Dresses', image: cat(14), colors: [{ name: 'Purple', hex: '#5b2a6e' }], description: 'Long-sleeved pleated dress with a cinched waist, in purple.' },
  { id: 373, name: 'Black Sequin Dress', price: 89.99, category: 'Dresses', isNew: true, image: cat(15), colors: [{ name: 'Black', hex: '#1a1a1a' }], description: 'Black sequin dress with dramatic bouffant sleeves.' },
  { id: 374, name: 'Long Dress', price: 109.99, category: 'Dresses', image: cat(18), colors: [{ name: 'Blue', hex: '#2b4c7e' }, { name: 'Teal', hex: '#1f6b64' }], description: 'Long flowing dress, available in blue or teal.' },
  { id: 375, name: 'Dress', price: 98.99, category: 'Dresses', image: cat(23), colors: [{ name: 'Blue', hex: '#2b4c7e' }, { name: 'Purple', hex: '#5b2a6e' }], description: 'Versatile dress available in blue or purple.' },
]

export const catalogueSetProducts = [
  { id: 361, name: 'Pantsuit', price: 119.99, category: 'Sets', image: cat(6), colors: [{ name: 'Purple', hex: '#5b2a6e' }, { name: 'Black', hex: '#1a1a1a' }], description: 'Tailored two-piece pantsuit in purple or black.' },
  { id: 362, name: 'Skirt & Top Set', price: 59.99, category: 'Sets', image: cat(7), colors: [{ name: 'White', hex: '#f2ede3' }, { name: 'Pink', hex: '#e8a9b8' }], description: 'Long pleated skirt with matching top, in white/navy or pink/navy.' },
  { id: 363, name: 'Pantsuit', price: 119.99, category: 'Sets', image: cat(8), colors: [{ name: 'White', hex: '#f2ede3' }, { name: 'Mauve', hex: '#a3798a' }], description: 'Tailored two-piece pantsuit in white or gray/mauve.' },
  { id: 364, name: 'Two-Piece Set', price: 89.99, category: 'Sets', image: cat(20), colors: [{ name: 'Purple', hex: '#5b2a6e' }, { name: 'Mauve', hex: '#a3798a' }, { name: 'Blue', hex: '#2b4c7e' }], description: 'Matching top and pantsuit set in purple, mauve or blue.' },
  { id: 365, name: 'Two-Piece Set', price: 89.99, category: 'Sets', image: cat(21), colors: [{ name: 'Green', hex: '#1f4d3a' }], description: 'Matching top and pants set in green with gold-tone detailing.' },
]

export const catalogueHijabProducts = [
  // No photo was included for this item in the source catalogue — using a
  // placeholder photo until a real one is added via the admin panel.
  { id: 335, name: 'Leopard Print Modal Hijab', price: 16, category: 'Hijabs', image: 'https://images.unsplash.com/photo-1601869609079-e2d5f5390343?w=900&q=80&auto=format&fit=crop', colors: [{ name: 'Leopard', hex: '#a9784a' }], description: 'Leopard-print modal hijab, available in several colorways.' },
]

export const catalogueProducts = [
  ...catalogueEmbroideryProducts,
  ...catalogueKaftanProducts,
  ...catalogueAbayaProducts,
  ...catalogueDressProducts,
  ...catalogueSetProducts,
  ...catalogueHijabProducts,
]
