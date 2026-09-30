export const money = (n) => `$${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export const isSale = (p) => p.originalPrice != null && Number(p.originalPrice) > Number(p.price)

export const discountPct = (p) => (isSale(p) ? Math.round((1 - p.price / p.originalPrice) * 100) : 0)

// sort a list of category names: preferred order first, everything else alphabetically after
export function sortCategories(cats, preferred = []) {
  return [...cats].sort((a, b) => {
    const ia = preferred.indexOf(a), ib = preferred.indexOf(b)
    if (ia !== -1 && ib !== -1) return ia - ib
    if (ia !== -1) return -1
    if (ib !== -1) return 1
    return a.localeCompare(b)
  })
}

// pick a varied mix (round-robin across categories) — used for the homepage teaser
export function pickMix(products, count) {
  const groups = new Map()
  products.forEach((p) => groups.set(p.category, [...(groups.get(p.category) || []), p]))
  const lists = [...groups.values()]
  const out = []
  for (let i = 0; out.length < count && lists.some((l) => l[i]); i++) {
    lists.forEach((l) => { if (l[i] && out.length < count) out.push(l[i]) })
  }
  return out
}

// shrink a photo in the browser before storing/uploading it
export function compressImage(file, maxSide = 1200, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)
    img.onload = () => {
      const scale = Math.min(1, maxSide / Math.max(img.width, img.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(objectUrl)
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not process image'))), 'image/jpeg', quality)
    }
    img.onerror = () => reject(new Error('That file is not a valid image'))
    img.src = objectUrl
  })
}

export function downloadCSV(filename, rows) {
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
  const csv = rows.map((r) => r.map(esc).join(',')).join('\n')
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = filename
  a.click()
  URL.revokeObjectURL(a.href)
}
