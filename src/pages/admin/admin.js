const API_URL = 'http://localhost:5000/api';

// ─── Routing ────────────────────────────────────────────────────────────────

window.showSection = (id) => {
  document.querySelectorAll('.section').forEach(el => el.classList.remove('active'));
  document.getElementById(id)?.classList.add('active');
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
  document.getElementById(`nav-${id}`)?.classList.add('active');

  // Lazy-load section data on first visit
  if (id === 'orders')   loadOrders();
  if (id === 'products') loadProducts();
  if (id === 'fleet')    renderFleet();
};

// ─── Toast ───────────────────────────────────────────────────────────────────

function toast(msg, ok = true) {
  const el = document.getElementById('toast');
  el.textContent = (ok ? '✅ ' : '❌ ') + msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 3000);
}

// ─── Init ────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  loadDashboard();

  document.getElementById('add-product-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const product = {
      name:        document.getElementById('p-name').value,
      price:       parseFloat(document.getElementById('p-price').value),
      category:    document.getElementById('p-category').value,
      image:       document.getElementById('p-image').value,
      description: document.getElementById('p-desc').value,
      stock:       parseInt(document.getElementById('p-stock').value) || 100,
    };

    try {
      const res = await fetch(`${API_URL}/products`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(product),
      });
      if (!res.ok) throw new Error(await res.text());
      toast('Product added successfully');
      e.target.reset();
      loadProducts();
    } catch (err) {
      toast(err.message, false);
    }
  });
});

// ─── Dashboard ───────────────────────────────────────────────────────────────

async function loadDashboard() {
  try {
    const [analyticsRes, ordersRes] = await Promise.all([
      fetch(`${API_URL}/orders/analytics/daily`),
      fetch(`${API_URL}/orders`),
    ]);
    const analytics = await analyticsRes.json();
    const orders    = await ordersRes.json();

    const totalOrders   = orders.length;
    const totalRevenue  = orders.reduce((s, o) => s + (o.totalAmount || 0), 0);
    const delivered     = orders.filter(o => o.status === 'delivered').length;

    document.getElementById('stat-orders').textContent   = totalOrders;
    document.getElementById('stat-revenue').textContent  = `₹${totalRevenue.toLocaleString()}`;
    document.getElementById('stat-delivered').textContent = delivered;

    document.getElementById('recent-ts').textContent =
      'Updated ' + new Date().toLocaleTimeString();

    drawRevenueChart(analytics);
    drawStatusChart(orders);
    renderRecentOrders(orders.slice(0, 8));
  } catch (_) {
    // API not running — show empty state
    ['stat-orders','stat-revenue','stat-delivered'].forEach(id => {
      document.getElementById(id).textContent = '—';
    });
  }
}

// ─── Charts ──────────────────────────────────────────────────────────────────

let revenueChart, statusChart;

function drawRevenueChart(data) {
  const ctx = document.getElementById('revenueChart').getContext('2d');
  if (revenueChart) revenueChart.destroy();

  revenueChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels:   data.map(d => d._id),
      datasets: [{
        label:           'Revenue (₹)',
        data:            data.map(d => d.totalRevenue),
        borderColor:     '#fc8019',
        backgroundColor: 'rgba(252,128,25,0.08)',
        fill:            true,
        tension:         0.45,
        pointRadius:     4,
        pointBackgroundColor: '#fc8019',
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { labels: { color: '#aeb5c0' } } },
      scales: {
        y: { ticks: { color: '#aeb5c0' }, grid: { color: 'rgba(255,255,255,0.06)' } },
        x: { ticks: { color: '#aeb5c0' }, grid: { display: false } },
      },
    },
  });
}

function drawStatusChart(orders) {
  const ctx = document.getElementById('statusChart').getContext('2d');
  if (statusChart) statusChart.destroy();

  const counts = { pending:0, processing:0, delivering:0, delivered:0, cancelled:0 };
  orders.forEach(o => { if (counts[o.status] !== undefined) counts[o.status]++; });

  statusChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels:   Object.keys(counts).map(k => k[0].toUpperCase() + k.slice(1)),
      datasets: [{
        data:            Object.values(counts),
        backgroundColor: ['#ffc800','#00c8ff','#fc8019','#44cc88','#ff4d4d'],
        borderWidth:     0,
        hoverOffset:     8,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '65%',
      plugins: { legend: { position: 'bottom', labels: { color: '#aeb5c0', padding: 16 } } },
    },
  });
}

// ─── Recent Orders Mini Table ─────────────────────────────────────────────────

function renderRecentOrders(orders) {
  const tbody = document.getElementById('recent-orders-body');
  if (!orders.length) {
    tbody.innerHTML = `<tr><td colspan="5"><div class="empty-state"><div class="empty-icon">📭</div>No orders yet</div></td></tr>`;
    return;
  }
  tbody.innerHTML = orders.map(o => `
    <tr>
      <td style="font-family:monospace;font-size:0.8rem;color:var(--text-dim)">${o._id.slice(-8).toUpperCase()}</td>
      <td><span class="badge badge-${o.status}">${o.status}</span></td>
      <td style="font-weight:700;color:var(--primary)">₹${(o.totalAmount||0).toLocaleString()}</td>
      <td style="font-size:0.85rem">${o.droneId ? '🚁 ' + o.droneId : '—'}</td>
      <td style="color:var(--text-dim);font-size:0.85rem">${new Date(o.createdAt).toLocaleDateString()}</td>
    </tr>
  `).join('');
}

// ─── All Orders ───────────────────────────────────────────────────────────────

const STATUS_ORDER = ['pending','processing','delivering','delivered','cancelled'];

window.loadOrders = async function() {
  const tbody = document.getElementById('orders-body');
  tbody.innerHTML = `<tr><td colspan="8" class="loader">Loading…</td></tr>`;
  try {
    const res    = await fetch(`${API_URL}/orders`);
    const orders = await res.json();

    if (!orders.length) {
      tbody.innerHTML = `<tr><td colspan="8"><div class="empty-state"><div class="empty-icon">📭</div>No orders yet</div></td></tr>`;
      return;
    }

    tbody.innerHTML = orders.map(o => {
      const productList = (o.products || [])
        .map(p => `${p.product?.name || 'Item'} ×${p.quantity}`)
        .join(', ') || '—';
      const customer = o.user?.username || o.user?.email || o.user?._id?.slice(-6) || 'Guest';
      const nextStatus = STATUS_ORDER[STATUS_ORDER.indexOf(o.status) + 1];

      return `
        <tr>
          <td style="font-family:monospace;font-size:0.78rem;color:var(--text-dim)">${o._id.slice(-8).toUpperCase()}</td>
          <td>${customer}</td>
          <td style="font-size:0.82rem;color:var(--text-dim);max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${productList}">${productList}</td>
          <td style="font-weight:700;color:var(--primary)">₹${(o.totalAmount||0).toLocaleString()}</td>
          <td><span class="badge badge-${o.status}">${o.status}</span></td>
          <td style="font-size:0.85rem">${o.droneId ? '🚁 D-' + o.droneId.slice(-4) : '—'}</td>
          <td style="color:var(--text-dim);font-size:0.82rem">${new Date(o.createdAt).toLocaleDateString()}</td>
          <td>
            ${nextStatus && o.status !== 'cancelled' ? `
              <button class="admin-btn" style="width:auto;padding:0.3rem 0.7rem;font-size:0.78rem"
                onclick="advanceOrder('${o._id}','${nextStatus}')">
                → ${nextStatus}
              </button>` : '—'}
          </td>
        </tr>`;
    }).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="8"><div class="empty-state"><div class="empty-icon">⚠️</div>API unavailable — start the backend server</div></td></tr>`;
  }
};

window.advanceOrder = async function(id, newStatus) {
  try {
    const res = await fetch(`${API_URL}/orders/${id}/status`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ status: newStatus }),
    });
    if (!res.ok) throw new Error();
    toast(`Order updated to '${newStatus}'`);
    loadOrders();
  } catch {
    toast('Failed to update order status', false);
  }
};

// ─── Products ─────────────────────────────────────────────────────────────────

window.loadProducts = async function() {
  const list = document.getElementById('product-list');
  list.innerHTML = `<div class="loader">Loading…</div>`;
  try {
    const res      = await fetch(`${API_URL}/products`);
    const products = await res.json();

    document.getElementById('product-count').textContent = `${products.length} items`;

    if (!products.length) {
      list.innerHTML = `<div class="empty-state"><div class="empty-icon">🛒</div>No products yet. Add one!</div>`;
      return;
    }

    list.innerHTML = products.map(p => `
      <div class="product-row">
        <img class="product-thumb" src="${p.image || ''}" alt="${p.name}"
          onerror="this.style.display='none'">
        <div class="product-info">
          <div class="product-name">${p.name}</div>
          <div class="product-cat">${p.category} · Stock: ${p.stock ?? '—'}</div>
        </div>
        <span class="product-price">₹${p.price}</span>
        <button class="btn-del" onclick="deleteProduct('${p._id}')">Delete</button>
      </div>
    `).join('');
  } catch {
    list.innerHTML = `<div class="empty-state"><div class="empty-icon">⚠️</div>API unavailable</div>`;
  }
};

window.deleteProduct = async function(id) {
  if (!confirm('Delete this product?')) return;
  try {
    const res = await fetch(`${API_URL}/products/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error();
    toast('Product deleted');
    loadProducts();
  } catch {
    toast('Delete failed', false);
  }
};

// ─── Fleet Status ─────────────────────────────────────────────────────────────

const DRONE_NAMES = ['Alpha','Bravo','Charlie','Delta','Echo'];

const PHASE_LABEL = {
  idle:                 { text: 'Idle',         cls: 'status-idle'   },
  ascending_to_pickup:  { text: 'Ascending',    cls: 'status-flying' },
  flying_to_pickup:     { text: 'To Pickup',    cls: 'status-pickup' },
  descending_to_pickup: { text: 'Descending',   cls: 'status-pickup' },
  picking_up:           { text: 'Picking Up',   cls: 'status-pickup' },
  ascending:            { text: 'Ascending',    cls: 'status-flying' },
  flying_to_zone:       { text: 'Delivering',   cls: 'status-flying' },
  descending:           { text: 'Final Descent',cls: 'status-flying' },
  dropping:             { text: 'Dropping',     cls: 'status-drop'   },
  returning:            { text: 'Returning',    cls: 'status-return' },
};

function renderFleet() {
  const grid = document.getElementById('fleet-grid');
  grid.innerHTML = DRONE_NAMES.map((name, i) => `
    <div class="drone-card idle" id="fleet-drone-${i}">
      <div class="drone-icon">🚁</div>
      <div class="drone-id">Drone ${name}</div>
      <span class="drone-status status-idle" id="fleet-status-${i}">Idle</span>
      <div class="drone-phase" id="fleet-phase-${i}">Standby</div>
    </div>
  `).join('');

  // Poll the simulation if it's open in another tab via window messaging
  // As a fallback show static "Standby" when not connected
  setInterval(() => updateFleetFromSim(), 500);
}

function updateFleetFromSim() {
  const drones = window.opener?.dockedDrones || window.dockedDrones || null;
  const states = window.opener?.missionStates || window.missionStates || null;

  if (!drones || !states) return;

  drones.forEach((drone, i) => {
    const state = states.get(drone);
    if (!state) return;
    const info  = PHASE_LABEL[state.phase] || { text: state.phase, cls: 'status-idle' };
    const card  = document.getElementById(`fleet-drone-${i}`);
    const badge = document.getElementById(`fleet-status-${i}`);
    const phase = document.getElementById(`fleet-phase-${i}`);
    if (!card) return;

    badge.textContent = info.text;
    badge.className   = `drone-status ${info.cls}`;
    card.className    = `drone-card ${state.phase === 'idle' ? 'idle' : 'active-mission'}`;

    if (drone.mesh) {
      const p = drone.mesh.position;
      phase.textContent = `(${p.x.toFixed(0)}, ${p.y.toFixed(0)}, ${p.z.toFixed(0)})`;
    }
  });
}

// ─── Mission Log helper (called from simulation via window.logMission) ─────────

window.logMission = function(msg) {
  const log = document.getElementById('mission-log');
  if (!log) return;
  const line = document.createElement('div');
  const time = new Date().toLocaleTimeString();
  line.innerHTML = `<span style="color:#555">[${time}]</span> ${msg}`;
  log.appendChild(line);
  log.scrollTop = log.scrollHeight;
};

window.clearLog = function() {
  document.getElementById('mission-log').innerHTML =
    '<div style="color:#44cc88">● Log cleared.</div>';
};
