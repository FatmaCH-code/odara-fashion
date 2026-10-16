import { useEffect, useState } from 'react'
import { getMuseItems } from '../services/muse'
import { useProducts } from './useProducts'
import { isFashion } from '../utils/categories'

const withTimeout = (promise, ms) =>
  Promise.race([promise, new Promise(resolve => setTimeout(() => resolve(null), ms))])

// Nothing curated yet? Show the newest fashion products so the section is never empty.
function fromProducts(products) {
  const pool = products.filter(p => isFashion(p) && p.image)
  const picks = [...pool.filter(p => p.isNew), ...pool.filter(p => !p.isNew)].slice(0, 5)
  return picks.map(p => ({ id: `p-${p.id}`, image: p.image, tag: p.isNew ? 'new' : '', product: p }))
}

export function useMuseItems() {
  const { products } = useProducts()
  const [live, setLive] = useState(undefined) // undefined = still checking

  useEffect(() => {
    let cancelled = false
    withTimeout(getMuseItems().catch(() => null), 3000).then(res => { if (!cancelled) setLive(res) })
    return () => { cancelled = true }
  }, [])

  const curated = Array.isArray(live) && live.length > 0
  return {
    items: curated ? live : fromProducts(products),
    loading: live === undefined,
    curated,
  }
}
