// Example integration code for admin panel
// Update admin.js dengan fungsi-fungsi berikut

// Add this to the top of admin.js, after Firebase initialization:
const USE_FIREBASE = false; // Set to true if using Firebase, false for GitHub/JSON

// Initialize database when admin loads
async function initializeDatabase() {
  console.log('Initializing database...');
  await DatabaseSync.init(USE_FIREBASE);
}

// Override save functions to use database:

// Save shop data
async function saveShopData(items) {
  // Save to localStorage
  let adminData = JSON.parse(localStorage.getItem('inverted_admin_data')) || {};
  adminData.shop = items;
  localStorage.setItem('inverted_admin_data', JSON.stringify(adminData));
  
  // Save to remote database
  await DatabaseSync.save(adminData, USE_FIREBASE);
  
  console.log('Shop data saved to database');
  showNotification('Shop data saved!');
}

// Save archive data
async function saveArchiveData(items) {
  let adminData = JSON.parse(localStorage.getItem('inverted_admin_data')) || {};
  adminData.archive = items;
  localStorage.setItem('inverted_admin_data', JSON.stringify(adminData));
  
  await DatabaseSync.save(adminData, USE_FIREBASE);
  
  console.log('Archive data saved to database');
  showNotification('Archive data saved!');
}

// Save gallery data
async function saveGalleryData(items) {
  let adminData = JSON.parse(localStorage.getItem('inverted_admin_data')) || {};
  adminData.gallery = items;
  localStorage.setItem('inverted_admin_data', JSON.stringify(adminData));
  
  await DatabaseSync.save(adminData, USE_FIREBASE);
  
  console.log('Gallery data saved to database');
  showNotification('Gallery data saved!');
}

// Notification helper
function showNotification(message) {
  // Add a simple notification to admin panel
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #4CAF50;
    color: white;
    padding: 16px 24px;
    border-radius: 4px;
    z-index: 10000;
    animation: slideIn 0.3s ease;
  `;
  notification.textContent = message;
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.remove();
  }, 3000);
}

// Add animation
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
`;
document.head.appendChild(style);

// Call initialization when page loads
document.addEventListener('DOMContentLoaded', initializeDatabase);
