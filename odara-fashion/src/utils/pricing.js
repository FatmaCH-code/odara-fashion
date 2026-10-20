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
