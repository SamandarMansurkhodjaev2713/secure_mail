import { useEffect, useState } from 'react'
import Header from '../components/Layout/Header'
import { api } from '../services/api'
import type { User } from '../types/models'
import { useForm } from 'react-hook-form'

export default function AdminPage() {
  const [users, setUsers] = useState<User[]>([])
  const [query, setQuery] = useState('')
  useEffect(() => { api.get('/users').then(r => setUsers(r.data)).catch(() => setUsers([])) }, [])
  const filtered = users.filter(u => [u.login, u.email, u.name].join(' ').toLowerCase().includes(query.toLowerCase()))
  const { register, handleSubmit, reset } = useForm<{ login: string; email: string; name: string; password: string; role: 'USER' | 'ADMIN' }>()
  const [msg, setMsg] = useState<string | null>(null)
  const onCreate = async (v: { login: string; email: string; name: string; password: string; role: 'USER' | 'ADMIN' }) => {
    setMsg(null)
    try {
      await api.post('/auth/register', v)
      const r = await api.get('/users')
      setUsers(r.data)
      reset()
      setMsg('Пользователь создан')
    } catch (e: any) {
      setMsg(e?.response?.data?.error || 'Ошибка')
    }
  }
  return (
    <div className="min-h-screen bg-gradient-to-b from-dark-900 to-dark-800 text-white">
      <Header />
      <div className="max-w-5xl mx-auto p-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold heading">Админ-панель</h1>
          <input value={query} onChange={e => setQuery(e.target.value)} className="input" placeholder="Поиск пользователей" />
        </div>
        <div className="card p-4 mb-6">
          <h2 className="text-lg font-semibold heading mb-3">Создать пользователя</h2>
          <form onSubmit={handleSubmit(onCreate)} className="grid md:grid-cols-2 gap-3">
            <input {...register('login', { required: true })} className="input" placeholder="Логин" />
            <input {...register('email', { required: true })} className="input" placeholder="Email" />
            <input {...register('name', { required: true })} className="input" placeholder="Имя" />
            <input type="password" {...register('password', { required: true })} className="input" placeholder="Пароль" />
            <select {...register('role')} className="input">
              <option value="USER">USER</option>
              <option value="ADMIN">ADMIN</option>
            </select>
            <div>
              <button type="submit" className="btn-primary">Создать</button>
            </div>
          </form>
          {msg && <div className="mt-2 text-sm text-emerald-300">{msg}</div>}
        </div>
        <div className="overflow-hidden rounded-lg border border-dark-700 shadow-soft">
          <table className="min-w-full bg-dark-800">
            <thead className="bg-dark-700">
              <tr>
                <th className="text-left px-4 py-2">Логин</th>
                <th className="text-left px-4 py-2">Имя</th>
                <th className="text-left px-4 py-2">Email</th>
                <th className="text-left px-4 py-2">Роль</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.id} className="odd:bg-dark-800 even:bg-dark-700">
                  <td className="px-4 py-2">{u.login}</td>
                  <td className="px-4 py-2">{u.name}</td>
                  <td className="px-4 py-2">{u.email}</td>
                  <td className="px-4 py-2"><span className="px-2 py-1 rounded bg-emerald-700 text-xs">{u.role}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
