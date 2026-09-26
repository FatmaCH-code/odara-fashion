import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useCartStore } from '../store/cartStore'

const baseOils = [
  { id: 1, name: 'Oud Pure', price: 34.99 },
  { id: 2, name: 'Sandalwood', price: 29.99 },
  { id: 3, name: 'Amber Musk', price: 34.99 },
  { id: 4, name: 'Floral Blend', price: 29.99 },
]

const topNotes = [
  { id: 101, name: 'Lemon', price: 5 },
  { id: 102, name: 'Bergamot', price: 5 },
  { id: 103, name: 'Grapefruit', price: 5 },
  { id: 104, name: 'Lavender', price: 5 },
]

const middleNotes = [
  { id: 201, name: 'Rose', price: 8 },
  { id: 202, name: 'Jasmine', price: 8 },
  { id: 203, name: 'Iris', price: 8 },
  { id: 204, name: 'Peach', price: 8 },
]

const baseNotes = [
  { id: 301, name: 'Vanilla', price: 6 },
  { id: 302, name: 'Musk', price: 6 },
  { id: 303, name: 'Cedar', price: 6 },
  { id: 304, name: 'Patchouli', price: 6 },
]

export default function MakePerfume() {
  const [customBlend, setCustomBlend] = useState({
    name: '',
    base: null,
    topNote: null,
    middleNote: null,
    baseNote: null,
    bottle: 'small'
  })

  const addToCart = useCartStore(state => state.addItem)

  const calculatePrice = () => {
    let price = 0
    if (customBlend.base) {
      price += baseOils.find(o => o.id === customBlend.base)?.price || 0
    }
    if (customBlend.topNote) {
      price += topNotes.find(o => o.id === customBlend.topNote)?.price || 0
    }
    if (customBlend.middleNote) {
      price += middleNotes.find(o => o.id === customBlend.middleNote)?.price || 0
    }
    if (customBlend.baseNote) {
      price += baseNotes.find(o => o.id === customBlend.baseNote)?.price || 0
    }
    return price.toFixed(2)
  }

  const handleAddToCart = () => {
    if (!customBlend.base) {
      alert('Please select a base oil')
      return
    }

    const item = {
      id: Date.now(),
      name: customBlend.name || 'Custom Fragrance Blend',
      price: parseFloat(calculatePrice()),
      category: 'Custom Blend',
      quantity: 1
    }

    addToCart(item)
    alert('Added to cart! Your custom blend will be prepared within 7 days.')
  }

  return (
    <div>
      {/* Header */}
      <div className="bg-F5EFE0 py-12">
        <div className="container-premium">
          <h1 className="text-5xl font-playfair text-2C2C2C mb-4">Create Your Signature Scent</h1>
          <p className="text-lg text-2C2C2C/70">Blend luxury oils to craft your perfect fragrance</p>
        </div>
      </div>

      {/* Blending Studio */}
      <div className="section-premium">
        <div className="container-premium">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Blender */}
            <div className="lg:col-span-2">
              <div className="bg-white p-8 border border-E8D9C4">
                {/* Blend Name */}
                <div className="mb-8">
                  <label className="block text-sm uppercase tracking-widest font-semibold mb-3 text-2C2C2C">
                    Name Your Fragrance
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., My Signature, Evening Rose..."
                    value={customBlend.name}
                    onChange={(e) => setCustomBlend({...customBlend, name: e.target.value})}
                    className="w-full p-4 border border-E8D9C4 text-sm"
                  />
                </div>

                {/* Base Selection */}
                <div className="mb-8">
                  <label className="block text-sm uppercase tracking-widest font-semibold mb-4 text-2C2C2C">
                    Step 1: Choose Base Oil
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {baseOils.map(oil => (
                      <button
                        key={oil.id}
                        onClick={() => setCustomBlend({...customBlend, base: oil.id})}
                        className={`p-4 text-left border-2 transition ${
                          customBlend.base === oil.id
                            ? 'border-C9A876 bg-F5EFE0'
                            : 'border-E8D9C4 hover:border-C9A876'
                        }`}
                      >
                        <div className="font-semibold text-2C2C2C">{oil.name}</div>
                        <div className="text-sm text-2C2C2C/60">${oil.price}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Top Notes */}
                <div className="mb-8">
                  <label className="block text-sm uppercase tracking-widest font-semibold mb-4 text-2C2C2C">
                    Step 2: Add Top Notes (Citrus & Herbs)
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {topNotes.map(note => (
                      <button
                        key={note.id}
                        onClick={() => setCustomBlend({...customBlend, topNote: note.id})}
                        className={`p-3 text-left border-2 transition ${
                          customBlend.topNote === note.id
                            ? 'border-C9A876 bg-F5EFE0'
                            : 'border-E8D9C4 hover:border-C9A876'
                        }`}
                      >
                        <div className="font-semibold text-2C2C2C">{note.name}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Middle Notes */}
                <div className="mb-8">
                  <label className="block text-sm uppercase tracking-widest font-semibold mb-4 text-2C2C2C">
                    Step 3: Add Middle Notes (Florals)
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {middleNotes.map(note => (
                      <button
                        key={note.id}
                        onClick={() => setCustomBlend({...customBlend, middleNote: note.id})}
                        className={`p-3 text-left border-2 transition ${
                          customBlend.middleNote === note.id
                            ? 'border-C9A876 bg-F5EFE0'
                            : 'border-E8D9C4 hover:border-C9A876'
                        }`}
                      >
                        <div className="font-semibold text-2C2C2C">{note.name}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Base Notes */}
                <div className="mb-8">
                  <label className="block text-sm uppercase tracking-widest font-semibold mb-4 text-2C2C2C">
                    Step 4: Add Base Notes (Woody & Amber)
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {baseNotes.map(note => (
                      <button
                        key={note.id}
                        onClick={() => setCustomBlend({...customBlend, baseNote: note.id})}
                        className={`p-3 text-left border-2 transition ${
                          customBlend.baseNote === note.id
                            ? 'border-C9A876 bg-F5EFE0'
                            : 'border-E8D9C4 hover:border-C9A876'
                        }`}
                      >
                        <div className="font-semibold text-2C2C2C">{note.name}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Bottle Size */}
                <div>
                  <label className="block text-sm uppercase tracking-widest font-semibold mb-4 text-2C2C2C">
                    Bottle Size
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { size: 'small', ml: '30ml', price: '+$0' },
                      { size: 'medium', ml: '50ml', price: '+$10' },
                      { size: 'large', ml: '100ml', price: '+$20' }
                    ].map(option => (
                      <button
                        key={option.size}
                        onClick={() => setCustomBlend({...customBlend, bottle: option.size})}
                        className={`p-4 text-center border-2 transition ${
                          customBlend.bottle === option.size
                            ? 'border-C9A876 bg-F5EFE0'
                            : 'border-E8D9C4 hover:border-C9A876'
                        }`}
                      >
                        <div className="font-semibold text-2C2C2C">{option.ml}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="lg:col-span-1">
              <div className="bg-F5EFE0 p-8 sticky top-32">
                <h3 className="text-2xl font-playfair text-2C2C2C mb-6">Your Blend</h3>

                <div className="space-y-4 mb-8">
                  {customBlend.base && (
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm uppercase tracking-widest text-2C2C2C/60">Base</p>
                        <p className="font-semibold text-2C2C2C">{baseOils.find(o => o.id === customBlend.base)?.name}</p>
                      </div>
                    </div>
                  )}
                  {customBlend.topNote && (
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm uppercase tracking-widest text-2C2C2C/60">Top Note</p>
                        <p className="font-semibold text-2C2C2C">{topNotes.find(o => o.id === customBlend.topNote)?.name}</p>
                      </div>
                    </div>
                  )}
                  {customBlend.middleNote && (
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm uppercase tracking-widest text-2C2C2C/60">Middle Note</p>
                        <p className="font-semibold text-2C2C2C">{middleNotes.find(o => o.id === customBlend.middleNote)?.name}</p>
                      </div>
                    </div>
                  )}
                  {customBlend.baseNote && (
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm uppercase tracking-widest text-2C2C2C/60">Base Note</p>
                        <p className="font-semibold text-2C2C2C">{baseNotes.find(o => o.id === customBlend.baseNote)?.name}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="border-t border-D4C4B0 pt-6 mb-6">
                  <div className="flex justify-between mb-4">
                    <span className="text-2C2C2C/70">Blend Total</span>
                    <span className="font-playfair text-2xl text-C9A876">${calculatePrice()}</span>
                  </div>
                  <p className="text-sm text-2C2C2C/60 mb-4">
                    Your custom fragrance will be expertly blended and delivered within 7 business days.
                  </p>
                  <button onClick={handleAddToCart} className="btn-gold w-full">
                    Add to Cart
                  </button>
                </div>

                <Link to="/perfumes" className="btn-outline w-full text-center block">
                  Browse Perfumes
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
