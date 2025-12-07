import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../services/api'
import type { Message } from '../../types/models'

export default function MessageList() {
  const [items, setItems] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  useEffect(() => {
    api.get('/messages?folder=inbox')
      .then(r => { setItems(r.data.items); setErr(null) })
      .catch(() => { setItems([]); setErr('Не удалось загрузить входящие') })
      .finally(() => setLoading(false))
  }, [])
  return (
    <div className="p-4 grid gap-2">
      {loading && (
        Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="rounded p-3 bg-dark-800 animate-shimmer">
            <div className="h-3 w-24 bg-dark-700 rounded mb-2"></div>
            <div className="h-4 w-48 bg-dark-700 rounded mb-1"></div>
            <div className="h-4 w-64 bg-dark-700 rounded"></div>
          </div>
        ))
      )}
      {!loading && items.map(m => (
        <div key={m.id} className={`rounded p-3 hover:bg-dark-700 transition-all duration-200 shadow-soft ${busy===m.id ? 'opacity-60' : ''}`}>
          <div className="flex items-start justify-between gap-2">
            <Link to={`/messages/${m.id}`} className="flex-1">
              <div className="text-xs text-gray-300">{new Date(m.createdAt).toLocaleString()}</div>
              <div className="font-medium text-emerald-300">{m.subject}</div>
              <div className="text-gray-200 overflow-hidden whitespace-nowrap text-ellipsis">{m.body}</div>
            </Link>
            <button
              className="btn-danger hover-float"
              disabled={busy===m.id}
              onClick={async () => {
                if (!window.confirm('Удалить сообщение?')) return
                setBusy(m.id)
                const prev = items
                try {
                  setItems(prev => prev.filter(x => x.id !== m.id))
                  await api.delete(`/messages/${m.id}`)
                  setErr(null)
                } catch {
                  setItems(prev)
                  setErr('Ошибка удаления')
                } finally {
                  setBusy(null)
                }
              }}
            >Удалить</button>
          </div>
        </div>
      ))}
      {err && <div className="text-sm text-red-400">{err}</div>}
    </div>
  )
}
