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

const DEMO_PRODUCTS = [
  { _id: 'd1', name: 'Organic Bananas', description: 'Fresh organic bananas, 6 pcs', price: 45, category: 'Groceries', image: 'https://images.unsplash.com/photo-1603833665858-e61d17a86224?w=300&h=300&fit=crop', stock: 120 },
  { _id: 'd2', name: 'Farm Fresh Eggs', description: 'Free-range eggs, pack of 12', price: 89, category: 'Groceries', image: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=300&h=300&fit=crop', stock: 80 },
  { _id: 'd3', name: 'Whole Wheat Bread', description: 'Multigrain whole wheat loaf', price: 55, category: 'Groceries', image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=300&h=300&fit=crop', stock: 60 },
  { _id: 'd4', name: 'Full Cream Milk', description: 'Pasteurized, 1 Litre pack', price: 68, category: 'Groceries', image: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=300&h=300&fit=crop', stock: 200 },
  { _id: 'd5', name: 'Basmati Rice', description: 'Aged premium basmati, 1 kg', price: 135, category: 'Groceries', image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=300&h=300&fit=crop', stock: 150 },
  { _id: 'd6', name: 'Extra Virgin Olive Oil', description: 'Cold pressed, 500 ml', price: 449, category: 'Groceries', image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=300&h=300&fit=crop', stock: 40 },
  { _id: 'd7', name: 'Wireless Earbuds', description: 'BT 5.3, ANC, 30hr battery', price: 1299, category: 'Electronics', image: 'https://images.unsplash.com/photo-1590658268037-6bf12f032f55?w=300&h=300&fit=crop', stock: 25 },
  { _id: 'd8', name: 'Power Bank 10000mAh', description: 'Fast charge, USB-C', price: 899, category: 'Electronics', image: 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=300&h=300&fit=crop', stock: 35 },
  { _id: 'd9', name: 'Paracetamol 500mg', description: 'Strip of 10 tablets', price: 25, category: 'Medicine', image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&h=300&fit=crop', stock: 500 },
  { _id: 'd10', name: 'Vitamin C Tablets', description: '1000mg, 30 effervescent tabs', price: 199, category: 'Medicine', image: 'https://images.unsplash.com/photo-1550572017-edd951aa8f72?w=300&h=300&fit=crop', stock: 90 },
  { _id: 'd11', name: 'Chicken Biryani', description: 'Hyderabadi dum biryani, 1 plate', price: 249, category: 'Food', image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=300&h=300&fit=crop', stock: 30 },
  { _id: 'd12', name: 'Margherita Pizza', description: 'Hand-tossed, 10 inch', price: 299, category: 'Food', image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=300&h=300&fit=crop', stock: 20 },
  { _id: 'd13', name: 'Fresh Avocados', description: 'Ripe Hass avocados, 2 pcs', price: 180, category: 'Groceries', image: 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=300&h=300&fit=crop', stock: 45 },
  { _id: 'd14', name: 'USB-C Fast Charger', description: '65W GaN, dual port', price: 1499, category: 'Electronics', image: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=300&h=300&fit=crop', stock: 50 },
  { _id: 'd15', name: 'Cold Brew Coffee', description: 'Ready to drink, 250ml', price: 149, category: 'Food', image: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=300&h=300&fit=crop', stock: 70 },
  { _id: 'd16', name: 'First Aid Kit', description: 'Essential home kit, 42 items', price: 349, category: 'Medicine', image: 'https://images.unsplash.com/photo-1603398938378-e54eab446dde?w=300&h=300&fit=crop', stock: 60 },
];

async function fetchProducts() {
  try {
    const res = await fetch(`${API_URL}/products`);
    if (!res.ok) throw new Error('API unavailable');
    products = await res.json();
    if (!products.length) throw new Error('No products from API');
  } catch (err) {
    console.warn('API unavailable, using demo products:', err.message);
    products = DEMO_PRODUCTS;
  }
    
  // Enrich with mock data for UI
  products = products.map(p => ({
    ...p,
    weight: p.weight || getRandomWeight(p.category),
    time: Math.floor(Math.random() * 15) + 5 + ' MINS',
    discount: Math.floor(Math.random() * 20) + 5,
    originalPrice: Math.floor(p.price * 1.2)
  }));
    
  filteredProducts = products;
  renderProducts(products);
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
