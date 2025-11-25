const API_URL = 'http://localhost:5000/api';
let cart = [];
let products = [];
let filteredProducts = [];

document.addEventListener('DOMContentLoaded', async () => {
  await fetchProducts();
  
  // Search Listener
  document.getElementById('search-input').addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    filteredProducts = products.filter(p => p.name.toLowerCase().includes(term));
    renderProducts(filteredProducts);
  });

  // Category Listener
  document.querySelectorAll('.category-item').forEach(item => {
    item.addEventListener('click', () => {
      document.querySelectorAll('.category-item').forEach(el => el.classList.remove('active'));
      item.classList.add('active');
      const cat = item.dataset.cat;
      
      if (cat === 'All') {
        filteredProducts = products;
      } else {
        filteredProducts = products.filter(p => p.category === cat);
      }
      renderProducts(filteredProducts);
    });
  });

  document.getElementById('checkout-btn').addEventListener('click', placeOrder);
});

async function fetchProducts() {
  try {
    const res = await fetch(`${API_URL}/products`);
    products = await res.json();
    
    // Enrich with mock data for UI (since DB only has basic fields)
    products = products.map(p => ({
      ...p,
      weight: getRandomWeight(p.category),
      time: Math.floor(Math.random() * 15) + 5 + ' MINS',
      discount: Math.floor(Math.random() * 20) + 5,
      originalPrice: Math.floor(p.price * 1.2)
    }));
    
    filteredProducts = products;
    renderProducts(products);
  } catch (err) {
    console.error('Error fetching products:', err);
  }
}

function getRandomWeight(category) {
  if (category === 'Groceries') return ['1 kg', '500 g', '1 L', '200 g'][Math.floor(Math.random() * 4)];
  if (category === 'Electronics') return '1 Unit';
  if (category === 'Medicine') return '1 Strip';
  if (category === 'Food') return '1 Serving';
  return '1 pc';
}

function renderProducts(list) {
  const grid = document.getElementById('product-grid');
  grid.innerHTML = list.map(product => `
    <div class="product-card">
      <div class="card-img-container">
        <img src="${product.image || 'https://via.placeholder.com/200'}" class="product-img" alt="${product.name}">
        <div class="discount-badge">${product.discount}% OFF</div>
        <div class="delivery-badge">⚡ ${product.time}</div>
      </div>
      <div class="card-content">
        <div class="time-estimate">Delivery in ${product.time}</div>
        <h4 class="product-name" title="${product.name}">${product.name}</h4>
        <div class="product-weight">${product.weight}</div>
        
        <div class="card-footer">
          <div class="price-block">
            <span class="original-price">₹${product.originalPrice}</span>
            <span class="current-price">₹${product.price}</span>
          </div>
          <button class="add-btn" onclick="addToCart('${product._id}')">ADD</button>
        </div>
      </div>
    </div>
  `).join('');
  
  window.addToCart = addToCart;
}

function addToCart(id) {
  const product = products.find(p => p._id === id);
  const existing = cart.find(item => item.product._id === id);
  
  if (existing) {
    existing.quantity++;
  } else {
    cart.push({ product, quantity: 1 });
  }
  renderCart();
}

function renderCart() {
  const container = document.getElementById('cart-items');
  const totalEl = document.getElementById('cart-total-amount');
  const itemTotalEl = document.getElementById('item-total');
  const countEl = document.getElementById('cart-count');
  
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  countEl.textContent = totalItems;

  if (cart.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; color: var(--text-secondary); margin-top: 2rem;">
        <div style="font-size: 3rem; margin-bottom: 1rem;">🛒</div>
        Your cart is empty
      </div>`;
    totalEl.textContent = '₹0.00';
    itemTotalEl.textContent = '₹0.00';
    return;
  }

  let total = 0;
  container.innerHTML = cart.map(item => {
    total += item.product.price * item.quantity;
    return `
      <div class="cart-item">
        <div>
          <div style="font-weight: 600; font-size: 0.9rem;">${item.product.name}</div>
          <small style="color: var(--text-secondary)">${item.product.weight} | ₹${item.product.price}</small>
        </div>
        <div style="display: flex; align-items: center; gap: 10px;">
          <div style="font-weight: 700; color: var(--primary);">x${item.quantity}</div>
          <div style="font-weight: 600;">₹${item.product.price * item.quantity}</div>
        </div>
      </div>
    `;
  }).join('');
  
  totalEl.textContent = `₹${total.toFixed(2)}`;
  itemTotalEl.textContent = `₹${total.toFixed(2)}`;
}

async function placeOrder() {
  const user = JSON.parse(localStorage.getItem('user'));
  if (!user) {
    alert('Please login to place an order');
    window.location.href = '/src/pages/login/login.html';
    return;
  }

  if (cart.length === 0) return;

  const orderData = {
    user: user.id,
    products: cart.map(item => ({ product: item.product._id, quantity: item.quantity })),
    totalAmount: cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0),
    deliveryLocation: { lat: 0, lng: 0, address: "123 Main St" }
  };

  try {
    const res = await fetch(`${API_URL}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData)
    });

    if (res.ok) {
      alert('Order Placed Successfully! Drone Dispatching...');
      cart = [];
      renderCart();
    }
  } catch (err) {
    console.error(err);
    alert('Failed to place order');
  }
}
