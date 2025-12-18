// Admin Panel JavaScript

// ===== IMAGE COMPRESSION HELPER =====
// Compress image before Base64 to reduce size and improve performance
function compressImage(base64String, maxWidth = 1200, maxHeight = 1200, quality = 0.8) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;
      
      // Calculate new dimensions
      if (width > height) {
        if (width > maxWidth) {
          height *= maxWidth / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width *= maxHeight / height;
          height = maxHeight;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      
      // Convert to compressed base64
      const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
      resolve(compressedBase64);
    };
    img.src = base64String;
  });
}

// ===== FILE READER WITH COMPRESSION =====
function readAndCompressFile(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        // Compress image
        const compressed = await compressImage(e.target.result, 1200, 1200, 0.75);
        resolve(compressed);
      } catch (error) {
        console.error('Error compressing image:', error);
        // Fallback to original if compression fails
        resolve(e.target.result);
      }
    };
    reader.readAsDataURL(file);
  });
}

// Load data from localStorage
// ===== PERFORMANCE OPTIMIZATION =====
// Debounce function untuk prevent excessive updates
function debounce(func, delay = 300) {
  let timeoutId;
  return function(...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

// Cache DOM queries untuk performance
const formInputCache = new Map();
function getCachedInput(selector) {
  if (!formInputCache.has(selector)) {
    formInputCache.set(selector, document.querySelector(selector));
  }
  return formInputCache.get(selector);
}

// Load data from localStorage
let adminData = (() => {
  try {
    const stored = localStorage.getItem('inverted_admin_data');
    if (!stored) return { shop: [], archive: [], gallery: [], categories: [], orders: [] };
    
    const parsed = JSON.parse(stored);
    
    // Ensure all required arrays exist
    return {
      shop: Array.isArray(parsed?.shop) ? parsed.shop : [],
      archive: Array.isArray(parsed?.archive) ? parsed.archive : [],
      gallery: Array.isArray(parsed?.gallery) ? parsed.gallery : [],
      categories: Array.isArray(parsed?.categories) ? parsed.categories : [],
      orders: Array.isArray(parsed?.orders) ? parsed.orders : []
    };
  } catch (error) {
    console.error('Error parsing adminData from localStorage:', error);
    return { shop: [], archive: [], gallery: [], categories: [], orders: [] };
  }
})();

// Save admin data to localStorage and sync to Firebase
function saveData() {
  try {
    // Validate adminData structure
    if (!adminData.shop) {
      console.warn('adminData.shop is missing, initializing...');
      adminData.shop = [];
    }
    
    // Save to localStorage
    const dataToSave = JSON.stringify(adminData);
    localStorage.setItem('inverted_admin_data', dataToSave);
    
    console.log('✓ Admin data saved to localStorage', {
      shopItems: adminData.shop.length,
      sample: adminData.shop.length > 0 ? adminData.shop[0].stock : null
    });
    
    // Sync to Firebase if available
    if (typeof debouncedFirebaseSync !== 'undefined') {
      debouncedFirebaseSync(adminData);
    }
    
    return true;
  } catch (error) {
    console.error('✗ Error saving admin data:', error);
    return false;
  }
}

// Initialize admin panel
document.addEventListener('DOMContentLoaded', () => {
  // Wait untuk Firebase initialize
  const checkFirebase = setInterval(() => {
    if (typeof firebase !== 'undefined' && typeof DatabaseSync !== 'undefined') {
      clearInterval(checkFirebase);
      console.log('Firebase initialized, loading admin...');
      checkAdmin();
      initializeEventListeners();
      initializeAdminBurger();
      loadAllItems();
      displayItems();
      
      // Restore the last selected section from localStorage
      const lastSection = localStorage.getItem('admin_selected_section');
      if (lastSection) {
        switchSection(lastSection);
      }
    }
  }, 100);
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
  // Navigation - use event delegation instead of multiple listeners
  document.addEventListener('click', (e) => {
    const link = e.target.closest('.admin-nav-link');
    if (link) {
      e.preventDefault();
      const section = link.getAttribute('data-section');
      switchSection(section);
    }
  });

  // Optimize: Remove heavy keypress listener
  // (it was checking every keystroke which causes lag)
  // If needed, handle Enter key submission at form level instead
}

// Switch sections
function switchSection(section) {
  // Hide all sections
  document.querySelectorAll('.admin-section').forEach(sec => {
    sec.classList.remove('active');
  });

  // Show selected section
  const targetSection = document.getElementById(section);
  if (targetSection) {
    targetSection.classList.add('active');
  }

  // Update nav link
  document.querySelectorAll('.admin-nav-link').forEach(link => {
    link.classList.remove('active');
  });
  const activeLink = document.querySelector(`[data-section="${section}"]`);
  if (activeLink) {
    activeLink.classList.add('active');
  }

  // Save selected section to localStorage
  localStorage.setItem('admin_selected_section', section);
}

// Handle form submission
async function handleSubmit(event, type) {
  event.preventDefault();

  const form = event.target;
  const submitBtn = form.querySelector('button[type="submit"]');
  const originalBtnText = submitBtn.textContent;
  
  try {
    submitBtn.disabled = true;
    submitBtn.textContent = '⏳ Processing...';

    let item = {
      id: Date.now(),
      type: type,
      createdAt: new Date().toISOString()
    };

    // Get form data using FormData API (no lag!)
    const formData = new FormData(form);
    const imageInput = form.querySelector('input[type="file"]');
    const files = Array.from(imageInput?.files || []);

    // Type-specific data extraction
    if (type === 'shop') {
      item.name = formData.get('productName');
      item.price = formData.get('price');
      item.description = formData.get('description');
      item.category = formData.get('category') || '';
      item.tags = formData.get('tags') || '';
      // Stock per size
      item.stock = {
        XS: parseInt(formData.get('stockXS')) || 0,
        S: parseInt(formData.get('stockS')) || 0,
        M: parseInt(formData.get('stockM')) || 0,
        L: parseInt(formData.get('stockL')) || 0,
        XL: parseInt(formData.get('stockXL')) || 0,
        XXL: parseInt(formData.get('stockXXL')) || 0
      };
    } else if (type === 'archive') {
      item.title = formData.get('title');
      item.category = formData.get('category');
      item.description = formData.get('description');
    } else if (type === 'gallery') {
      // Gallery only needs images, no title/description
      item.title = `Image ${Date.now()}`;
      item.description = '';
    }

    // Process images with compression
    if (files.length > 0) {
      item.images = [];
      for (let i = 0; i < files.length; i++) {
        submitBtn.textContent = `⏳ Processing ${i + 1}/${files.length}`;
        const compressed = await readAndCompressFile(files[i]);
        item.images.push(compressed);
      }
      item.image = item.images[0]; // Set first image as thumbnail
    } else {
      item.image = null;
      item.images = [];
    }

    // Add to appropriate data array
    if (type === 'shop') {
      if (!Array.isArray(adminData.shop)) adminData.shop = [];
      adminData.shop.push(item);
    } else if (type === 'archive') {
      if (!Array.isArray(adminData.archive)) adminData.archive = [];
      adminData.archive.push(item);
    } else if (type === 'gallery') {
      if (!Array.isArray(adminData.gallery)) adminData.gallery = [];
      adminData.gallery.push(item);
    }

    // Save to localStorage and Firebase
    submitBtn.textContent = '⏳ Saving...';
    await saveAdminData(adminData);

    // Clear form
    form.reset();

    // Reload display
    displayItems();

    // Show success message
    showNotification(`${type.charAt(0).toLowerCase() + type.slice(1)} saved successfully!`, 'success');

  } catch (error) {
    console.error('Error saving item:', error);
    showNotification('error saving item. check console.', 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = originalBtnText;
  }
}

// Display items
function displayItems() {
  displayDashboard();
  displayInventory();
  displayCategories();
  updateCategorySelects();
  displayShopItems();
  displayArchiveItems();
  displayGalleryItems();
  displayOrders();
  displayAnalytics();
}

// Display dashboard with analytics
function displayDashboard() {
  // Calculate stats
  const totalProducts = adminData.shop?.length || 0;
  const totalArchived = adminData.archive?.length || 0;
  const totalGalleryItems = adminData.gallery?.length || 0;
  const totalImages = (adminData.shop || []).reduce((sum, item) => {
    return sum + (item.images?.length || 1);
  }, 0) + (adminData.archive || []).reduce((sum, item) => {
    return sum + (item.images?.length || 1);
  }, 0) + (adminData.gallery || []).reduce((sum, item) => {
    return sum + (item.images?.length || 1);
  }, 0);

  // Update stat cards
  document.getElementById('totalProducts').textContent = totalProducts;
  document.getElementById('totalArchived').textContent = totalArchived;
  document.getElementById('totalGallery').textContent = totalGalleryItems;
  document.getElementById('totalImages').textContent = totalImages;

  // Update activity timeline
  displayActivityTimeline();
}

// Display recent activity timeline
function displayActivityTimeline() {
  const activityTimeline = document.getElementById('activityTimeline');
  const activities = [];

  // Collect all activities with timestamps
  if (adminData.shop) {
    adminData.shop.forEach(item => {
      activities.push({
        type: 'product',
        action: 'added product',
        name: item.name,
        timestamp: item.createdAt,
        icon: 'ri-shopping-bag-line'
      });
    });
  }

  if (adminData.archive) {
    adminData.archive.forEach(item => {
      activities.push({
        type: 'archive',
        action: 'archived',
        name: item.title,
        timestamp: item.createdAt,
        icon: 'ri-archive-drawer-line'
      });
    });
  }

  if (adminData.gallery) {
    adminData.gallery.forEach(item => {
      activities.push({
        type: 'gallery',
        action: 'uploaded image',
        name: item.title,
        timestamp: item.createdAt,
        icon: 'ri-gallery-line'
      });
    });
  }

  // Sort by timestamp (newest first)
  activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  // Display last 10 activities
  if (activities.length === 0) {
    activityTimeline.innerHTML = '<p class="empty-state">no recent activity yet</p>';
    return;
  }

  activityTimeline.innerHTML = activities.slice(0, 10).map(activity => {
    const date = new Date(activity.timestamp);
    const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    return `
      <div class="activity-item">
        <div class="activity-icon"><i class="${activity.icon}"></i></div>
        <div class="activity-content">
          <div class="activity-text">${activity.action}: <strong>${activity.name}</strong></div>
          <div class="activity-time">${dateStr} at ${timeStr}</div>
        </div>
      </div>
    `;
  }).join('');
}

// ===== CATEGORIES & TAGS FUNCTIONS =====
// Get next category ID
function getNextCategoryId() {
  if (adminData.categories.length === 0) return 1;
  return Math.max(...adminData.categories.map(c => c.id || 0)) + 1;
}

// Add new category
function handleAddCategory(e) {
  e.preventDefault();
  
  const name = document.getElementById('categoryName').value;
  const color = document.getElementById('categoryColor').value;
  const desc = document.getElementById('categoryDesc').value;
  
  const newCategory = {
    id: getNextCategoryId(),
    name: name.toLowerCase(),
    color: color,
    description: desc,
    createdAt: new Date().toISOString()
  };
  
  adminData.categories.push(newCategory);
  saveData();
  displayCategories();
  resetCategoryForm();
  updateCategorySelects();
  showNotification(`category "${name}" created`, 'success');
}

// Reset category form
function resetCategoryForm() {
  document.getElementById('categoryForm').reset();
  document.getElementById('categoryColor').value = '#6366f1';
}

// Display categories
function displayCategories() {
  const container = document.getElementById('categoriesList');
  
  if (adminData.categories.length === 0) {
    container.innerHTML = '<p class="empty-state">no categories yet. create your first category!</p>';
    return;
  }
  
  // Count items per category
  const categoryCounts = {};
  adminData.shop.forEach(item => {
    const cat = item.category || 'uncategorized';
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  });
  
  container.innerHTML = adminData.categories.map(cat => `
    <div class="category-card">
      <div class="category-color" style="background-color: ${cat.color}"></div>
      <div class="category-name">${cat.name}</div>
      <div class="category-count">${categoryCounts[cat.id] || 0} items</div>
      <div class="category-actions">
        <button class="btn btn-secondary" onclick="editCategory(${cat.id})">edit</button>
        <button class="btn btn-danger" onclick="deleteCategory(${cat.id})">delete</button>
      </div>
    </div>
  `).join('');
}

// Edit category
function editCategory(id) {
  const cat = adminData.categories.find(c => c.id === id);
  if (!cat) return;
  
  document.getElementById('categoryName').value = cat.name;
  document.getElementById('categoryColor').value = cat.color;
  document.getElementById('categoryDesc').value = cat.description || '';
  
  // Update form to edit mode
  const form = document.getElementById('categoryForm');
  const button = form.querySelector('button[type="submit"]');
  button.textContent = 'update category';
  button.onclick = (e) => {
    e.preventDefault();
    const name = document.getElementById('categoryName').value;
    const color = document.getElementById('categoryColor').value;
    const desc = document.getElementById('categoryDesc').value;
    
    cat.name = name.toLowerCase();
    cat.color = color;
    cat.description = desc;
    
    saveData();
    displayCategories();
    resetCategoryForm();
    button.textContent = 'save category';
    button.onclick = null;
    showNotification('category updated', 'success');
  };
}

// Delete category
function deleteCategory(id) {
  const cat = adminData.categories.find(c => c.id === id);
  if (!cat) return;
  
  if (confirm(`delete category "${cat.name}"? items will be uncategorized.`)) {
    // Uncategorize items in this category
    adminData.shop.forEach(item => {
      if (item.category === id) {
        item.category = '';
      }
    });
    
    adminData.categories = adminData.categories.filter(c => c.id !== id);
    saveData();
    displayCategories();
    updateCategorySelects();
    displayShopItems();
    showNotification('category deleted', 'success');
  }
}

// Update category select dropdowns
function updateCategorySelects() {
  const categorySelects = document.querySelectorAll('[name="category"]');
  categorySelects.forEach(select => {
    const currentValue = select.value;
    select.innerHTML = '<option value="">select category</option>';
    select.innerHTML += '<option value="">uncategorized</option>';
    adminData.categories.forEach(cat => {
      select.innerHTML += `<option value="${cat.id}">${cat.name}</option>`;
    });
    select.value = currentValue;
  });
  
  // Update category filter in shop
  const categoryFilter = document.getElementById('shopCategory');
  if (categoryFilter) {
    const currentValue = categoryFilter.value;
    categoryFilter.innerHTML = '<option value="">all categories</option>';
    categoryFilter.innerHTML += '<option value="">uncategorized</option>';
    adminData.categories.forEach(cat => {
      categoryFilter.innerHTML += `<option value="${cat.id}">${cat.name}</option>`;
    });
    categoryFilter.value = currentValue;
  }
}

// Show category form
function showCategoryForm() {
  document.getElementById('categoryForm').scrollIntoView({ behavior: 'smooth' });
  document.getElementById('categoryName').focus();
}

// ===== INVENTORY MANAGEMENT FUNCTIONS =====
// Display inventory table with per-size stock
function displayInventory() {
  const container = document.getElementById('inventoryTable');
  
  if (adminData.shop.length === 0) {
    container.innerHTML = '<p class="empty-state">No items in inventory yet</p>';
    updateInventoryStats();
    return;
  }
  
  const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
  
  const inventory = adminData.shop.map(item => {
    const stock = item.stock || {};
    const totalStock = sizes.reduce((sum, size) => sum + (parseInt(stock[size]) || 0), 0);
    let status = 'in-stock';
    if (totalStock === 0) status = 'out-of-stock';
    else if (totalStock <= 10) status = 'low-stock';
    
    return { item, stock, totalStock, status };
  });
  
  container.innerHTML = inventory.map(inv => {
    const cat = adminData.categories.find(c => c.id == inv.item.category);
    const categoryName = cat ? cat.name : 'uncategorized';
    const statusLabel = inv.status.replace('-', ' ');
    
    const sizeStocks = sizes.map(size => ({
      size,
      count: parseInt(inv.stock[size]) || 0
    }));
    
    return `
      <div class="inventory-item-card">
        <div class="inventory-item-header">
          <div class="inventory-item-title" title="${inv.item.name}">${inv.item.name}</div>
          <span class="inventory-item-status ${inv.status}">
            <i class="ri-${inv.status === 'in-stock' ? 'check' : inv.status === 'low-stock' ? 'alert' : 'close'}-line"></i>
            ${statusLabel}
          </span>
        </div>
        
        <div class="inventory-item-body">
          <div class="inventory-item-row">
            <span class="inventory-item-label">Category</span>
            <span class="inventory-item-value">${categoryName}</span>
          </div>
          <div class="inventory-item-row">
            <span class="inventory-item-label">Price</span>
            <span class="inventory-item-value">$${inv.item.price}</span>
          </div>
          <div class="inventory-item-row">
            <span class="inventory-item-label">Total Stock</span>
            <span class="inventory-item-value">${inv.totalStock} units</span>
          </div>
        </div>
        
        <div class="inventory-sizes">
          ${sizeStocks.map(s => `
            <div class="size-badge">
              <span class="size-badge-label">${s.size}</span>
              <span class="size-badge-value">${s.count}</span>
            </div>
          `).join('')}
        </div>
        
        <div class="inventory-item-footer">
          <button class="btn btn-primary" onclick="toggleSizeEditor(${inv.item.id})">
            <i class="ri-pencil-line"></i> Edit
          </button>
          <button class="btn btn-danger" onclick="deleteItem('shop', ${inv.item.id})">
            <i class="ri-delete-bin-line"></i> Delete
          </button>
        </div>
      </div>
    `;
  }).join('');
  
  updateInventoryStats();
}

// Update all sizes stock for an item
function toggleSizeEditor(itemId) {
  const item = adminData.shop.find(i => i.id === itemId);
  if (!item) return;
  
  const modal = document.getElementById('sizeEditorModal');
  if (!modal) {
    createSizeEditorModal();
  }
  
  openSizeEditor(itemId);
}

// Create size editor modal if not exists
function createSizeEditorModal() {
  if (document.getElementById('sizeEditorModal')) return;
  
  const modal = document.createElement('div');
  modal.id = 'sizeEditorModal';
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h2 id="sizeEditorTitle">edit stock</h2>
        <button type="button" class="close-btn" onclick="closeSizeEditor()">&times;</button>
      </div>
      <div class="modal-body">
        <div id="sizeEditorContent"></div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" onclick="closeSizeEditor()">cancel</button>
        <button type="button" class="btn btn-success" onclick="saveSizeEditorChanges()">save changes</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}

// Open size editor for specific item
function openSizeEditor(itemId) {
  const item = adminData.shop.find(i => i.id === itemId);
  if (!item) return;
  
  window.currentSizeEditItemId = itemId;
  const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
  const stock = item.stock || {};
  
  const content = document.getElementById('sizeEditorContent');
  content.innerHTML = `
    <div class="size-editor-form">
      ${sizes.map(size => `
        <div class="size-editor-group">
          <label>${size} Size</label>
          <input type="number" id="editor-stock-${size}" value="${parseInt(stock[size]) || 0}" min="0" class="form-input">
        </div>
      `).join('')}
    </div>
  `;
  
  const modal = document.getElementById('sizeEditorModal');
  modal.classList.add('active');
}

// Close size editor
function closeSizeEditor() {
  const modal = document.getElementById('sizeEditorModal');
  if (modal) {
    modal.classList.remove('active');
  }
  window.currentSizeEditItemId = null;
}

// Save size editor changes
function saveSizeEditorChanges() {
  console.log('🔄 Starting modal stock update');
  
  const itemId = window.currentSizeEditItemId;
  if (!itemId) {
    console.error('✗ No item ID found');
    alert('Error: No item selected');
    return false;
  }
  
  const item = adminData.shop.find(i => i.id === itemId);
  if (!item) {
    console.error('✗ Item not found:', itemId);
    alert('Error: Item not found');
    return false;
  }
  
  console.log('📦 Found item:', item.name);
  
  const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
  
  // Initialize stock object if not exists
  if (!item.stock || typeof item.stock !== 'object') {
    console.log('📝 Initializing stock object');
    item.stock = {};
  }
  
  // Update stock values from modal inputs
  let hasValidInput = false;
  const stockValues = {};
  
  sizes.forEach(size => {
    const input = document.getElementById(`editor-stock-${size}`);
    if (input && input.value !== undefined) {
      const value = parseInt(input.value);
      stockValues[size] = isNaN(value) ? 0 : value;
      item.stock[size] = stockValues[size];
      hasValidInput = true;
      console.log(`  ${size}: ${stockValues[size]}`);
    } else {
      console.warn(`⚠ Missing input for ${size}`);
    }
  });
  
  if (!hasValidInput) {
    console.error('✗ No valid stock inputs found in modal');
    alert('Error: No valid stock inputs found');
    return false;
  }
  
  console.log('💾 Stock object prepared:', item.stock);
  
  // Save to localStorage
  const saveSuccess = saveData();
  if (!saveSuccess) {
    console.error('✗ Failed to save data');
    alert('Error: Failed to save stock data');
    return false;
  }
  
  console.log('✓ Stock saved successfully for item:', itemId);
  
  // Verify saved data
  const saved = localStorage.getItem('inverted_admin_data');
  if (saved) {
    const parsedData = JSON.parse(saved);
    const savedItem = parsedData.shop.find(i => i.id === itemId);
    if (savedItem) {
      console.log('✓ Verified saved stock:', savedItem.stock);
    }
  }
  
  // Close modal
  closeSizeEditor();
  
  // Refresh inventory display
  displayInventory();
  
  // Show success message
  alert('✓ Stock updated successfully');
  
  return true;
}

// Quick add stock to specific size
function addStockQuick(itemId, size, amount) {
  const item = adminData.shop.find(i => i.id === itemId);
  if (!item) {
    console.error('Item not found:', itemId);
    return false;
  }
  
  if (!item.stock || typeof item.stock !== 'object') {
    item.stock = {};
  }
  
  const currentStock = parseInt(item.stock[size]) || 0;
  item.stock[size] = currentStock + amount;
  
  saveData();
  displayInventory();
  console.log(`Added ${amount} to ${size}: now ${item.stock[size]}`);
  return true;
}

// Quick reduce stock from specific size
function reduceStockQuick(itemId, size, amount) {
  const item = adminData.shop.find(i => i.id === itemId);
  if (!item) {
    console.error('Item not found:', itemId);
    return false;
  }
  
  if (!item.stock || typeof item.stock !== 'object') {
    item.stock = {};
  }
  
  const currentStock = parseInt(item.stock[size]) || 0;
  item.stock[size] = Math.max(0, currentStock - amount);
  
  saveData();
  displayInventory();
  console.log(`Reduced ${amount} from ${size}: now ${item.stock[size]}`);
  return true;
}

// Update inventory stats
function updateInventoryStats() {
  const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
  const totalItems = adminData.shop.length;
  let inStock = 0;
  let lowStock = 0;
  let outOfStock = 0;
  
  adminData.shop.forEach(item => {
    const stock = item.stock || {};
    const totalStock = sizes.reduce((sum, size) => sum + (parseInt(stock[size]) || 0), 0);
    
    if (totalStock === 0) outOfStock++;
    else if (totalStock <= 10) lowStock++;
    else inStock++;
  });
  
  document.getElementById('totalInventoryItems').textContent = totalItems;
  document.getElementById('inStockItems').textContent = inStock;
  document.getElementById('lowStockItems').textContent = lowStock;
  document.getElementById('outOfStockItems').textContent = outOfStock;
  
  // Show low stock warning
  const warning = document.getElementById('lowStockWarning');
  if (lowStock > 0 || outOfStock > 0) {
    warning.style.display = 'block';
    document.getElementById('lowStockCount').textContent = lowStock + outOfStock;
  } else {
    warning.style.display = 'none';
  }
}

// Filter inventory
function filterInventory() {
  const status = document.getElementById('inventoryStatus').value;
  const search = document.getElementById('inventorySearch')?.value.toLowerCase() || '';
  const container = document.getElementById('inventoryTable');
  const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
  
  if (adminData.shop.length === 0) {
    container.innerHTML = '<p class="empty-state">No items in inventory yet</p>';
    return;
  }
  
  let filtered = adminData.shop;
  
  // Filter by status
  if (status) {
    filtered = filtered.filter(item => {
      const stock = item.stock || {};
      const totalStock = sizes.reduce((sum, size) => sum + (parseInt(stock[size]) || 0), 0);
      
      if (status === 'in-stock') return totalStock > 10;
      if (status === 'low-stock') return totalStock > 0 && totalStock <= 10;
      if (status === 'out-of-stock') return totalStock === 0;
    });
  }
  
  // Filter by search
  if (search) {
    filtered = filtered.filter(item => {
      const matchName = item.name.toLowerCase().includes(search);
      const matchDesc = (item.description && item.description.toLowerCase().includes(search)) || false;
      return matchName || matchDesc;
    });
  }
  
  if (filtered.length === 0) {
    container.innerHTML = '<p class="empty-state">No items match your filters</p>';
    return;
  }
  
  const inventory = filtered.map(item => {
    const stock = item.stock || {};
    const totalStock = sizes.reduce((sum, size) => sum + (parseInt(stock[size]) || 0), 0);
    let itemStatus = 'in-stock';
    if (totalStock === 0) itemStatus = 'out-of-stock';
    else if (totalStock <= 10) itemStatus = 'low-stock';
    
    return { item, stock, totalStock, status: itemStatus };
  });
  
  container.innerHTML = inventory.map(inv => {
    const cat = adminData.categories.find(c => c.id == inv.item.category);
    const categoryName = cat ? cat.name : 'uncategorized';
    const statusLabel = inv.status.replace('-', ' ');
    
    const sizeStocks = sizes.map(size => ({
      size,
      count: parseInt(inv.stock[size]) || 0
    }));
    
    return `
      <div class="inventory-item-card">
        <div class="inventory-item-header">
          <div class="inventory-item-title" title="${inv.item.name}">${inv.item.name}</div>
          <span class="inventory-item-status ${inv.status}">
            <i class="ri-${inv.status === 'in-stock' ? 'check' : inv.status === 'low-stock' ? 'alert' : 'close'}-line"></i>
            ${statusLabel}
          </span>
        </div>
        
        <div class="inventory-item-body">
          <div class="inventory-item-row">
            <span class="inventory-item-label">Category</span>
            <span class="inventory-item-value">${categoryName}</span>
          </div>
          <div class="inventory-item-row">
            <span class="inventory-item-label">Price</span>
            <span class="inventory-item-value">$${inv.item.price}</span>
          </div>
          <div class="inventory-item-row">
            <span class="inventory-item-label">Total Stock</span>
            <span class="inventory-item-value">${inv.totalStock} units</span>
          </div>
        </div>
        
        <div class="inventory-sizes">
          ${sizeStocks.map(s => `
            <div class="size-badge">
              <span class="size-badge-label">${s.size}</span>
              <span class="size-badge-value">${s.count}</span>
            </div>
          `).join('')}
        </div>
        
        <div class="inventory-item-footer">
          <button class="btn btn-primary" onclick="toggleSizeEditor(${inv.item.id})">
            <i class="ri-pencil-line"></i> Edit
          </button>
          <button class="btn btn-danger" onclick="deleteItem('shop', ${inv.item.id})">
            <i class="ri-delete-bin-line"></i> Delete
          </button>
        </div>
      </div>
    `;
  }).join('');
}

// Reset inventory filter
function resetInventoryFilter() {
  document.getElementById('inventoryStatus').value = '';
  if (document.getElementById('inventorySearch')) {
    document.getElementById('inventorySearch').value = '';
  }
  displayInventory();
}

// Filter Shop Items
function filterShopItems() {
  const searchInput = document.getElementById('shopSearch').value.toLowerCase();
  const categoryFilter = document.getElementById('shopCategory').value;
  const sortBy = document.getElementById('shopSortBy').value;

  // Get shop items
  let filtered = [...adminData.shop];

  // Search filter
  if (searchInput) {
    filtered = filtered.filter(item => 
      item.name.toLowerCase().includes(searchInput) || 
      (item.description && item.description.toLowerCase().includes(searchInput)) ||
      (item.tags && item.tags.toLowerCase().includes(searchInput))
    );
  }

  // Category filter
  if (categoryFilter) {
    filtered = filtered.filter(item => item.category === categoryFilter || (categoryFilter === '' && !item.category));
  }

  // Sort
  switch(sortBy) {
    case 'date-desc':
      filtered.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      break;
    case 'date-asc':
      filtered.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
      break;
    case 'name-asc':
      filtered.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case 'name-desc':
      filtered.sort((a, b) => b.name.localeCompare(a.name));
      break;
    case 'price-asc':
      filtered.sort((a, b) => a.price - b.price);
      break;
    case 'price-desc':
      filtered.sort((a, b) => b.price - a.price);
      break;
  }

  // Display filtered items
  displayShopItemsFiltered(filtered);
}

// Reset Shop Filters
function resetShopFilters() {
  document.getElementById('shopSearch').value = '';
  document.getElementById('shopCategory').value = '';
  document.getElementById('shopSortBy').value = 'date-desc';
  displayShopItems();
}

// Track selected items for bulk operations
let selectedItems = new Set();

// Toggle item selection
function toggleItemSelection(itemId) {
  if (selectedItems.has(itemId)) {
    selectedItems.delete(itemId);
  } else {
    selectedItems.add(itemId);
  }
  updateBulkActionsBar();
  updateItemCardSelection();
}

// Update bulk actions bar visibility
function updateBulkActionsBar() {
  const bar = document.getElementById('bulkActionsBar');
  const count = document.getElementById('bulkSelectedCount');
  
  if (selectedItems.size > 0) {
    bar.style.display = 'flex';
    count.textContent = selectedItems.size;
  } else {
    bar.style.display = 'none';
  }
}

// Update item card visual selection
function updateItemCardSelection() {
  const cards = document.querySelectorAll('.item-card');
  cards.forEach(card => {
    const checkbox = card.querySelector('.item-checkbox');
    if (checkbox && selectedItems.has(parseInt(checkbox.value))) {
      card.classList.add('selected');
      checkbox.checked = true;
    } else {
      card.classList.remove('selected');
      if (checkbox) checkbox.checked = false;
    }
  });
}

// Select all items
function bulkSelectAll() {
  adminData.shop.forEach(item => {
    selectedItems.add(item.id);
  });
  updateBulkActionsBar();
  updateItemCardSelection();
}

// Clear all selections
function bulkClearSelection() {
  selectedItems.clear();
  updateBulkActionsBar();
  updateItemCardSelection();
}

// Bulk archive items
function bulkArchiveItems() {
  if (selectedItems.size === 0) return;
  
  if (confirm(`archive ${selectedItems.size} items?`)) {
    selectedItems.forEach(itemId => {
      const item = adminData.shop.find(i => i.id === itemId);
      if (item) {
        adminData.archive.push(item);
        adminData.shop = adminData.shop.filter(i => i.id !== itemId);
      }
    });
    
    selectedItems.clear();
    saveData();
    displayItems();
    showNotification(`${selectedItems.size} items archived`, 'success');
  }
}

// Bulk delete items
function bulkDeleteItems() {
  if (selectedItems.size === 0) return;
  
  if (confirm(`permanently delete ${selectedItems.size} items? this cannot be undone.`)) {
    selectedItems.forEach(itemId => {
      adminData.shop = adminData.shop.filter(i => i.id !== itemId);
    });
    
    selectedItems.clear();
    saveData();
    displayItems();
    showNotification(`${selectedItems.size} items deleted`, 'success');
  }
}

// Display filtered shop items
function displayShopItemsFiltered(items) {
  const container = document.getElementById('shopItems');
  
  if (items.length === 0) {
    container.innerHTML = '<p class="empty-state">No products found matching your filters.</p>';
    return;
  }

  container.innerHTML = items.map(item => {
    const cat = adminData.categories.find(c => c.id == item.category);
    const categoryName = cat ? cat.name : 'uncategorized';
    const categoryColor = cat ? cat.color : '#6366f1';
    const tagsHtml = item.tags ? item.tags.split(',').map(tag => `<span class="shop-product-tag">${tag.trim()}</span>`).join('') : '';
    const image = item.image || (item.images && item.images[0]) || null;
    
    return `
      <div class="shop-product-card${selectedItems.has(item.id) ? ' selected' : ''}">
        <div class="shop-product-checkbox">
          <input type="checkbox" value="${item.id}" onchange="toggleItemSelection(${item.id})" ${selectedItems.has(item.id) ? 'checked' : ''}>
        </div>
        ${image ? `<img src="${image}" alt="${item.name}" class="shop-product-image">` : '<div class="shop-product-image empty"><i class="ri-image-add-line"></i></div>'}
        <div class="shop-product-info">
          <div class="shop-product-header">
            <div class="shop-product-title">${item.name}</div>
            <div class="shop-product-price">$${item.price}</div>
          </div>
          <span class="shop-product-category" style="background-color: ${categoryColor}22; color: ${categoryColor};">${categoryName}</span>
          <div class="shop-product-description">${item.description}</div>
          ${tagsHtml ? `<div class="shop-product-tags">${tagsHtml}</div>` : ''}
          <div class="shop-product-meta">
            <span>${new Date(item.createdAt).toLocaleDateString()}</span>
          </div>
          <div class="shop-product-actions">
            <button class="btn" onclick="editItem('shop', ${item.id})">
              <i class="ri-pencil-line"></i> Edit
            </button>
            <button class="btn btn-warning" onclick="archiveItem('shop', ${item.id})">
              <i class="ri-archive-drawer-line"></i> Archive
            </button>
            <button class="btn btn-danger" onclick="deleteItemFromList('shop', ${item.id})">
              <i class="ri-delete-bin-line"></i> Delete
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// Display shop items
function displayShopItems() {
  const container = document.getElementById('shopItems');
  
  if (adminData.shop.length === 0) {
    container.innerHTML = '<p class="empty-state">No products yet. Add your first product!</p>';
    return;
  }

  container.innerHTML = adminData.shop.map(item => {
    const cat = adminData.categories.find(c => c.id == item.category);
    const categoryName = cat ? cat.name : 'uncategorized';
    const categoryColor = cat ? cat.color : '#6366f1';
    const tagsHtml = item.tags ? item.tags.split(',').map(tag => `<span class="shop-product-tag">${tag.trim()}</span>`).join('') : '';
    const image = item.image || (item.images && item.images[0]) || null;
    
    return `
      <div class="shop-product-card${selectedItems.has(item.id) ? ' selected' : ''}">
        <div class="shop-product-checkbox">
          <input type="checkbox" value="${item.id}" onchange="toggleItemSelection(${item.id})" ${selectedItems.has(item.id) ? 'checked' : ''}>
        </div>
        ${image ? `<img src="${image}" alt="${item.name}" class="shop-product-image">` : '<div class="shop-product-image empty"><i class="ri-image-add-line"></i></div>'}
        <div class="shop-product-info">
          <div class="shop-product-header">
            <div class="shop-product-title">${item.name}</div>
            <div class="shop-product-price">$${item.price}</div>
          </div>
          <span class="shop-product-category" style="background-color: ${categoryColor}22; color: ${categoryColor};">${categoryName}</span>
          <div class="shop-product-description">${item.description}</div>
          ${tagsHtml ? `<div class="shop-product-tags">${tagsHtml}</div>` : ''}
          <div class="shop-product-meta">
            <span>${new Date(item.createdAt).toLocaleDateString()}</span>
          </div>
          <div class="shop-product-actions">
            <button class="btn" onclick="editItem('shop', ${item.id})">
              <i class="ri-pencil-line"></i> Edit
            </button>
            <button class="btn btn-warning" onclick="archiveItem('shop', ${item.id})">
              <i class="ri-archive-drawer-line"></i> Archive
            </button>
            <button class="btn btn-danger" onclick="deleteItemFromList('shop', ${item.id})">
              <i class="ri-delete-bin-line"></i> Delete
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
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
        <div class="item-description">${item.category || item.description}</div>
        <div class="item-meta">
          <span>${item.category || 'Archived'}</span>
          <span>${new Date(item.createdAt).toLocaleDateString()}</span>
        </div>
        <div class="item-actions">
          <button class="btn btn-secondary" onclick="editItem('archive', ${item.id})">edit</button>
          <button class="btn btn-success" onclick="unarchiveItem(${item.id})">unarchive to shop</button>
          <button class="btn btn-danger" onclick="deleteItemFromList('archive', ${item.id})">delete</button>
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
          <button class="btn btn-secondary" onclick="editItem('gallery', ${item.id})">edit</button>
          <button class="btn btn-danger" onclick="deleteItemFromList('gallery', ${item.id})">delete</button>
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

  modalTitle.textContent = `edit ${type.charAt(0).toLowerCase() + type.slice(1)} item`;

  // Store current editing item
  window.currentEditingItem = { type, id };

  if (type === 'shop') {
    // Build images preview HTML
    const images = item.images || [item.image];
    const imagesPreview = images.map((img, idx) => `
      <div class="image-preview-item" data-image-index="${idx}">
        <img src="${img}" alt="Image ${idx + 1}">
        <button type="button" class="btn btn-danger btn-small" onclick="removeImagePreview(${idx})">remove</button>
      </div>
    `).join('');

    modalFormContent.innerHTML = `
      <input type="text" placeholder="Product Name" class="form-input" value="${item.name}" required>
      <input type="number" placeholder="Price" class="form-input" value="${item.price}" required>
      <textarea placeholder="Product Description" class="form-textarea" required>${item.description}</textarea>
      
      <div class="form-group">
        <label>Product Images</label>
        <div class="images-preview" id="imagesPreview">
          ${imagesPreview}
        </div>
        <input type="file" accept="image/*" multiple class="form-file" id="editProductImages">
        <small>Upload additional images or leave empty to keep current ones</small>
      </div>
    `;

    // Store current images for modal
    window.currentEditingImages = [...images];
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
  const modalFormContent = document.getElementById('modalFormContent');
  const itemIndex = adminData[type].findIndex(i => i.id === id);

  if (itemIndex === -1) return;

  if (type === 'shop') {
    const formInputs = modalFormContent.querySelectorAll('input, textarea');
    adminData[type][itemIndex].name = formInputs[0].value;
    adminData[type][itemIndex].price = formInputs[1].value;
    adminData[type][itemIndex].description = formInputs[2].value;

    // Handle new images if uploaded
    const imageInput = document.getElementById('editProductImages');
    if (imageInput && imageInput.files.length > 0) {
      // Add new images to existing ones
      for (const file of imageInput.files) {
        const compressedImage = await readAndCompressFile(file);
        window.currentEditingImages.push(compressedImage);
      }
    }

    // Update images
    adminData[type][itemIndex].images = window.currentEditingImages;
    adminData[type][itemIndex].image = window.currentEditingImages[0];
  } else if (type === 'archive') {
    const formInputs = modalFormContent.querySelectorAll('input, textarea');
    adminData[type][itemIndex].title = formInputs[0].value;
    adminData[type][itemIndex].category = formInputs[1].value;
    adminData[type][itemIndex].description = formInputs[2].value;
  } else if (type === 'gallery') {
    const formInputs = modalFormContent.querySelectorAll('input, textarea');
    adminData[type][itemIndex].title = formInputs[0].value;
    adminData[type][itemIndex].description = formInputs[1].value;
  }

  await saveAdminData(adminData);
  closeModal();
  displayItems();
  showNotification('item updated successfully!', 'success');
}

// Remove image from preview in edit modal
function removeImagePreview(index) {
  if (window.currentEditingImages) {
    window.currentEditingImages.splice(index, 1);
    // Refresh preview
    const previewContainer = document.getElementById('imagesPreview');
    if (previewContainer) {
      previewContainer.innerHTML = window.currentEditingImages.map((img, idx) => `
        <div class="image-preview-item" data-image-index="${idx}">
          <img src="${img}" alt="Image ${idx + 1}">
          <button type="button" class="btn btn-danger btn-small" onclick="removeImagePreview(${idx})">Remove</button>
        </div>
      `).join('');
    }
  }
}

// Delete item from list
async function deleteItemFromList(type, id) {
  if (confirm('are you sure you want to delete this item?')) {
    adminData[type] = adminData[type].filter(i => i.id !== id);
    await saveAdminData(adminData);
    displayItems();
    showNotification('item deleted!', 'success');
  }
}

// Archive shop item (move to archive)
async function archiveItem(type, id) {
  if (confirm('move this item to archive?')) {
    // Find the item in shop
    const itemIndex = adminData[type].findIndex(i => i.id === id);
    if (itemIndex === -1) return;
    
    const item = adminData[type][itemIndex];
    
    // Convert shop item to archive format
    const archivedItem = {
      id: item.id,
      type: 'archive',
      title: item.name,
      category: 'Shop Archive',
      description: item.description,
      image: item.image,
      images: item.images,
      price: item.price, // Keep price info
      createdAt: item.createdAt,
      archivedAt: new Date().toISOString()
    };
    
    // Remove from shop
    adminData.shop = adminData.shop.filter(i => i.id !== id);
    
    // Add to archive
    if (!Array.isArray(adminData.archive)) adminData.archive = [];
    adminData.archive.push(archivedItem);
    
    // Save to Firebase
    await saveAdminData(adminData);
    displayItems();
    showNotification('item archived successfully!', 'success');
  }
}

// Unarchive item (move back to shop)
async function unarchiveItem(id) {
  if (confirm('move this item back to shop?')) {
    // Find the item in archive
    const itemIndex = adminData.archive.findIndex(i => i.id === id);
    if (itemIndex === -1) return;
    
    const item = adminData.archive[itemIndex];
    
    // Convert archive item back to shop format
    const shopItem = {
      id: item.id,
      type: 'shop',
      name: item.title,
      description: item.description,
      image: item.image,
      images: item.images,
      price: item.price || 0,
      createdAt: item.createdAt,
      unarchivedAt: new Date().toISOString()
    };
    
    // Remove from archive
    adminData.archive = adminData.archive.filter(i => i.id !== id);
    
    // Add back to shop
    if (!Array.isArray(adminData.shop)) adminData.shop = [];
    adminData.shop.push(shopItem);
    
    // Save to Firebase
    await saveAdminData(adminData);
    displayItems();
    showNotification('item restored to shop!', 'success');
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
  if (confirm('are you sure you want to logout?')) {
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
      if (confirm('this will replace all current data. continue?')) {
        adminData = imported;
        await saveAdminData(adminData);
        displayItems();
        showNotification('data imported successfully!', 'success');
      }
    } catch (error) {
      showNotification('error importing data!', 'error');
    }
  };
  reader.readAsText(file);
}

// ===== ORDERS MANAGEMENT FUNCTIONS =====
// Get next order ID
function getNextOrderId() {
  if (adminData.orders.length === 0) return 1001;
  return Math.max(...adminData.orders.map(o => o.id || 0)) + 1;
}

// Display orders table
function displayOrders() {
  const container = document.getElementById('ordersTable');
  
  if (adminData.orders.length === 0) {
    container.innerHTML = '<p class="empty-state">no orders yet</p>';
    updateOrderStats();
    return;
  }

  const statusFilter = document.getElementById('orderStatus')?.value || '';
  let orders = adminData.orders;

  if (statusFilter) {
    orders = orders.filter(o => o.status === statusFilter);
  }

  container.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>order id</th>
          <th>customer</th>
          <th>date</th>
          <th>total</th>
          <th>items</th>
          <th>status</th>
          <th>actions</th>
        </tr>
      </thead>
      <tbody>
        ${orders.map(order => `
          <tr>
            <td>#${order.id}</td>
            <td>${order.customerName || 'N/A'}</td>
            <td>${new Date(order.date).toLocaleDateString()}</td>
            <td>$${order.total.toFixed(2)}</td>
            <td>${order.items.length} items</td>
            <td>
              <span class="order-status ${order.status}">
                ${order.status}
              </span>
            </td>
            <td>
              <button class="btn btn-secondary" style="font-size: 11px;" onclick="viewOrderDetails(${order.id})">view</button>
              <button class="btn btn-primary" style="font-size: 11px;" onclick="downloadInvoice(${order.id})">invoice</button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;

  updateOrderStats();
}

// Update order stats
function updateOrderStats() {
  const totalOrders = adminData.orders.length;
  const pending = adminData.orders.filter(o => o.status === 'pending').length;
  const completed = adminData.orders.filter(o => o.status === 'completed').length;
  const totalRevenue = adminData.orders.reduce((sum, o) => sum + (o.total || 0), 0);

  document.getElementById('totalOrders').textContent = totalOrders;
  document.getElementById('pendingOrders').textContent = pending;
  document.getElementById('completedOrders').textContent = completed;
  document.getElementById('totalRevenue').textContent = '$' + totalRevenue.toFixed(2);
}

// Filter orders
function filterOrders() {
  displayOrders();
}

// Reset order filters
function resetOrderFilters() {
  document.getElementById('orderStatus').value = '';
  displayOrders();
}

// Create new order
function createOrder(customerName, customerEmail, items) {
  const newOrder = {
    id: getNextOrderId(),
    customerName: customerName,
    customerEmail: customerEmail,
    items: items,
    total: items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
    status: 'pending',
    date: new Date().toISOString(),
    shippingAddress: '',
    notes: '',
    paymentMethod: '',
    paymentStatus: 'unpaid'
  };

  adminData.orders.push(newOrder);
  saveData();
  displayOrders();
  showNotification(`order #${newOrder.id} created`, 'success');
  return newOrder;
}

// View order details
function viewOrderDetails(orderId) {
  const order = adminData.orders.find(o => o.id === orderId);
  if (!order) return;

  const modal = document.getElementById('orderModal');
  const content = document.getElementById('orderModalContent');

  content.innerHTML = `
    <div style="padding: 20px;">
      <h4>Order #${order.id}</h4>
      <p><strong>Customer:</strong> ${order.customerName}</p>
      <p><strong>Email:</strong> ${order.customerEmail}</p>
      <p><strong>Date:</strong> ${new Date(order.date).toLocaleString()}</p>
      <p><strong>Status:</strong> <span class="order-status ${order.status}">${order.status}</span></p>
      <p><strong>Payment Status:</strong> ${order.paymentStatus}</p>
      
      <h4 style="margin-top: 20px;">Items</h4>
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="border-bottom: 2px solid #ddd;">
            <th style="text-align: left; padding: 10px;">Product</th>
            <th style="text-align: center;">Quantity</th>
            <th style="text-align: right;">Price</th>
            <th style="text-align: right;">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          ${order.items.map(item => `
            <tr style="border-bottom: 1px solid #eee;">
              <td style="padding: 10px;">${item.name}</td>
              <td style="text-align: center;">${item.quantity}</td>
              <td style="text-align: right;">$${item.price.toFixed(2)}</td>
              <td style="text-align: right;">$${(item.price * item.quantity).toFixed(2)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div style="margin-top: 15px; padding-top: 15px; border-top: 2px solid #ddd; text-align: right;">
        <h3>Total: $${order.total.toFixed(2)}</h3>
      </div>

      <div style="margin-top: 20px;">
        <label>Update Status</label>
        <select id="orderStatusSelect" class="form-input" value="${order.status}">
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>
    </div>
  `;

  modal.style.display = 'flex';
  window.currentOrderId = orderId;
}

// Close order modal
function closeOrderModal() {
  document.getElementById('orderModal').style.display = 'none';
  window.currentOrderId = null;
}

// Update order status
function updateOrderStatus() {
  if (!window.currentOrderId) return;

  const order = adminData.orders.find(o => o.id === window.currentOrderId);
  if (!order) return;

  const newStatus = document.getElementById('orderStatusSelect').value;
  order.status = newStatus;
  saveData();
  displayOrders();
  closeOrderModal();
  showNotification('order status updated', 'success');
}

// ===== INVOICE FUNCTIONS =====
// Download invoice as PDF
function downloadInvoice(orderId) {
  const order = adminData.orders.find(o => o.id === orderId);
  if (!order) return;

  const invoiceContent = generateInvoiceHTML(order);
  const printWindow = window.open('', '', 'width=800,height=600');
  printWindow.document.write(invoiceContent);
  printWindow.document.close();
  printWindow.print();
}

// Print invoice
function printInvoice() {
  if (!window.currentOrderId) return;
  downloadInvoice(window.currentOrderId);
}

// Generate invoice HTML
function generateInvoiceHTML(order) {
  const date = new Date(order.date);
  const today = new Date();

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Invoice #${order.id}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 20px;
          background: white;
        }
        .invoice-container {
          max-width: 800px;
          margin: 0 auto;
          border: 1px solid #ddd;
          padding: 40px;
        }
        .invoice-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 40px;
          border-bottom: 2px solid #333;
          padding-bottom: 20px;
        }
        .invoice-title {
          font-size: 28px;
          font-weight: bold;
        }
        .invoice-number {
          text-align: right;
        }
        .invoice-number h2 {
          margin: 0;
          font-size: 20px;
        }
        .invoice-number p {
          margin: 5px 0;
          color: #666;
        }
        .company-info {
          margin-bottom: 40px;
        }
        .company-info h3 {
          margin-top: 0;
        }
        .invoice-details {
          display: flex;
          justify-content: space-between;
          margin-bottom: 40px;
        }
        .detail-section {
          flex: 1;
        }
        .detail-section h4 {
          margin-top: 0;
          border-bottom: 1px solid #ddd;
          padding-bottom: 10px;
        }
        .detail-section p {
          margin: 5px 0;
          color: #666;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 30px;
        }
        thead {
          background: #f5f5f5;
        }
        th {
          text-align: left;
          padding: 12px;
          border: 1px solid #ddd;
          font-weight: bold;
        }
        td {
          padding: 12px;
          border: 1px solid #ddd;
        }
        .text-right {
          text-align: right;
        }
        .total-section {
          display: flex;
          justify-content: flex-end;
          margin-bottom: 40px;
        }
        .total-box {
          width: 300px;
        }
        .total-row {
          display: flex;
          justify-content: space-between;
          padding: 10px 0;
          border-bottom: 1px solid #ddd;
        }
        .total-amount {
          display: flex;
          justify-content: space-between;
          padding: 15px 0;
          border-top: 2px solid #333;
          font-weight: bold;
          font-size: 16px;
        }
        .footer {
          text-align: center;
          color: #666;
          font-size: 12px;
          border-top: 1px solid #ddd;
          padding-top: 20px;
          margin-top: 40px;
        }
        @media print {
          body {
            padding: 0;
            margin: 0;
          }
        }
      </style>
    </head>
    <body>
      <div class="invoice-container">
        <div class="invoice-header">
          <div>
            <div class="invoice-title">INVOICE</div>
            <p style="color: #666; margin: 10px 0 0 0;">inverted.exe</p>
          </div>
          <div class="invoice-number">
            <h2>#${order.id}</h2>
            <p>Invoice Date: ${today.toLocaleDateString()}</p>
            <p>Order Date: ${date.toLocaleDateString()}</p>
          </div>
        </div>

        <div class="company-info">
          <h3>inverted.exe</h3>
          <p>Professional Digital Solutions</p>
          <p>Email: support@inverted.exe</p>
        </div>

        <div class="invoice-details">
          <div class="detail-section">
            <h4>Bill To</h4>
            <p><strong>${order.customerName}</strong></p>
            <p>${order.customerEmail}</p>
            <p>${order.shippingAddress || 'Address not provided'}</p>
          </div>
          <div class="detail-section">
            <h4>Order Details</h4>
            <p><strong>Status:</strong> ${order.status}</p>
            <p><strong>Payment:</strong> ${order.paymentStatus}</p>
            <p><strong>Method:</strong> ${order.paymentMethod || 'Not specified'}</p>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th class="text-right">Qty</th>
              <th class="text-right">Unit Price</th>
              <th class="text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${order.items.map(item => `
              <tr>
                <td>${item.name}</td>
                <td class="text-right">${item.quantity}</td>
                <td class="text-right">$${item.price.toFixed(2)}</td>
                <td class="text-right">$${(item.price * item.quantity).toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="total-section">
          <div class="total-box">
            <div class="total-row">
              <span>Subtotal:</span>
              <span>$${order.total.toFixed(2)}</span>
            </div>
            <div class="total-row">
              <span>Tax:</span>
              <span>$0.00</span>
            </div>
            <div class="total-amount">
              <span>Total:</span>
              <span>$${order.total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div class="footer">
          <p>Thank you for your business!</p>
          <p>This is an automated invoice. Please contact support@inverted.exe for any inquiries.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// ===== ANALYTICS FUNCTIONS =====
// Display analytics dashboard
function displayAnalytics() {
  updateAnalyticsMetrics();
  displayTopProducts();
  generateSalesChart();
  generateCategoryChart();
}

// Update analytics metrics
function updateAnalyticsMetrics() {
  const startDate = document.getElementById('analyticsStartDate')?.value;
  const endDate = document.getElementById('analyticsEndDate')?.value;

  let filteredOrders = adminData.orders;

  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    filteredOrders = filteredOrders.filter(o => {
      const orderDate = new Date(o.date);
      return orderDate >= start && orderDate <= end;
    });
  }

  const totalRevenue = filteredOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  const totalOrders = filteredOrders.length;
  const avgOrder = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const totalItems = filteredOrders.reduce((sum, o) => sum + o.items.reduce((s, i) => s + i.quantity, 0), 0);

  document.getElementById('analyticsRevenue').textContent = '$' + totalRevenue.toFixed(2);
  document.getElementById('analyticsTotalOrders').textContent = totalOrders;
  document.getElementById('analyticsAvgOrder').textContent = '$' + avgOrder.toFixed(2);
  document.getElementById('analyticsItemsSold').textContent = totalItems;
}

// Display top products
function displayTopProducts() {
  const container = document.getElementById('topProductsTable');

  // Count sales by product
  const productSales = {};
  adminData.orders.forEach(order => {
    order.items.forEach(item => {
      if (!productSales[item.id]) {
        productSales[item.id] = { name: item.name, quantity: 0, revenue: 0 };
      }
      productSales[item.id].quantity += item.quantity;
      productSales[item.id].revenue += item.price * item.quantity;
    });
  });

  const topProducts = Object.values(productSales)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  if (topProducts.length === 0) {
    container.innerHTML = '<p class="empty-state">no sales data yet</p>';
    return;
  }

  container.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>product name</th>
          <th>units sold</th>
          <th>revenue</th>
          <th>avg price</th>
        </tr>
      </thead>
      <tbody>
        ${topProducts.map((product, index) => `
          <tr>
            <td>${index + 1}. ${product.name}</td>
            <td>${product.quantity}</td>
            <td>$${product.revenue.toFixed(2)}</td>
            <td>$${(product.revenue / product.quantity).toFixed(2)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

// Generate sales chart (simple text-based)
function generateSalesChart() {
  const container = document.getElementById('salesChart');
  
  // Group sales by day
  const salesByDay = {};
  adminData.orders.forEach(order => {
    const day = new Date(order.date).toLocaleDateString();
    if (!salesByDay[day]) {
      salesByDay[day] = 0;
    }
    salesByDay[day] += order.total;
  });

  if (Object.keys(salesByDay).length === 0) {
    container.innerHTML = '<p class="empty-state">no sales data</p>';
    return;
  }

  const maxRevenue = Math.max(...Object.values(salesByDay));
  const chartHTML = Object.entries(salesByDay)
    .map(([day, revenue]) => {
      const percentage = (revenue / maxRevenue) * 100;
      return `
        <div style="margin-bottom: 15px;">
          <div style="font-size: 12px; margin-bottom: 5px;">
            ${day} - $${revenue.toFixed(2)}
          </div>
          <div style="background: #f0f0f0; height: 20px; border-radius: 4px; overflow: hidden;">
            <div style="background: #4CAF50; height: 100%; width: ${percentage}%;"></div>
          </div>
        </div>
      `;
    })
    .join('');

  container.innerHTML = chartHTML;
}

// Generate category chart
function generateCategoryChart() {
  const container = document.getElementById('categoryChart');

  // Calculate revenue by category
  const revenueByCategory = {};
  adminData.orders.forEach(order => {
    order.items.forEach(item => {
      const category = item.category || 'Uncategorized';
      if (!revenueByCategory[category]) {
        revenueByCategory[category] = 0;
      }
      revenueByCategory[category] += item.price * item.quantity;
    });
  });

  if (Object.keys(revenueByCategory).length === 0) {
    container.innerHTML = '<p class="empty-state">no category data</p>';
    return;
  }

  const totalRevenue = Object.values(revenueByCategory).reduce((a, b) => a + b, 0);
  const chartHTML = Object.entries(revenueByCategory)
    .map(([category, revenue]) => {
      const percentage = (revenue / totalRevenue) * 100;
      return `
        <div style="margin-bottom: 15px;">
          <div style="font-size: 12px; margin-bottom: 5px;">
            ${category} - $${revenue.toFixed(2)} (${percentage.toFixed(1)}%)
          </div>
          <div style="background: #f0f0f0; height: 20px; border-radius: 4px; overflow: hidden;">
            <div style="background: #2196F3; height: 100%; width: ${percentage}%;"></div>
          </div>
        </div>
      `;
    })
    .join('');

  container.innerHTML = chartHTML;
}

// Filter analytics
function filterAnalytics() {
  updateAnalyticsMetrics();
  displayTopProducts();
  generateSalesChart();
  generateCategoryChart();
}

// Reset analytics
function resetAnalytics() {
  document.getElementById('analyticsStartDate').value = '';
  document.getElementById('analyticsEndDate').value = '';
  filterAnalytics();
}

// Export analytics to CSV
function exportAnalyticsCSV() {
  let csv = 'Order ID,Customer,Date,Total,Status,Items Count\n';
  
  adminData.orders.forEach(order => {
    csv += `${order.id},"${order.customerName}","${new Date(order.date).toLocaleDateString()}","${order.total.toFixed(2)}","${order.status}",${order.items.length}\n`;
  });

  downloadFile(csv, 'analytics-report.csv', 'text/csv');
}

// Export analytics to PDF
function exportAnalyticsPDF() {
  const totalRevenue = adminData.orders.reduce((sum, o) => sum + (o.total || 0), 0);
  const totalOrders = adminData.orders.length;

  const pdfContent = `
    ANALYTICS REPORT
    inverted.exe
    Generated: ${new Date().toLocaleString()}
    
    KEY METRICS
    ====================
    Total Revenue: $${totalRevenue.toFixed(2)}
    Total Orders: ${totalOrders}
    Average Order Value: $${(totalOrders > 0 ? totalRevenue / totalOrders : 0).toFixed(2)}
    
    TOP PRODUCTS
    ====================
  `;

  const productSales = {};
  adminData.orders.forEach(order => {
    order.items.forEach(item => {
      if (!productSales[item.id]) {
        productSales[item.id] = { name: item.name, quantity: 0, revenue: 0 };
      }
      productSales[item.id].quantity += item.quantity;
      productSales[item.id].revenue += item.price * item.quantity;
    });
  });

  const topProducts = Object.values(productSales)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  let content = pdfContent;
  topProducts.forEach((product, i) => {
    content += `${i + 1}. ${product.name} - ${product.quantity} units - $${product.revenue.toFixed(2)}\n`;
  });

  downloadFile(content, 'analytics-report.txt', 'text/plain');
  showNotification('report exported as text. convert to PDF using your browser print feature.', 'info');
}

// Helper: Download file
function downloadFile(content, filename, type) {
  const blob = new Blob([content], { type: type });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

// Add CSS for order status styling
const style = document.createElement('style');
style.textContent = `
  .order-status {
    padding: 6px 12px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: bold;
    text-transform: uppercase;
  }
  
  .order-status.pending {
    background: #fff3cd;
    color: #856404;
  }
  
  .order-status.processing {
    background: #cfe2ff;
    color: #084298;
  }
  
  .order-status.completed {
    background: #d1e7dd;
    color: #0f5132;
  }
  
  .order-status.cancelled {
    background: #f8d7da;
    color: #842029;
  }
  
  .analytics-container {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    margin: 20px 0;
  }
  
  .chart-box {
    background: #f9f9f9;
    padding: 20px;
    border-radius: 8px;
    border: 1px solid #eee;
  }
  
  .chart-placeholder {
    background: white;
    padding: 20px;
    border-radius: 4px;
    min-height: 300px;
  }
`;
document.head.appendChild(style);
