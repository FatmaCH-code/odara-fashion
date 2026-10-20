import { useEffect, useState } from 'react'
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'
import { useUiStore } from '../store/uiStore'

const ICONS = { success: CheckCircle2, error: AlertCircle, info: Info }

function ToastItem({ toast }) {
  const dismiss = useUiStore(s => s.dismissToast)
  const [leaving, setLeaving] = useState(false)
  const [paused, setPaused] = useState(false)
  const Icon = ICONS[toast.type] || CheckCircle2

  const close = () => {
    setLeaving(true)
    setTimeout(() => dismiss(toast.id), 260)
  }

  useEffect(() => {
    if (paused) return
    const t = setTimeout(close, toast.duration)
    return () => clearTimeout(t)
  }, [paused])

  return (
    <div
      className={`odt odt-${toast.type} ${leaving ? 'is-leaving' : ''}`}
      role={toast.type === 'error' ? 'alert' : 'status'}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <span className="odt-icon"><Icon className="w-5 h-5" /></span>
      <div className="odt-text">
        {toast.title && <p className="odt-title">{toast.title}</p>}
        <p className="odt-msg">{toast.message}</p>
      </div>
      <button type="button" className="odt-close" onClick={close} aria-label="Dismiss"><X className="w-4 h-4" /></button>
      {!paused && !leaving && <span className="odt-bar" style={{ animationDuration: `${toast.duration}ms` }} />}
    </div>
  )
}

export default function Toast() {
  const toasts = useUiStore(s => s.toasts)
  if (!toasts.length) return null
  return (
    <div className="odt-stack" aria-live="polite">
      {toasts.map(t => <ToastItem key={t.id} toast={t} />)}
    </div>
  )
}
