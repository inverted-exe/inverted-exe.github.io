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
         ".write": true
       }
     }
   }
   ```
   - Klik "Publish"
   - Tunggu sampai ada notifikasi "Rules Published"

4. **Initialize Database Node:**
   - Di Realtime Database, klik tab "Data"
   - Klik icon **"+"** untuk add data baru
   - **Key:** `content`
   - **Value:** Copy-paste ini:
   ```json
   {
     "shop": [],
     "archive": [],
     "gallery": []
   }
   ```
   - Klik "Add"
   - Sekarang Anda akan lihat node `content` dengan 3 empty arrays

4. **Ambil Firebase Config:**
   - Klik gear icon (⚙️) di kiri atas → "Project Settings"
   - Scroll ke bawah ke section "Your apps"
   - Klik icon `</>` (Web) untuk membuka config
   - Copy seluruh config object yang muncul (terlihat seperti ini):
   ```javascript
   const firebaseConfig = {
     apiKey: "AIzaSyD...xxxxx",
     authDomain: "your-project.firebaseapp.com",
     databaseURL: "https://your-project.firebaseio.com",
     projectId: "your-project-id",
     storageBucket: "your-project.appspot.com",
     messagingSenderId: "123456789",
     appId: "1:123456789:web:abcdef123456"
   };
   ```
   - Highlight semua text di dalam box (Ctrl+A)
   - Copy (Ctrl+C)

5. **Update `database.js`:**
   - Buka file `database.js` di root folder workspace Anda
   - Cari bagian di paling atas:
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
   - **Ganti SELURUH object ini dengan config yang sudah Anda copy dari Firebase**
   - Contoh hasil akhirnya:
   ```javascript
   const firebaseConfig = {
     apiKey: "AIzaSyD1234567890abcdefghijklmnopqrst",
     authDomain: "inverted-exe-database.firebaseapp.com",
     databaseURL: "https://inverted-exe-database.firebaseio.com",
     projectId: "inverted-exe-database",
     storageBucket: "inverted-exe-database.appspot.com",
     messagingSenderId: "123456789012",
     appId: "1:123456789012:web:abcdef1234567890"
   };
   ```
   - Save file (Ctrl+S)

6. **Add Firebase CDN ke HTML:**
   - Buka file `index.html` di root folder
   - Cari tag `</head>` (sebelum penutup head)
   - Tambahkan kode berikut **SEBELUM** `</head>`:
   ```html
   <!-- Firebase -->
   <script src="https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js"></script>
   <script src="https://www.gstatic.com/firebasejs/10.0.0/firebase-database.js"></script>
   <script src="database.js"></script>
   <script src="database-sync.js"></script>
   </head>
   ```
   
   - **PENTING:** Ulangi langkah yang sama untuk file HTML lainnya:
     - `gallery/index.html`
     - `shop/index.html`
     - `archive/index.html`
   - Save semua file (Ctrl+S)

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

### Langkah-langkah Testing:

1. **Upload data dari admin panel:**
   - Buka `http://localhost:8000/admin/` atau halaman admin Anda
   - Login dengan username: `admin`, password: `admin123`
   - Upload beberapa item ke Shop, Archive, atau Gallery
   - Klik tombol save/submit
   - Tunggu 2-3 detik sampai data tersimpan

2. **Buka halaman publik di tab baru (Incognito):**
   - Buka browser baru atau gunakan Incognito Mode (Ctrl+Shift+N)
   - Akses halaman shop/gallery/archive
   - Cek apakah item yang Anda upload sudah muncul

3. **Jika data tidak muncul:**
   - Buka Console (F12) → Tab "Console"
   - Cek apakah ada error message (warna merah)
   - Catat error message-nya untuk troubleshooting
   - Refresh halaman (F5 atau Ctrl+R)

4. **Verifikasi data di Firebase (optional):**
   - Buka https://console.firebase.google.com/
   - Pilih project Anda
   - Klik "Realtime Database"
   - Lihat apakah data sudah ada di bawah "content" node

## Troubleshooting

### ❌ Data hanya muncul di device yang upload, tidak di device lain:

**Masalah:** Admin panel tidak tersimpan ke Firebase, hanya di localStorage lokal.

**Solusi:**

1. **Pastikan Firebase Scripts dimuat:**
   - Buka F12 → Console
   - Ketik: `firebase` (tekan Enter)
   - Jika undefined, berarti Firebase belum ter-load

2. **Cek Firebase Config:**
   - Buka file `/database.js`
   - Pastikan config sudah diupdate dengan nilai dari Firebase
   - Jangan gunakan placeholder seperti "YOUR_API_KEY"

3. **Cek Firebase Rules:**
   - Buka https://console.firebase.google.com/
   - Pilih project Anda
   - Klik "Realtime Database" → "Rules"
   - Pastikan rules memungkinkan read:
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

4. **Test Firebase Connection:**
   - Buka admin panel (F12 → Console)
   - Ketik: `firebase.database()` (tekan Enter)
   - Seharusnya return Database object, bukan error

5. **Cek Admin Panel Save:**
   - Upload item dari admin panel
   - Buka Console → ketik: `localStorage.getItem('inverted_admin_data')` (Enter)
   - Seharusnya menampilkan data yang baru diupload

6. **Cek Firebase Dashboard:**
   - Buka https://console.firebase.google.com/
   - Pilih project
   - Klik "Realtime Database"
   - Lihat apakah ada "content" node dengan data

7. **Jika masih tidak sync:**
   - Clear localStorage: Buka Console → `localStorage.clear()`
   - Refresh halaman (F5)
   - Upload item lagi
   - Cek Firebase dashboard apakah data tersimpan

### Firebase error "Permission denied":
1. Update Rules di Realtime Database
2. Pastikan mode tidak "Locked Mode"
3. Tunggu beberapa detik setelah publish rules

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
