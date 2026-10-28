import { zoneForState, DEFAULT_ZONE_FEES, DEFAULT_INTERNATIONAL_FEE } from './shippingZones'
const round2 = (n) => Math.round(n * 100) / 100

// Same rule the database applies when the order is placed (sql/schema.sql → create_order),
// so what the customer sees here always matches what they're charged.
// `amount` is what they're paying for goods AFTER any discount code.
export function shippingFor(amount, shipping, location) {
  const cfg = shipping || {}
  const freeOver = Number(cfg.freeOver || 0)
  if (freeOver > 0 && amount >= freeOver) return 0
  const flat = round2(Math.min(500, Math.max(0, Number(cfg.flatFee != null ? cfg.flatFee : 10))))
  if (cfg.byZone === false) return flat
  // By distance from Ohio: we need the destination. Returns null until the customer picks a state.
  const country = location && location.country
  if (!country) return null
  if (country !== 'United States') {
    return round2(Math.min(500, Math.max(0, Number(cfg.international != null ? cfg.international : DEFAULT_INTERNATIONAL_FEE))))
  }
  const zone = zoneForState(location.state)
  if (!zone) return location.state ? flat : null
  const fees = Array.isArray(cfg.zones) ? cfg.zones : DEFAULT_ZONE_FEES
  const fee = fees[zone - 1] != null ? fees[zone - 1] : DEFAULT_ZONE_FEES[zone - 1]
  return round2(Math.min(500, Math.max(0, Number(fee))))
}


// ---- Price for each size (Admin -> Products -> "Price for each size") ----
export const fmtMoney = (n) => (Number(n) % 1 === 0 ? String(Number(n)) : Number(n).toFixed(2))

// The price of a chosen size; a size with no price of its own costs the normal product price.
export const priceForSize = (product, size) => {
  const own = size && product.sizePrices ? Number(product.sizePrices[size]) : NaN
  return own > 0 ? own : Number(product.price)
}

// For listings: the lowest price, but only when the sizes do not all cost the same ("From $59.99").
export function priceFrom(product) {
  const prices = product.sizePrices || {}
  if (Object.keys(prices).length === 0) return null
  const offered = new Set([...(product.sizes || []), ...(product.colors || []).flatMap(c => c.sizes || [])])
  if (offered.size === 0) return null
  const all = [...offered].map(sz => priceForSize(product, sz))
  const min = Math.min(...all)
  return min < Math.max(...all) ? min : null
}
