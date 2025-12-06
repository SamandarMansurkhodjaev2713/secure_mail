import Header from '../components/Layout/Header'
import { api } from '../services/api'
import { useState } from 'react'

export default function SettingsPage() {
  const [twofa, setTwofa] = useState<{ secret: string; otpAuth: string } | null>(null)
  const [token, setToken] = useState('')
  const [msg, setMsg] = useState<string | null>(null)
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      <Header />
      <div className="max-w-4xl mx-auto p-4">
        <h1 className="text-2xl font-semibold mb-4 heading">Настройки</h1>
        <div className="grid gap-6">
          <section className="card p-4">
            <h2 className="text-lg font-semibold heading mb-2">Двухфакторная аутентификация (2FA)</h2>
            {!twofa ? (
              <button className="btn-primary" onClick={async () => { const r = await api.post('/auth/2fa/setup'); setTwofa(r.data) }}>Начать настройку</button>
            ) : (
              <div className="grid gap-3">
                <div className="text-sm">Секрет: <span className="text-emerald-300">{twofa.secret}</span></div>
                <div className="text-sm">URL для приложения: <span className="text-emerald-300">{twofa.otpAuth}</span></div>
                <input value={token} onChange={e => setToken(e.target.value)} className="input" placeholder="Введите 6-значный код из приложения" />
                <button className="btn-primary" onClick={async () => { try { await api.post('/auth/2fa/verify', { token }); setMsg('2FA включена'); } catch { setMsg('Ошибка'); } }}>Подтвердить</button>
                {msg && <div className="text-sm text-emerald-300">{msg}</div>}
              </div>
            )}
          </section>
          <section className="card p-4">
            <h2 className="text-lg font-semibold heading mb-2">Почта (IMAP)</h2>
            <button className="btn-secondary" onClick={async () => { const r = await api.post('/imap/sync'); setMsg(r.data.ok ? `Синхронизировано: ${r.data.synced || 0}` : 'IMAP не настроен'); }}>Синхронизировать входящие</button>
          </section>
        </div>
      </div>
    </div>
  )
}
