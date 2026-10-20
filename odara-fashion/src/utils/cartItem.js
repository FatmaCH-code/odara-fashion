import { sortSizes } from './sizes'

// Sizes a shopper can pick: the chosen color's own list if the admin set one, else the product's.
export const sizesFor = (product, color) =>
  sortSizes((color && color.sizes !== undefined) ? color.sizes : (product.sizes || []))

// The cart line for a product + color + size. (The server re-prices from the product id,
// so the price/name here are only for display.)
export function buildCartItem(product, color, size, quantity = 1) {
  const variant = [color && color.name, size && `Size ${size}`].filter(Boolean).join(', ')
  return {
    id: product.id,
    name: variant ? `${product.name} (${variant})` : product.name,
    price: product.price,
    image: product.image,
    color: color ? color.name : undefined,
    size: size || undefined,
    quantity,
  }
}
