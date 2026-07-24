const API_BASE = window.ENV.PRODUCTOS_API;

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 25;

const refreshBtn    = document.getElementById('refresh-history-btn');
const loader        = document.getElementById('loader');
const runSpinner    = document.getElementById('run-spinner');
const errorSection  = document.getElementById('error-section');
const errorMsg      = document.getElementById('error-msg');
const emptyState    = document.getElementById('empty-state');
const emptyStateSub = document.getElementById('empty-state-sub');
const resultsEl     = document.getElementById('results');
const themeToggle   = document.getElementById('theme-toggle');
const historyFooter = document.getElementById('history-footer');
const historyInfo   = document.getElementById('history-page-info');
const prevBtn       = document.getElementById('prev-page-btn');
const nextBtn       = document.getElementById('next-page-btn');

let currentPage = DEFAULT_PAGE;
let pageSize = DEFAULT_LIMIT;
let totalPages = null;
let totalItems = null;
let lastBatchCount = 0;
let loading = false;

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
}

if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    const cur = document.documentElement.getAttribute('data-theme');
    applyTheme(cur === 'dark' ? 'light' : 'dark');
  });
}

applyTheme(localStorage.getItem('theme') || 'dark');

function escHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function fmtPrice(val) {
  if (val === null || val === undefined) return '—';
  return Number(val).toLocaleString('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function toPositiveInt(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return null;
  if (num <= 0) return null;
  return Math.trunc(num);
}

function getByPath(obj, path) {
  let cursor = obj;
  for (let i = 0; i < path.length; i += 1) {
    if (!cursor || typeof cursor !== 'object') return undefined;
    cursor = cursor[path[i]];
  }
  return cursor;
}

function pickFirst(obj, paths) {
  for (let i = 0; i < paths.length; i += 1) {
    const val = getByPath(obj, paths[i]);
    if (val !== undefined && val !== null) return val;
  }
  return undefined;
}

function extractBatches(payload) {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== 'object') return [];
  if (Array.isArray(payload.batches)) return payload.batches;
  if (Array.isArray(payload.items)) return payload.items;

  const data = payload.data;
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object') {
    if (Array.isArray(data.batches)) return data.batches;
    if (Array.isArray(data.items)) return data.items;
  }

  return [];
}

function extractPagination(payload, fallbackCount) {
  const page = toPositiveInt(pickFirst(payload, [
    ['page'],
    ['currentPage'],
    ['pagination', 'page'],
    ['meta', 'page'],
    ['data', 'page'],
    ['data', 'currentPage'],
    ['data', 'pagination', 'page'],
    ['data', 'meta', 'page'],
  ])) || currentPage;

  const limit = toPositiveInt(pickFirst(payload, [
    ['limit'],
    ['pageSize'],
    ['pagination', 'limit'],
    ['pagination', 'pageSize'],
    ['meta', 'limit'],
    ['meta', 'pageSize'],
    ['data', 'limit'],
    ['data', 'pageSize'],
    ['data', 'pagination', 'limit'],
    ['data', 'pagination', 'pageSize'],
  ])) || pageSize;

  const total = toPositiveInt(pickFirst(payload, [
    ['total'],
    ['totalItems'],
    ['pagination', 'total'],
    ['pagination', 'totalItems'],
    ['meta', 'total'],
    ['meta', 'totalItems'],
    ['data', 'total'],
    ['data', 'totalItems'],
    ['data', 'pagination', 'total'],
    ['data', 'pagination', 'totalItems'],
  ]));

  let pages = toPositiveInt(pickFirst(payload, [
    ['totalPages'],
    ['pages'],
    ['pagination', 'totalPages'],
    ['pagination', 'pages'],
    ['meta', 'totalPages'],
    ['meta', 'pages'],
    ['data', 'totalPages'],
    ['data', 'pages'],
    ['data', 'pagination', 'totalPages'],
    ['data', 'pagination', 'pages'],
  ]));

  if (!pages && total && limit) {
    pages = Math.max(1, Math.ceil(total / limit));
  }

  return {
    page,
    limit,
    total: total || null,
    totalPages: pages || null,
    batchCount: fallbackCount,
  };
}

function hideError() {
  errorSection.style.display = 'none';
}

function showError(msg) {
  errorMsg.textContent = msg;
  errorSection.style.display = '';
}

function hideEmptyState() {
  emptyState.style.display = 'none';
}

function showEmptyState(msg) {
  emptyStateSub.textContent = msg;
  emptyState.style.display = '';
}

function setLoading(on) {
  loading = on;
  refreshBtn.disabled = on;
  prevBtn.disabled = on || prevBtn.disabled;
  nextBtn.disabled = on || nextBtn.disabled;
  loader.style.display = on ? 'inline-flex' : 'none';
  refreshBtn.querySelector('.btn-text').textContent = on ? 'Actualizando…' : 'Actualizar historial';
  runSpinner.style.display = on ? '' : 'none';
}

function batchStatusBadge(batch) {
  if (batch.needsMassUpdate) {
    return `<span class="stock-badge stock-no">Requiere actualización (${batch.changedCount}/${batch.threshold})</span>`;
  }
  if (batch.changedCount > 0) {
    return `<span class="stock-badge stock-proveedor">${batch.changedCount} cambio${batch.changedCount !== 1 ? 's' : ''}</span>`;
  }
  return '<span class="stock-badge stock-yes">Sin cambios</span>';
}

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
        ${items.map((item) => `
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

function renderBatches(batches) {
  resultsEl.innerHTML = '';

  if (batches.length === 0) {
    historyFooter.style.display = 'none';
    showEmptyState('No hay resultados para la página seleccionada.');
    return;
  }

  batches.forEach((batch) => {
    resultsEl.appendChild(buildBatchCard(batch));
  });
}

function canGoPrev() {
  return currentPage > 1;
}

function canGoNext() {
  if (totalPages) return currentPage < totalPages;
  return lastBatchCount >= pageSize && lastBatchCount > 0;
}

function updatePaginationUI() {
  let info = `Página ${currentPage}`;
  if (totalPages) info += ` de ${totalPages}`;
  if (totalItems) info += ` · ${totalItems} registro${totalItems !== 1 ? 's' : ''}`;

  historyInfo.innerHTML = `<strong>${escHtml(info)}</strong>`;
  historyFooter.style.display = lastBatchCount > 0 ? '' : 'none';

  prevBtn.disabled = loading || !canGoPrev();
  nextBtn.disabled = loading || !canGoNext();
}

async function fetchHistory(pageToLoad) {
  setLoading(true);
  hideError();
  hideEmptyState();
  resultsEl.innerHTML = '';

  try {
    const params = new URLSearchParams();
    params.set('page', String(pageToLoad));
    params.set('limit', String(pageSize));

    const res = await fetch(`${API_BASE}/api/v1/price-checks/?${params.toString()}`, {
      headers: { Accept: 'application/json' },
    });

    if (!res.ok) throw new Error(`Error del servidor: HTTP ${res.status}`);

    const payload = await res.json();
    const batches = extractBatches(payload);
    const pagination = extractPagination(payload, batches.length);

    currentPage = pagination.page;
    pageSize = pagination.limit;
    totalPages = pagination.totalPages;
    totalItems = pagination.total;
    lastBatchCount = pagination.batchCount;

    renderBatches(batches);
    updatePaginationUI();
  } catch (e) {
    historyFooter.style.display = 'none';
    showError(e.message || 'No se pudo conectar con el servidor.');
  } finally {
    setLoading(false);
    updatePaginationUI();
  }
}

refreshBtn.addEventListener('click', () => {
  fetchHistory(currentPage);
});

prevBtn.addEventListener('click', () => {
  if (!canGoPrev()) return;
  fetchHistory(currentPage - 1);
});

nextBtn.addEventListener('click', () => {
  if (!canGoNext()) return;
  fetchHistory(currentPage + 1);
});

fetchHistory(DEFAULT_PAGE);
