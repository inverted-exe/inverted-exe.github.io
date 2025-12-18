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

  // Setup size options with stock display
  const sizeSelect = document.getElementById('sizeSelect');
  const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
  
  sizeSelect.innerHTML = '<option value="">select size</option>';
  
  sizes.forEach(size => {
    const stock = product.stock && product.stock[size] ? parseInt(product.stock[size]) : 0;
    const option = document.createElement('option');
    option.value = size;
    option.textContent = stock > 0 ? `${size} (${stock} in stock)` : `${size} (out of stock)`;
    option.disabled = stock === 0;
    sizeSelect.appendChild(option);
  });

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

function addProductToCart() {
  const productId = getProductIdFromUrl();
  const adminData = loadAdminData();
  const product = adminData.shop.find(p => p.id === productId);

  if (!product) {
    alert('Product not found');
    return;
  }

  // Get size and quantity
  const size = document.getElementById('sizeSelect').value;
  const quantity = parseInt(document.getElementById('quantityInput').value) || 1;

  if (!size) {
    alert('Please select a size');
    return;
  }

  // Check stock availability
  const stock = product.stock && product.stock[size] ? parseInt(product.stock[size]) : 0;
  
  if (stock === 0) {
    alert(`${size} size is out of stock`);
    return;
  }

  if (quantity > stock) {
    alert(`Only ${stock} ${size} item(s) available`);
    return;
  }

  if (quantity < 1) {
    alert('Please enter a valid quantity');
    return;
  }

  // Get current cart from localStorage
  let cart = JSON.parse(localStorage.getItem('cart')) || [];

  // Create unique key combining product id and size
  const itemKey = `${product.id}-${size}`;
  
  // Check if product with same size already in cart
  const existingItem = cart.find(item => `${item.id}-${item.size}` === itemKey);

  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: parseFloat(product.price) || 0,
      image: product.image,
      size: size,
      quantity: quantity
    });
  }

  // Save cart to localStorage
  localStorage.setItem('cart', JSON.stringify(cart));

  // Update cart count in header
  if (typeof updateCartCount === 'function') {
    updateCartCount();
  }

  // Show success notification
  showCartNotification(`Added ${quantity} ${product.name} (Size ${size}) to cart`);

  // Reset selectors
  document.getElementById('sizeSelect').value = '';
  document.getElementById('quantityInput').value = '1';
}

function showCartNotification(message) {
  // Check if notification already exists
  const existing = document.querySelector('.cart-notification');
  if (existing) {
    existing.remove();
  }

  const notification = document.createElement('div');
  notification.className = 'cart-notification';
  notification.textContent = message;
  document.body.appendChild(notification);

  // Auto remove after 3 seconds
  setTimeout(() => {
    notification.remove();
  }, 3000);
}

function increaseQuantity() {
  const input = document.getElementById('quantityInput');
  let value = parseInt(input.value) || 1;
  if (value < 99) {
    input.value = value + 1;
  }
}

function decreaseQuantity() {
  const input = document.getElementById('quantityInput');
  let value = parseInt(input.value) || 1;
  if (value > 1) {
    input.value = value - 1;
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', displayProductDetail);
} else {
  displayProductDetail();
}
