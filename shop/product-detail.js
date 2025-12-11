// Product Detail Page Logic

let currentProductData = {
  images: [],
  currentImageIndex: 0
};

function loadAdminData() {
  const adminData = JSON.parse(localStorage.getItem('inverted_admin_data')) || {
    shop: [],
    archive: [],
    gallery: []
  };
  return adminData;
}

function getProductIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return parseInt(params.get('id'));
}

function displayProductDetail() {
  const productId = getProductIdFromUrl();
  const adminData = loadAdminData();
  const product = adminData.shop.find(p => p.id === productId);

  if (!product) {
    document.querySelector('.detail-content').innerHTML = `
      <div style="text-align: center; padding: 60px 20px;">
        <h2 style="color: var(--accent); margin-bottom: 20px;">Product Not Found</h2>
        <p style="color: rgba(255,255,255,0.7); margin-bottom: 30px;">Sorry, this product doesn't exist.</p>
        <a href="/shop" class="btn btn-primary" style="display: inline-block; padding: 12px 24px; border: 2px solid var(--accent); color: var(--accent); text-decoration: none; border-radius: 2px; transition: all 0.2s;">Back to Shop</a>
      </div>
    `;
    return;
  }

  // Set up image gallery data
  currentProductData = {
    images: product.images || [product.image],
    currentImageIndex: 0
  };

  // Set main image
  document.getElementById('mainProductImage').src = currentProductData.images[0] || '';

  // Set product info
  document.getElementById('detailProductName').textContent = product.name || '';
  document.getElementById('detailProductPrice').textContent = product.price ? `$${product.price}` : 'Contact for Price';
  document.getElementById('detailProductDescription').textContent = product.description || '';

  // Set created date
  if (product.createdAt) {
    const date = new Date(product.createdAt).toLocaleDateString();
    document.getElementById('detailCreatedAt').textContent = `Added on: ${date}`;
  }

  // Setup image gallery
  const imageCounter = document.getElementById('detailImageCounter');
  const galleryNav = document.getElementById('detailGalleryNav');

  if (currentProductData.images.length > 1) {
    imageCounter.style.display = 'block';
    galleryNav.style.display = 'flex';

    document.getElementById('detailCurrentImageIndex').textContent = '1';
    document.getElementById('detailTotalImages').textContent = currentProductData.images.length;

    // Create thumbnails
    const thumbnailsContainer = document.getElementById('detailThumbnails');
    thumbnailsContainer.innerHTML = currentProductData.images.map((img, index) => `
      <div class="detail-thumbnail ${index === 0 ? 'active' : ''}" onclick="selectProductImage(${index})">
        <img src="${img}" alt="Image ${index + 1}">
      </div>
    `).join('');
  } else {
    imageCounter.style.display = 'none';
    galleryNav.style.display = 'none';
  }

  console.log('Product detail loaded:', product);
}

function selectProductImage(index) {
  if (index >= 0 && index < currentProductData.images.length) {
    currentProductData.currentImageIndex = index;
    document.getElementById('mainProductImage').src = currentProductData.images[index];
    document.getElementById('detailCurrentImageIndex').textContent = index + 1;

    // Update thumbnail active state
    document.querySelectorAll('.detail-thumbnail').forEach((thumb, i) => {
      thumb.classList.toggle('active', i === index);
    });
  }
}

function nextProductImage() {
  const nextIndex = (currentProductData.currentImageIndex + 1) % currentProductData.images.length;
  selectProductImage(nextIndex);
}

function previousProductImage() {
  const prevIndex = (currentProductData.currentImageIndex - 1 + currentProductData.images.length) % currentProductData.images.length;
  selectProductImage(prevIndex);
}

// Keyboard navigation
document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowRight') {
    nextProductImage();
  } else if (e.key === 'ArrowLeft') {
    previousProductImage();
  }
});

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', displayProductDetail);
} else {
  displayProductDetail();
}
