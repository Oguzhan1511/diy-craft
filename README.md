# 🧵 DIY Craft — Ürün Havuzu

Etsy mağazanız için ortak ürün takip sistemi. İki bilgisayardan gerçek zamanlı kullanılabilir.

---

## 🚀 Kurulum (İlk Sefer)

### 1. Firebase Projesi Oluştur

1. [console.firebase.google.com](https://console.firebase.google.com) adresine git
2. **"Create a project"** → Proje adı: `diy-craft` → Continue → Continue → Create project
3. Sol menüden **Firestore Database** → Create database → **Start in test mode** → Next → Enable
4. Sol menüden **Storage** → Get started → **Start in test mode** → Next → Done
5. Sol menüden **Project Settings** (⚙️ simgesi) → **Your apps** → **Web** (`</>`) simgesi → App nickname: `diy-craft-web` → Register app
6. Çıkan `firebaseConfig` nesnesindeki değerleri kopyala

### 2. `.env.local` Dosyası Oluştur

Projenin kök dizininde `.env.local` dosyası oluştur ve şu şekilde doldur:

```
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=diy-craft-xxxxx.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=diy-craft-xxxxx
VITE_FIREBASE_STORAGE_BUCKET=diy-craft-xxxxx.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
```

### 3. Projeyi Çalıştır

```bash
npm run dev
```

Tarayıcıda `http://localhost:5173` adresini aç.

---

## 🌐 İki Bilgisayardan Kullanmak

**Seçenek A — Aynı ağdayken (LAN):**
```bash
npm run dev -- --host
```
Terminalde çıkan `Network: http://192.168.x.x:5173` adresini arkadaşın tarayıcısına yaz.

**Seçenek B — İnternetten (Vercel ücretsiz hosting):**
1. [vercel.com](https://vercel.com) hesabı aç
2. Import Git Repository veya klasörü sürükle-bırak
3. Environment Variables kısmına `.env.local` içindeki değerleri gir
4. Deploy et → çıkan URL'yi arkadaşınla paylaş

---

## 📱 Nasıl Kullanılır

| Durum | Açıklama |
|-------|----------|
| 🔵 Havuzda | Ürün bulundu, henüz kimse almadı |
| 🟡 Yapılıyor | Biri bu ürünü üretiyor |
| 🟢 Tamamlandı | Ürün hazır |

### Ürün Eklemek
- Sağ üstten "+ Ürün Ekle" butonuna tıkla
- Link ve/veya görsel/video yükle, başlık gir → Ekle

### Ürün Detayı
- Bir ürün kartına tıkla
- Başlık, açıklama, tag gir → Kaydet
- "Yapılıyor Olarak İşaretle" → ürün sana atanır
- "Tamamlandı Olarak İşaretle" → bitti!

---

## 🗂 Proje Yapısı

```
src/
├── components/
│   ├── ProductCard.jsx    # Ürün kartı
│   ├── ProductModal.jsx   # Detay/düzenleme modalı
│   ├── AddProductModal.jsx # Yeni ürün ekleme
│   └── StatusBadge.jsx    # Durum etiketi
├── pages/
│   └── ProductPool.jsx    # Ana sayfa
├── firebase.js            # Firebase bağlantısı
└── App.jsx                # Kök bileşen (isim ekranı)
```
