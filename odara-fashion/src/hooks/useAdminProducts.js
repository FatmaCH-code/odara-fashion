import { useEffect, useState } from 'react'
import { adminListProducts, adminCreateProduct, adminUpdateProduct, adminDeleteProduct } from '../services/products'

export function useAdminProducts() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const data = await adminListProducts()
      setProducts(data)
      setError('')
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const saveProduct = async (form, editingId) => {
    if (editingId) {
      await adminUpdateProduct(editingId, form)
    } else {
      await adminCreateProduct(form)
    }
    await load()
  }

  const deleteProduct = async (id) => {
    await adminDeleteProduct(id)
    await load()
  }

  return { products, loading, error, reload: load, saveProduct, deleteProduct }
}
