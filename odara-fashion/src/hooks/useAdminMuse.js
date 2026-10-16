import { useEffect, useState } from 'react'
import { adminListMuse, adminSaveMuse, adminDeleteMuse, adminReorderMuse } from '../services/muse'

export function useAdminMuse() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async () => {
    try {
      setItems(await adminListMuse())
      setError('')
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const save = async (form, id) => { await adminSaveMuse(form, id); await load() }
  const remove = async (id) => { await adminDeleteMuse(id); await load() }

  const toggleActive = async (item) => {
    setItems(list => list.map(i => i.id === item.id ? { ...i, isActive: !i.isActive } : i))
    try {
      await adminSaveMuse({ productId: item.productId, image: item.image, tag: item.tag, isActive: !item.isActive }, item.id)
    } catch (err) {
      setError(err.message)
      load()
    }
  }

  const move = async (index, dir) => {
    const target = index + dir
    if (target < 0 || target >= items.length) return
    const next = [...items]
    ;[next[index], next[target]] = [next[target], next[index]]
    setItems(next)
    try {
      await adminReorderMuse(next.map(i => i.id))
    } catch (err) {
      setError(err.message)
      load()
    }
  }

  return { items, loading, error, save, remove, toggleActive, move }
}
