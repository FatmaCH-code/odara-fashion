import { isFashion } from './categories'

// "Buy one, get one free" on clothing (Admin → Offers).
// For every clothing item the customer pays for, ONE of the gift pieces the admin picked
// becomes free. The cheapest gifts are freed first. If the cart only has gift pieces,
// they pair up among themselves (pay for one, the cheaper one is free).
//
// The SAME rule runs on the server (sql/bogo_offer.sql → apply_bogo) so what the customer
// sees here is exactly what they are charged.

export const giftIdSet = (cfg) =>
  new Set(((cfg && cfg.freeIds) || []).map(Number).filter(Number.isFinite))

export const bogoActive = (cfg) => !!(cfg && cfg.enabled) && giftIdSet(cfg).size > 0

const lineKey = (item) =>
  item.lineId || [item.id, item.color || '', item.size || '', item.blend ? JSON.stringify(item.blend) : ''].join('|')

/**
 * @param items        cart lines ({ id, price, quantity, blend? })
 * @param cfg          settings.bogo  ({ enabled, freeIds })
 * @param productById  (id) => product | undefined  — to know the real category/brand
 * @returns { amount, freeByLine: { [lineId]: qty }, unclaimed, giftsInCart }
 *   unclaimed = free gifts the customer has earned but not added yet
 */
export function computeBogo(items, cfg, productById = () => undefined) {
  const result = { amount: 0, freeByLine: {}, unclaimed: 0, giftsInCart: 0 }
  if (!bogoActive(cfg)) return result
  const gifts = giftIdSet(cfg)

  let buys = 0
  const giftUnits = []
  for (const it of items) {
    if (it.blend) continue
    const p = productById(it.id) || {}
    const clothing = isFashion({ category: p.category ?? it.category ?? '', brand: p.brand ?? '' })
    const qty = Number(it.quantity) || 0
    const price = Number(it.price) || 0
    if (gifts.has(Number(it.id))) {
      for (let q = 0; q < qty; q++) giftUnits.push({ line: lineKey(it), price, clothing })
    } else if (clothing) {
      buys += qty
    }
  }
  result.giftsInCart = giftUnits.length

  giftUnits.sort((a, b) => a.price - b.price)
  const paid = new Array(giftUnits.length).fill(false)
  let hi = giftUnits.length - 1
  for (let i = 0; i < giftUnits.length; i++) {
    if (paid[i]) continue
    if (buys > 0) {
      buys--                                   // a paid clothing item "pays" for this gift
    } else {
      // No clothing left to pay for it: the dearest remaining clothing gift is paid for instead.
      while (hi > i && (paid[hi] || !giftUnits[hi].clothing)) hi--
      if (hi <= i) break
      paid[hi--] = true
    }
    const g = giftUnits[i]                     // …and this (cheapest remaining) gift is free
    result.freeByLine[g.line] = (result.freeByLine[g.line] || 0) + 1
    result.amount += g.price
  }
  result.amount = Math.round(result.amount * 100) / 100
  result.unclaimed = buys
  return result
}
