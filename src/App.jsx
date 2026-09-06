import { useState, useEffect } from 'react'
import ProductPool from './pages/ProductPool'
import './index.css'

const USER_KEY = 'diycraft_username'

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => localStorage.getItem(USER_KEY) || '')
  const [nameInput, setNameInput] = useState('')

  useEffect(() => {
    if (currentUser) localStorage.setItem(USER_KEY, currentUser)
  }, [currentUser])

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 to-orange-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl p-8 w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="text-5xl mb-3">🧵</div>
            <h1 className="text-2xl font-bold text-gray-800 mb-1">DIY Craft</h1>
            <p className="text-sm text-gray-500">Ürün Havuzu Sistemine Hoş Geldin</p>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Adın ne?</label>
              <input
                type="text"
                value={nameInput}
                onChange={e => setNameInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && nameInput.trim() && setCurrentUser(nameInput.trim())}
                placeholder="Örn: Oğuzhan, Arkadaşın..."
                autoFocus
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-transparent"
              />
              <p className="text-xs text-gray-400 mt-1.5">Bu isim bir kez girilir, kaydedilir.</p>
            </div>
            <button
              onClick={() => nameInput.trim() && setCurrentUser(nameInput.trim())}
              disabled={!nameInput.trim()}
              className="w-full bg-rose-500 hover:bg-rose-600 text-white py-3 rounded-xl font-medium text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
            >
              Giriş Yap →
            </button>
          </div>
        </div>
      </div>
    )
  }

  return <ProductPool currentUser={currentUser} />
}
