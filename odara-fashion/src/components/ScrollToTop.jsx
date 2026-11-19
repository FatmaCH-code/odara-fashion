import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

// Without this, React Router keeps the browser's scroll position when
// navigating to a new page, so a click near the bottom of one page can
// land you near the bottom of the next page instead of the top.
export default function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return null
}
