import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useAuth } from '../store/auth'
import { useNavigate } from 'react-router-dom'

type FormValues = { login?: string; email?: string; password: string; otp?: string }

export default function LoginPage() {
  const { register, handleSubmit, setValue, setFocus } = useForm<FormValues>()
  const auth = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const onSubmit = async (v: FormValues) => {
    setError(null)
    try {
      await auth.login(v)
    } catch (e: any) {
      const msg = e?.response?.data?.error || e?.message || 'Ошибка входа'
      setError(msg)
      if (msg.includes('OTP')) setFocus('otp')
    }
  }
  useEffect(() => { if (auth.user) navigate('/') }, [auth.user, navigate])
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-gray-900 to-gray-800">
      <div className="w-full max-w-md card p-6">
        <h1 className="text-xl mb-4 heading">Вход</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-3">
          <input {...register('login')} className="input" placeholder="Логин" />
          <input {...register('email')} className="input" placeholder="Email" />
          <input {...register('password', { required: true })} type="password" className="input" placeholder="Пароль" />
          <input {...register('otp')} className="input" placeholder="OTP (если включен 2FA)" />
          <button type="submit" className="btn-primary">Войти</button>
        </form>
        {error && <div className="mt-2 text-sm text-red-400">{error}</div>}
        <div className="mt-4 grid gap-2">
          <button onClick={async () => { setError(null); setValue('login', 'Sam4k'); setValue('email', ''); setValue('password', '1234'); try { await auth.login({ login: 'Sam4k', password: '1234' }) } catch (e: any) { const msg = e?.response?.data?.error || e?.message || 'Ошибка входа'; setError(msg); if (msg.includes('OTP')) setFocus('otp') } }} className="btn-secondary">Войти как Sam4k</button>
          <button onClick={async () => { setError(null); setValue('login', 'artur'); setValue('email', ''); setValue('password', '1234'); try { await auth.login({ login: 'artur', password: '1234' }) } catch (e: any) { const msg = e?.response?.data?.error || e?.message || 'Ошибка входа'; setError(msg); } }} className="btn-secondary">Войти как artur</button>
          <button onClick={() => { auth.skip(); navigate('/') }} className="btn-secondary">Пропустить</button>
        </div>
      </div>
    </div>
  )
}
