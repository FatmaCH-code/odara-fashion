// US sizing — numeric (shoes/kids/some regional garment sizing) and standard
// letter sizing, in the fixed logical order they should always display in
// (1→7, S→XXXL) — regardless of what order they were clicked/selected in.
export const NUMERIC_SIZES = ['1', '2', '3', '4', '5', '6', '7']
export const LETTER_SIZES = ['S', 'M', 'L', 'XL', 'XXL', 'XXXL']
const SIZE_ORDER = [...NUMERIC_SIZES, ...LETTER_SIZES]

export const sortSizes = (sizes) =>
  [...(sizes || [])].sort((a, b) => SIZE_ORDER.indexOf(a) - SIZE_ORDER.indexOf(b))
