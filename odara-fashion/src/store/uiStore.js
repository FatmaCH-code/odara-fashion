import { create } from 'zustand'

// Small app-wide UI state: the slide-in cart, the quick-add popup and pop-up notifications.
// showToast('Added to your bag', { type: 'success' | 'error' | 'info', title: 'Optional title' })
export const useUiStore = create((set) => ({
  cartOpen: false,
  quickAdd: null,        // the product being quick-added, or null
  toasts: [],            // [{ id, message, title, type, duration }]
  openCart: () => set({ cartOpen: true }),
  closeCart: () => set({ cartOpen: false }),
  openQuickAdd: (product) => set({ quickAdd: product }),
  closeQuickAdd: () => set({ quickAdd: null }),
  showToast: (message, opts = {}) => set((s) => ({
    toasts: [...s.toasts.slice(-2), {
      id: Date.now() + Math.random(),
      message,
      title: opts.title,
      type: opts.type || 'success',
      duration: opts.duration || 3800,
    }],
  })),
  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter(t => t.id !== id) })),
}))
