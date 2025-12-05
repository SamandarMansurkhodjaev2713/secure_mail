import Header from '../components/Layout/Header'
import MessageList from '../components/MessageList'
import Composer from '../components/Composer'

export default function MainPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      <Header />
      <div className="grid md:grid-cols-2 gap-6 p-6 max-w-6xl mx-auto">
        <section className="card">
          <h2 className="px-4 py-3 font-semibold heading">Входящие</h2>
          <MessageList />
        </section>
        <section className="card">
          <h2 className="px-4 py-3 font-semibold heading">Написать</h2>
          <Composer />
        </section>
      </div>
    </div>
  )
}
