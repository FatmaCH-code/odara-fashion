// The bottle in the "Your Blend" panel is the real picture (public/signature-bottle.jpg).
// Its label is blank in the picture; the name and size are written on it live.
export default function PerfumeBottle({ name, size }) {
  const title = (name || 'Your Signature').slice(0, 24)
  const titleSize = title.length <= 10 ? 21 : title.length <= 14 ? 17 : title.length <= 19 ? 13.5 : 11
  return (
    <svg viewBox="0 0 475 372" className="w-full rounded-xl" style={{ display: 'block' }} role="img" aria-label="Your perfume bottle">
      <image href="/signature-bottle.jpg" x="0" y="0" width="475" height="372" preserveAspectRatio="xMidYMid slice" />
      <text x="242" y="182" textAnchor="middle" fontSize="11" letterSpacing="4.5" fill="#7a6a52" fontFamily="Outfit, sans-serif">ODARA</text>
      <line x1="221" y1="193" x2="263" y2="193" stroke="#C9A876" strokeWidth="1" />
      <text x="242" y="226" textAnchor="middle" fontSize={titleSize} fill="#1f1f1f" fontFamily="'Playfair Display', serif">{title}</text>
      <text x="242" y="256" textAnchor="middle" fontSize="10" letterSpacing="2.5" fill="#6f6250" fontFamily="Outfit, sans-serif">
        {size ? size.toUpperCase().replace(/\s*ML/i, ' ML') : ''}
      </text>
    </svg>
  )
}

