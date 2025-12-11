// Admin Firebase Integration Helper
// Add this to admin.js to enable Firebase syncing

// Flag untuk menggunakan Firebase
const USE_FIREBASE_ADMIN = true;

// Helper function untuk save admin data ke Firebase
async function saveAdminDataToFirebase(data) {
  try {
    if (!USE_FIREBASE_ADMIN || typeof firebase === 'undefined') {
      console.warn('Firebase tidak aktif di admin panel');
      return false;
    }

    // Pastikan DatabaseSync tersedia
    if (typeof DatabaseSync === 'undefined') {
      console.warn('DatabaseSync tidak tersedia');
      return false;
    }

    console.log('Saving to Firebase...', data);
    const result = await DatabaseSync.save(data, true);
    console.log('Firebase save result:', result);
    return result;
  } catch (error) {
    console.error('Error saving to Firebase:', error);
    return false;
  }
}

// Override localStorage setItem untuk otomatis sync ke Firebase
const originalSetItem = Storage.prototype.setItem;
Storage.prototype.setItem = function(key, value) {
  originalSetItem.call(this, key, value);
  
  // Jika key adalah admin data dan Firebase aktif, sync ke Firebase
  if (key === 'inverted_admin_data' && USE_FIREBASE_ADMIN && typeof DatabaseSync !== 'undefined') {
    try {
      const data = JSON.parse(value);
      saveAdminDataToFirebase(data).catch(error => {
        console.error('Background Firebase sync failed:', error);
      });
    } catch (e) {
      console.error('Error parsing data for Firebase sync:', e);
    }
  }
};

// Initialize Firebase sync when admin loads
document.addEventListener('DOMContentLoaded', async () => {
  if (USE_FIREBASE_ADMIN && typeof DatabaseSync !== 'undefined') {
    console.log('Initializing Firebase for admin panel...');
    await DatabaseSync.init(true);
    console.log('Admin panel Firebase initialized');
  }
});
