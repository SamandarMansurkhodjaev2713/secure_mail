import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Header from '../components/Layout/Header'
import { api } from '../services/api'
import type { Message } from '../types/models'
import { getAttachment, putAttachment } from '../utils/idb'

export default function MessagePage() {
  const [preview, setPreview] = useState<{ type: 'image' | 'html' | 'text'; url: string; report?: string } | null>(null)
  const { id } = useParams()
  const [msg, setMsg] = useState<Message | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const navigate = useNavigate()
  useEffect(() => { if (id) api.get(`/messages/${id}`).then(r => setMsg(r.data)).catch(() => setErr('Не удалось загрузить сообщение')) }, [id])
  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <Header />
      <div className="p-4">
        {msg && (
          <div className="bg-slate-800 rounded p-4 animate-fade-in">
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
              {msg.attachments.map(a => (
                <button key={a.id} className="ml-2 btn-secondary" onClick={async () => {
                  const r = await api.post(`/sandbox/open/${a.id}`)
                  setPreview({ type: r.data.resultType, url: r.data.previewPath, report: r.data.reportPath })
                }}>Просмотреть безопасно</button>
              ))}
              <button className="btn-danger hover-float" disabled={busy} onClick={async () => {
                if (!id) return
                if (!window.confirm('Удалить сообщение?')) return
                setBusy(true)
                try {
                  await api.delete(`/messages/${id}`)
                  navigate('/')
                } catch {
                  setErr('Ошибка удаления')
                } finally {
                  setBusy(false)
                }
              }}>Удалить</button>
            </div>
          </div>
        )}
        {preview && (
          <div className="mt-4 card p-4">
            <div className="heading font-semibold mb-2">Безопасное превью</div>
            {preview.type === 'image' && <img src={preview.url} alt="preview" className="max-w-full" />}
            {preview.type === 'html' && <iframe src={preview.url} className="w-full h-96 bg-white" />}
            {preview.type === 'text' && <iframe src={preview.url} className="w-full h-64 bg-white" />}
            {preview.report && <a href={preview.report} className="text-emerald-300 mt-2 inline-block">Отчет</a>}
          </div>
        )}
        {err && <div className="mt-2 text-sm text-red-400">{err}</div>}
      </div>
    </div>
  )
}
