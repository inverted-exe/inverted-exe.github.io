# Database Setup Guide

Sistem database untuk menyimpan content yang dapat diakses oleh semua pengunjung.

## Opsi Database

Anda dapat memilih salah satu dari tiga opsi:

### Opsi 1: Firebase Realtime Database (RECOMMENDED - Paling Mudah)

**Kelebihan:**
- Real-time sync
- Gratis untuk traffic rendah
- Setup paling mudah
- Multi-platform support

**Langkah-langkah:**

1. **Buat Firebase Project:**
   - Kunjungi https://console.firebase.google.com/
   - Klik "Add Project"
   - Beri nama project: `inverted-exe-database`
   - Pilih negara Indonesia
   - Klik "Create Project"

2. **Setup Realtime Database:**
   - Di sidebar kiri, klik "Realtime Database" (atau "Build" → "Realtime Database")
   - Klik "Create Database"
   - Pilih lokasi: Singapore (terdekat)
   - Mode: Mulai dengan "Test Mode"
   - Klik "Enable"

3. **Setup Authentication (Optional untuk public read):**
   - Klik "Rules" di Realtime Database
   - Ganti dengan rules berikut:
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
   - Klik "Publish"

4. **Ambil Firebase Config:**
   - Klik gear icon → "Project Settings"
   - Scroll ke bawah ke section "Your apps"
   - Klik icon `</>` untuk web
   - Copy config object

5. **Update `database.js`:**
   - Buka file `database.js` di root folder
   - Ganti bagian `firebaseConfig` dengan config Anda:
   ```javascript
   const firebaseConfig = {
     apiKey: "YOUR_API_KEY",
     authDomain: "YOUR_PROJECT.firebaseapp.com",
     databaseURL: "https://YOUR_PROJECT.firebaseio.com",
     projectId: "YOUR_PROJECT",
     storageBucket: "YOUR_PROJECT.appspot.com",
     messagingSenderId: "YOUR_SENDER_ID",
     appId: "YOUR_APP_ID"
   };
   ```

6. **Add Firebase CDN ke HTML:**
   - Tambahkan di file HTML (sebelum script lainnya):
   ```html
   <!-- Firebase -->
   <script src="https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js"></script>
   <script src="https://www.gstatic.com/firebasejs/10.0.0/firebase-database.js"></script>
   <script src="database.js"></script>
   <script src="database-sync.js"></script>
   ```

### Opsi 2: GitHub JSON File (Dengan API Token)

**Kelebihan:**
- Terintegrasi dengan repository
- Data disimpan di GitHub
- Gratis

**Langkah-langkah:**

1. **Buat GitHub Personal Access Token:**
   - Kunjungi https://github.com/settings/tokens
   - Klik "Generate new token"
   - Nama: "inverted-exe-data"
   - Pilih scope: `repo`, `workflow`
   - Klik "Generate token"
   - Copy token (hanya tampil sekali)

2. **Update `database-github.js`:**
   ```javascript
   const GITHUB_CONFIG = {
     owner: 'inverted-exe',
     repo: 'inverted-exe.github.io',
     branch: 'main',
     token: 'YOUR_GITHUB_TOKEN',  // Paste token di sini
     dataFile: 'data/content.json'
   };
   ```

3. **Add ke HTML:**
   ```html
   <script src="database-github.js"></script>
   <script src="database-sync.js"></script>
   ```

### Opsi 3: JSON File Lokal (Paling Simple)

**Kelebihan:**
- Tidak perlu setup backend
- File sederhana

**Kekurangan:**
- Hanya bisa baca dari file
- Untuk update, perlu manual push ke GitHub

**Langkah-langkah:**

1. **File sudah ada di:** `data/content.json`

2. **Biarkan file kosong atau isi dengan data:**
   ```json
   {
     "shop": [],
     "archive": [],
     "gallery": []
   }
   ```

3. **Add ke HTML:**
   ```html
   <script src="database-sync.js"></script>
   ```

## Integration dengan Admin Panel

Update file `admin/admin.js` untuk menyimpan ke database:

```javascript
// Sebelum: Hanya localStorage
localStorage.setItem('inverted_admin_data', JSON.stringify(adminData));

// Sesudah: Save ke database
await DatabaseSync.save(adminData, useFirebase); // useFirebase: true/false
```

## Integration dengan Page Viewer

Update file `admin/data-loader.js`:

```javascript
// Sebelum:
function loadAdminData() {
  return JSON.parse(localStorage.getItem('inverted_admin_data')) || {};
}

// Sesudah:
function loadAdminData() {
  return DatabaseSync.load();
}

// Di initialize, tambahkan sync:
async function initializeAdminData() {
  await DatabaseSync.init(useFirebase); // sync data terlebih dahulu
  displayShopItems();
  displayArchiveItems();
  displayGalleryImages();
  setupImageLightbox();
}
```

## Testing Database

1. **Upload data dari admin panel**
2. **Buka halaman berbeda (incognito/fresh tab)**
3. **Cek apakah data tampil**
4. **Jika tidak muncul, cek console untuk error**

## Troubleshooting

### Data tidak muncul di halaman publik:
1. Cek Console (F12) untuk error messages
2. Pastikan `database-sync.js` di-load
3. Pastikan Firebase/GitHub config benar
4. Cek localStorage: `localStorage.getItem('inverted_admin_data')`

### Firebase error "Permission denied":
1. Update Rules di Realtime Database
2. Pastikan mode tidak "Locked Mode"

### GitHub API error:
1. Cek GitHub token valid
2. Pastikan token memiliki scope `repo`
3. Cek path file benar

## File Structure

```
root/
├── data/
│   └── content.json          # JSON file untuk data
├── database.js               # Firebase config
├── database-github.js        # GitHub API config
├── database-sync.js          # Hybrid sync system
├── admin/
│   ├── admin.js              # Update untuk save ke DB
│   └── data-loader.js        # Update untuk load dari DB
├── index.html
├── gallery/
│   └── index.html
├── shop/
│   └── index.html
└── archive/
    └── index.html
```

## Best Practices

1. **Selalu backup data** sebelum testing
2. **Setup authentication** di Firebase untuk admin
3. **Monitor database usage** untuk biaya
4. **Test di incognito tab** untuk memastikan data sync
5. **Clear localStorage** jika ada masalah: `localStorage.clear()`
