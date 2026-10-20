import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useCartStore } from '../store/cartStore'
import { useUiStore } from '../store/uiStore'
import { loadBlendConfig, DEFAULT_BLEND } from '../services/blend'

const STEPS = [
  { slot: 'base', list: 'bases', title: 'Step 1: Choose Base Oil', label: 'Base' },
  { slot: 'topNote', list: 'topNotes', title: 'Step 2: Add Top Notes (Citrus & Herbs)', label: 'Top Note' },
  { slot: 'middleNote', list: 'middleNotes', title: 'Step 3: Add Middle Notes (Florals)', label: 'Middle Note' },
  { slot: 'baseNote', list: 'baseNotes', title: 'Step 4: Add Base Notes (Woody & Amber)', label: 'Base Note' },
]

const visible = (list) => (list || []).filter(o => o.active !== false)
const money = (n) => (Number(n) || 0).toFixed(2)

export default function MakePerfume() {
  const [cfg, setCfg] = useState(DEFAULT_BLEND)
  const [pick, setPick] = useState({ name: '', base: null, topNote: null, middleNote: null, baseNote: null, size: null })
  const addToCart = useCartStore(state => state.addItem)
  const openCart = useUiStore(state => state.openCart)
  const showToast = useUiStore(state => state.showToast)

  useEffect(() => {
    loadBlendConfig().then(c => {
      setCfg(c)
      // Smallest/first visible size is preselected.
      const first = visible(c.sizes)[0]
      setPick(p => ({ ...p, size: first ? first.id : null }))
    })
  }, [])

  const find = (list, id) => visible(cfg[list]).find(o => String(o.id) === String(id))
  const sizes = visible(cfg.sizes)
  const sizeOpt = sizes.find(s => s.id === pick.size)

  const total = () => {
    let t = 0
    for (const s of STEPS) if (s.slot !== 'base' && pick[s.slot]) t += Number(find(s.list, pick[s.slot])?.price) || 0
    return t + (Number(sizeOpt?.price) || 0)
  }

  // Click again to unselect an optional note.
  const choose = (s, id) => setPick(p => ({ ...p, [s.slot]: s.slot !== 'base' && p[s.slot] === id ? null : id }))

  const handleAddToCart = () => {
    if (!pick.base) {
      showToast('Choose a base oil to start your blend.', { type: 'error', title: 'Base oil needed' })
      return
    }
    if (sizes.length > 0 && !sizeOpt) {
      showToast('Choose a bottle size.', { type: 'error', title: 'Size needed' })
      return
    }
    if (total() <= 0) {
      showToast('This blend is not available yet. Please try again soon.', { type: 'error', title: 'Unavailable' })
      return
    }
    addToCart({
      id: Date.now(),
      name: pick.name || 'Custom Fragrance Blend',
      price: Number(money(total())),
      category: 'Custom Blend',
      // The recipe travels with the order; the server prices it again from the admin's settings.
      blend: {
        base: pick.base,
        ...(pick.topNote ? { topNote: pick.topNote } : {}),
        ...(pick.middleNote ? { middleNote: pick.middleNote } : {}),
        ...(pick.baseNote ? { baseNote: pick.baseNote } : {}),
        ...(sizeOpt ? { size: sizeOpt.id } : {}),
      },
      quantity: 1,
    })
    showToast('Your custom blend is in the bag — it is prepared within 7 days.', { title: 'Added to bag' })
    openCart()
  }

  const card = (selected) => `p-4 text-left border-2 transition ${selected ? 'border-C9A876 bg-F5EFE0' : 'border-E8D9C4 hover:border-C9A876'}`

  return (
    <div>
      <div className="bg-F5EFE0 py-12">
        <div className="container-premium">
          <h1 className="text-5xl font-playfair text-2C2C2C mb-4">Create Your Signature Scent</h1>
          <p className="text-lg text-2C2C2C/70">Blend luxury oils to craft your perfect fragrance</p>
        </div>
      </div>

      <div className="section-premium">
        <div className="container-premium">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2">
              <div className="bg-white p-8 border border-E8D9C4">
                <div className="mb-8">
                  <label className="block text-sm uppercase tracking-widest font-semibold mb-3 text-2C2C2C">Name Your Fragrance</label>
                  <input
                    type="text"
                    placeholder="e.g., My Signature, Evening Rose..."
                    value={pick.name}
                    onChange={(e) => setPick({ ...pick, name: e.target.value })}
                    className="w-full p-4 border border-E8D9C4 text-sm"
                  />
                </div>

                {STEPS.map(s => {
                  const items = visible(cfg[s.list])
                  if (!items.length) return null
                  return (
                    <div className="mb-8" key={s.slot}>
                      <label className="block text-sm uppercase tracking-widest font-semibold mb-4 text-2C2C2C">{s.title}</label>
                      <div className="grid grid-cols-2 gap-3">
                        {items.map(o => (
                          <button key={o.id} type="button" onClick={() => choose(s, String(o.id))} className={`${card(String(pick[s.slot]) === String(o.id))} ${o.image ? '!p-0 overflow-hidden' : ''}`}>
                            {o.image && <img src={o.image} alt={o.name} loading="lazy" className="w-full aspect-square object-cover" />}
                            <div className={o.image ? 'p-3' : ''}>
                              <div className="font-semibold text-2C2C2C">{o.name}</div>
                              {s.slot !== 'base' && Number(o.price) > 0 && <div className="text-sm text-2C2C2C/60">+${money(o.price)}</div>}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )
                })}

                {sizes.length > 0 && (
                  <div>
                    <label className="block text-sm uppercase tracking-widest font-semibold mb-4 text-2C2C2C">Bottle Size</label>
                    <div className="grid grid-cols-3 gap-3">
                      {sizes.map(o => (
                        <button key={o.id} type="button" onClick={() => setPick({ ...pick, size: o.id })} className={`${card(pick.size === o.id)} text-center`}>
                          <div className="font-semibold text-2C2C2C">{o.label}</div>
                          <div className="text-sm text-2C2C2C/60">${money(o.price)}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="bg-F5EFE0 p-8 sticky top-32">
                <h3 className="text-2xl font-playfair text-2C2C2C mb-6">Your Blend</h3>
                <div className="space-y-4 mb-8">
                  {STEPS.map(s => pick[s.slot] && find(s.list, pick[s.slot]) && (
                    <div key={s.slot}>
                      <p className="text-sm uppercase tracking-widest text-2C2C2C/60">{s.label}</p>
                      <p className="font-semibold text-2C2C2C">{find(s.list, pick[s.slot]).name}</p>
                    </div>
                  ))}
                  {sizeOpt && (
                    <div>
                      <p className="text-sm uppercase tracking-widest text-2C2C2C/60">Bottle</p>
                      <p className="font-semibold text-2C2C2C">{sizeOpt.label}</p>
                    </div>
                  )}
                </div>

                <div className="border-t border-D4C4B0 pt-6 mb-6">
                  <div className="flex justify-between mb-4">
                    <span className="text-2C2C2C/70">Blend Total</span>
                    <span className="font-playfair text-2xl text-C9A876">${money(total())}</span>
                  </div>
                  <p className="text-sm text-2C2C2C/60 mb-4">Your custom fragrance will be expertly blended and delivered within 7 business days.</p>
                  <button onClick={handleAddToCart} className="btn-gold w-full">Add to Cart</button>
                </div>

                <Link to="/perfumes" className="btn-outline w-full text-center block">Browse Perfumes</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
