import { useState, useRef } from 'react'
import { supabase, uploadFile } from '../supabase'

export default function AddProductModal({ onClose, currentUser }) {
  const [title, setTitle] = useState('')
  const [sourceLink, setSourceLink] = useState('')
  const [files, setFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const [uploadingFile, setUploadingFile] = useState('')
  const fileRef = useRef()

  const handleFileChange = (e) => setFiles(Array.from(e.target.files))
  const handleDrop = (e) => { e.preventDefault(); setFiles(Array.from(e.dataTransfer.files)) }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!title.trim() && !sourceLink.trim() && files.length === 0) return
    setUploading(true)
    try {
      // Önce ürünü oluştur
      const { data: product, error } = await supabase
        .from('products')
        .insert({
          title: title.trim(),
          description: '',
          tags: [],
          source_link: sourceLink.trim(),
          status: 'pool',
          assigned_to: '',
          media_files: [],
          created_by: currentUser,
        })
        .select()
        .single()

      if (error) throw error

      // Dosyaları yükle
      if (files.length > 0) {
        const uploaded = []
        for (const file of files) {
          setUploadingFile(file.name)
          const result = await uploadFile(file, product.id)
          uploaded.push(result)
        }
        await supabase.from('products').update({ media_files: uploaded }).eq('id', product.id)
      }

      onClose()
    } catch (err) {
      console.error(err)
      alert('Hata oluştu: ' + err.message)
    } finally {
      setUploading(false)
      setUploadingFile('')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-800">Yeni Ürün Ekle</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100">×</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Ürün Başlığı</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Başlık gir (opsiyonel, sonra da eklenebilir)"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Kaynak Link</label>
            <input
              type="text"
              value={sourceLink}
              onChange={e => setSourceLink(e.target.value)}
              placeholder="https://www.etsy.com/listing/..."
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Görsel / Video</label>
            <div
              onDrop={handleDrop}
              onDragOver={e => e.preventDefault()}
              onClick={() => fileRef.current.click()}
              className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center cursor-pointer hover:border-rose-300 hover:bg-rose-50 transition-colors"
            >
              <div className="text-3xl mb-2">🖼️</div>
              <p className="text-sm text-gray-500">
                {files.length > 0 ? `${files.length} dosya seçildi` : 'Dosyaları buraya sürükle veya tıkla'}
              </p>
              <p className="text-xs text-gray-400 mt-1">JPG, PNG, WEBP, MP4, MOV</p>
              <input ref={fileRef} type="file" accept="image/*,video/*" multiple onChange={handleFileChange} className="hidden" />
            </div>
            {files.length > 0 && (
              <ul className="mt-2 space-y-1">
                {files.map((f, i) => (
                  <li key={i} className="text-xs text-gray-500 flex items-center gap-1">
                    <span>{f.type.startsWith('video') ? '🎬' : '🖼️'}</span>
                    <span className="truncate">{f.name}</span>
                    <span className="text-gray-400 ml-auto">({(f.size / 1024 / 1024).toFixed(1)} MB)</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {uploading && (
            <div className="flex items-center gap-3 bg-rose-50 rounded-xl p-3">
              <div className="animate-spin w-4 h-4 border-2 border-rose-500 border-t-transparent rounded-full flex-shrink-0" />
              <p className="text-sm text-rose-600 truncate">
                {uploadingFile ? `Yükleniyor: ${uploadingFile}` : 'Kaydediliyor...'}
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
              İptal
            </button>
            <button type="submit"
              disabled={uploading || (!title.trim() && !sourceLink.trim() && files.length === 0)}
              className="flex-1 px-4 py-2.5 bg-rose-500 text-white rounded-xl text-sm font-medium hover:bg-rose-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {uploading ? 'Yükleniyor...' : 'Ekle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
