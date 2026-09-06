import { useState, useRef } from 'react'
import { supabase, uploadFile, deleteFile } from '../supabase'
import StatusBadge from './StatusBadge'

// Orijinal kalitede indirme
async function downloadFile(file) {
  try {
    const response = await fetch(file.url)
    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = file.name || `download.${file.type?.split('/')[1] || 'jpg'}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  } catch (err) {
    // Fallback: direkt URL'yi aç
    window.open(file.url, '_blank')
  }
}

async function downloadAll(mediaFiles) {
  for (const file of mediaFiles) {
    await downloadFile(file)
    // Tarayıcının birden fazla indirmeyi engellemesini önlemek için kısa bekleme
    await new Promise(r => setTimeout(r, 400))
  }
}

const STATUS_FLOW = {
  pool: 'in_progress',
  in_progress: 'completed',
  completed: 'etsy_uploaded',
  etsy_uploaded: null,
}

const STATUS_BTN = {
  pool: { label: '🙋 Yapılıyor Olarak Al', color: 'bg-amber-500 hover:bg-amber-600' },
  in_progress: { label: '✅ Tamamlandı Olarak İşaretle', color: 'bg-green-500 hover:bg-green-600' },
  completed: { label: "🛍️ Etsy'ye Yüklendi Olarak İşaretle", color: 'bg-orange-500 hover:bg-orange-600' },
  etsy_uploaded: null,
}

export default function ProductModal({ product, onClose, currentUser }) {
  const [title, setTitle] = useState(product.title || '')
  const [description, setDescription] = useState(product.description || '')
  const [tags, setTags] = useState(product.tags || [])
  const [tagInput, setTagInput] = useState('')
  const [sourceLink, setSourceLink] = useState(product.source_link || '')
  const [mediaFiles, setMediaFiles] = useState(product.media_files || [])
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadingFile, setUploadingFile] = useState('')
  const [lightbox, setLightbox] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const fileRef = useRef()

  const isCompleted = product.status === 'completed' || product.status === 'etsy_uploaded'

  const save = async (extra = {}) => {
    setSaving(true)
    try {
      const { error } = await supabase.from('products').update({
        title,
        description,
        tags,
        source_link: sourceLink,
        media_files: mediaFiles,
        updated_at: new Date().toISOString(),
        ...extra,
      }).eq('id', product.id)
      if (error) throw error
    } catch (err) {
      alert('Kayıt hatası: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleStatusChange = async () => {
    const nextStatus = STATUS_FLOW[product.status]
    if (!nextStatus) return
    const extra = { status: nextStatus }
    if (nextStatus === 'in_progress') extra.assigned_to = currentUser
    if (nextStatus === 'completed') extra.completed_by = currentUser
    if (nextStatus === 'etsy_uploaded') extra.etsy_uploaded_at = new Date().toISOString()
    await save(extra)
    onClose()
  }

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase().replace(/\s+/g, ' ')
    if (tag && !tags.includes(tag)) setTags([...tags, tag])
    setTagInput('')
  }

  const removeTag = (t) => setTags(tags.filter(x => x !== t))

  const handleTagKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag() }
  }

  const handleUploadFiles = async (files) => {
    setUploading(true)
    const newFiles = []
    try {
      for (const file of files) {
        setUploadingFile(file.name)
        const result = await uploadFile(file, product.id)
        newFiles.push(result)
      }
      const updated = [...mediaFiles, ...newFiles]
      setMediaFiles(updated)
      await supabase.from('products').update({ media_files: updated, updated_at: new Date().toISOString() }).eq('id', product.id)
    } catch (err) {
      alert('Yükleme hatası: ' + err.message)
    } finally {
      setUploading(false)
      setUploadingFile('')
    }
  }

  const removeMedia = async (idx) => {
    const file = mediaFiles[idx]
    await deleteFile(file.storagePath)
    const updated = mediaFiles.filter((_, i) => i !== idx)
    setMediaFiles(updated)
    await supabase.from('products').update({ media_files: updated, updated_at: new Date().toISOString() }).eq('id', product.id)
  }

  const handleDelete = async () => {
    try {
      // Storage dosyalarını sil
      for (const f of mediaFiles) { await deleteFile(f.storagePath) }
      await supabase.from('products').delete().eq('id', product.id)
      onClose()
    } catch (err) {
      alert('Silme hatası: ' + err.message)
    }
  }

  const btnInfo = STATUS_BTN[product.status]

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className={`bg-white rounded-2xl shadow-2xl w-full max-h-[92vh] overflow-y-auto ${isCompleted ? 'max-w-4xl' : 'max-w-2xl'}`}>

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white z-10 rounded-t-2xl">
          <div className="flex items-center gap-3 flex-wrap">
            <StatusBadge status={product.status} />
            {product.assigned_to && (
              <span className="text-xs text-gray-400">
                {product.status === 'in_progress' ? 'Yapıyor: ' : 'Yapan: '}
                <span className="font-medium text-gray-600">{product.assigned_to}</span>
              </span>
            )}
            {product.status === 'etsy_uploaded' && (
              <span className="text-xs text-orange-500 font-medium">✓ Etsy'de yayında</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setConfirmDelete(true)} className="text-xs text-red-400 hover:text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors">Sil</button>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100">×</button>
          </div>
        </div>

        <div className={`p-5 ${isCompleted ? 'grid grid-cols-1 md:grid-cols-2 gap-6' : 'space-y-5'}`}>

          {/* SOL — Medya */}
          <div className="space-y-4">
            {/* Referans Link - düzenlenebilir */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">🔗 Referans Link</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={sourceLink}
                  onChange={e => setSourceLink(e.target.value)}
                  placeholder="https://www.etsy.com/listing/..."
                  className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
                />
                {sourceLink && (
                  <a
                    href={sourceLink}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-sm transition-colors"
                    title="Linki aç"
                  >
                    ↗
                  </a>
                )}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">
                  {isCompleted ? '📸 Ürün Görselleri & Videoları' : 'Görsel / Video'}
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">{mediaFiles.length} dosya</span>
                  {mediaFiles.length > 0 && (
                    <button
                      onClick={() => downloadAll(mediaFiles)}
                      className="text-xs text-rose-500 hover:text-rose-700 font-medium flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-rose-50 transition-colors"
                      title="Tüm görselleri indir"
                    >
                      ⬇️ Tümünü İndir
                    </button>
                  )}
                </div>
              </div>

              {mediaFiles.length > 0 && (
                <div className={`grid gap-2 mb-3 ${isCompleted ? 'grid-cols-2' : 'grid-cols-3'}`}>
                  {mediaFiles.map((file, idx) => (
                    <div key={idx} className={`relative group rounded-xl overflow-hidden bg-gray-100 ${isCompleted && idx === 0 ? 'col-span-2 aspect-video' : 'aspect-square'}`}>
                      {file.type?.startsWith('video') ? (
                        <video src={file.url} className="w-full h-full object-cover cursor-pointer" onClick={() => setLightbox({ ...file, idx })} />
                      ) : (
                        <img src={file.url} alt={file.name} className="w-full h-full object-cover cursor-pointer" onClick={() => setLightbox({ ...file, idx })} />
                      )}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                      {/* Sil butonu - sağ üst */}
                      <button onClick={() => removeMedia(idx)}
                        className="absolute top-1.5 right-1.5 bg-black/60 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500">
                        ×
                      </button>
                      {/* İndir butonu - sol alt */}
                      <button
                        onClick={e => { e.stopPropagation(); downloadFile(file) }}
                        className="absolute bottom-1.5 left-1.5 bg-black/60 hover:bg-black/80 text-white rounded-lg px-2 py-1 text-[10px] font-medium opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1"
                        title="İndir (orijinal kalite)"
                      >
                        ⬇️ {file.type?.startsWith('video') ? 'Video' : 'Görsel'}
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div
                onDrop={e => { e.preventDefault(); handleUploadFiles(Array.from(e.dataTransfer.files)) }}
                onDragOver={e => e.preventDefault()}
                onClick={() => fileRef.current.click()}
                className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center cursor-pointer hover:border-rose-300 hover:bg-rose-50 transition-colors"
              >
                {uploading ? (
                  <div className="flex items-center justify-center gap-2 text-rose-500">
                    <div className="animate-spin w-4 h-4 border-2 border-rose-500 border-t-transparent rounded-full" />
                    <span className="text-sm truncate max-w-[200px]">{uploadingFile || 'Yükleniyor...'}</span>
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-gray-400">+ Dosya ekle (sürükle veya tıkla)</p>
                    <p className="text-xs text-gray-300 mt-0.5">JPG, PNG, WEBP, MP4, MOV</p>
                  </>
                )}
                <input ref={fileRef} type="file" accept="image/*,video/*" multiple onChange={e => handleUploadFiles(Array.from(e.target.files))} className="hidden" />
              </div>
            </div>
          </div>

          {/* SAĞ — Başlık, Açıklama, Taglar */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {isCompleted ? '📝 Etsy Başlığı' : 'Başlık'}
              </label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)}
                placeholder={isCompleted ? "Etsy'de görünecek başlık" : 'Ürün başlığı'}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
              />
              {isCompleted && <p className="text-xs text-gray-400 mt-1">{title.length}/140 karakter</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {isCompleted ? '📄 Etsy Açıklaması' : 'Açıklama'}
              </label>
              <textarea value={description} onChange={e => setDescription(e.target.value)}
                rows={isCompleted ? 7 : 4}
                placeholder={isCompleted ? 'Ürünü anlatan Etsy açıklaması...' : 'Notlar, kaynak açıklaması...'}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                🏷️ Taglar <span className="text-gray-400 font-normal">({tags.length}/13)</span>
              </label>
              <div className="flex flex-wrap gap-1.5 mb-2 min-h-[2rem]">
                {tags.map(t => (
                  <span key={t} className="inline-flex items-center gap-1 bg-orange-50 text-orange-600 border border-orange-200 rounded-full px-3 py-1 text-xs font-medium">
                    {t}
                    <button onClick={() => removeTag(t)} className="hover:text-red-600 ml-0.5 leading-none">×</button>
                  </span>
                ))}
              </div>
              {tags.length < 13 && (
                <div className="flex gap-2">
                  <input type="text" value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={handleTagKeyDown}
                    placeholder="Tag yaz, Enter ile ekle"
                    className="flex-1 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
                  />
                  <button onClick={addTag} className="px-4 py-2 bg-orange-100 text-orange-600 rounded-xl text-sm font-medium hover:bg-orange-200 transition-colors">Ekle</button>
                </div>
              )}
              {isCompleted && <p className="text-xs text-gray-400 mt-1.5">Etsy maks 13 tag kabul eder.</p>}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-100 p-5 flex gap-3 rounded-b-2xl">
          {btnInfo && (
            <button onClick={handleStatusChange}
              className={`flex-1 py-2.5 text-white rounded-xl text-sm font-medium transition-colors ${btnInfo.color}`}>
              {btnInfo.label}
            </button>
          )}
          {product.status === 'etsy_uploaded' && (
            <div className="flex-1 py-2.5 text-center text-sm text-orange-600 font-medium bg-orange-50 rounded-xl border border-orange-200">
              🎉 Etsy'de yayında!
            </div>
          )}
          <button onClick={() => save()} disabled={saving}
            className="flex-1 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50">
            {saving ? 'Kaydediliyor...' : '💾 Kaydet'}
          </button>
        </div>
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-60 p-4" onClick={() => setLightbox(null)}>
          {/* Kapat */}
          <button className="absolute top-4 right-4 text-white/70 hover:text-white text-4xl" onClick={() => setLightbox(null)}>×</button>
          {/* İndir */}
          <button
            onClick={e => { e.stopPropagation(); downloadFile(lightbox) }}
            className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white/20 hover:bg-white/30 backdrop-blur text-white px-5 py-2.5 rounded-full text-sm font-medium flex items-center gap-2 transition-colors"
          >
            ⬇️ Orijinal Kalitede İndir
          </button>
          {lightbox.type?.startsWith('video')
            ? <video src={lightbox.url} controls className="max-w-full max-h-[80vh] rounded-xl" onClick={e => e.stopPropagation()} />
            : <img src={lightbox.url} alt="" className="max-w-full max-h-[80vh] rounded-xl object-contain" />
          }
        </div>
      )}

      {/* Silme onayı */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-60 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center shadow-2xl">
            <div className="text-4xl mb-3">🗑️</div>
            <h3 className="font-bold text-gray-800 mb-2">Ürünü Sil</h3>
            <p className="text-sm text-gray-500 mb-5">Bu ürün ve tüm görselleri kalıcı olarak silinecek.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(false)} className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm">İptal</button>
              <button onClick={handleDelete} className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-600">Sil</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
