import { create } from 'zustand'
import { getAdmin, adminSignIn, adminSignOut } from '../services/api'

export const useAdminStore = create((set) => ({
  admin: null,
  ready: false,
  init: async () => {
    try { set({ admin: await getAdmin(), ready: true }) } catch { set({ admin: null, ready: true }) }
  },
  login: async (email, password) => { const admin = await adminSignIn(email, password); set({ admin }); return admin },
  logout: async () => { await adminSignOut(); set({ admin: null }) },
}))
