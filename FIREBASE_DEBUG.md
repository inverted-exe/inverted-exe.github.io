# Firebase Debug Guide - Data Hilang Setelah Logout

## ❌ Masalah
Data yang diupload di admin panel hilang ketika Anda logout dan login lagi.

## 🔍 Penyebab

Ada 2 kemungkinan penyebab:

### Penyebab 1: Data Hanya Disimpan Lokal, Tidak ke Firebase
- Admin panel hanya menyimpan ke `localStorage` lokal device
- Ketika logout, localStorage di-clear
- Data tidak tersimpan di Firebase cloud

### Penyebab 2: Firebase Tidak Terhubung
- Firebase config tidak benar
- Firebase scripts tidak ter-load
- Firebase rules tidak memungkinkan write

---

## ✅ Solusi

### Step 1: Verifikasi Firebase Terhubung

Buka admin panel, lalu buka **Console** (F12):

```javascript
// Ketik di console:
firebase

// Seharusnya muncul object Firebase, bukan "undefined"
```

**Jika undefined:**
- Firebase scripts tidak ter-load
- Cek apakah file `/database.js` ada dan valid
- Cek apakah Firebase CDN link di `admin/index.html` benar

---

### Step 2: Verifikasi Firebase Config

```javascript
// Di console:
firebase.database()

// Seharusnya return Database object
```

**Jika error:**
- Config di `database.js` tidak benar
- Buka `/database.js` dan pastikan `firebaseConfig` sudah diupdate dengan nilai dari Firebase Console

---

### Step 3: Upload Item dan Cek Console

1. **Buka admin panel**
2. **Buka F12 → Console tab**
3. **Upload sebuah item (shop/archive/gallery)**
4. **Lihat console untuk logs:**

```javascript
// Seharusnya muncul:
Data saved to localStorage
Syncing to Firebase...
Firebase sync result: true
```

**Jika tidak ada "Syncing to Firebase":**
- `DatabaseSync` tidak ter-load
- Cek di console: `DatabaseSync` (seharusnya return object)

---

### Step 4: Verifikasi di Firebase Dashboard

1. **Buka https://console.firebase.google.com/**
2. **Pilih project: `inverted-exe-database`**
3. **Klik "Realtime Database"**
4. **Lihat apakah ada "content" node dengan data**

**Struktur yang benar:**
```
content
├── shop: [...]
├── archive: [...]
└── gallery: [...]
```

**Jika data tidak ada di Firebase:**
- Firebase write tidak berhasil
- Cek Firebase Rules

---

### Step 5: Cek Firebase Rules

1. **Di Realtime Database, klik tab "Rules"**
2. **Rules harus seperti ini:**

```json
{
  "rules": {
    "content": {
      ".read": true,
      ".write": false
    }
  }
}
```

⚠️ Jika `.write: false`, admin panel tidak bisa menulis!

**Solusi: Ganti rules ke:**

```json
{
  "rules": {
    "content": {
      ".read": true,
      ".write": true
    }
  }
}
```

Kemudian klik **"Publish"**

---

### Step 6: Test Sync Dengan 2 Device

1. **Device A (Admin):**
   - Buka admin panel
   - Upload item baru
   - Tunggu 2-3 detik

2. **Device B (Incognito):**
   - Buka halaman publik (shop/gallery/archive) di device/tab lain
   - Item dari Device A seharusnya tampil LANGSUNG

**Jika tidak tampil:**
- Refresh halaman di Device B
- Cek console untuk error messages
- Cek apakah `data-loader.js` ada di halaman publik

---

## 🛠️ Debugging Checklist

Sebelum logout/login, pastikan:

- [ ] `firebase` defined di console (Firebase loaded)
- [ ] `DatabaseSync` defined di console (Sync system loaded)
- [ ] Upload item → console shows "Syncing to Firebase..."
- [ ] Data appears di Firebase Dashboard Realtime Database
- [ ] Firebase Rules allow write (`.write: true` atau custom)
- [ ] Public pages show uploaded item tanpa refresh
- [ ] Item tetap ada setelah logout dan login lagi

---

## 💾 Backup Data Jika Khawatir

Admin panel punya fitur export/import:

```javascript
// Di console:
localStorage.getItem('inverted_admin_data')

// Copy output untuk backup
```

---

## 🆘 Jika Masih Error

1. **Buka Console (F12) setelah upload item**
2. **Copy seluruh error message**
3. **Cek output:**
   - Apakah ada "Permission denied"?
   - Apakah ada "undefined" error?
   - Apakah Firebase returning null?

4. **Solusi umum:**
   - `localStorage.clear()` → Clear semua cache
   - `location.reload()` → Refresh halaman
   - Cek Firebase Rules lagi
   - Cek Firebase config di `/database.js`

---

## 📝 File yang Diupdate

Berikut adalah file yang sudah diubah untuk fix masalah ini:

### `/admin/admin.js`
- **Ditambah**: Fungsi `saveAdminData()` untuk sync ke Firebase
- **Diubah**: Semua `localStorage.setItem()` menjadi `saveAdminData()`
- **Hasil**: Data otomatis sync ke Firebase setiap kali save

### `/database.js`
- Status: ✅ Sudah dikonfigurasi dengan Firebase config

### `/database-sync.js`
- Status: ✅ Sudah menggunakan `.on()` untuk real-time listener

### `/admin/index.html`
- Status: ✅ Firebase scripts sudah ditambahkan

### `/admin/firebase-admin-sync.js`
- Status: ✅ Helper untuk intercept localStorage writes

---

## 📋 Testing Checklist

```bash
# 1. Upload item dari admin
Admin Panel → Upload Product → Save

# 2. Check console logs
F12 → Console
# Seharusnya muncul:
# - "Data saved to localStorage"
# - "Syncing to Firebase..."
# - "Firebase sync result: true"

# 3. Check Firebase Dashboard
console.firebase.google.com → Realtime Database → lihat "content" node

# 4. Logout dan login
Admin Panel → Logout → Login

# 5. Verifikasi data masih ada
Admin Panel → Lihat list item seharusnya masih ada

# 6. Buka publik pages incognito
Shop/Gallery/Archive → Item dari tadi seharusnya ada

# 7. Refresh public pages
F5 → Item tetap ada (dari Firebase, bukan localStorage)
```

---

## ✨ Sekarang Data Harus

✅ Disimpan ke **localStorage** (lokal)
✅ Disimpan ke **Firebase** (cloud)
✅ Persist di kedua tempat setelah logout
✅ Sync real-time ke semua device

---

## 🎯 Next Step

Jika semua sudah berjalan, Anda bisa:

1. **Tambah authentication** - Admin login via Firebase Auth
2. **Tambah image optimization** - Compress base64 sebelum Firebase
3. **Tambah backup system** - Auto-backup data ke GitHub
4. **Monitor Firebase usage** - Avoid unexpected charges

