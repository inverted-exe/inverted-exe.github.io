# Firebase Node Null - Quick Fix

## 🔴 Masalah
Upload item dari admin panel, tapi node di Firebase Realtime Database kosong/null.

## ✅ Quick Fix (3 Steps)

### Step 1: Update Firebase Rules
```
console.firebase.google.com 
→ Project: inverted-exe-database
→ Realtime Database
→ Rules tab
```

**Replace rules dengan:**
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
**Click: PUBLISH**

---

### Step 2: Initialize Node
```
Realtime Database
→ Data tab
→ Click "+" icon
→ Key: content
→ Value: {"shop":[],"archive":[],"gallery":[]}
→ Click: Add
```

---

### Step 3: Test Upload
```
Admin Panel
→ Upload 1 item
→ Open Console (F12)
→ Should see: "Data saved to Firebase"
→ Check Firebase Console → Data should appear ✅
```

---

## 🔍 If Still Not Working

Check in browser console:
```javascript
firebase.database().ref('content').once('value').then(snap => {
  console.log('Firebase data:', snap.val());
});
```

If null → Firebase Rules still wrong
If empty arrays → Go back to Step 2

---

## 📝 Important Settings

**Rules (MUST BE):**
- `.read: true` (public dapat baca)
- `.write: true` (admin dapat tulis)

**Node Structure (MUST BE):**
```
content
├── shop: []
├── archive: []
└── gallery: []
```

**Admin Data Structure:**
```javascript
{
  shop: [...items],
  archive: [...items],
  gallery: [...items]
}
```

❌ DO NOT include extra keys like `invertedExe`, etc.

---

## ✨ After Fix Works

✅ Upload item → Firebase saves data
✅ Logout/login → data persists
✅ Public pages → item appears instantly
✅ Edit/Delete → Firebase updates

