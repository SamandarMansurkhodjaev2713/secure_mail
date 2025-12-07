import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../store/auth'

export default function Header() {
  const [open, setOpen] = useState(false)
  const { user, logout } = useAuth()
  return (
    <header className="bg-gray-900 text-white px-4 py-3 flex items-center justify-between border-b border-gray-700">
      <Link to="/" className="font-semibold text-emerald-400 hover-float">SecureMail</Link>
      <button aria-expanded={open} aria-label="Открыть меню" className="p-2 rounded hover:bg-dark-800 transition-transform duration-200 hover:scale-105" onClick={() => setOpen(!open)}>
        <span className="block w-6 h-0.5 bg-emerald-500 mb-1"></span>
        <span className="block w-6 h-0.5 bg-emerald-500 mb-1"></span>
        <span className="block w-6 h-0.5 bg-emerald-500"></span>
      </button>
      {open && (
        <nav className="absolute right-4 top-14 bg-gray-800/95 backdrop-blur rounded shadow-soft w-56 border border-gray-700 animate-menu-pop">
          <ul className="py-2">
            <li><Link className="block px-4 py-2 hover:bg-gray-700" to="/">Сообщения</Link></li>
            <li><Link className="block px-4 py-2 hover:bg-gray-700" to="/settings">Настройки</Link></li>
            {user?.role === 'ADMIN' && (
              <li><Link className="block px-4 py-2 hover:bg-gray-700" to="/admin">Админ-панель</Link></li>
            )}
            {user && user.id !== 'guest' ? (
              <li><button className="w-full text-left px-4 py-2 hover:bg-gray-700" onClick={logout}>Выйти</button></li>
            ) : (
              <li><Link className="block px-4 py-2 hover:bg-gray-700" to="/login">Войти</Link></li>
            )}
          </ul>
        </nav>
      )}
    </header>
  )
}
