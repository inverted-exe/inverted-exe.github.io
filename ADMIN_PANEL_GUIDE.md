# Admin Panel Documentation

## Overview
The new admin panel is built with the same styling and layout as the public pages. It connects directly to Firebase for data management and is completely independent from localStorage.

## Features

### 1. **Authentication**
- **Location**: `/admin/login.html`
- **Default Password**: `inverted2025` (change this in `/admin/admin.js` line 1)
- **Method**: sessionStorage (expires when browser closes)
- **Protection**: All admin pages redirect to login if not authenticated

### 2. **Three Management Sections**
The admin panel has three main sections accessible via navigation:

#### Shop Manager
- **URL**: `/admin/` → click "// shop"
- **Features**:
  - Add/Edit/Delete products
  - Set product name, price, image URL, description
  - Add TeePublic links
  - Real-time sync to Firebase

#### Archive Manager
- **URL**: `/admin/` → click "// archive"
- **Features**:
  - Add/Edit/Delete archive items
  - Set title, category, image URL, description
  - Automatic date stamping
  - Real-time sync to Firebase

#### Gallery Manager
- **URL**: `/admin/` → click "// gallery"
- **Features**:
  - Add/Edit/Delete gallery images
  - Set title and image URL
  - Simple interface for quick uploads
  - Real-time sync to Firebase

### 3. **CRUD Operations**
- **Create**: Click "add product/item/image" button
- **Read**: Data loads automatically from Firebase
- **Update**: Click "edit" on any item card
- **Delete**: Click "delete" on any item card (requires confirmation)

### 4. **Design**
- **Header**: Matches public page (76px height, responsive burger menu on mobile)
- **Navigation**: Horizontal tabs for section switching
- **Layout**: Grid layout (responsive - 3 columns desktop, 1 mobile)
- **Colors**: Matches public page design (dark background, white text)
- **Typography**: Poppins font, matching public page styling

## Firebase Integration

### Data Structure
```
content/
├── shop/
│   └── [
│       {
│         id: timestamp,
│         name: "product name",
│         price: 29.99,
│         image: "url",
│         description: "...",
│         teepublicLink: "https://teepublic.com/...",
│         updatedAt: "ISO date"
│       }
│     ]
├── archive/
│   └── [
│       {
│         id: timestamp,
│         title: "archive title",
│         category: "photography",
│         image: "url",
│         description: "...",
│         createdAt: "ISO date",
│         updatedAt: "ISO date"
│       }
│     ]
└── gallery/
    └── [
        {
          id: timestamp,
          title: "gallery title",
          image: "url",
          updatedAt: "ISO date"
        }
      ]
```

### How It Works
- **Admin Panel**: Reads/writes to Firebase in real-time
- **Public Pages**: Load data from Firebase via `DatabaseSync.load()`
- **Updates**: Changes in admin panel appear instantly on public pages
- **No localStorage**: All data stored in Firebase only

## How to Use

### 1. Access Admin Panel
```
1. Go to https://inverted.exe/admin/login.html
2. Enter password: inverted2025
3. Click "login"
```

### 2. Add a Product
```
1. Click "// shop" in navigation (if not already there)
2. Click "add product" button
3. Fill in form:
   - product name (required)
   - price
   - image url
   - description
   - teepublic link (optional)
4. Click "save product"
```

### 3. Edit an Item
```
1. Find the item card
2. Click "edit" button
3. Modify any field
4. Click "save"
```

### 4. Delete an Item
```
1. Find the item card
2. Click "delete" button
3. Confirm deletion
4. Item removed from Firebase
```

### 5. Logout
```
1. Click logout button (top right)
2. Confirm logout
3. Redirected to login page
```

## Styling Notes

### Custom CSS Classes
- `.admin-main` - Main container with padding
- `.admin-section` - Each section (shop/archive/gallery)
- `.admin-controls` - Button controls area
- `.admin-grid` - Responsive grid layout
- `.admin-item-card` - Individual item card
- `.modal` - Modal overlay for forms
- `.notification` - Success/error messages

### Responsive Breakpoints
- **Desktop**: 3-column grid (300px min-width)
- **Tablet** (1024px): 2-3 columns
- **Mobile** (768px): 1 column, burger menu for navigation

## File Structure
```
/admin/
├── index.html          # Main admin panel
├── login.html          # Login page
├── admin.js            # All admin functionality (2000+ lines)
├── admin.css           # Admin styling
```

## Security Notes
- Password stored in admin.js (line 1: `const ADMIN_PASSWORD = 'inverted2025'`)
- Authentication stored in sessionStorage (expires when browser closes)
- All data saved to Firebase (ensure Firebase security rules are configured)
- Consider adding IP whitelist for production

## Troubleshooting

### Login page not working
- Check Firebase is initialized correctly
- Verify `database.js` is loaded
- Clear sessionStorage: `sessionStorage.clear()`

### Data not saving
- Check Firebase permissions in security rules
- Verify data structure matches expected format
- Check browser console for error messages

### Changes not appearing on public pages
- Ensure public pages have latest script.js with data-loader functions
- Check that public pages call `DatabaseSync.load()`
- Verify Firebase database URL is correct

## Customization

### Change Admin Password
Edit `/admin/admin.js` line 1:
```javascript
const ADMIN_PASSWORD = 'your_new_password';
```

### Customize Form Fields
Edit the form generation in `/admin/admin.js`:
- `openItemModal()` function creates form HTML
- Add new input fields as needed
- Update save functions to include new fields

### Modify Styling
Edit `/admin/admin.css`:
- Update colors (use CSS variables from main styles.css)
- Modify grid layout
- Adjust responsive breakpoints
