import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import Header from '../components/Layout/Header'
import { api } from '../services/api'
import type { Message } from '../types/models'
import { getAttachment, putAttachment } from '../utils/idb'

export default function MessagePage() {
  const { id } = useParams()
  const [msg, setMsg] = useState<Message | null>(null)
  useEffect(() => { if (id) api.get(`/messages/${id}`).then(r => setMsg(r.data)) }, [id])
  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <Header />
      <div className="p-4">
        {msg && (
          <div className="bg-slate-800 rounded p-4">
            <div className="text-sm text-slate-300">{new Date(msg.createdAt).toLocaleString()}</div>
            <div className="text-xl font-semibold mb-2">{msg.subject}</div>
            <div className="mb-4 whitespace-pre-wrap">{msg.body}</div>
            <div className="grid gap-2">
              {msg.attachments.map(a => (
                <a
                  key={a.id}
                  href={a.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-emerald-300 hover:text-emerald-200"
                  onClick={async (e) => {
                    try {
                      const key = `attachment:${a.id}`
                      const cached = await getAttachment(key)
                      if (!cached) {
                        const res = await fetch(a.url)
                        const blob = await res.blob()
                        await putAttachment(key, blob)
                      }
                    } catch {}
                  }}
                >
                  {a.filename}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
