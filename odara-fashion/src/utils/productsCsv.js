// Admin → Products → "Export CSV": every product with its details and photo links.
// Opens in Excel / Google Sheets / Numbers. A BOM is added so Arabic and accented names show correctly.

const absolute = (url) => {
  if (!url) return ''
  try { return new URL(url, window.location.origin).href } catch { return url }
}

const cell = (v) => {
  const s = v == null ? '' : String(v)
  return /[",\r\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

const COLUMNS = [
  ['ID', p => p.id],
  ['Name', p => p.name],
  ['Category', p => p.category],
  ['Brand', p => p.brand],
  ['Price ($)', p => p.price],
  ['Original price ($)', p => p.originalPrice ?? ''],
  ['Stock', p => p.stock],
  ['Sizes', p => (p.sizes || []).join(' | ')],
  ['Colors', p => (p.colors || []).map(c => [c.name, c.hex].filter(Boolean).join(' ')).join(' | ')],
  ['New', p => (p.isNew ? 'Yes' : '')],
  ['On sale', p => (p.isSale ? 'Yes' : '')],
  ['Best seller', p => (p.isBest ? 'Yes' : '')],
  ['Description', p => p.description],
  ['Main photo', p => absolute(p.image)],
  ['All photos', p => {
    const imgs = (p.images && p.images.length ? p.images : [p.image]).filter(Boolean)
    const colorImgs = (p.colors || []).map(c => c.image).filter(Boolean)
    return [...new Set([...imgs, ...colorImgs])].map(absolute).join(' | ')
  }],
]

export function downloadProductsCsv(products, filename) {
  const rows = [COLUMNS.map(([h]) => h), ...products.map(p => COLUMNS.map(([, get]) => get(p)))]
  const csv = '﻿' + rows.map(r => r.map(cell).join(',')).join('\r\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename || `odara-products-${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
