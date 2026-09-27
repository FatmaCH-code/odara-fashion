// Central product catalog for Odara Fashion
// Fashion items (Embroidery/Thoubs, Kaftans, Jackets) are real products & prices from our
// partner store odarafashionplace.com. Perfumes are also real, from the same partner.
// Hijabs use temporary stock photos (no partner listing yet) — swap in real ones anytime.
// Perfumery Oils use temporary stock photos until oils are added to the partner catalog.
const shopify = (id) => `https://odarafashionplace.com/cdn/shop/files/${id}`
const unsplash = (id) => `https://images.unsplash.com/${id}?w=900&q=80&auto=format&fit=crop`

// ---- Embroidery / Palestinian-style Thoubs ----
export const embroideryProducts = [
  { id: 301, name: 'Lara Thoub', price: 139.99, category: 'Embroidery', image: shopify('5E211E89-116D-4055-91CE-C3C60F63FC59.png?v=1779477586'), colors: [{ name: 'Blue', hex: '#2b4c7e' }], description: "Heritage-inspired embroidered thoub with intricate hand-finished detailing across the bodice and sleeves." },
  { id: 302, name: 'Dianna Luxury Thoub', price: 349.99, category: 'Embroidery', isNew: true, image: shopify('3F7E0A62-D3CA-4862-B584-59520CB08441.webp?v=1781756076'), colors: [{ name: 'Green', hex: '#1f4d3a' }], description: "Our most luxurious thoub, densely embroidered with traditional motifs in a flowing silhouette." },
  { id: 303, name: 'Atlas Thoub', price: 214.99, category: 'Embroidery', image: shopify('039F315C-F581-46C7-B7F8-C6E2AAEB8A22.png?v=1779492457'), colors: [{ name: 'Red', hex: '#a4272c' }, { name: 'Green', hex: '#1f4d3a' }, { name: 'Purple', hex: '#5b2a6e' }], description: "A bold embroidered thoub with rich color-blocked panels and classic tailoring." },
  { id: 304, name: 'Safiya Thoube', price: 189.99, category: 'Embroidery', image: shopify('393AD928-5CD7-4E49-850E-184CF1164311.png?v=1779480807'), description: "Elegant embroidered thoube with heritage patterning along the chest panel and cuffs." },
  { id: 305, name: 'Fajr Dishdasha', price: 69.99, originalPrice: 99.99, isSale: true, category: 'Embroidery', image: shopify('6785EB06-043A-43CF-9DB2-2CEBEEF5652C.png?v=1779478773'), colors: [{ name: 'Blue', hex: '#2b4c7e' }, { name: 'Light Blue', hex: '#7fa8c9' }, { name: 'Burgundy', hex: '#6e1f2a' }, { name: 'Brown', hex: '#6b4a34' }, { name: 'Teal', hex: '#1f6b64' }], description: "A comfortable everyday dishdasha with subtle embroidered trim, available in five colors." },
]

// ---- Kaftans ----
export const kaftanProducts = [
  { id: 311, name: 'Maysaa Kafttan', price: 189.99, category: 'Kaftans', image: shopify('8A16679D-59F4-49A8-8B9E-35BEA45D4946.png?v=1779232399'), colors: [{ name: 'Green', hex: '#1f4d3a' }], description: "Flowing kaftan with gold-inspired embroidery and a flattering waist belt." },
  { id: 312, name: 'Laila Kafttan', price: 139.99, originalPrice: 179.99, isSale: true, category: 'Kaftans', image: shopify('85E46373-3CF2-4457-9052-299C6D7E718D.jpg?v=1779223274'), colors: [{ name: 'Green', hex: '#2e5c3f' }], description: "Richly patterned kaftan in emerald tones, perfect for special occasions." },
  { id: 313, name: 'Princess Kaftan', price: 229.99, originalPrice: 329.99, isSale: true, category: 'Kaftans', isNew: true, image: shopify('kafttan2.jpg?v=1789573770'), colors: [{ name: 'Gold', hex: '#c9a876' }], description: "A statement gold kaftan with dramatic sleeves for red-carpet elegance." },
  { id: 314, name: 'Samra Kafttan', price: 179.99, category: 'Kaftans', image: shopify('IMG-8061.jpg?v=1778871442'), colors: [{ name: 'Purple', hex: '#5b2a6e' }], description: "Luxurious embroidered kaftan with intricate gold-inspired patterns and a flattering waist belt — perfect for Eid, Ramadan, or special gatherings." },
]

// ---- Jackets & Coats ----
export const jacketProducts = [
  { id: 321, name: 'Embroidered Jacket', price: 169.99, category: 'Jackets', isNew: true, image: shopify('4A921327-35F2-41F0-B326-F3AF0E7D8E3A.jpg?v=1789188933'), colors: [{ name: 'Red', hex: '#a4272c' }], description: "Statement jacket with heritage embroidery across the front panels and cuffs." },
  { id: 322, name: "Women's Trench Coat", price: 79.99, category: 'Jackets', image: shopify('trenchcoat1.jpg?v=1762880571'), colors: [{ name: 'Black', hex: '#1a1a1a' }, { name: 'Beige', hex: '#d9c7a8' }, { name: 'Light Green', hex: '#8faa87' }], description: "Timeless trench coat with clean flowing lines and a waist-cinching belt. Available in black, beige and light green." },
  { id: 323, name: "Women's Winter Jacket", price: 124.00, category: 'Jackets', image: shopify('winterjacket2.jpg?v=1762965304'), colors: [{ name: 'Gray', hex: '#8a8a8a' }], description: "A long, modest winter jacket with a flowing cut and waist belt, made from warm autumnal fabric." },
  { id: 324, name: "Women's Linen Jacket", price: 69.99, category: 'Jackets', isSale: true, image: shopify('32a803ae-a154-4d04-806a-7f544f82964b.jpg?v=1764958066'), colors: [{ name: 'Blue', hex: '#4a6fa5' }], description: "Lightweight short jacket in distinctive colors, easy to style with jeans or skirts." },
]

// ---- Hijabs (temporary stock photos — no partner listing yet) ----
export const hijabProducts = [
  { id: 331, name: 'Chiffon Hijab', price: 19.99, category: 'Hijabs', image: unsplash('photo-1601869611206-3c7a6f092b05'), colors: [{ name: 'Pink', hex: '#e8a9b8' }], description: "Lightweight, breathable chiffon hijab with a soft drape, easy to style." },
  { id: 332, name: 'Jersey Hijab', price: 16.99, category: 'Hijabs', isNew: true, image: unsplash('photo-1601869610205-9aad35d5971f'), colors: [{ name: 'Pink', hex: '#e8a9b8' }], description: "Stretchy, no-slip jersey hijab for effortless everyday wear." },
  { id: 333, name: 'Printed Silk-Feel Hijab', price: 24.99, category: 'Hijabs', image: unsplash('photo-1601869609079-e2d5f5390343'), colors: [{ name: 'Purple', hex: '#8a6ea3' }], description: "Silky-smooth hijab in a printed pattern, perfect for special occasions." },
  { id: 334, name: 'Premium Modal Hijab', price: 18.99, category: 'Hijabs', isSale: true, image: unsplash('photo-1601869611834-677a936bbede'), colors: [{ name: 'Gray', hex: '#9a9a9a' }], description: "Ultra-soft modal blend hijab that holds its shape all day." },
]

export const fashionProducts = [...embroideryProducts, ...kaftanProducts, ...jacketProducts, ...hijabProducts]

// ---- Perfumes (real, from odarafashionplace.com) ----
export const perfumeProducts = [
  { id: 101, name: 'Qamrain', price: 59.99, category: 'Fragrances', image: shopify('EE64E6B7-A7A3-4D14-9F21-7B97CC247555.jpg?v=1789706560'), description: "A fruity-rose fragrance, bright and long-lasting." },
  { id: 102, name: 'Hayman Blend', price: 59.99, originalPrice: 79.99, isSale: true, category: 'Fragrances', image: shopify('2EBD34F8-840F-46BC-8D1B-125F27667BCE.jpg?v=1789706481'), description: "A warm, distinctive blend built for everyday signature wear." },
  { id: 103, name: 'Lara', price: 39.99, originalPrice: 49.99, isSale: true, category: 'Fragrances', image: shopify('F1DBB496-05CB-4659-B7A1-1ECC53F475CB.jpg?v=1789706387'), description: "A soft, romantic everyday scent with excellent lasting power." },
  { id: 104, name: 'Aloud Alazraq', price: 54.99, category: 'Dubai Fragrances', isNew: true, image: shopify('FC477C66-B68F-4CC2-85B3-8DE59F565D1B.jpg?v=1789706296'), description: "A rich, resinous oud fragrance inspired by Dubai's oud houses." },
  { id: 105, name: 'Ana Fayrouz', price: 59.99, category: 'Dubai Fragrances', image: shopify('285798F2-A471-4DB5-94C9-07CA5B2D170D.jpg?v=1789706217'), description: "A vibrant, turquoise-inspired fragrance with a fresh, opulent character." },
]

// ---- Perfumery Oils (renamed from Essential Oils; temporary stock photos) ----
export const oilProducts = [
  { id: 201, name: 'Oud Pure Oil', price: 34.99, category: 'Perfumery Oils', image: unsplash('photo-1608571424634-58ae03e6edcf'), description: 'A concentrated pure oud oil, rich and long-lasting — a few drops go a long way.' },
  { id: 202, name: 'Floral Blend', price: 29.99, category: 'Perfumery Oils', image: unsplash('photo-1608571424237-381e6b43a2a7'), description: 'A delicate multi-floral oil blend, light enough for everyday wear.' },
  { id: 203, name: 'Sandalwood Oil', price: 29.99, category: 'Perfumery Oils', isNew: true, image: unsplash('photo-1565215277595-67d13d26e45d'), description: 'Creamy, warm sandalwood oil sourced for depth and longevity on the skin.' },
  { id: 204, name: 'Amber Musk Oil', price: 34.99, category: 'Perfumery Oils', image: unsplash('photo-1564789629808-8c250495c575'), description: 'A sensual blend of amber and white musk, soft and skin-close.' },
]

export const allProducts = [...fashionProducts, ...perfumeProducts, ...oilProducts]

export const getProductById = (id) => allProducts.find(p => p.id === parseInt(id))
