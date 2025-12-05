import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../services/api'
import type { Message } from '../../types/models'

export default function MessageList() {
  const [items, setItems] = useState<Message[]>([])
  useEffect(() => {
    api.get('/messages?folder=inbox')
      .then(r => setItems(r.data.items))
      .catch(() => setItems([]))
  }, [])
  return (
    <div className="p-4 grid gap-2">
      {items.map(m => (
        <Link key={m.id} to={`/messages/${m.id}`} className="block rounded p-3 hover:bg-dark-700 transition-colors">
          <div className="text-xs text-gray-300">{new Date(m.createdAt).toLocaleString()}</div>
          <div className="font-medium text-emerald-300">{m.subject}</div>
          <div className="text-gray-200 overflow-hidden whitespace-nowrap text-ellipsis">{m.body}</div>
        </Link>
      ))}
    </div>
  )
}
