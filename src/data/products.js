// Central product catalog for Odara Fashion
// Images are temporary stock photos so nothing shows empty — replace with your own product photography anytime.
const img = (id) => `https://images.unsplash.com/${id}?w=900&q=80&auto=format&fit=crop`

export const fashionProducts = [
  { id: 1, name: 'Ivory Linen Shirt', price: 98, category: 'Tops', image: img('photo-1755483503918-6b0fa0573a0e'), description: 'A breathable linen shirt with clean lines, finished with delicate embroidered trim for effortless elegance.' },
  { id: 2, name: 'Cream Wool Trousers', price: 145, category: 'Bottoms', image: img('photo-1755483503957-2d3b00ec03eb'), description: 'Luxuriously soft wool trousers cut for a flattering, fluid silhouette that moves with you.' },
  { id: 3, name: 'Beige Linen Dress', price: 178, category: 'Dresses', isNew: true, image: img('photo-1755483503889-e4a79e94a806'), description: 'A flowing beige dress with hand-finished embellishments, perfect for day-to-evening elegance.' },
  { id: 4, name: 'Camel Wool Coat', price: 285, category: 'Outerwear', image: img('photo-1755483503873-b3b5309bae1f'), description: 'A statement wool coat layered over a sheer embellished overlay for refined warmth and drama.' },
  { id: 5, name: 'White Cotton Tee', price: 58, category: 'Tops', image: img('photo-1755483504083-e774c05cab68'), description: 'An elevated essential in pure cotton with a delicate embroidered pattern along the hem.' },
  { id: 6, name: 'Tan Linen Blazer', price: 198, category: 'Outerwear', isSale: true, image: img('photo-1755483503866-76390b5c3b3d'), description: 'A tailored tan blazer with leaf embroidery detailing, structured yet soft to the touch.' },
  { id: 7, name: 'Cream Silk Slip', price: 128, category: 'Intimates', image: img('photo-1755483503929-a2eb08de1c7d'), description: 'A fluid silk slip with wide draped sleeves, cut for graceful, understated movement.' },
  { id: 8, name: 'Natural Linen Shorts', price: 85, category: 'Bottoms', image: img('photo-1755483503991-41ea3f121968'), description: 'Relaxed linen shorts finished with floral embroidery for a refined casual look.' },
  { id: 9, name: 'Oat Cashmere Sweater', price: 240, category: 'Tops', image: img('photo-1755483503862-7320d7fa288b'), description: 'An indulgently soft cashmere sweater with an embellished neckline for quiet luxury.' },
  { id: 10, name: 'Sand Linen Skirt', price: 115, category: 'Bottoms', isNew: true, image: img('photo-1755483503819-697f5c6611ca'), description: 'A ruffled linen skirt with floral embroidery, designed to catch the light as you move.' },
  { id: 11, name: 'Pearl Wool Dress', price: 195, category: 'Dresses', image: img('photo-1755483503918-6b0fa0573a0e'), description: 'An elegant wool dress with a long, trimmed silhouette for polished everyday wear.' },
  { id: 12, name: 'Champagne Silk Blouse', price: 165, category: 'Tops', isSale: true, image: img('photo-1755483503889-e4a79e94a806'), description: 'A softly draped silk blouse with embellished detailing, luminous in champagne tones.' },
]

export const perfumeProducts = [
  { id: 101, name: 'Oud Amara', price: 54.99, category: 'Fragrances', image: img('photo-1458538977777-0549b2370168'), description: 'A warm, resinous oud fragrance layered with amber and spice for an unforgettable signature scent.' },
  { id: 102, name: 'Rose Garden', price: 49.99, category: 'Fragrances', image: img('photo-1595425959632-34f2822322ce'), description: 'A soft, romantic bouquet of Damask rose petals with a whisper of white musk.' },
  { id: 103, name: 'Arabian Nights', price: 59.99, category: 'Fragrances', isNew: true, image: img('photo-1585218334450-afcf929da36e'), description: 'A rich, mysterious blend of oud, saffron and dark amber inspired by desert evenings.' },
  { id: 104, name: 'Jasmine Dream', price: 49.99, category: 'Fragrances', image: img('photo-1613521140785-e85e427f8002'), description: 'A luminous floral built around night-blooming jasmine and soft sandalwood.' },
  { id: 105, name: 'Dubai Gold', price: 64.99, category: 'Dubai Fragrances', image: img('photo-1588405748880-12d1d2a59f75'), description: 'An opulent gourmand oud with honey, vanilla and gold amber — bold and long-lasting.' },
  { id: 106, name: 'Dune Spirit', price: 59.99, category: 'Dubai Fragrances', isNew: true, image: img('photo-1594035910387-fea47794261f'), description: 'A smoky, woody composition that captures the spirit of the desert at dusk.' },
  { id: 107, name: 'Desert Rose', price: 54.99, category: 'Dubai Fragrances', image: img('photo-1608528577891-eb055944f2e7'), description: 'A striking fusion of rose and spice, deep and velvety on the skin.' },
]

export const oilProducts = [
  { id: 201, name: 'Oud Pure Oil', price: 34.99, category: 'Oils', image: img('photo-1608571424634-58ae03e6edcf'), description: 'A concentrated pure oud oil, rich and long-lasting — a few drops go a long way.' },
  { id: 202, name: 'Floral Blend', price: 29.99, category: 'Oils', image: img('photo-1608571424237-381e6b43a2a7'), description: 'A delicate multi-floral oil blend, light enough for everyday wear.' },
  { id: 203, name: 'Sandalwood Oil', price: 29.99, category: 'Oils', isNew: true, image: img('photo-1565215277595-67d13d26e45d'), description: 'Creamy, warm sandalwood oil sourced for depth and longevity on the skin.' },
  { id: 204, name: 'Amber Musk Oil', price: 34.99, category: 'Oils', image: img('photo-1564789629808-8c250495c575'), description: 'A sensual blend of amber and white musk, soft and skin-close.' },
]

export const allProducts = [...fashionProducts, ...perfumeProducts, ...oilProducts]

export const getProductById = (id) => allProducts.find(p => p.id === parseInt(id))
