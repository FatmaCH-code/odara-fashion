const round2 = (n) => Math.round(n * 100) / 100

// Same rule the database applies when the order is placed (sql/schema.sql → create_order),
// so what the customer sees here always matches what they're charged.
// `amount` is what they're paying for goods AFTER any discount code.
export function shippingFor(amount, shipping) {
  const flat = Math.min(500, Math.max(0, Number(shipping && shipping.flatFee != null ? shipping.flatFee : 10)))
  const freeOver = Number((shipping && shipping.freeOver) || 0)
  return freeOver > 0 && amount >= freeOver ? 0 : round2(flat)
}
