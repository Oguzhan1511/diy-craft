import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseKey)

// Storage yardımcı fonksiyonları
export const BUCKET = 'product-media'

export async function uploadFile(file, productId) {
  const ext = file.name.split('.').pop()
  const path = `${productId}/${Date.now()}.${ext}`
  const { error } = await supabase.storage.from(BUCKET).upload(path, file)
  if (error) throw error
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return { url: data.publicUrl, name: file.name, type: file.type, storagePath: path }
}

export async function deleteFile(storagePath) {
  if (!storagePath) return
  await supabase.storage.from(BUCKET).remove([storagePath])
}
