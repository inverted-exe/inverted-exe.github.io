// Display Admin Data on Main Pages
// This script loads and displays data managed through admin panel on the main website pages

function loadAdminData() {
  return DatabaseSync.load();
}

// ===== OPTIMIZED SHOP ITEMS =====
function displayShopItems() {
  console.log('Loading shop items...');
  const adminData = loadAdminData();
  const shopContainer = document.querySelector('.shop-grid');
  
  if (!shopContainer) {
    console.log('Shop container not found');
    return;
  }

  if (!adminData.shop || adminData.shop.length === 0) {
    console.log('No shop items');
    return;
  }

  // Enable pagination for large datasets
  if (adminData.shop.length > 12) {
    shopContainer.setAttribute('data-paginated', 'true');
  }

  // Render with lazy loading
  shopContainer.innerHTML = adminData.shop.map((item, idx) => `
    <div class="shop-item-simple" data-item="${idx}" data-product-id="${item.id}">
      <a href="/shop/product-detail.html?id=${item.id}" class="shop-item-link">
        <div class="shop-image-simple">
          ${item.image ? `
            <img 
              ${idx < 12 ? `src="${item.image}"` : `data-src="${item.image}"`}
              alt="${item.name}" 
              loading="lazy"
              class="shop-item-img"
            >
          ` : '<div style="background: rgba(255,255,255,0.1); height: 100%; display:flex; align-items:center; justify-content:center;">No Image</div>'}
        </div>
        <h3 class="shop-item-title">${item.name}</h3>
      </a>
    </div>
  `).join('');

  // Setup lazy loading for images
  PerformanceManager.setupLazyLoading();
  // Setup pagination if needed
  PerformanceManager.setupPagination();
  
  console.log('Shop items loaded:', adminData.shop.length);
}

// ===== OPTIMIZED ARCHIVE ITEMS =====
function displayArchiveItems() {
  console.log('Loading archive items...');
  const adminData = loadAdminData();
  const archiveContainer = document.querySelector('.archive-grid');
  
  if (!archiveContainer) return;

  if (!adminData.archive || adminData.archive.length === 0) return;

  // Enable pagination for large datasets
  if (adminData.archive.length > 12) {
    archiveContainer.setAttribute('data-paginated', 'true');
  }

  // Check if it's simple layout (public archive page)
  const isSimpleLayout = archiveContainer.classList.contains('archive-simple');
  
  if (isSimpleLayout) {
    // Display like shop items with gray styling
    archiveContainer.innerHTML = adminData.archive.map((item, idx) => `
      <div class="archive-item-simple" data-item="${idx}">
        <div class="archive-image-simple">
          ${item.image ? `
            <img 
              ${idx < 12 ? `src="${item.image}"` : `data-src="${item.image}"`}
              alt="${item.title}" 
              loading="lazy"
              class="archive-item-img"
            >
          ` : '<div style="background: rgba(255,255,255,0.1); height: 100%"></div>'}
        </div>
        <h3 class="archive-item-title">${item.title}</h3>
      </div>
    `).join('');
  } else {
    // Admin panel detailed layout
    archiveContainer.innerHTML = adminData.archive.map((item, idx) => `
      <div class="archive-item" data-item="${idx}" onclick="openImageLightbox('${item.images ? item.images[0] : item.image}', '${item.title}')" style="cursor:pointer;">
        <div class="archive-image">
          ${item.image ? `
            <img 
              ${idx < 12 ? `src="${item.image}"` : `data-src="${item.image}"`}
              alt="${item.title}"
              loading="lazy"
              class="archive-item-img"
            >
          ` : '<div style="background: rgba(255,255,255,0.1); height: 100%"></div>'}
        </div>
        <div class="archive-info">
          <h3>${item.title}</h3>
          <p class="archive-category">${item.category}</p>
          <p>${item.description}</p>
          <time>${new Date(item.createdAt).toLocaleDateString()}</time>
        </div>
      </div>
    `).join('');
  }

  // Setup lazy loading and pagination
  PerformanceManager.setupLazyLoading();
  PerformanceManager.setupPagination();

  console.log('Archive items loaded:', adminData.archive.length);
}

// ===== OPTIMIZED GALLERY IMAGES =====
function displayGalleryImages() {
  console.log('Loading gallery images...');
  const adminData = loadAdminData();
  const galleryContainer = document.querySelector('.gallery-grid');
  
  if (!galleryContainer) return;

  if (!adminData.gallery || adminData.gallery.length === 0) return;

  // Enable pagination for large datasets
  if (adminData.gallery.length > 12) {
    galleryContainer.setAttribute('data-paginated', 'true');
  }

  // Store gallery data globally for modal access
  window.galleryData = adminData.gallery;

  galleryContainer.innerHTML = adminData.gallery.map((item, index) => `
    <div class="gallery-item" data-item="${index}" onclick="openGalleryModal(${index})" style="cursor:pointer;">
      <div class="gallery-image-wrapper">
        ${item.image ? `
          <img 
            ${index < 12 ? `src="${item.image}"` : `data-src="${item.image}"`}
            alt="${item.title}" 
            loading="lazy"
            class="gallery-img"
          >
        ` : '<div style="background: rgba(255,255,255,0.1); height: 100%"></div>'}
        <div class="gallery-item-overlay">
          <i class="ri-expand-alt-line"></i>
        </div>
      </div>
    </div>
  `).join('');

  // Setup lazy loading and pagination
  PerformanceManager.setupLazyLoading();
  PerformanceManager.setupPagination();

  console.log('Gallery items loaded:', adminData.gallery.length, 'items');
}

async function initializeAdminData() {
  console.log('Initializing data loader...');
  // Tunggu Firebase sync terlebih dahulu
  if (typeof DatabaseSync !== 'undefined') {
    await DatabaseSync.init(true); // true untuk menggunakan Firebase
  }
  
  // Tunggu localStorage ter-update dari Firebase
  await new Promise(resolve => setTimeout(resolve, 500));
  
  displayShopItems();
  displayArchiveItems();
  displayGalleryImages();
  setupImageLightbox();
  console.log('Data initialization complete');
}

// Simple image lightbox for archive
function openImageLightbox(imageSrc, title) {
  const lightbox = document.getElementById('imageLightbox');
  if (!lightbox) return;
  document.getElementById('lightboxImage').src = imageSrc;
  document.getElementById('lightboxImage').alt = title || 'Image';
  lightbox.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeImageLightbox() {
  const lightbox = document.getElementById('imageLightbox');
  if (!lightbox) return;
  lightbox.classList.remove('active');
  document.body.style.overflow = 'auto';
}

// Setup enhanced gallery modal with full navigation
function setupImageLightbox() {
  if (!document.getElementById('imageLightbox')) {
    const lightbox = document.createElement('div');
    lightbox.id = 'imageLightbox';
    lightbox.className = 'image-lightbox';
    lightbox.innerHTML = `
      <div class="lightbox-content">
        <button class="lightbox-close" onclick="closeImageLightbox()">&times;</button>
        <img id="lightboxImage" src="" alt="">
      </div>
    `;
    document.body.appendChild(lightbox);
  }

  if (!document.getElementById('galleryModal')) {
    const modal = document.createElement('div');
    modal.id = 'galleryModal';
    modal.className = 'gallery-modal';
    modal.innerHTML = `
      <div class="gallery-modal-content">
        <button class="gallery-modal-close" onclick="closeGalleryModal()">&times;</button>
        
        <div class="gallery-modal-main">
          <button class="gallery-modal-nav prev-nav" onclick="previousGalleryImage()">
            <i class="ri-arrow-left-s-line"></i>
          </button>
          
          <div class="gallery-modal-image-container">
            <img id="galleryModalImage" src="" alt="">
            <div class="gallery-modal-counter">
              <span id="galleryCurrentIndex">1</span> / <span id="galleryTotalCount">1</span>
            </div>
          </div>
          
          <button class="gallery-modal-nav next-nav" onclick="nextGalleryImage()">
            <i class="ri-arrow-right-s-line"></i>
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }
}

// Global gallery state
let currentGalleryIndex = 0;

// Open gallery modal
function openGalleryModal(index) {
  if (!window.galleryData || window.galleryData.length === 0) return;
  
  currentGalleryIndex = index;
  const item = window.galleryData[index];
  const modal = document.getElementById('galleryModal');
  
  // Set main image
  document.getElementById('galleryModalImage').src = item.image;
  document.getElementById('galleryCurrentIndex').textContent = index + 1;
  document.getElementById('galleryTotalCount').textContent = window.galleryData.length;
  
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

// Navigate to next gallery item (continuous)
function nextGalleryImage() {
  if (!window.galleryData || window.galleryData.length === 0) return;
  const nextIndex = (currentGalleryIndex + 1) % window.galleryData.length;
  openGalleryModal(nextIndex);
}

// Navigate to previous gallery item (continuous)
function previousGalleryImage() {
  if (!window.galleryData || window.galleryData.length === 0) return;
  const prevIndex = (currentGalleryIndex - 1 + window.galleryData.length) % window.galleryData.length;
  openGalleryModal(prevIndex);
}

// Close gallery modal
function closeGalleryModal() {
  const modal = document.getElementById('galleryModal');
  modal.classList.remove('active');
  document.body.style.overflow = 'auto';
}

// Close gallery modal when clicking outside
document.addEventListener('click', (e) => {
  const modal = document.getElementById('galleryModal');
  if (modal && e.target === modal) {
    closeGalleryModal();
  }
  
  const lightbox = document.getElementById('imageLightbox');
  if (lightbox && e.target === lightbox) {
    closeImageLightbox();
  }
});

// Keyboard navigation for gallery
document.addEventListener('keydown', (e) => {
  const modal = document.getElementById('galleryModal');
  if (modal && modal.classList.contains('active')) {
    if (e.key === 'ArrowRight') {
      nextGalleryImage();
    } else if (e.key === 'ArrowLeft') {
      previousGalleryImage();
    } else if (e.key === 'Escape') {
      closeGalleryModal();
    }
  }
  
  const lightbox = document.getElementById('imageLightbox');
  if (lightbox && lightbox.classList.contains('active') && e.key === 'Escape') {
    closeImageLightbox();
  }
});

// Wait for DOM to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeAdminData);
} else {
  initializeAdminData();
}

