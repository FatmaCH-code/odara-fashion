import { useEffect, useMemo, useState } from 'react'
import { Check, Leaf, Scale, Sun } from 'lucide-react'
import { useCartStore } from '../store/cartStore'
import { useUiStore } from '../store/uiStore'
import { loadBlendConfig, DEFAULT_BLEND } from '../services/blend'

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

// The big bottle in the "Your Blend" panel: the label shows the perfume's name and size.
function PerfumeBottle({ name, size }) {
  return (
    <svg viewBox="0 0 220 280" className="w-full" style={{ maxWidth: 230 }} role="img" aria-label="Your perfume bottle">
      <defs>
        <linearGradient id="pbCap" x1="0" x2="1">
          <stop offset="0" stopColor="#9c7a3c" /><stop offset="0.45" stopColor="#f0d79a" /><stop offset="1" stopColor="#a07f40" />
        </linearGradient>
        <linearGradient id="pbLiquid" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#f6d3bf" /><stop offset="1" stopColor="#e9b79c" />
        </linearGradient>
        <linearGradient id="pbGlass" x1="0" x2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.85" /><stop offset="0.5" stopColor="#ffffff" stopOpacity="0.15" /><stop offset="1" stopColor="#ffffff" stopOpacity="0.6" />
        </linearGradient>
      </defs>
      <ellipse cx="110" cy="268" rx="78" ry="7" fill="#2C2C2C" opacity="0.12" />
      <rect x="86" y="8" width="48" height="46" rx="4" fill="url(#pbCap)" />
      <rect x="98" y="54" width="24" height="12" fill="#cdb98f" />
      <rect x="28" y="66" width="164" height="196" rx="16" fill="url(#pbLiquid)" stroke="#d9c7a8" strokeWidth="3" />
      <rect x="28" y="66" width="164" height="196" rx="16" fill="url(#pbGlass)" />
      <rect x="52" y="112" width="116" height="104" fill="#fffdf9" stroke="#d9c7a8" strokeWidth="1" />
      <text x="110" y="136" textAnchor="middle" fontSize="9" letterSpacing="3" fill="#8a7a63" fontFamily="Outfit, sans-serif">ODARA</text>
      <line x1="96" y1="144" x2="124" y2="144" stroke={GOLD} strokeWidth="1" />
      <text x="110" y="172" textAnchor="middle" fontSize={name && name.length > 14 ? 13 : 17} fill="#2C2C2C" fontFamily="'Playfair Display', serif">
        {(name || 'Your Signature').slice(0, 22)}
      </text>
      <text x="110" y="200" textAnchor="middle" fontSize="8" letterSpacing="2" fill="#8a7a63" fontFamily="Outfit, sans-serif">
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
      showToast('Choose your main scent to start your blend.', { type: 'error', title: 'Main scent needed' })
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
                {heading(1, 'Choose your main scent')}
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
                {heading(2, 'Add a twist', 'Choose a second scent, or keep it simple.')}
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
                {heading(3, 'Choose your scent character', 'Tell us how you would like your blend to feel.')}
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
                  {heading(4, 'Select your bottle')}
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
                {heading(5, 'Name your creation')}
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
                  <PerfumeBottle name={pick.name.trim()} size={sizeOpt?.label} />
                </div>

                <dl className="text-sm space-y-2 text-left mb-5">
                  <div className="flex justify-between gap-4"><dt className="text-2C2C2C/70">Main scent</dt><dd className="text-2C2C2C text-right">{baseOpt ? (subOpt ? `${baseOpt.name} — ${subOpt.name}` : baseOpt.name) : '—'}</dd></div>
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
