// Clothing sizes (US numeric + letter) and bottle sizes (ml), in the order they should always
// display in — regardless of what order they were clicked or typed in. The admin can also add
// ANY size of their own (e.g. "75 ml", "One size"); those are sorted by their number, then by name.
export const NUMERIC_SIZES = ['1', '2', '3', '4', '5', '6', '7', '8']
export const LETTER_SIZES = ['S', 'M', 'L', 'XL', 'XXL', 'XXXL']
export const ML_SIZES = ['30 ml', '50 ml', '100 ml']
const SIZE_ORDER = [...NUMERIC_SIZES, ...LETTER_SIZES]

const leadingNumber = (s) => {
  const m = String(s).match(/^\s*(\d+(?:[.,]\d+)?)/)
  return m ? parseFloat(m[1].replace(',', '.')) : null
}

export const sortSizes = (sizes) =>
  [...(sizes || [])].sort((a, b) => {
    const ia = SIZE_ORDER.indexOf(a)
    const ib = SIZE_ORDER.indexOf(b)
    if (ia >= 0 && ib >= 0) return ia - ib
    if (ia >= 0) return -1
    if (ib >= 0) return 1
    const na = leadingNumber(a)
    const nb = leadingNumber(b)
    if (na != null && nb != null && na !== nb) return na - nb
    return String(a).localeCompare(String(b), undefined, { numeric: true })
  })
