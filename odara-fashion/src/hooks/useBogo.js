import { useMemo } from 'react'
import { useSiteSettings } from './useSiteSettings'
import { useProducts } from './useProducts'
import { computeBogo, giftIdSet, bogoActive } from '../utils/bogo'

// Buy-one-get-one-free for the current cart, plus the gift pieces to suggest.
export function useBogo(items) {
  const { settings } = useSiteSettings()
  const { products } = useProducts()
  const cfg = settings.bogo

  return useMemo(() => {
    const byId = new Map(products.map(p => [Number(p.id), p]))
    const ids = giftIdSet(cfg)
    const giftProducts = bogoActive(cfg) ? products.filter(p => ids.has(Number(p.id))) : []
    return {
      active: bogoActive(cfg),
      giftProducts,
      ...computeBogo(items, cfg, (id) => byId.get(Number(id))),
    }
  }, [items, products, cfg])
}
