const API_BASE = window.ENV.PRODUCTOS_API;

// ── DOM refs ──────────────────────────────────────────────────────────────────
const runBtn        = document.getElementById('run-check-btn');
const loader        = document.getElementById('loader');
const runSpinner    = document.getElementById('run-spinner');
const errorSection  = document.getElementById('error-section');
const errorMsg      = document.getElementById('error-msg');
const emptyState    = document.getElementById('empty-state');
const emptyStateSub = document.getElementById('empty-state-sub');
const resultsEl     = document.getElementById('results');
const themeToggle    = document.getElementById('theme-toggle');

// ── Theme ─────────────────────────────────────────────────────────────────────
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
}
themeToggle.addEventListener('click', () => {
  const cur = document.documentElement.getAttribute('data-theme');
  applyTheme(cur === 'dark' ? 'light' : 'dark');
});
applyTheme(localStorage.getItem('theme') || 'dark');

// ── Helpers ───────────────────────────────────────────────────────────────────
function escHtml(str) {
  return String(str ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function fmtPrice(val) {
  if (val === null || val === undefined) return '—';
  return Number(val).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function setLoading(on) {
  runBtn.disabled = on;
  loader.style.display = on ? 'inline-flex' : 'none';
  runBtn.querySelector('.btn-text').textContent = on ? 'Verificando…' : 'Verificar precios';
  runSpinner.style.display = on ? '' : 'none';
}

function hideError() { errorSection.style.display = 'none'; }
function showError(msg) { errorMsg.textContent = msg; errorSection.style.display = ''; }

function hideEmptyState() { emptyState.style.display = 'none'; }
function showEmptyState(msg) { emptyStateSub.textContent = msg; emptyState.style.display = ''; }

// ── Estado de un batch (marca/proveedor) ────────────────────────────────────
function batchStatusBadge(batch) {
  if (batch.needsMassUpdate) {
    return `<span class="stock-badge stock-no">Requiere actualización (${batch.changedCount}/${batch.threshold})</span>`;
  }
  if (batch.changedCount > 0) {
    return `<span class="stock-badge stock-proveedor">${batch.changedCount} cambio${batch.changedCount !== 1 ? 's' : ''}</span>`;
  }
  return `<span class="stock-badge stock-yes">Sin cambios</span>`;
}

// Celda de precio "viejo → nuevo": si cambió, resalta en verde (subió) o rojo (bajó).
function priceCell(oldVal, newVal) {
  if (oldVal === null || oldVal === undefined || newVal === null || newVal === undefined) {
    return '<span class="td-muted">—</span>';
  }
  const changed = Number(oldVal) !== Number(newVal);
  if (!changed) {
    return `<span class="price-symbol">$</span>${fmtPrice(newVal)}`;
  }
  const up = Number(newVal) > Number(oldVal);
  const color = up ? 'var(--green)' : 'var(--red)';
  return `
    <span class="td-muted" style="text-decoration:line-through">$${fmtPrice(oldVal)}</span>
    →
    <span style="color:${color};font-weight:600">$${fmtPrice(newVal)}</span>
  `;
}

// ── Fetch: ejecutar verificación ─────────────────────────────────────────────
async function runCheck() {
  setLoading(true);
  hideError();
  hideEmptyState();
  resultsEl.innerHTML = '';

  try {
    const res = await fetch(`${API_BASE}/api/v1/price-checks/run`, {
      method: 'POST',
      headers: { 'Accept': 'application/json' }
    });
    if (!res.ok) throw new Error(`Error del servidor: HTTP ${res.status}`);
    const data = await res.json();
    renderBatches(Array.isArray(data.batches) ? data.batches : []);
  } catch (e) {
    showError(e.message || 'No se pudo conectar con el servidor.');
  } finally {
    setLoading(false);
  }
}

// ── Render de resultados ──────────────────────────────────────────────────────
function renderBatches(batches) {
  resultsEl.innerHTML = '';

  if (batches.length === 0) {
    showEmptyState('La verificación no devolvió resultados.');
    return;
  }

  batches.forEach(batch => {
    resultsEl.appendChild(buildBatchCard(batch));
  });
}

function buildBatchCard(batch) {
  const items = Array.isArray(batch.items) ? batch.items : [];

  const card = document.createElement('div');
  card.className = 'card';

  const header = document.createElement('div');
  header.className = 'card-header';
  header.style.cursor = 'pointer';
  header.innerHTML = `
    <div class="card-title">
      <svg class="row-chevron" width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M3 1.5L7 5L3 8.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
      ${escHtml(batch.productBrandName ?? '—')}
    </div>
    <div class="card-meta">
      <span class="td-muted">${escHtml(batch.supplierName ?? '—')}</span>
      <span class="td-muted">· muestra: ${escHtml(String(batch.sampleSize ?? items.length))}</span>
      ${batchStatusBadge(batch)}
    </div>
  `;

  const body = document.createElement('div');
  body.className = 'table-wrapper';
  body.style.display = 'none';
  body.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Código</th>
          <th class="th-center">Estado</th>
          <th class="th-num">Precio Lista</th>
          <th class="th-num">Costo Neto</th>
          <th class="th-num">Costo c/IVA</th>
          <th class="th-num">Precio Sugerido</th>
        </tr>
      </thead>
      <tbody>
        ${items.map(item => `
          <tr${item.changed ? ' style="background:var(--surface2)"' : ''}>
            <td><span class="td-code">${escHtml(item.supplierProductCode ?? '—')}</span></td>
            <td class="th-center">${item.scrapeStatus === 'OK'
              ? '<span class="stock-badge stock-yes">OK</span>'
              : `<span class="stock-badge stock-no">${escHtml(item.scrapeStatus ?? 'ERROR')}</span>`}</td>
            <td class="th-num">${priceCell(item.priceListOld, item.priceListNew)}</td>
            <td class="th-num">${priceCell(item.netCostOld, item.netCostNew)}</td>
            <td class="th-num">${priceCell(item.costWithIvaOld, item.costWithIvaNew)}</td>
            <td class="th-num">${priceCell(item.suggestedPriceOld, item.suggestedPriceNew)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;

  header.addEventListener('click', () => {
    const expanded = body.style.display !== 'none';
    body.style.display = expanded ? 'none' : '';
    const chevron = header.querySelector('.row-chevron');
    chevron.style.transform = expanded ? '' : 'rotate(90deg)';
    chevron.style.color = expanded ? '' : 'var(--brand)';
  });

  card.appendChild(header);
  card.appendChild(body);
  return card;
}

// ── Eventos ───────────────────────────────────────────────────────────────────
runBtn.addEventListener('click', runCheck);
