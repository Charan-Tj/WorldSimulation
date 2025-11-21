const API_URL = 'http://localhost:5000/api';
let cart = [];
let products = [];

document.addEventListener('DOMContentLoaded', async () => {
  await fetchProducts();
  renderProducts();
  
  document.getElementById('checkout-btn').addEventListener('click', placeOrder);
});

async function fetchProducts() {
  try {
    const res = await fetch(`${API_URL}/products`);
    products = await res.json();
  } catch (err) {
    console.error('Error fetching products:', err);
  }
}

function renderProducts() {
  const grid = document.getElementById('product-grid');
  grid.innerHTML = products.map(product => `
    <div class="product-card">
      <img src="${product.image || 'https://via.placeholder.com/200'}" class="product-img" alt="${product.name}">
      <div class="product-info">
        <h4>${product.name}</h4>
        <p style="color: var(--text-dim); font-size: 0.9rem;">₹${product.price}</p>
        <button class="add-btn" onclick="addToCart('${product._id}')">Add</button>
      </div>
    </div>
  `).join('');
  
  // Attach event listeners dynamically since onclick string doesn't work with modules easily in this setup without window binding
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
  
  if (cart.length === 0) {
    container.innerHTML = '<p style="color: var(--text-dim); text-align: center; margin-top: 2rem;">Cart is empty</p>';
    totalEl.textContent = '$0.00';
    return;
  }

  let total = 0;
  container.innerHTML = cart.map(item => {
    total += item.product.price * item.quantity;
    return `
      <div class="cart-item">
        <div>
          <h4>${item.product.name}</h4>
          <small style="color: var(--text-dim)">₹${item.product.price} x ${item.quantity}</small>
        </div>
        <div>₹${item.product.price * item.quantity}</div>
      </div>
    `;
  }).join('');
  
  totalEl.textContent = `₹${total.toFixed(2)}`;
}

async function placeOrder() {
  const user = JSON.parse(localStorage.getItem('user'));
  if (!user) {
    alert('Please login to place an order');
    window.location.href = '/login.html';
    return;
  }

  if (cart.length === 0) return;

  const orderData = {
    user: user.id,
    products: cart.map(item => ({ product: item.product._id, quantity: item.quantity })),
    totalAmount: cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0),
    deliveryLocation: { lat: 0, lng: 0, address: "123 Main St" } // Mock location for now
  };

  try {
    const res = await fetch(`${API_URL}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
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
