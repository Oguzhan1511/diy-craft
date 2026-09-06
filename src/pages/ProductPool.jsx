import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import ProductCard from '../components/ProductCard'
import ProductModal from '../components/ProductModal'
import AddProductModal from '../components/AddProductModal'

const TABS = [
  { key: 'pool',          label: 'Havuzda',     emoji: '📦', variant: 'pool' },
  { key: 'in_progress',   label: 'Yapılıyor',   emoji: '🔨', variant: 'pool' },
  { key: 'completed',     label: 'Tamamlandı',  emoji: '✅', variant: 'etsy' },
  { key: 'etsy_uploaded', label: "Etsy'de",     emoji: '🛍️', variant: 'etsy' },
]

export default function ProductPool({ currentUser }) {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('pool')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const [showAdd, setShowAdd] = useState(false)

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })
    if (!error) setProducts(data || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchProducts()

    // Gerçek zamanlı değişiklikler
    const channel = supabase
      .channel('products-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
        fetchProducts()
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [])

  // Modal açıkken ürün güncellenirse onu da güncelle
  useEffect(() => {
    if (selected) {
      const updated = products.find(p => p.id === selected.id)
      if (updated) setSelected(updated)
    }
  }, [products])

  const counts = {
    pool: products.filter(p => p.status === 'pool').length,
    in_progress: products.filter(p => p.status === 'in_progress').length,
    completed: products.filter(p => p.status === 'completed').length,
    etsy_uploaded: products.filter(p => p.status === 'etsy_uploaded').length,
  }

  const currentTab = TABS.find(t => t.key === activeTab)
  const filtered = products.filter(p => {
    if (p.status !== activeTab) return false
    if (search.trim()) {
      const q = search.toLowerCase()
      return (
        p.title?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.tags?.some(t => t.includes(q)) ||
        p.source_link?.toLowerCase().includes(q)
      )
    }
    return true
  })

  const isEtsyView = activeTab === 'completed' || activeTab === 'etsy_uploaded'

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Topbar */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">🧵</span>
            <span className="font-bold text-gray-800 text-lg">DIY Craft</span>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <span className="text-sm text-gray-500 hidden sm:block">
              👤 <span className="font-medium text-gray-700">{currentUser}</span>
            </span>
            <button
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-1.5 bg-rose-500 hover:bg-rose-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors shadow-sm"
            >
              <span className="text-lg leading-none">+</span>
              Ürün Ekle
            </button>
          </div>
        </div>
      </header>

      {/* Tab Navigasyonu */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex gap-0 overflow-x-auto">
            {TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => { setActiveTab(tab.key); setSearch('') }}
                className={`flex items-center gap-2 px-5 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.key
                    ? 'border-rose-500 text-rose-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-200'
                }`}
              >
                <span>{tab.emoji}</span>
                <span>{tab.label}</span>
                {counts[tab.key] > 0 && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                    activeTab === tab.key ? 'bg-rose-100 text-rose-600' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {counts[tab.key]}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Başlık + Arama */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
          <div>
            <h2 className="text-lg font-bold text-gray-800">{currentTab?.emoji} {currentTab?.label}</h2>
            <p className="text-sm text-gray-400">
              {activeTab === 'pool' && 'Yapılmayı bekleyen ürünler'}
              {activeTab === 'in_progress' && 'Şu an üretimde olan ürünler'}
              {activeTab === 'completed' && "Hazır, Etsy'ye yüklenmeyi bekleyen ürünler"}
              {activeTab === 'etsy_uploaded' && "Etsy mağazasında yayında olan ürünler"}
            </p>
          </div>
          <div className="sm:ml-auto">
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Ara..."
              className="w-full sm:w-56 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 bg-white"
            />
          </div>
        </div>

        {isEtsyView && filtered.length > 0 && (
          <div className={`mb-4 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2 ${
            activeTab === 'etsy_uploaded'
              ? 'bg-orange-50 text-orange-700 border border-orange-100'
              : 'bg-green-50 text-green-700 border border-green-100'
          }`}>
            {activeTab === 'etsy_uploaded'
              ? `🛍️ ${filtered.length} ürün Etsy mağazanızda yayında`
              : `✅ ${filtered.length} ürün tamamlandı — Etsy'ye yüklenmeye hazır`}
          </div>
        )}

        {/* Grid */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <span className="text-5xl mb-3">
              {activeTab === 'pool' ? '📦' : activeTab === 'in_progress' ? '🔨' : activeTab === 'completed' ? '✅' : '🛍️'}
            </span>
            <p className="text-sm font-medium text-gray-500">
              {activeTab === 'pool' && (products.length === 0 ? 'Henüz ürün yok. İlk ürünü ekle!' : 'Havuzda ürün yok.')}
              {activeTab === 'in_progress' && 'Şu an yapılan ürün yok.'}
              {activeTab === 'completed' && 'Tamamlanan ürün yok.'}
              {activeTab === 'etsy_uploaded' && "Henüz Etsy'ye yüklenen ürün yok."}
            </p>
          </div>
        ) : (
          <div className={`grid gap-4 ${isEtsyView ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4' : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5'}`}>
            {filtered.map(p => (
              <ProductCard key={p.id} product={p} onClick={() => setSelected(p)} variant={currentTab?.variant} />
            ))}
          </div>
        )}
      </main>

      {selected && (
        <ProductModal product={selected} onClose={() => setSelected(null)} currentUser={currentUser} />
      )}
      {showAdd && (
        <AddProductModal onClose={() => setShowAdd(false)} currentUser={currentUser} />
      )}
    </div>
  )
}
