import { create } from 'zustand'
import { listProducts } from '../services/api'

export const useProductsStore = create((set, get) => ({
  products: [],
  loaded: false,
  loading: false,
  error: null,

  load: async (force = false) => {
    if (get().loading || (get().loaded && !force)) return
    set({ loading: true, error: null })
    try {
      const products = await listProducts()
      set({ products, loaded: true, loading: false })
    } catch (e) {
      set({ error: e.message, loading: false, loaded: true })
    }
  },
  upsert: (p) => set((s) => ({
    products: s.products.some((x) => x.id === p.id) ? s.products.map((x) => (x.id === p.id ? p : x)) : [...s.products, p],
  })),
  remove: (id) => set((s) => ({ products: s.products.filter((x) => x.id !== id) })),
}))

// what shoppers may see: only active products
export const selectShop = (s) => s.products.filter((p) => p.active)
