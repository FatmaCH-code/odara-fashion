import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

// New page -> back to the top. A link with a #section (like /about#review) -> scroll to that section.
export default function ScrollToTop() {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    if (hash) {
      const id = decodeURIComponent(hash.slice(1))
      const t = setTimeout(() => {
        const el = document.getElementById(id)
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        else window.scrollTo(0, 0)
      }, 150)
      return () => clearTimeout(t)
    }
    window.scrollTo(0, 0)
  }, [pathname, hash])

  return null
}
