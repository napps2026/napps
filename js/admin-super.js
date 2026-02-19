const API_PATH = '/.netlify/functions/api';
let logs = [];
let token = '';

async function fetchLogs() {
  if (!token) return alert('Unlock with admin token first');
  try {
    const res = await fetch(`${API_PATH}?type=logs`, { headers: { 'Authorization': `Bearer ${token}` } });
    if (!res.ok) throw new Error('Failed to fetch logs');
    logs = await res.json();
    renderLogs(logs);
    populateActions(logs);
  } catch (e) { console.error(e); alert('Could not load logs'); }
}

function renderLogs(list) {
  const tbody = document.querySelector('#logTable tbody');
  tbody.innerHTML = list.map(l => `
    <tr>
      <td style="font-family:monospace">${new Date(l.timestamp).toLocaleString()}</td>
      <td>${escapeHtml(l.actor||'system')}</td>
      <td>${escapeHtml(l.action)}</td>
      <td><code style="color:#9fd6c0">${escapeHtml(l.targetid || l.targetId || '')}</code></td>
      <td style="font-size:0.9rem;color:#cfeee0">${formatDetails(l.details)}</td>
    </tr>
  `).join('');
}

function formatDetails(d) {
  if (!d) return '';
  try { return escapeHtml(typeof d === 'string' ? d : JSON.stringify(d)); } catch(e){ return escapeHtml(String(d)); }
}

function escapeHtml(s){ return String(s).replace(/[&<>\"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]||c)); }

function populateActions(list){
  const sel = document.getElementById('filterAction');
  const actions = Array.from(new Set(list.map(l=>l.action).filter(Boolean)));
  sel.innerHTML = '<option value="">All actions</option>' + actions.map(a=>`<option value="${a}">${a}</option>`).join('');
}

function applyFilters(){
  const q = (document.getElementById('q').value||'').toLowerCase();
  const action = document.getElementById('filterAction').value;
  const filtered = logs.filter(l=>{
    if (action && l.action !== action) return false;
    if (!q) return true;
    const hay = (l.actor+' '+(l.targetid||l.targetId||'')+' '+JSON.stringify(l.details||'')).toLowerCase();
    return hay.indexOf(q) !== -1;
  });
  renderLogs(filtered);
}

function exportCSV(){
  if (!logs.length) return alert('No logs to export');
  const csv = ['timestamp,actor,action,target,details', ...logs.map(l => {
    const t = new Date(l.timestamp).toISOString();
    const actor = `"${(l.actor||'').replace(/"/g,'""')}"`;
    const action = `"${(l.action||'').replace(/"/g,'""')}"`;
    const target = `"${((l.targetid||l.targetId||'')+'').replace(/"/g,'""')}"`;
    const details = `"${JSON.stringify(l.details||'').replace(/"/g,'""')}"`;
    return [t, actor, action, target, details].join(',');
  })];
  const blob = new Blob([csv.join('\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = `audit_logs_${Date.now()}.csv`; a.click();
}

// Wire UI
document.getElementById('unlock').addEventListener('click', ()=>{
  token = document.getElementById('token').value.trim();
  if (!token) return alert('Enter token');
  fetchLogs();
});

document.getElementById('refresh').addEventListener('click', fetchLogs);
document.getElementById('q').addEventListener('input', applyFilters);
document.getElementById('filterAction').addEventListener('change', applyFilters);
document.getElementById('export').addEventListener('click', exportCSV);

// initial
renderLogs([]);
