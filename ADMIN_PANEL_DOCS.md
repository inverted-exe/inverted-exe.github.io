# Admin Panel Documentation

## Overview
Admin Panel memungkinkan Anda untuk mengelola konten di website inverted.exe dengan mudah, termasuk:
- Shop products
- Archive items
- Gallery images
- About page (inverted.exe) content

## Akses Admin Panel

### URL
```
/admin/
```

### Login Credentials (Demo)
- **Username**: `admin`
- **Password**: `admin123`

> ⚠️ **Security Note**: Ubah credentials ini di production environment!

## Fitur-Fitur

### 1. Shop Management
Kelola produk di toko online Anda:
- **Add Product**: Tambah nama, harga, deskripsi, dan gambar
- **Edit Product**: Ubah informasi produk yang sudah ada
- **Delete Product**: Hapus produk dari katalog
- **Image Upload**: Upload gambar produk (Max 5MB)

### 2. Archive Management
Kelola arsip konten:
- **Add Archive**: Tambah judul, kategori, deskripsi
- **Edit Archive**: Perbarui informasi arsip
- **Delete Archive**: Hapus arsip
- **Cover Image**: Upload gambar penutup arsip

### 3. Gallery Management
Kelola galeri foto:
- **Add Image**: Upload foto dengan judul dan deskripsi
- **Edit Image**: Ubah informasi gambar
- **Delete Image**: Hapus gambar dari galeri
- **Multiple Images**: Support untuk banyak gambar

### 4. Inverted.exe Page
Edit halaman about:
- **Page Title**: Judul utama halaman
- **Subtitle**: Subtitle pendamping
- **Main Content**: Deskripsi panjang tentang inverted.exe
- **Team Members**: Tambah anggota tim dengan nama dan role
- **Partners**: Daftar mitra/kolaborator
- **Add Members/Partners**: Tombol untuk menambah entri baru

## Data Storage

### Local Storage
Semua data disimpan di **localStorage** browser dengan key: `inverted_admin_data`

Struktur data:
```json
{
  "shop": [
    {
      "id": 1234567890,
      "name": "Product Name",
      "price": "99.99",
      "description": "Product description",
      "image": "base64-encoded-image",
      "createdAt": "2025-12-10T10:30:00Z"
    }
  ],
  "archive": [...],
  "gallery": [...],
  "invertedExe": {
    "mainTitle": "...",
    "subtitle": "...",
    "content": "...",
    "teamMembers": [...],
    "partners": [...]
  }
}
```

### Backup & Export
Data dapat di-export sebagai JSON file untuk backup:
```javascript
// Untuk export (tambahkan button untuk ini):
exportData();

// Untuk import:
// Select file dengan input[type="file"]
importData(file);
```

## Integrasi dengan Main Website

### Script Loading
File `admin/data-loader.js` otomatis memuat data dari localStorage dan menampilkannya di halaman utama.

### Fungsi yang Tersedia
```javascript
// Load semua data
const adminData = loadAdminData();

// Display di halaman tertentu
displayShopItems();      // Untuk shop page
displayArchiveItems();   // Untuk archive page
displayGalleryImages();  // Untuk gallery page
displayInvertedExeContent(); // Untuk about page
```

## Workflow Contoh

### Menambah Produk di Shop
1. Login ke admin panel `/admin/`
2. Klik tab **Shop** di sidebar
3. Isi form:
   - Product Name: "T-Shirt inverted.exe"
   - Price: "29.99"
   - Description: "Comfortable inverted.exe t-shirt"
   - Upload image
4. Klik **Save Product**
5. Produk akan langsung muncul di `/shop`

### Menambah Foto ke Gallery
1. Login ke admin panel
2. Klik tab **Gallery**
3. Isi form:
   - Image Title: "Photoshoot 001"
   - Description: "Behind the scenes"
   - Upload image
4. Klik **Upload Image**
5. Foto akan muncul di `/gallery`

## Tips & Tricks

### Image Optimization
- Gunakan format JPG atau PNG
- Kompres gambar sebelum upload untuk performa lebih baik
- Ukuran ideal untuk shop: 400x400px
- Ukuran ideal untuk gallery: 600x600px

### Data Backup
Lakukan backup regular dengan export data:
1. Buka browser console (F12)
2. Jalankan: `exportData()`
3. Simpan file JSON yang ter-download

### Restore Data
1. Buka browser console
2. Ambil file JSON backup
3. Jalankan: `importData(file)`
4. Konfirmasi prompt

## Browser Compatibility
- Chrome/Chromium: ✅ Fully supported
- Firefox: ✅ Fully supported
- Safari: ✅ Fully supported
- Edge: ✅ Fully supported

## Limitations & Considerations

### localStorage Limits
- Typical limit: ~5-10MB per domain
- Catat ukuran file jika upload banyak image base64

### Best Practices
1. Jangan bagi credentials admin dengan orang lain
2. Clear browser cache/data jika ada masalah data
3. Backup data secara berkala
4. Test perubahan di development sebelum production

## Troubleshooting

### Data tidak muncul di website
- Refresh halaman (Ctrl+Shift+R untuk hard refresh)
- Cek browser console untuk error messages
- Pastikan `admin/data-loader.js` di-include di index.html

### Gambar tidak terlihat
- Pastikan gambar ter-upload dengan benar
- Check ukuran file (max 5MB)
- Browser support untuk base64 images

### Tidak bisa login
- Pastikan cookies/localStorage tidak di-disable
- Clear browser cache
- Gunakan incognito/private window untuk test

## Future Enhancements
- [ ] Cloud storage integration (Firebase, AWS S3)
- [ ] Multi-user authentication
- [ ] Database backend (instead of localStorage)
- [ ] Image compression & optimization
- [ ] Version control & undo features
- [ ] Real-time sync across devices
- [ ] Advanced search & filtering
