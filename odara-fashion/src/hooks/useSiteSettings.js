import { useEffect, useState } from 'react'
import { DEFAULT_SETTINGS, loadSiteSettings } from '../services/settings'

export function useSiteSettings() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  useEffect(() => {
    let cancelled = false
    loadSiteSettings().then(s => { if (!cancelled) setSettings(s) })
    return () => { cancelled = true }
  }, [])
  return { settings }
}
