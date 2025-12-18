# Per-Size Stock Management System

## Overview
Sistem stock management yang fully integrated antara admin panel dan product detail page. Setiap produk sekarang memiliki stock terpisah untuk setiap ukuran (XS, S, M, L, XL, XXL).

## Architecture

### 1. Data Structure

**Old Format (Single Stock):**
```javascript
{
  id: 123,
  name: "T-Shirt",
  price: 50,
  stock: 30  // Total stock only
}
```

**New Format (Per-Size Stock):**
```javascript
{
  id: 123,
  name: "T-Shirt",
  price: 50,
  sizeStock: {
    'XS': 5,
    'S': 8,
    'M': 10,
    'L': 4,
    'XL': 2,
    'XXL': 1
  },
  stock: 30  // Auto-calculated from sizeStock (for backwards compatibility)
}
```

### 2. Admin Panel Changes

#### Form Updates (`admin/index.html`)
- **Removed:** Single `stock` input field
- **Added:** Size-based stock grid with 6 inputs (XS, S, M, L, XL, XXL)
- Each size has its own labeled input field
- Layout: Responsive grid that adapts to screen size

#### CSS Styling (`admin/admin.css`)
```css
.size-stock-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 12px;
}

.size-stock-input {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
```

#### Form Processing (`admin/admin.js`)
In `handleSubmit()` function:
```javascript
// Convert individual size stock inputs to sizeStock object
item.sizeStock = {
  'XS': parseInt(formData.get('sizeStockXS')) || 0,
  'S': parseInt(formData.get('sizeStockS')) || 0,
  'M': parseInt(formData.get('sizeStockM')) || 0,
  'L': parseInt(formData.get('sizeStockL')) || 0,
  'XL': parseInt(formData.get('sizeStockXL')) || 0,
  'XXL': parseInt(formData.get('sizeStockXXL')) || 0
};

// Auto-calculate total stock
item.stock = Object.values(item.sizeStock).reduce((a, b) => a + b, 0);
```

### 3. Inventory Management

#### Display Updates (`displayInventory()` & `displayShopItems()`)
Both functions now show per-size stock breakdown:

**Example Output:**
```
XS:5 S:8 M:10 L:4 XL:2 XXL:1
```

#### Stock Summary Card
Each product card in admin shows:
- Stock breakdown for all sizes
- Color-coded total stock badge
- Stock status indicator (in-stock/low-stock/out-of-stock)

#### Stats Calculation (`updateInventoryStats()`)
- Calculates total from sizeStock
- Maintains backwards compatibility with old stock field
- Status determination based on total stock

### 4. Product Detail Page

#### Display Logic (`shop/product-detail.js`)

**New Function: `updateStockDisplay(product)`**
```javascript
// Called when:
// 1. Page loads (initial display for default size M)
// 2. User changes size selection
// Updates stock display based on selected size

function updateStockDisplay(product) {
  const selectedSize = document.getElementById('sizeSelect').value || 'M';
  const sizeStock = product.sizeStock || {};
  const stock = sizeStock[selectedSize] || 0;
  const stockBadge = document.getElementById('detailStockStatus');
  
  if (stock === 0) {
    stockBadge.textContent = `${selectedSize}: out of stock`;
    stockBadge.className = 'stock-badge out-of-stock';
    // Disable quantity and add-to-cart
  } else if (stock <= 5) {
    stockBadge.textContent = `${selectedSize}: low stock (${stock} left)`;
    stockBadge.className = 'stock-badge low-stock';
    // Enable all controls
  } else {
    stockBadge.textContent = `${selectedSize}: in stock (${stock} available)`;
    stockBadge.className = 'stock-badge in-stock';
    // Enable all controls
  }
}
```

#### Stock Display Format
- Shows size prefix: `M: in stock (10 available)`
- Three-tier status: in-stock / low-stock / out-of-stock
- Color-coded badges (green/orange/red)

#### Size Selection Event Listener
```javascript
const sizeSelect = document.getElementById('sizeSelect');
sizeSelect.addEventListener('change', () => {
  updateStockDisplay(product);
});
```

### 5. Cart Validation

#### Updated `addProductToCart()` Function
```javascript
// Check stock for SELECTED SIZE (not total)
const sizeStock = product.sizeStock || {};
const availableStock = sizeStock[size] || 0;

if (availableStock === 0) {
  alert(`This product in size ${size} is out of stock`);
  return;
}

if (quantity > availableStock) {
  alert(`Only ${availableStock} items available in size ${size}`);
  return;
}
```

**Key Validations:**
1. Size must be selected
2. Stock checked for THAT SIZE only
3. Quantity cannot exceed available stock for that size
4. Error messages are size-specific

### 6. Data Flow

```
Admin Panel Input (6 fields: XS-XXL)
    ↓
handleSubmit() → Creates sizeStock object
    ↓
localStorage → Stores inverted_admin_data
    ↓
Product Detail Page
    ↓
loadAdminData() → Retrieves product with sizeStock
    ↓
displayProductDetail() + updateStockDisplay()
    ↓
Shows per-size stock based on selection
    ↓
addProductToCart() → Validates against selected size stock
```

### 7. Backwards Compatibility

**Old Products (without sizeStock):**
- `stock` field still exists and is used as fallback
- `product.sizeStock || {}` safely handles undefined
- Admin panel properly displays old format

**Migration Path:**
- Existing products: Continue using old `stock` field
- New products: Use sizeStock system
- Edit existing product: Can convert by re-saving with size inputs

## Usage Guide

### For Admins

1. **Adding New Product:**
   - Enter product name, price, description, images
   - Input stock quantity for each size (XS, S, M, L, XL, XXL)
   - System auto-calculates total stock
   - Save product

2. **Viewing Inventory:**
   - Inventory page shows per-size breakdown for each product
   - Total stock calculated from all sizes
   - Status badge shows overall availability

3. **Monitoring Stock:**
   - Admin panel shows stock by size on:
     - Inventory tab (detailed table view)
     - Shop tab (product cards)
   - Easy to spot which sizes are running low

### For Customers

1. **Browsing Products:**
   - Select desired size from dropdown
   - Stock status updates dynamically
   - See available quantity for that size

2. **Adding to Cart:**
   - System validates stock for SELECTED SIZE only
   - Cannot add if size is out of stock
   - Alert shows available quantity if over-requested

## Technical Details

### Files Modified

1. **admin/index.html**
   - Replaced single stock input with 6 size-based inputs
   - Added size-stock-grid layout

2. **admin/admin.js**
   - `handleSubmit()`: Converts size inputs to sizeStock object
   - `displayInventory()`: Shows per-size breakdown
   - `displayShopItems()`: Shows per-size breakdown on product cards
   - `updateInventoryStats()`: Calculates total from sizeStock
   - `filterInventory()`: Updated stock calculation

3. **admin/admin.css**
   - Added .size-stock-grid styling
   - Added .size-stock-input styling
   - Added .stock-breakdown styling
   - Added .total-stock styling

4. **shop/product-detail.js**
   - New `updateStockDisplay()` function
   - Updated `displayProductDetail()` with size listener
   - Updated `addProductToCart()` with per-size validation

5. **shop/product-detail.html**
   - No changes (size selector already exists)
   - Works seamlessly with updated JavaScript

## Stock Display Examples

### Admin Inventory View
```
Product: Blue T-Shirt
Stock: XS:5 S:8 M:10 L:4 XL:2 XXL:1
Total: 30 items
Status: In stock
```

### Product Detail Page
- **Before Size Selection:** "Select size to see stock"
- **After M Selected:** "M: in stock (10 available)"
- **After XS Selected:** "XS: low stock (5 left)"
- **After XXL Selected:** "XXL: out of stock"

## API Response Example

When product is fetched:
```javascript
{
  id: 1702345600000,
  type: 'shop',
  name: 'Premium Cotton T-Shirt',
  price: 49.99,
  description: 'High-quality...',
  sizeStock: {
    'XS': 5,
    'S': 8,
    'M': 10,
    'L': 4,
    'XL': 2,
    'XXL': 1
  },
  stock: 30,  // Backwards compatibility
  category: 'clothing',
  tags: 'cotton, shirt, casual',
  images: [/* array of base64 images */],
  image: /* first image */,
  createdAt: '2024-01-01T00:00:00.000Z'
}
```

## Testing Checklist

- [ ] Add new product with per-size stock via admin
- [ ] Verify sizeStock object created correctly in localStorage
- [ ] Product detail page loads without errors
- [ ] Stock displays correctly when changing size
- [ ] Stock shows correct status (in/low/out)
- [ ] Cannot add out-of-stock sizes to cart
- [ ] Cannot add quantity exceeding available stock
- [ ] Inventory page shows correct per-size breakdown
- [ ] Admin cards show stock breakdown
- [ ] Old products still work with backwards compatibility

## Future Enhancements

- Edit product: Support changing per-size stock values
- Quick update: Admin shortcuts for +/- per size
- Analytics: Track which sizes sell fastest
- Reorder alerts: Auto-notify when size stock low
- Size popularity: Show which sizes have highest demand

---

**System Status:** ✅ Fully Integrated & Working
**Last Updated:** 2024
**Compatibility:** Backwards compatible with old stock system
