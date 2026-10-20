import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// A cart line is a product AND its color/size (or a specific custom blend) — so the same
// thoub in size M and size L are two lines, not one line with quantity 2.
export const getLineId = (item) =>
  item.lineId || [item.id, item.color || '', item.size || '', item.blend ? JSON.stringify(item.blend) : ''].join('|')

export const useCartStore = create(
  persist(
    (set) => ({
      items: [],
      addItem: (item) => set((state) => {
        const lineId = getLineId(item)
        const existing = state.items.find(i => getLineId(i) === lineId)
        if (existing) {
          return {
            items: state.items.map(i =>
              getLineId(i) === lineId
                ? { ...i, quantity: i.quantity + (item.quantity || 1) }
                : i
            )
          }
        }
        return { items: [...state.items, { ...item, lineId, quantity: item.quantity || 1 }] }
      }),
      removeItem: (lineId) => set((state) => ({
        items: state.items.filter(i => getLineId(i) !== lineId)
      })),
      updateQuantity: (lineId, quantity) => set((state) => ({
        items: quantity < 1
          ? state.items.filter(i => getLineId(i) !== lineId)
          : state.items.map(i => getLineId(i) === lineId ? { ...i, quantity: Math.min(99, quantity) } : i)
      })),
      clearCart: () => set({ items: [] })
    }),
    { name: 'odara-cart' }
  )
)
