import { useSiteSettings } from '../hooks/useSiteSettings'

// Thin bar above the header. Text is edited in Admin → Offers.
export default function AnnouncementBar() {
  const { settings } = useSiteSettings()
  const a = settings.announcement
  if (!a.enabled || !a.text) return null
  return (
    <div className="announcement-bar">
      <p>{a.text}</p>
    </div>
  )
}
