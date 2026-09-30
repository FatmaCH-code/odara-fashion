import { useEffect, useState } from 'react'
import { getProducts } from '../services/products'
import { allProducts as staticAllProducts } from '../data/products'

export function useProducts() {
  const [products, setProducts] = useState(staticAllProducts)
  const [isLive, setIsLive] = useState(false)

  useEffect(() => {
    let cancelled = false
    getProducts((liveProducts) => {
      if (!cancelled) {
        setProducts(liveProducts)
        setIsLive(true)
      }
    })
    return () => { cancelled = true }
  }, [])

  return { products, isLive }
}
