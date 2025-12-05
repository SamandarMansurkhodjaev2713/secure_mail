import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useAuth } from '../store/auth'
import { useNavigate } from 'react-router-dom'

type FormValues = { login?: string; email?: string; password: string }

export default function LoginPage() {
  const { register, handleSubmit } = useForm<FormValues>()
  const auth = useAuth()
  const navigate = useNavigate()
  const onSubmit = async (v: FormValues) => { await auth.login(v) }
  useEffect(() => { if (auth.user) navigate('/') }, [auth.user, navigate])
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-gray-900 to-gray-800">
      <div className="w-full max-w-md card p-6">
        <h1 className="text-xl mb-4 heading">Вход</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-3">
          <input {...register('login')} className="input" placeholder="Логин" />
          <input {...register('email')} className="input" placeholder="Email" />
          <input {...register('password', { required: true })} type="password" className="input" placeholder="Пароль" />
          <button type="submit" className="btn-primary">Войти</button>
        </form>
        <div className="mt-4 grid gap-2">
          <button onClick={async () => { await auth.login({ login: 'Sam4k', password: '1234' }) }} className="btn-secondary">Войти как Sam4k</button>
          <button onClick={async () => { await auth.login({ login: 'artur', password: '1234' }) }} className="btn-secondary">Войти как artur</button>
          <button onClick={() => { auth.skip(); navigate('/') }} className="btn-secondary">Пропустить</button>
        </div>
      </div>
    </div>
  )
}
