# TeePublic Integration Guide

## Overview
Website sekarang terintegrasi dengan TeePublic Print-on-Demand. Setiap produk dapat dikonfigurasi untuk redirect langsung ke TeePublic, dengan cart otomatis terhapus setelah customer redirect.

## Features

### 1. **Admin Panel - Add/Edit Product**
- ✅ **New Field**: "TeePublic Product Link" di form produk
- Input harus format URL TeePublic (validasi otomatis)
- Contoh: `https://www.teepublic.com/user/your-store/t-12345`

**Lokasi**:
- File: `/admin/index.html` 
- Di form "Add Product" → Baris baru: TeePublic link input field

### 2. **Product Detail Page** 
- ✅ **Conditional Button**: 
  - Jika produk punya TeePublic link → Tombol "Buy on TeePublic" (orange gradient)
  - Jika tidak ada TeePublic link → Tombol "Add to Cart" (hijau default)
  
- ✅ **UI Changes**:
  - Size selector dan quantity selector HIDDEN untuk TeePublic products
  - Tombol "Buy on TeePublic" redirect ke link dengan target="_blank"
  - Cart auto-clear sebelum redirect

**File**: `/shop/product-detail.js`

### 3. **Data Structure**
Setiap produk sekarang punya field tambahan:
```javascript
{
  id: 1766086790788,
  name: "T-Shirt Design",
  price: 19.99,
  description: "...",
  category: "1",
  tags: "tshirt, clothing",
  teepublicLink: "https://www.teepublic.com/... ", // NEW FIELD
  image: "data:image/jpeg;...",
  images: [...],
  stock: { XS: 0, S: 0, M: 0, ... },
  createdAt: "2025-12-19T..."
}
```

### 4. **Redirect Function**
**File**: `/script.js` - Function `redirectToTeePublic(event, teepublicLink, productName)`

```javascript
// Cara kerja:
1. Clear cart dari localStorage
2. Update cart count di header
3. Show notification: "Redirecting to TeePublic for [Product Name]..."
4. Open TeePublic link di tab baru (target="_blank")
5. Cart kosong di website tetapi tidak menghapus dari TeePublic
```

### 5. **Styling**
**File**: `/styles.css`

Button styling untuk TeePublic:
```css
.action-btn.buy-on-teepublic {
  background: linear-gradient(135deg, #ff6b35, #ff8c00);
  border-color: #ff8c00;
}

.action-btn.buy-on-teepublic:hover {
  background: linear-gradient(135deg, #ff8c00, #ff6b35);
  box-shadow: 0 8px 20px rgba(255, 107, 53, 0.4);
}
```

## How to Use

### Setup Product dengan TeePublic Link

1. **Admin Panel**:
   - Buka `/admin/index.html`
   - Login dengan credentials
   - Ke section "Shop" → "Add Product"
   - Isi semua field normal
   - **Baru**: Paste TeePublic product link di field "TeePublic Product Link"
   - Click "Save Product"

2. **Edit Existing Product**:
   - Click tombol Edit pada produk
   - Scroll ke field "TeePublic Product Link"
   - Paste/update link
   - Click "Update"

3. **Di Frontend (Shop Page)**:
   - Customer ke `/shop`
   - Click produk dengan TeePublic link
   - Lihat tombol "Buy on TeePublic" (orange) bukan "Add to Cart"
   - Click tombol → redirect ke TeePublic
   - Cart otomatis kosong

### untuk Produk Lokal (Non-TeePublic)
- Jangan isi TeePublic link field
- Produk akan normal dengan "Add to Cart" button hijau
- Size selection dan quantity tetap ada

## Data Flow

```
Admin Add/Edit Product
    ↓
Input TeePublic Link (atau kosongkan)
    ↓
Save to localStorage (inverted_admin_data)
    ↓
Sync to Firebase
    ↓
Frontend Load Product
    ↓
Check: teepublicLink exist?
    ├─ YES: Show "Buy on TeePublic" button
    │       Hide size/qty selectors
    │       Click → redirectToTeePublic()
    │            → Clear cart
    │            → Open TeePublic link
    │
    └─ NO: Show "Add to Cart" button (normal flow)
           Show size/qty selectors
```

## Technical Changes Made

### Files Modified:

1. **`/admin/index.html`**
   - Added TeePublic link input field to shop form

2. **`/admin/admin.js`**
   - Added `teepublicLink` field capture di `handleSubmit()` (line ~428)
   - Added TeePublic link section di edit modal (line ~1680-1690)
   - Updated `handleModalSubmit()` untuk capture teepublicLink (line ~1915-1920)

3. **`/shop/product-detail.js`**
   - Added conditional rendering untuk button (line ~75-90)
   - Show "Buy on TeePublic" jika `product.teepublicLink` exist
   - Hide size/qty selectors untuk TeePublic products

4. **`/script.js`**
   - Added `redirectToTeePublic()` function (line ~205-225)
   - Clears cart sebelum redirect
   - Shows notification
   - Opens link di tab baru

5. **`/styles.css`**
   - Added `.action-btn.buy-on-teepublic` styling (line ~968-977)

## Testing Checklist

- [ ] Add product dengan TeePublic link di admin
- [ ] Edit product dan update TeePublic link
- [ ] Check product di shop page
- [ ] Click "Buy on TeePublic" button
- [ ] Verify: redirect ke TeePublic di tab baru
- [ ] Verify: cart di website kosong setelah redirect
- [ ] Test add produk lokal (tanpa TeePublic link)
- [ ] Verify: "Add to Cart" button masih work normal
- [ ] Test size selection untuk produk lokal
- [ ] Check Firebase sync - TeePublic link ter-save

## Notes

- ✅ Cart clearing hanya di website, tidak mempengaruhi customer di TeePublic
- ✅ URL validation otomatis (harus domain teepublic.com)
- ✅ TeePublic link optional (bisa kosong untuk produk lokal)
- ✅ Compatible dengan inventory system
- ✅ Firebase sync otomatis untuk TeePublic link

## FAQ

**Q: Apakah customer bisa beli di kedua platform?**
A: Ya! Produk bisa dijual lokal (Add to Cart) atau via TeePublic (redirect). Pilih sesuai kebutuhan per produk.

**Q: Bagaimana tracking penjualan TeePublic?**
A: TeePublic punya affiliate dashboard. Kamu bisa track dari sana.

**Q: Bisa ubah produk dari lokal ke TeePublic?**
A: Ya, cukup add TeePublic link ke produk existing via edit modal.

**Q: Apakah stok terintegrasi dengan TeePublic?**
A: Tidak. TeePublic handle stok sendiri. Field stok di website hanya untuk lokal products.

---

**Last Updated**: December 19, 2025
**Status**: ✅ Live & Ready to Use
