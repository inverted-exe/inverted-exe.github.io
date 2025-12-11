// Admin Firebase Integration Helper
// Add this to admin.js to enable Firebase syncing

// Flag untuk menggunakan Firebase
const USE_FIREBASE_ADMIN = true;

// Debounce Firebase sync untuk prevent excessive calls
let syncTimeout;
async function debouncedFirebaseSync(data) {
  // Clear previous timeout
  clearTimeout(syncTimeout);
  
  // Wait 2 seconds after last change before syncing
  syncTimeout = setTimeout(() => {
    saveAdminDataToFirebase(data);
  }, 2000);
}

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

    console.log('Syncing to Firebase...');
    const result = await DatabaseSync.save(data, true);
    console.log('Firebase sync result:', result);
    return result;
  } catch (error) {
    console.error('Error saving to Firebase:', error);
    return false;
  }
}

// REMOVED: Storage.prototype override - it was causing lag on every keystroke
// Instead, Firebase sync is triggered only on form submit (in handleSubmit function)

// Initialize Firebase sync when admin loads
document.addEventListener('DOMContentLoaded', async () => {
  if (USE_FIREBASE_ADMIN && typeof DatabaseSync !== 'undefined') {
    console.log('Initializing Firebase for admin panel...');
    await DatabaseSync.init(true);
    console.log('Admin panel Firebase initialized');
  }
});
