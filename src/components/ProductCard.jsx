import StatusBadge from './StatusBadge'

// Pool/Yapılıyor için basit kart
function PoolCard({ product, onClick }) {
  const firstImage = product.media_files?.find(f => !f.type?.startsWith('video'))
  const firstVideo = product.media_files?.find(f => f.type?.startsWith('video'))
  const preview = firstImage || firstVideo

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer overflow-hidden group"
    >
      <div className="aspect-square bg-gray-50 overflow-hidden relative">
        {preview ? (
          preview.type?.startsWith('video') ? (
            <video src={preview.url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" muted />
          ) : (
            <img src={preview.url} alt={product.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          )
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-300">
            <span className="text-5xl mb-2">🧵</span>
            <span className="text-xs">Görsel yok</span>
          </div>
        )}
        {product.media_files?.length > 1 && (
          <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs rounded-full px-2 py-0.5">
            +{product.media_files.length - 1}
          </div>
        )}
      </div>
      <div className="p-3 space-y-2">
        <h3 className="text-sm font-semibold text-gray-800 line-clamp-2 leading-snug">
          {product.title || <span className="text-gray-400 italic">Başlıksız ürün</span>}
        </h3>
        <StatusBadge status={product.status} />
        {(product.status === 'in_progress' || product.status === 'completed') && product.assigned_to && (
          <p className="text-xs text-gray-400">
            {product.status === 'in_progress' ? 'Yapıyor: ' : 'Yaptı: '}
            <span className="font-medium text-gray-600">{product.assigned_to}</span>
          </p>
        )}
        {product.source_link && (
          <p className="text-xs text-rose-400 truncate">🔗 Kaynak</p>
        )}
      </div>
    </div>
  )
}

// Tamamlandı / Etsy için vitrin kartı
function EtsyCard({ product, onClick }) {
  const images = product.media_files?.filter(f => !f.type?.startsWith('video')) || []
  const preview = images[0] || product.media_files?.[0]

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200 cursor-pointer overflow-hidden group"
    >
      {/* Ana görsel */}
      <div className="aspect-square bg-gray-50 overflow-hidden relative">
        {preview ? (
          preview.type?.startsWith('video') ? (
            <video src={preview.url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" muted />
          ) : (
            <img src={preview.url} alt={product.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          )
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-200">
            <span className="text-6xl mb-2">🧵</span>
          </div>
        )}
        <div className="absolute top-2.5 left-2.5">
          <StatusBadge status={product.status} />
        </div>
        {images.length > 1 && (
          <div className="absolute bottom-2.5 right-2.5 bg-black/50 backdrop-blur-sm text-white text-xs rounded-full px-2.5 py-1 flex items-center gap-1">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"/></svg>
            {images.length}
          </div>
        )}
      </div>

      {/* İkincil görseller */}
      {images.length > 1 && (
        <div className="flex gap-1 px-3 pt-2.5">
          {images.slice(1, 4).map((img, i) => (
            <div key={i} className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
              <img src={img.url} alt="" className="w-full h-full object-cover" />
            </div>
          ))}
          {images.length > 4 && (
            <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-xs text-gray-400 font-medium flex-shrink-0">
              +{images.length - 4}
            </div>
          )}
        </div>
      )}

      {/* İçerik */}
      <div className="p-3 space-y-2">
        <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 leading-snug">
          {product.title || <span className="text-gray-400 italic font-normal">Başlık girilmemiş</span>}
        </h3>
        {product.description && (
          <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{product.description}</p>
        )}
        {product.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {product.tags.slice(0, 4).map(t => (
              <span key={t} className="text-[10px] bg-orange-50 text-orange-600 border border-orange-100 rounded-full px-2 py-0.5">{t}</span>
            ))}
            {product.tags.length > 4 && (
              <span className="text-[10px] text-gray-400 py-0.5">+{product.tags.length - 4}</span>
            )}
          </div>
        )}
        {product.assigned_to && (
          <p className="text-xs text-gray-400">Yapan: <span className="font-medium text-gray-600">{product.assigned_to}</span></p>
        )}
      </div>
    </div>
  )
}

export default function ProductCard({ product, onClick, variant = 'pool' }) {
  if (variant === 'etsy') return <EtsyCard product={product} onClick={onClick} />
  return <PoolCard product={product} onClick={onClick} />
}
