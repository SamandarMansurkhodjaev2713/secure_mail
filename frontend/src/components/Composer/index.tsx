import { useForm } from 'react-hook-form'
import { useAuth } from '../../store/auth'
import { api } from '../../services/api'

type FormValues = {
  to: string
  subject: string
  body: string
  files: FileList
}

export default function Composer() {
  const { register, handleSubmit, reset } = useForm<FormValues>()
  const authed = !!useAuth.getState().accessToken
  const onSubmit = async (v: FormValues) => {
    const fd = new FormData()
    fd.append('to', v.to)
    fd.append('subject', v.subject)
    fd.append('body', v.body)
    Array.from(v.files || []).forEach(f => fd.append('attachments', f))
    await api.post('/messages', fd)
    reset()
  }
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="p-4 grid gap-3 animate-fade-in">
      <input {...register('to', { required: true })} className="input" placeholder="Получатель (login/email)" />
      <input {...register('subject', { required: true })} className="input" placeholder="Тема" />
      <textarea {...register('body', { required: true })} className="input h-32" placeholder="Сообщение" />
      <input type="file" multiple {...register('files')} className="text-white" />
      <button type="submit" disabled={!authed} className="btn-primary disabled:bg-dark-600 disabled:cursor-not-allowed animate-glow">Отправить</button>
      {!authed && <div className="text-dark-300 text-sm">Для отправки войдите в систему.</div>}
    </form>
  )
}
