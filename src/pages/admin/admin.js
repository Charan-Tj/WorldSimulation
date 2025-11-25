const API_URL = 'http://localhost:5000/api';

// Simple router
window.showSection = (id) => {
  document.querySelectorAll('.section').forEach(el => el.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
  event.target.classList.add('active');
};

document.addEventListener('DOMContentLoaded', async () => {
  loadDashboard();
  
  document.getElementById('add-product-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const product = {
      name: document.getElementById('p-name').value,
      price: document.getElementById('p-price').value,
      category: document.getElementById('p-category').value,
      image: document.getElementById('p-image').value,
    };
    
    await fetch(`${API_URL}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product)
    });
    
    alert('Product Added');
    e.target.reset();
    loadProducts(); // Refresh list
  });

  loadProducts();
});

async function loadDashboard() {
  // Load Analytics
  const res = await fetch(`${API_URL}/orders/analytics/daily`);
  const data = await res.json();
  
  const totalOrders = data.reduce((sum, d) => sum + d.count, 0);
  const totalRevenue = data.reduce((sum, d) => sum + d.totalRevenue, 0);
  
  document.getElementById('total-orders').textContent = totalOrders;
  document.getElementById('total-revenue').textContent = `₹${totalRevenue}`;

  // Chart
  const ctx = document.getElementById('revenueChart').getContext('2d');
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: data.map(d => d._id),
      datasets: [{
        label: 'Daily Revenue',
        data: data.map(d => d.totalRevenue),
        borderColor: '#fc8019',
        tension: 0.4
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { labels: { color: 'white' } }
      },
      scales: {
        y: { ticks: { color: '#aeb5c0' }, grid: { color: 'rgba(255,255,255,0.1)' } },
        x: { ticks: { color: '#aeb5c0' }, grid: { color: 'rgba(255,255,255,0.1)' } }
      }
    }
  });
}

async function loadProducts() {
  const res = await fetch(`${API_URL}/products`);
  const products = await res.json();
  
  const list = document.getElementById('product-list');
  list.innerHTML = products.map(p => `
    <div style="display: flex; justify-content: space-between; padding: 1rem; border-bottom: 1px solid rgba(255,255,255,0.1); align-items: center;">
      <div style="display: flex; align-items: center; gap: 1rem;">
        <img src="${p.image}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 8px;">
        <div>
          <div style="font-weight: bold;">${p.name}</div>
          <div style="color: var(--text-dim); font-size: 0.9rem;">₹${p.price} - ${p.category}</div>
        </div>
      </div>
      <button onclick="deleteProduct('${p._id}')" style="color: #ff4d4d; background: none; border: none; cursor: pointer;">Delete</button>
    </div>
  `).join('');

  window.deleteProduct = async (id) => {
    if(confirm('Delete this product?')) {
      await fetch(`${API_URL}/products/${id}`, { method: 'DELETE' });
      loadProducts();
    }
  };
}
