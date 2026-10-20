import { useEffect, useState } from 'react'
import { getApprovedReviews } from '../services/reviews'

// Every product card asks for reviews — they all share ONE request (and one result).
let cache = null
let inflight = null
const listeners = new Set()

function load() {
  if (cache || inflight) return
  inflight = getApprovedReviews().then(list => {
    cache = list
    listeners.forEach(fn => fn(list))
  })
}

export function useReviews() {
  const [reviews, setReviews] = useState(cache || [])
  useEffect(() => {
    listeners.add(setReviews)
    if (cache) setReviews(cache)
    else load()
    return () => { listeners.delete(setReviews) }
  }, [])
  return { reviews }
}

export function summarize(list) {
  const count = list.length
  const average = count ? list.reduce((s, r) => s + r.rating, 0) / count : 0
  return { count, average }
}
