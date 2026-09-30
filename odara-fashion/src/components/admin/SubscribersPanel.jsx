import { useEffect, useState } from 'react'
import { Trash2, Download } from 'lucide-react'
import { adminListSubscribers, adminDeleteSubscriber } from '../../services/newsletter'

export default function SubscribersPanel() {
  const [subscribers, setSubscribers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const data = await adminListSubscribers()
      setSubscribers(data)
      setError('')
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleDelete = async (id) => {
    await adminDeleteSubscriber(id)
    load()
  }

  const exportCsv = () => {
    const rows = ['email,source,subscribed_at', ...subscribers.map(s => `${s.email},${s.source || ''},${s.created_at}`)]
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'odara-subscribers.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) return <p className="text-2C2C2C/50">Loading…</p>

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <h1 className="text-2xl font-playfair">Subscribers ({subscribers.length})</h1>
        {subscribers.length > 0 && (
          <button className="admin-btn-secondary flex items-center gap-2" onClick={exportCsv}>
            <Download className="w-4 h-4" /> Export CSV
          </button>
        )}
      </div>
      {error && <div className="admin-notice mb-6">{error}</div>}

      <div className="admin-table-wrap">
        {subscribers.length === 0 ? (
          <p className="text-2C2C2C/45 text-center py-16">
            No subscribers yet — every "Subscribe" form on the site feeds this list.
          </p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Signed Up Via</th>
                <th>Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {subscribers.map(s => (
                <tr key={s.id}>
                  <td className="font-medium">{s.email}</td>
                  <td className="text-2C2C2C/60 capitalize">{s.source}</td>
                  <td className="text-2C2C2C/60 text-xs">{new Date(s.created_at).toLocaleDateString()}</td>
                  <td>
                    <button onClick={() => handleDelete(s.id)} className="admin-icon-btn admin-icon-btn-danger">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
