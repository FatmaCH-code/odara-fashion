import { useEffect, useMemo, useState } from 'react'
import { Check, Leaf, Scale, Sun } from 'lucide-react'
import { useCartStore } from '../store/cartStore'
import { useUiStore } from '../store/uiStore'
import { loadBlendConfig, DEFAULT_BLEND, DEFAULT_LABELS } from '../services/blend'

const CHARACTERS = [
  { id: 'softer', label: 'Softer', Icon: Leaf },
  { id: 'balanced', label: 'Balanced', Icon: Scale },
  { id: 'bolder', label: 'Bolder', Icon: Sun },
]

const visible = (list) => (list || []).filter(o => o.active !== false)
const money = (n) => (Number(n) || 0).toFixed(2)
const GOLD = '#C9A876'

// Small outline bottle used on the size cards.
function BottleIcon({ height = 34 }) {
  return (
    <svg height={height} viewBox="0 0 28 44" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
      <rect x="10" y="1" width="8" height="7" rx="1.5" fill={GOLD} />
      <rect x="12" y="8" width="4" height="4" fill={GOLD} opacity="0.7" />
      <rect x="3" y="12" width="22" height="30" rx="4" stroke={GOLD} strokeWidth="1.6" />
      <rect x="7" y="20" width="14" height="10" rx="1" stroke={GOLD} strokeWidth="1" opacity="0.6" />
    </svg>
  )
}

// Liquid colour follows the chosen scent (rose by default), so the bottle reacts to the customer's choices.
const LIQUIDS = [
  [/oud|wood|cedar|patchouli|sandal/i, ['#e2b98a', '#b9814f']],
  [/amber|saffron|honey/i, ['#f2c27c', '#d98a3c']],
  [/musk|vanilla|white|cotton|coconut/i, ['#fbeedd', '#efd3b8']],
  [/lemon|bergamot|grapefruit|citrus|orange|peach/i, ['#fbe8a6', '#f1c96a']],
  [/lavender|iris|violet|lilac/i, ['#e6d6f2', '#c3a6de']],
  [/jasmine|floral|rose|peony/i, ['#f9d6cc', '#ecaa99']],
]
const liquidFor = (name) => (LIQUIDS.find(([re]) => re.test(name || '')) || [null, ['#f9d6cc', '#ecaa99']])[1]

// The bottle in the "Your Blend" panel: rose-gold cap, thick glass, tinted perfume and a label
// that shows the perfume's name and size.
function PerfumeBottle({ name, size, scent }) {
  const [top, bottom] = liquidFor(scent)
  const title = (name || 'Your Signature').slice(0, 24)
  const titleSize = title.length <= 10 ? 21 : title.length <= 16 ? 17 : 13.5
  return (
    <svg viewBox="0 0 320 400" className="w-full" style={{ maxWidth: 300, borderRadius: 18 }} role="img" aria-label="Your perfume bottle">
      <defs>
        <radialGradient id="pbBg" cx="30%" cy="18%" r="95%">
          <stop offset="0" stopColor="#fdf3ee" /><stop offset="0.55" stopColor="#f6e3da" /><stop offset="1" stopColor="#ecd0c4" />
        </radialGradient>
        <linearGradient id="pbRose" x1="0" x2="1">
          <stop offset="0" stopColor="#7d4d3a" /><stop offset="0.12" stopColor="#c58c75" /><stop offset="0.3" stopColor="#f6d3be" />
          <stop offset="0.5" stopColor="#dca78f" /><stop offset="0.76" stopColor="#b97a62" /><stop offset="1" stopColor="#744635" />
        </linearGradient>
        <linearGradient id="pbLiq" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={top} /><stop offset="1" stopColor={bottom} />
        </linearGradient>
        <linearGradient id="pbLiqSide" x1="0" x2="1">
          <stop offset="0" stopColor="#000" stopOpacity="0.1" /><stop offset="0.18" stopColor="#000" stopOpacity="0" />
          <stop offset="0.82" stopColor="#000" stopOpacity="0" /><stop offset="1" stopColor="#000" stopOpacity="0.12" />
        </linearGradient>
        <linearGradient id="pbHL" x1="0" x2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.95" /><stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="pbBase" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.15" /><stop offset="1" stopColor="#fff" stopOpacity="0.7" />
        </linearGradient>
        <filter id="pbBlur" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="9" /></filter>
        <filter id="pbBlurS" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation="4" /></filter>
      </defs>

      <rect width="320" height="400" fill="url(#pbBg)" />
      {/* soft leaf shadows in the background */}
      <g filter="url(#pbBlur)" opacity="0.5">
        <ellipse cx="42" cy="110" rx="16" ry="70" fill="#fff" transform="rotate(-18 42 110)" />
        <ellipse cx="288" cy="70" rx="14" ry="60" fill="#fff" transform="rotate(22 288 70)" />
        <ellipse cx="20" cy="250" rx="12" ry="46" fill="#c99a8a" opacity="0.5" transform="rotate(14 20 250)" />
      </g>
      {/* floor shadow */}
      <ellipse cx="160" cy="352" rx="118" ry="11" fill="#5a3a2e" opacity="0.22" filter="url(#pbBlurS)" />

      {/* cap */}
      <rect x="116" y="22" width="88" height="78" rx="3" fill="url(#pbRose)" />
      <ellipse cx="160" cy="22" rx="44" ry="5" fill="#f3cdb8" stroke="#b5755f" strokeWidth="0.8" />
      <rect x="133" y="27" width="6" height="68" fill="#fff" opacity="0.3" />
      <rect x="116" y="95" width="88" height="5" fill="#5e3828" opacity="0.45" />
      {/* collar + neck */}
      <rect x="128" y="100" width="64" height="9" rx="2" fill="url(#pbRose)" />
      <rect x="134" y="109" width="52" height="14" fill="#fff" opacity="0.55" stroke="#d8c7c0" strokeWidth="0.8" />

      {/* glass body */}
      <rect x="50" y="120" width="220" height="222" rx="26" fill="#fff" opacity="0.28" />
      {/* perfume */}
      <rect x="63" y="140" width="194" height="184" rx="16" fill="url(#pbLiq)" />
      <rect x="63" y="140" width="194" height="184" rx="16" fill="url(#pbLiqSide)" />
      <ellipse cx="160" cy="141" rx="97" ry="6" fill="#fff" opacity="0.5" />
      {/* thick glass base */}
      <rect x="55" y="314" width="210" height="26" rx="12" fill="url(#pbBase)" />
      {/* glass edges and highlights */}
      <rect x="50" y="120" width="220" height="222" rx="26" fill="none" stroke="#cdbbb3" strokeWidth="1.4" />
      <rect x="55.5" y="125.5" width="209" height="211" rx="22" fill="none" stroke="#fff" strokeOpacity="0.85" strokeWidth="2" />
      <rect x="57" y="134" width="13" height="190" rx="6" fill="url(#pbHL)" opacity="0.9" />
      <rect x="252" y="140" width="7" height="176" rx="3" fill="#fff" opacity="0.4" />
      <polygon points="92,142 120,142 94,322 68,322" fill="#fff" opacity="0.16" />
      <path d="M76 128 Q160 118 244 128" fill="none" stroke="#fff" strokeOpacity="0.8" strokeWidth="2" strokeLinecap="round" />

      {/* label */}
      <rect x="92" y="176" width="136" height="96" fill="#fffdf9" opacity="0.95" stroke="#d9c7a8" strokeWidth="0.8" />
      <text x="160" y="202" textAnchor="middle" fontSize="10" letterSpacing="4" fill="#8a7a63" fontFamily="Outfit, sans-serif">ODARA</text>
      <line x1="142" y1="211" x2="178" y2="211" stroke="#C9A876" strokeWidth="0.9" />
      <text x="160" y="241" textAnchor="middle" fontSize={titleSize} fill="#2C2C2C" fontFamily="'Playfair Display', serif">{title}</text>
      <text x="160" y="261" textAnchor="middle" fontSize="8.5" letterSpacing="2.5" fill="#8a7a63" fontFamily="Outfit, sans-serif">
        {size ? size.toUpperCase().replace(/\s*ML/i, ' ML') : ''}
      </text>
    </svg>
  )
}

function Thumb({ item }) {
  if (item.image) return <img src={item.image} alt="" loading="lazy" className="w-14 h-14 rounded-lg object-cover flex-shrink-0" />
  return (
    <span className="w-14 h-14 rounded-lg flex-shrink-0 flex items-center justify-center font-playfair text-xl text-C9A876 bg-F5EFE0">
      {(item.name || '?').charAt(0)}
    </span>
  )
}

export default function MakePerfume() {
  const [cfg, setCfg] = useState(DEFAULT_BLEND)
  const [pick, setPick] = useState({ name: '', base: null, sub: null, twist: null, character: 'balanced', size: null })
  const addToCart = useCartStore(state => state.addItem)
  const openCart = useUiStore(state => state.openCart)
  const showToast = useUiStore(state => state.showToast)

  // Step 2 shows every note from the three admin groups as ONE list of "twists".
  const twists = useMemo(() => [
    ...visible(cfg.topNotes).map(o => ({ ...o, slot: 'topNote' })),
    ...visible(cfg.middleNotes).map(o => ({ ...o, slot: 'middleNote' })),
    ...visible(cfg.baseNotes).map(o => ({ ...o, slot: 'baseNote' })),
  ], [cfg])
  const L = { ...DEFAULT_LABELS, ...(cfg.labels || {}) }
  const bases = visible(cfg.bases)
  const sizes = visible(cfg.sizes)

  useEffect(() => {
    loadBlendConfig().then(c => {
      setCfg(c)
      const first = visible(c.sizes)[0]
      setPick(p => ({ ...p, size: first ? first.id : null }))
    })
  }, [])

  const baseOpt = bases.find(b => String(b.id) === String(pick.base))
  const subs = visible(baseOpt?.subs)
  const subOpt = subs.find(x => String(x.id) === String(pick.sub))
  const twistOpt = twists.find(t => String(t.id) === String(pick.twist))
  const sizeOpt = sizes.find(s => s.id === pick.size)
  const charOpt = CHARACTERS.find(c => c.id === pick.character)
  const total = Number(sizeOpt?.price) || 0

  const startOver = () => setPick({ name: '', base: null, sub: null, twist: null, character: 'balanced', size: sizes[0]?.id || null })
  const surprise = () => {
    const r = (list) => list[Math.floor(Math.random() * list.length)]
    const hasTwist = twists.length > 0 && Math.random() > 0.3
    const b = bases.length ? r(bases) : null
    const bSubs = visible(b?.subs)
    setPick(p => ({
      ...p,
      base: b ? String(b.id) : null,
      sub: bSubs.length ? String(r(bSubs).id) : null,
      twist: hasTwist ? String(r(twists).id) : null,
      character: r(CHARACTERS).id,
    }))
  }

  const handleAddToCart = () => {
    if (!baseOpt) {
      showToast(`${L.base} to start your blend.`, { type: 'error', title: 'Choice needed' })
      return
    }
    if (subs.length > 0 && !subOpt) {
      showToast(`Choose a type of ${baseOpt.name}.`, { type: 'error', title: 'Type needed' })
      return
    }
    if (!sizeOpt) {
      showToast('Choose a bottle size.', { type: 'error', title: 'Size needed' })
      return
    }
    if (total <= 0) {
      showToast('This size is not available yet. Please try again soon.', { type: 'error', title: 'Unavailable' })
      return
    }
    addToCart({
      id: Date.now(),
      name: pick.name.trim() || 'Custom Fragrance Blend',
      price: Number(money(total)),
      category: 'Custom Blend',
      // The recipe travels with the order; the server prices it again from the admin's settings.
      blend: {
        base: String(baseOpt.id),
        ...(subOpt ? { sub: String(subOpt.id) } : {}),
        ...(twistOpt ? { [twistOpt.slot]: String(twistOpt.id) } : {}),
        character: pick.character,
        size: sizeOpt.id,
      },
      quantity: 1,
    })
    showToast('Your custom blend is in the bag — it is prepared within 7 days.', { title: 'Added to bag' })
    openCart()
  }

  const card = (selected) =>
    `relative text-left border transition rounded-xl bg-white ${selected ? 'border-C9A876 bg-F5EFE0 shadow-sm' : 'border-E8D9C4 hover:border-C9A876'}`
  const badge = (
    <span className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center text-white" style={{ background: GOLD }}>
      <Check className="w-3 h-3" strokeWidth={3} />
    </span>
  )
  const heading = (n, title, sub) => (
    <div className="mb-4">
      <h2 className="font-playfair text-2xl text-2C2C2C">{n}. {title}</h2>
      {sub && <p className="text-sm text-2C2C2C/60 mt-1">{sub}</p>}
    </div>
  )

  return (
    <div>
      <div className="pt-12 pb-8 text-center">
        <div className="container-premium">
          <h1 className="text-4xl md:text-5xl font-playfair text-2C2C2C mb-3">Create Your Signature Scent</h1>
          <div className="mx-auto mb-3" style={{ width: 48, height: 1, background: GOLD }} />
          <p className="text-lg text-2C2C2C/60">Two favorites. One scent that is uniquely yours.</p>
        </div>
      </div>

      <div className="pb-20">
        <div className="container-premium">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2 space-y-10">

              <section>
                {heading(1, L.base)}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                  {bases.map(o => (
                    <button key={o.id} type="button" onClick={() => setPick(p => ({ ...p, base: String(o.id), sub: String(p.base) === String(o.id) ? p.sub : null }))}
                      className={`${card(String(pick.base) === String(o.id))} flex items-center gap-3 p-3 pr-8`}>
                      <Thumb item={o} />
                      <span className="min-w-0">
                        <span className="block font-semibold text-2C2C2C">{o.name}</span>
                        {o.tagline && <span className="block text-sm text-2C2C2C/60">{o.tagline}</span>}
                      </span>
                      {String(pick.base) === String(o.id) && badge}
                    </button>
                  ))}
                </div>
              </section>

              {subs.length > 0 && (
                <section>
                  {heading('1b', `Choose your ${baseOpt.name}`, 'Pick the type you prefer.')}
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                    {subs.map(o => (
                      <button key={o.id} type="button" onClick={() => setPick(p => ({ ...p, sub: String(o.id) }))}
                        className={`${card(String(pick.sub) === String(o.id))} flex items-center gap-3 p-3 pr-8`}>
                        <Thumb item={o} />
                        <span className="min-w-0">
                          <span className="block font-semibold text-2C2C2C">{o.name}</span>
                          {o.tagline && <span className="block text-sm text-2C2C2C/60">{o.tagline}</span>}
                        </span>
                        {String(pick.sub) === String(o.id) && badge}
                      </button>
                    ))}
                  </div>
                </section>
              )}

              <section>
                {heading(2, L.twist, 'Choose a second scent, or keep it simple.')}
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                  {twists.map(o => (
                    <button key={o.id} type="button" onClick={() => setPick(p => ({ ...p, twist: String(p.twist) === String(o.id) ? null : String(o.id) }))}
                      className={`${card(String(pick.twist) === String(o.id))} flex items-center gap-3 p-2.5 pr-8`}>
                      <Thumb item={o} />
                      <span className="min-w-0">
                        <span className="block font-semibold text-2C2C2C leading-tight">{o.name}</span>
                        {o.tagline && <span className="block text-xs text-2C2C2C/60">{o.tagline}</span>}
                      </span>
                      {String(pick.twist) === String(o.id) && badge}
                    </button>
                  ))}
                  <button type="button" onClick={() => setPick(p => ({ ...p, twist: null }))}
                    className={`${card(!pick.twist)} flex items-center gap-3 p-2.5 pr-8`}>
                    <span className="w-14 h-14 flex items-center justify-center flex-shrink-0 text-C9A876"><Leaf className="w-6 h-6" /></span>
                    <span className="font-semibold text-2C2C2C leading-tight">No second scent</span>
                    {!pick.twist && badge}
                  </button>
                </div>
              </section>

              <section>
                {heading(3, L.character, 'Tell us how you would like your blend to feel.')}
                <div className="grid grid-cols-3 gap-3">
                  {CHARACTERS.map(({ id, label, Icon }) => (
                    <button key={id} type="button" onClick={() => setPick(p => ({ ...p, character: id }))}
                      className={`${card(pick.character === id)} flex items-center justify-center gap-3 py-5`}>
                      <Icon className="w-6 h-6 text-C9A876" strokeWidth={1.5} />
                      <span className="font-semibold text-2C2C2C">{label}</span>
                      {pick.character === id && badge}
                    </button>
                  ))}
                </div>
              </section>

              {sizes.length > 0 && (
                <section>
                  {heading(4, L.size)}
                  <div className="grid grid-cols-3 gap-3">
                    {sizes.map((o, i) => (
                      <button key={o.id} type="button" onClick={() => setPick(p => ({ ...p, size: o.id }))}
                        className={`${card(pick.size === o.id)} flex items-center justify-center gap-3 py-4`}>
                        <BottleIcon height={30 + Math.min(i, 2) * 7} />
                        <span>
                          <span className="block font-semibold text-2C2C2C">{o.label}</span>
                          <span className="block text-sm text-2C2C2C/60">${money(o.price)}</span>
                        </span>
                        {pick.size === o.id && badge}
                      </button>
                    ))}
                  </div>
                </section>
              )}

              <section>
                {heading(5, L.name)}
                <input
                  type="text"
                  maxLength={30}
                  placeholder="e.g., Velvet Rose, My Signature…"
                  value={pick.name}
                  onChange={(e) => setPick({ ...pick, name: e.target.value })}
                  className="w-full p-4 border border-E8D9C4 rounded-xl text-base bg-white"
                />
                <button type="button" onClick={surprise} className="mt-3 text-sm underline text-C9A876 hover:opacity-80">
                  Need inspiration? Help me choose
                </button>
              </section>
            </div>

            <div className="lg:col-span-1">
              <div className="bg-F5EFE0 border border-E8D9C4 rounded-2xl p-7 lg:sticky lg:top-28 text-center">
                <h3 className="text-3xl font-playfair text-2C2C2C mb-4">Your Blend</h3>
                <div className="flex justify-center mb-6">
                  <PerfumeBottle name={pick.name.trim()} size={sizeOpt?.label} scent={`${baseOpt?.name || ''} ${twistOpt?.name || ''}`} />
                </div>

                <dl className="text-sm space-y-2 text-left mb-5">
                  <div className="flex justify-between gap-4"><dt className="text-2C2C2C/70">{L.baseName}</dt><dd className="text-2C2C2C text-right">{baseOpt ? (subOpt ? `${baseOpt.name} — ${subOpt.name}` : baseOpt.name) : '—'}</dd></div>
                  <div className="flex justify-between gap-4"><dt className="text-2C2C2C/70">Added twist</dt><dd className="text-2C2C2C">{twistOpt?.name || 'None'}</dd></div>
                  <div className="flex justify-between gap-4"><dt className="text-2C2C2C/70">Character</dt><dd className="text-2C2C2C">{charOpt?.label}</dd></div>
                  <div className="flex justify-between gap-4"><dt className="text-2C2C2C/70">Bottle</dt><dd className="text-2C2C2C">{sizeOpt?.label || '—'}</dd></div>
                </dl>

                <div className="border-t border-C9A876 pt-4 mb-5 flex justify-between items-baseline">
                  <span className="font-playfair text-xl text-2C2C2C">Total</span>
                  <span className="font-playfair text-3xl text-2C2C2C">${money(total)}</span>
                </div>

                <button type="button" onClick={handleAddToCart} className="btn-gold w-full uppercase tracking-widest">Create my perfume</button>
                <button type="button" onClick={startOver} className="mt-4 text-sm underline text-2C2C2C/70 hover:text-2C2C2C">Start over</button>
                <p className="text-xs text-2C2C2C/50 mt-4">Blended to order and delivered within 7 business days.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
