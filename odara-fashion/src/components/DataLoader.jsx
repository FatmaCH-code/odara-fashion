import { useEffect } from 'react'
import { useProductsStore } from '../store/productsStore'
import { useAdminStore } from '../store/adminStore'

// loads the catalogue + checks the manager session once when the app starts
export default function DataLoader() {
  useEffect(() => { useProductsStore.getState().load(); useAdminStore.getState().init() }, [])
  return null
}
