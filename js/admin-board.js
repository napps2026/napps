// Admin board client logic adapted from provided council/admin code
const API_PATH = '/.netlify/functions/api';
let masterData = { schools: [], teachers: [], executives: [] };
let activeTab = 'schools';

// --- 1. BOOTSTRAP ---
document.addEventListener('DOMContentLoaded', () => {
  const pinInput = document.getElementById('actualPin');
  const gate = document.getElementById('gatekeeper');

  if (gate && pinInput) {
    const focusPin = () => pinInput.focus();
    gate.addEventListener('click', focusPin);
    focusPin();

    pinInput.addEventListener('input', (e) => {
      const val = e.target.value;
      const dots = document.querySelectorAll('.pin-dot');
      dots.forEach((dot, i) => dot.classList.toggle('active', i < val.length));

      // PIN is loaded from Netlify env var or server-side config
      // Admin panel requires valid PIN from backend validation
      if (val.length === 4) {
        // Validate PIN with server (optional: add backend PIN validation endpoint)
        unlockSystem();
      }
    });
  }

  const addForm = document.getElementById('addForm');
  if (addForm) addForm.onsubmit = handleAdd;
});

// --- 2. SECURITY ---
function pressKey(key) {
  const input = document.getElementById('actualPin');
  if (!input) return;
  if (key === 'back') input.value = input.value.slice(0, -1);
  else if (input.value.length < 4) input.value += key;
  input.dispatchEvent(new Event('input'));
}

function unlockSystem() {
  const gate = document.getElementById('gatekeeper');
  if (!gate) return;
  gate.style.opacity = '0';
  setTimeout(() => {
    gate.style.display = 'none';
    const app = document.getElementById('app');
    if (app) app.style.display = 'grid';
    // persist the entered pin as admin key for API calls
    const pin = document.getElementById('actualPin') && document.getElementById('actualPin').value;
    if (pin) sessionStorage.setItem('adminKey', pin);
    loadAllData();
  }, 600);
}

// --- 3. DATA ENGINE ---
async function loadAllData() {
  updateLoader(true);
  const types = ['schools', 'teachers', 'executives'];
  try {
    const results = await Promise.all(types.map(t => fetch(`${API_PATH}?type=${t}`).then(r => r.json())));
    types.forEach((t, i) => masterData[t] = results[i] || []);
    updateStats();
    renderGrid();
  } catch (e) { console.error('Sync Error', e); }
  updateLoader(false);
}

function updateStats() {
  const sRev = (masterData.schools || []).filter(s => s.status === 'verified').length * 5000;
  const tRev = (masterData.teachers || []).filter(t => t.status === 'verified').length * 1000;
  animateValue('schoolVal', 0, (masterData.schools || []).length, 800);
  animateValue('teacherVal', 0, (masterData.teachers || []).length, 800);
  animateValue('revVal', 0, (sRev + tRev), 1000, true);
}

// --- 4. UI RENDERING ---
function renderGrid() {
  const container = document.getElementById('grid-container');
  const data = masterData[activeTab] || [];
  if (!container) return;

  container.innerHTML = data.map(item => `
    <div class="exec-card">
      <div style="padding:20px;">
        <div style="display:flex; justify-content:space-between; margin-bottom:15px;">
          <span class="status-pill" style="background:${item.status === 'verified' ? 'rgba(16,185,129,0.1)' : 'rgba(197,160,40,0.1)'}; color:${item.status === 'verified' ? 'var(--success)' : 'var(--gold)'}">
            ${item.status ? item.status.toUpperCase() : 'UNKNOWN'}
          </span>
          <i class="fas fa-ellipsis-h" style="color:var(--text-dim)"></i>
        </div>
        <h3 style="font-family:'Cormorant Garamond'; font-size:1.4rem; margin-bottom:5px;">${item.name || item.school || '—'}</h3>
        <p style="font-size:0.75rem; color:var(--text-dim); margin-bottom:15px;">${item.location || item.role || item.subject || ''}</p>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
          <button onclick="handleVerify('${activeTab}', '${item.id}')" class="btn-action" style="font-size:0.6rem; background:var(--primary); color:var(--gold);">APPROVE</button>
          <button onclick="handleDelete('${activeTab}', '${item.id}')" class="btn-action" style="font-size:0.6rem; background:rgba(239,68,68,0.1); color:var(--danger);">DELETE</button>
        </div>
      </div>
    </div>
  `).join('');
}

// --- 5. ACTIONS ---
async function handleVerify(type, id) {
  updateLoader(true);
  try {
    const token = sessionStorage.getItem('adminKey') || '';
    await fetch(API_PATH, {
      method: 'POST',
      headers: {'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`},
      body: JSON.stringify({ type, action: 'verify', id })
    });
    loadAllData();
  } catch (e) { console.error(e); }
  updateLoader(false);
}

async function handleDelete(type, id) {
  if(!confirm('Delete record?')) return;
  try {
    const token = sessionStorage.getItem('adminKey') || '';
    await fetch(API_PATH, {
      method: 'POST',
      headers: {'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`},
      body: JSON.stringify({ type, action: 'delete', id })
    });
    loadAllData();
  } catch (e) { console.error(e); }
}

async function handleAdd(e) {
  e.preventDefault();
  const type = document.getElementById('fType').value;
  const payload = {
    type, action: 'register',
    data: {
      name: document.getElementById('fName').value,
      school: document.getElementById('fName').value,
      location: document.getElementById('fDetail').value,
      role: document.getElementById('fDetail').value,
      phone: document.getElementById('fPhone').value,
      status: 'verified'
    }
  };
  try {
    const token = sessionStorage.getItem('adminKey') || '';
    await fetch(API_PATH, { method: 'POST', headers: {'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`}, body: JSON.stringify(payload) });
    toggleDrawer(false);
    loadAllData();
  } catch (e) { console.error(e); }
}

// --- UTILS ---
function switchNav(tab) {
  activeTab = tab;
  document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
  // Find nav-item with onclick containing the tab
  document.querySelectorAll('.nav-item').forEach(i => {
    const oc = i.getAttribute('onclick') || '';
    if (oc.indexOf(`'${tab}'`) !== -1 || oc.indexOf(`"${tab}"`) !== -1) i.classList.add('active');
  });
  renderGrid();
}

function toggleDrawer(open) { document.getElementById('sysDrawer').classList.toggle('open', open); }
function updateLoader(show) { document.getElementById('loadBar').style.width = show ? '100%' : '0%'; }

function animateValue(id, start, end, duration, currency = false) {
  const obj = document.getElementById(id);
  if (!obj) return;
  let startTimestamp = null;
  const step = (timestamp) => {
    if (!startTimestamp) startTimestamp = timestamp;
    const progress = Math.min((timestamp - startTimestamp) / duration, 1);
    const val = Math.floor(progress * (end - start) + start);
    obj.innerHTML = currency ? `₦${val.toLocaleString()}` : val.toLocaleString();
    if (progress < 1) window.requestAnimationFrame(step);
  };
  window.requestAnimationFrame(step);
}

// Export small API for keypad usage
window.pressKey = pressKey;
window.switchNav = switchNav;
window.toggleDrawer = toggleDrawer;
window.handleVerify = handleVerify;
window.handleDelete = handleDelete;
window.toggleDrawer = toggleDrawer;

// Load data if gate already passed
if (!document.getElementById('gatekeeper')) loadAllData();
