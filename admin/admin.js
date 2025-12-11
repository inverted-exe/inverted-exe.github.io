// Admin Panel JavaScript

// Load data from localStorage
let adminData = JSON.parse(localStorage.getItem('inverted_admin_data')) || {
  shop: [],
  archive: [],
  gallery: [],
  invertedExe: {}
};

// Initialize admin panel
document.addEventListener('DOMContentLoaded', () => {
  checkAdmin();
  initializeEventListeners();
  initializeAdminBurger();
  loadAllItems();
  displayItems();
});

// ===== FIREBASE SYNC FUNCTION =====
// Save data to Firebase (which also syncs to localStorage)
async function saveAdminData(newData) {
  try {
    // Check if DatabaseSync is available
    if (typeof DatabaseSync === 'undefined') {
      console.warn('DatabaseSync not available, saving to localStorage only');
      localStorage.setItem('inverted_admin_data', JSON.stringify(newData));
      return false;
    }

    // Check if Firebase is available
    if (typeof firebase === 'undefined') {
      console.warn('Firebase not initialized, saving to localStorage only');
      localStorage.setItem('inverted_admin_data', JSON.stringify(newData));
      return false;
    }

    console.log('Saving data to Firebase...');
    // Use DatabaseSync.save with Firebase enabled (true)
    const result = await DatabaseSync.save(newData, true);
    console.log('Firebase save result:', result);
    return result;
  } catch (error) {
    console.error('Error saving admin data:', error);
    return false;
  }
}

// Initialize admin burger menu
function initializeAdminBurger() {
  const adminBurger = document.getElementById('adminBurger');
  const adminSidebar = document.querySelector('.admin-sidebar');

  if (!adminBurger || !adminSidebar) return;

  // Toggle sidebar on burger click
  adminBurger.addEventListener('click', (e) => {
    adminBurger.classList.toggle('open');
    adminSidebar.classList.toggle('open');
    e.stopPropagation();
  });

  // Close sidebar when clicking a nav link
  document.querySelectorAll('.admin-nav-link').forEach(link => {
    link.addEventListener('click', () => {
      adminBurger.classList.remove('open');
      adminSidebar.classList.remove('open');
    });
  });

  // Close sidebar when clicking outside on mobile
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.admin-sidebar') && !e.target.closest('.admin-burger')) {
      adminBurger.classList.remove('open');
      adminSidebar.classList.remove('open');
    }
  });

  // Close sidebar on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      adminBurger.classList.remove('open');
      adminSidebar.classList.remove('open');
    }
  });
}

// Check if user is logged in as admin
function checkAdmin() {
  const adminToken = localStorage.getItem('admin_token');
  if (!adminToken) {
    window.location.href = '/admin/login.html';
  }
}

// Initialize event listeners
function initializeEventListeners() {
  // Navigation
  document.querySelectorAll('.admin-nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const section = link.getAttribute('data-section');
      switchSection(section);
    });
  });

  // Prevent form submission on Enter for input fields
  document.querySelectorAll('.form-input').forEach(input => {
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.target.closest('form')) {
        e.preventDefault();
      }
    });
  });
}

// Switch sections
function switchSection(section) {
  // Hide all sections
  document.querySelectorAll('.admin-section').forEach(sec => {
    sec.classList.remove('active');
  });

  // Show selected section
  document.getElementById(section).classList.add('active');

  // Update nav link
  document.querySelectorAll('.admin-nav-link').forEach(link => {
    link.classList.remove('active');
  });
  document.querySelector(`[data-section="${section}"]`).classList.add('active');
}

// Handle form submission
async function handleSubmit(event, type) {
  event.preventDefault();

  const form = event.target;
  
  let item = {
    id: Date.now(),
    type: type,
    createdAt: new Date().toISOString()
  };

  // Get form data by type
  if (type === 'shop') {
    item.name = form.querySelector('input[placeholder="Product Name"]').value;
    item.price = form.querySelector('input[placeholder="Price"]').value;
    item.description = form.querySelector('textarea').value;
    
    // Handle multiple images
    const imageInput = form.querySelector('input[type="file"]');
    if (imageInput.files.length > 0) {
      item.images = [];
      let loadedCount = 0;
      const totalFiles = imageInput.files.length;

      return new Promise((resolve) => {
        Array.from(imageInput.files).forEach((file, index) => {
          const reader = new FileReader();
          reader.onload = async (e) => {
            item.images.push(e.target.result);
            loadedCount++;

            // When all images loaded
            if (loadedCount === totalFiles) {
              item.image = item.images[0]; // Set first image as thumbnail
              adminData.shop.push(item);
              // Wait for Firebase sync to complete
              await saveAdminData(adminData);
              form.reset();
              displayItems();
              showNotification('Product saved successfully!', 'success');
              resolve();
            }
          };
          reader.readAsDataURL(file);
        });
      });
    } else {
      adminData.shop.push(item);
    }
  } else if (type === 'archive') {
    item.title = form.querySelector('input[placeholder="Title"]').value;
    item.category = form.querySelector('input[placeholder="Category"]').value;
    item.description = form.querySelector('textarea').value;
    
    const imageInput = form.querySelector('input[type="file"]');
    if (imageInput.files.length > 0) {
      item.images = [];
      let loadedCount = 0;
      const totalFiles = imageInput.files.length;

      return new Promise((resolve) => {
        Array.from(imageInput.files).forEach((file) => {
          const reader = new FileReader();
          reader.onload = async (e) => {
            item.images.push(e.target.result);
            loadedCount++;

            if (loadedCount === totalFiles) {
              item.image = item.images[0];
              adminData.archive.push(item);
              await saveAdminData(adminData);
              form.reset();
              displayItems();
              showNotification('Archive saved successfully!', 'success');
              resolve();
            }
          };
          reader.readAsDataURL(file);
        });
      });
    } else {
      adminData.archive.push(item);
    }
  } else if (type === 'gallery') {
    item.title = form.querySelector('input[placeholder="Image Title"]').value;
    item.description = form.querySelector('textarea').value;
    
    const imageInput = form.querySelector('input[type="file"]');
    if (imageInput.files.length > 0) {
      item.images = [];
      let loadedCount = 0;
      const totalFiles = imageInput.files.length;

      return new Promise((resolve) => {
        Array.from(imageInput.files).forEach((file) => {
          const reader = new FileReader();
          reader.onload = async (e) => {
            item.images.push(e.target.result);
            loadedCount++;

            if (loadedCount === totalFiles) {
              item.image = item.images[0];
              adminData.gallery.push(item);
              await saveAdminData(adminData);
              form.reset();
              displayItems();
              showNotification('Image saved successfully!', 'success');
              resolve();
            }
          };
          reader.readAsDataURL(file);
        });
      });
    } else {
      adminData.gallery.push(item);
    }
  }

  // Save to localStorage and Firebase
  await saveAdminData(adminData);

  // Clear form
  form.reset();

  // Reload display
  displayItems();

  // Show success message
  showNotification('Item saved successfully!', 'success');
}

// Display items
function displayItems() {
  displayShopItems();
  displayArchiveItems();
  displayGalleryItems();
}

// Display shop items
function displayShopItems() {
  const container = document.getElementById('shopItems');
  
  if (adminData.shop.length === 0) {
    container.innerHTML = '<p class="empty-state">No items yet. Add your first product!</p>';
    return;
  }

  container.innerHTML = adminData.shop.map(item => `
    <div class="item-card">
      ${item.image ? `<img src="${item.image}" alt="${item.name}" class="item-image">` : '<div class="item-image" style="background: rgba(255,255,255,0.1)"></div>'}
      <div class="item-info">
        <div class="item-title">${item.name}</div>
        <div class="item-description">${item.description}</div>
        <div class="item-meta">
          <span>$${item.price}</span>
          <span>${new Date(item.createdAt).toLocaleDateString()}</span>
        </div>
        <div class="item-actions">
          <button class="btn btn-secondary" onclick="editItem('shop', ${item.id})">Edit</button>
          <button class="btn btn-danger" onclick="deleteItemFromList('shop', ${item.id})">Delete</button>
        </div>
      </div>
    </div>
  `).join('');
}

// Display archive items
function displayArchiveItems() {
  const container = document.getElementById('archiveItems');
  
  if (adminData.archive.length === 0) {
    container.innerHTML = '<p class="empty-state">No archive items yet.</p>';
    return;
  }

  container.innerHTML = adminData.archive.map(item => `
    <div class="item-card">
      ${item.image ? `<img src="${item.image}" alt="${item.title}" class="item-image">` : '<div class="item-image" style="background: rgba(255,255,255,0.1)"></div>'}
      <div class="item-info">
        <div class="item-title">${item.title}</div>
        <div class="item-description">${item.category}</div>
        <div class="item-meta">
          <span>${item.category}</span>
          <span>${new Date(item.createdAt).toLocaleDateString()}</span>
        </div>
        <div class="item-actions">
          <button class="btn btn-secondary" onclick="editItem('archive', ${item.id})">Edit</button>
          <button class="btn btn-danger" onclick="deleteItemFromList('archive', ${item.id})">Delete</button>
        </div>
      </div>
    </div>
  `).join('');
}

// Display gallery items
function displayGalleryItems() {
  const container = document.getElementById('galleryItems');
  
  if (adminData.gallery.length === 0) {
    container.innerHTML = '<p class="empty-state">No gallery images yet.</p>';
    return;
  }

  container.innerHTML = adminData.gallery.map(item => `
    <div class="item-card">
      ${item.image ? `<img src="${item.image}" alt="${item.title}" class="item-image">` : '<div class="item-image" style="background: rgba(255,255,255,0.1)"></div>'}
      <div class="item-info">
        <div class="item-title">${item.title}</div>
        <div class="item-description">${item.description}</div>
        <div class="item-meta">
          <span>${new Date(item.createdAt).toLocaleDateString()}</span>
        </div>
        <div class="item-actions">
          <button class="btn btn-secondary" onclick="editItem('gallery', ${item.id})">Edit</button>
          <button class="btn btn-danger" onclick="deleteItemFromList('gallery', ${item.id})">Delete</button>
        </div>
      </div>
    </div>
  `).join('');
}

// Edit item
function editItem(type, id) {
  const item = adminData[type].find(i => i.id === id);
  if (!item) return;

  const modal = document.getElementById('itemModal');
  const modalTitle = document.getElementById('modalTitle');
  const modalFormContent = document.getElementById('modalFormContent');

  modalTitle.textContent = `Edit ${type.charAt(0).toUpperCase() + type.slice(1)} Item`;

  // Store current editing item
  window.currentEditingItem = { type, id };

  if (type === 'shop') {
    modalFormContent.innerHTML = `
      <input type="text" placeholder="Product Name" class="form-input" value="${item.name}" required>
      <input type="number" placeholder="Price" class="form-input" value="${item.price}" required>
      <textarea placeholder="Product Description" class="form-textarea" required>${item.description}</textarea>
    `;
  } else if (type === 'archive') {
    modalFormContent.innerHTML = `
      <input type="text" placeholder="Title" class="form-input" value="${item.title}" required>
      <input type="text" placeholder="Category" class="form-input" value="${item.category}" required>
      <textarea placeholder="Archive Description" class="form-textarea" required>${item.description}</textarea>
    `;
  } else if (type === 'gallery') {
    modalFormContent.innerHTML = `
      <input type="text" placeholder="Image Title" class="form-input" value="${item.title}" required>
      <textarea placeholder="Image Description" class="form-textarea" required>${item.description}</textarea>
    `;
  }

  modal.classList.add('active');
}

// Handle modal form submit
async function handleModalSubmit(event) {
  event.preventDefault();

  if (!window.currentEditingItem) return;

  const { type, id } = window.currentEditingItem;
  const formInputs = document.getElementById('modalFormContent').querySelectorAll('input, textarea');
  const itemIndex = adminData[type].findIndex(i => i.id === id);

  if (itemIndex === -1) return;

  if (type === 'shop') {
    adminData[type][itemIndex].name = formInputs[0].value;
    adminData[type][itemIndex].price = formInputs[1].value;
    adminData[type][itemIndex].description = formInputs[2].value;
  } else if (type === 'archive') {
    adminData[type][itemIndex].title = formInputs[0].value;
    adminData[type][itemIndex].category = formInputs[1].value;
    adminData[type][itemIndex].description = formInputs[2].value;
  } else if (type === 'gallery') {
    adminData[type][itemIndex].title = formInputs[0].value;
    adminData[type][itemIndex].description = formInputs[1].value;
  }

  await saveAdminData(adminData);
  closeModal();
  displayItems();
  showNotification('Item updated successfully!', 'success');
}

// Delete item from list
async function deleteItemFromList(type, id) {
  if (confirm('Are you sure you want to delete this item?')) {
    adminData[type] = adminData[type].filter(i => i.id !== id);
    await saveAdminData(adminData);
    displayItems();
    showNotification('Item deleted!', 'success');
  }
}

// Close modal
function closeModal() {
  document.getElementById('itemModal').classList.remove('active');
  window.currentEditingItem = null;
}

// Add new item button
function addNewItem(type) {
  switchSection(type);
}

// Logout
function logout() {
  if (confirm('Are you sure you want to logout?')) {
    localStorage.removeItem('admin_token');
    window.location.href = '/admin/login.html';
  }
}

// Load all items
function loadAllItems() {
  // Items are already loaded from localStorage in adminData
}

// Show notification
function showNotification(message, type = 'info') {
  // Simple notification (dapat ditingkatkan dengan toast library)
  alert(message);
}

// Export data
function exportData() {
  const dataStr = JSON.stringify(adminData, null, 2);
  const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
  const exportFileDefaultName = 'inverted-admin-backup.json';

  const linkElement = document.createElement('a');
  linkElement.setAttribute('href', dataUri);
  linkElement.setAttribute('download', exportFileDefaultName);
  linkElement.click();
}

// Import data
function importData(file) {
  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const imported = JSON.parse(e.target.result);
      if (confirm('This will replace all current data. Continue?')) {
        adminData = imported;
        await saveAdminData(adminData);
        displayItems();
        showNotification('Data imported successfully!', 'success');
      }
    } catch (error) {
      showNotification('Error importing data!', 'error');
    }
  };
  reader.readAsText(file);
}
