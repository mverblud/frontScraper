const API_BASE = window.ENV.SADAR_BASE;

// ── DOM refs ──────────────────────────────────────────────────────────────────
const buscarInput        = document.getElementById('buscar-codigo');
const btnBuscar          = document.getElementById('btn-buscar');
const btnVerTodo         = document.getElementById('btn-ver-todo');
const loader             = document.getElementById('loader');
const resultsSection     = document.getElementById('results-section');
const errorSection       = document.getElementById('error-section');
const errorMsg           = document.getElementById('error-msg');
const resultsTable       = document.getElementById('results-table');
const resultsBody        = document.getElementById('results-body');
const resultsCount       = document.getElementById('results-count');
const resultsQuery       = document.getElementById('results-query');
const noResults          = document.getElementById('no-results');
const noResultsSub       = document.getElementById('no-results-sub');
const tableFooter        = document.getElementById('table-footer');
const pageSizeSelect     = document.getElementById('page-size');
const paginationInfo     = document.getElementById('pagination-info');
const paginationControls = document.getElementById('pagination-controls');

// Detalle modal
const detalleOverlay       = document.getElementById('detalle-modal-overlay');
const detalleModal         = document.getElementById('detalle-modal');
const detalleClose         = document.getElementById('detalle-modal-close');
const detalleCode          = document.getElementById('detalle-modal-code');
const detalleVariantsCount = document.getElementById('detalle-modal-variants-count');
const detalleBody          = document.getElementById('detalle-modal-body');

// Theme
const themeToggle = document.getElementById('theme-toggle');

// ── Estado ────────────────────────────────────────────────────────────────────
let allItems  = [];
let currentPage = 1;
let pageSize    = parseInt(pageSizeSelect.value);

// ── Theme ─────────────────────────────────────────────────────────────────────
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
}
themeToggle.addEventListener('click', () => {
  const cur = document.documentElement.getAttribute('data-theme');
  applyTheme(cur === 'dark' ? 'light' : 'dark');
});
applyTheme(localStorage.getItem('theme') || 'light');

// ── Helpers ───────────────────────────────────────────────────────────────────
function escHtml(str) {
  return String(str ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function setLoading(on) {
  btnBuscar.disabled = on;
  loader.style.display = on ? 'inline-flex' : 'none';
  btnBuscar.querySelector('.btn-text').textContent = on ? 'Buscando…' : 'Buscar';
}

function hideResults() {
  resultsSection.style.display = 'none';
  resultsBody.innerHTML = '';
  tableFooter.style.display = 'none';
}

function hideError() { errorSection.style.display = 'none'; }
function showError(msg) { errorMsg.textContent = msg; errorSection.style.display = ''; }

// ── Fetch catálogo completo ───────────────────────────────────────────────────
async function loadCatalogo() {
  setLoading(true);
  hideResults();
  hideError();
  try {
    const res = await fetch(`${API_BASE}/catalogo`);
    if (!res.ok) throw new Error(`Error del servidor: HTTP ${res.status}`);
    const data = await res.json();
    console.log('[SADAR] GET /catalogo response:', data);
    if (Array.isArray(data)) {
      allItems = data;
    } else {
      const known = data.catalogo ?? data.items ?? data.productos ?? data.data ?? data.results ?? data.codigos;
      if (Array.isArray(known)) {
        allItems = known;
      } else {
        // Último recurso: primer campo que sea array
        const fallback = Object.values(data).find(v => Array.isArray(v));
        allItems = fallback ?? [];
        if (!fallback) console.warn('[SADAR] No se encontró array en la respuesta. Estructura:', Object.keys(data));
      }
    }

    resultsCount.textContent = `${allItems.length} código${allItems.length !== 1 ? 's' : ''}`;
    resultsQuery.textContent = 'Catálogo completo';
    currentPage = 1;
    resultsSection.style.display = '';

    if (allItems.length === 0) {
      resultsTable.style.display = 'none';
      noResults.style.display = '';
      noResultsSub.textContent = 'El catálogo está vacío.';
    } else {
      resultsTable.style.display = '';
      noResults.style.display = 'none';
      renderPage();
    }
  } catch (e) {
    showError(e.message || 'No se pudo conectar con el servidor.');
  } finally {
    setLoading(false);
  }
}

// ── Fetch por código ──────────────────────────────────────────────────────────
async function buscarPorCodigo(codigo) {
  setLoading(true);
  hideResults();
  hideError();
  try {
    const res = await fetch(`${API_BASE}/catalogo/${encodeURIComponent(codigo.trim())}`);

    if (res.status === 404) {
      allItems = [];
      resultsCount.textContent = '0 códigos';
      resultsQuery.textContent = `"${codigo}"`;
      currentPage = 1;
      resultsSection.style.display = '';
      resultsTable.style.display = 'none';
      tableFooter.style.display = 'none';
      noResults.style.display = '';
      noResultsSub.textContent = `No se encontró el código "${codigo}".`;
      return;
    }

    if (!res.ok) throw new Error(`Error del servidor: HTTP ${res.status}`);
    const data = await res.json();
    allItems = [data];
    resultsCount.textContent = '1 código';
    resultsQuery.textContent = `"${codigo}"`;
    currentPage = 1;
    resultsSection.style.display = '';
    resultsTable.style.display = '';
    noResults.style.display = 'none';
    renderPage();
  } catch (e) {
    showError(e.message || 'No se pudo conectar con el servidor.');
  } finally {
    setLoading(false);
  }
}

// ── Render tabla ──────────────────────────────────────────────────────────────
function renderPage() {
  const total      = allItems.length;
  const totalPages = Math.ceil(total / pageSize);
  if (currentPage > totalPages) currentPage = totalPages || 1;

  const start = (currentPage - 1) * pageSize;
  const end   = Math.min(start + pageSize, total);
  const slice = allItems.slice(start, end);

  resultsBody.innerHTML = '';
  slice.forEach(item => {
    const codigo     = item.codigo ?? '—';
    const variantes  = Array.isArray(item.variantes) ? item.variantes : [];
    const nVariantes = variantes.length;
    const v0         = variantes[0] ?? {};
    const posicion   = v0.posicion   ?? '';
    const estructura = v0.estructura ?? '';
    const totalApps  = variantes.reduce((sum, v) => sum + (Array.isArray(v.aplicaciones) ? v.aplicaciones.length : 0), 0);

    const aplicacion = v0.aplicacion ?? '';

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><span class="td-code">${escHtml(String(codigo))}</span></td>
      <td class="td-aplicacion-main">${aplicacion ? `<span class="td-aplicacion-txt">${escHtml(aplicacion)}</span>` : '<span class="td-muted">—</span>'}</td>
      <td>${posicion   ? `<span class="sadar-badge sadar-badge-pos">${escHtml(posicion)}</span>`     : '<span class="td-muted">—</span>'}</td>
      <td>${estructura ? `<span class="sadar-badge sadar-badge-struct">${escHtml(estructura)}</span>` : '<span class="td-muted">—</span>'}</td>
      <td class="th-center td-compact">${nVariantes}</td>
      <td class="th-center td-compact">${totalApps}</td>
      <td class="th-center td-compact">
        <button class="sadar-det-btn" title="Ver detalle">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="6.5" cy="6.5" r="4" stroke="currentColor" stroke-width="1.5"/><path d="M10 10L13.5 13.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
        </button>
      </td>
    `;

    tr.__item = item;
    tr.addEventListener('click', function(e) {
      // Evitar que el click en el botón dispare doble apertura
      if (e.target.closest('.sadar-det-btn')) return;
      openDetalle(this.__item);
    });
    tr.querySelector('.sadar-det-btn').addEventListener('click', () => openDetalle(item));

    resultsBody.appendChild(tr);
  });

  paginationInfo.innerHTML = `Mostrando <strong>${start + 1}–${end}</strong> de <strong>${total}</strong>`;
  renderPaginationControls(totalPages);
  tableFooter.style.display = total > 0 ? '' : 'none';
}

// ── Paginación ────────────────────────────────────────────────────────────────
function renderPaginationControls(totalPages) {
  paginationControls.innerHTML = '';
  if (totalPages <= 1) return;

  const btn = (label, page, disabled = false, active = false, isDots = false) => {
    if (isDots) {
      const span = document.createElement('span');
      span.className = 'page-dots';
      span.textContent = '…';
      return span;
    }
    const b = document.createElement('button');
    b.className = 'btn-page' + (active ? ' active' : '');
    b.disabled  = disabled;
    b.innerHTML = label;
    if (!disabled) b.addEventListener('click', () => { currentPage = page; renderPage(); });
    return b;
  };

  paginationControls.appendChild(
    btn('<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M8.5 3L5 7L8.5 11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
      currentPage - 1, currentPage === 1)
  );
  buildPageRange(currentPage, totalPages).forEach(p => {
    paginationControls.appendChild(p === '…' ? btn('',0,true,false,true) : btn(p,p,false,p===currentPage));
  });
  paginationControls.appendChild(
    btn('<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5.5 3L9 7L5.5 11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
      currentPage + 1, currentPage === totalPages)
  );
}

function buildPageRange(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 4) return [1,2,3,4,5,'…',total];
  if (current >= total - 3) return [1,'…',total-4,total-3,total-2,total-1,total];
  return [1,'…',current-1,current,current+1,'…',total];
}

// ── Modal detalle ─────────────────────────────────────────────────────────────
function openDetalle(item) {
  const codigo    = item.codigo ?? '—';
  const variantes = Array.isArray(item.variantes) ? item.variantes : [];

  detalleCode.textContent = codigo;
  detalleVariantsCount.textContent = `${variantes.length} variante${variantes.length !== 1 ? 's' : ''}`;
  detalleBody.innerHTML = '';

  if (variantes.length === 0) {
    detalleBody.innerHTML = '<p class="sadar-empty">Sin variantes registradas.</p>';
  } else {
    variantes.forEach((v, idx) => {
      const posicion   = v.posicion   ?? '';
      const estructura = v.estructura ?? '';
      const aplicacion = v.aplicacion ?? '';
      const dim        = v.dimensional ?? {};
      const equiv      = Array.isArray(v.equivalencia) ? v.equivalencia : [];
      const apps       = Array.isArray(v.aplicaciones) ? v.aplicaciones : [];
      const qf         = v.quality_flags ?? {};

      const hasDim = qf.has_dimensional ||
        !!(dim.abierto || dim.cerrado || dim.superior || dim.inferior);

      const dimHtml = hasDim ? `
        <div class="sadar-section">
          <div class="sadar-section-label">Dimensional</div>
          <div class="sadar-dim-grid">
            ${dim.abierto  ? `<div class="sadar-dim-item"><span class="sadar-dim-label">Abierto</span><span class="sadar-dim-val">${escHtml(dim.abierto)}</span></div>`   : ''}
            ${dim.cerrado  ? `<div class="sadar-dim-item"><span class="sadar-dim-label">Cerrado</span><span class="sadar-dim-val">${escHtml(dim.cerrado)}</span></div>`   : ''}
            ${dim.superior ? `<div class="sadar-dim-item"><span class="sadar-dim-label">Superior</span><span class="sadar-dim-val">${escHtml(dim.superior)}</span></div>` : ''}
            ${dim.inferior ? `<div class="sadar-dim-item"><span class="sadar-dim-label">Inferior</span><span class="sadar-dim-val">${escHtml(dim.inferior)}</span></div>` : ''}
          </div>
        </div>` : '';

      const equivHtml = equiv.length > 0 ? `
        <div class="sadar-section">
          <div class="sadar-section-label">Equivalencias (${equiv.length})</div>
          <div class="table-wrapper">
            <table class="sadar-apps-table">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Marca</th>
                </tr>
              </thead>
              <tbody>
                ${equiv.map(eq => {
                  const codigo = typeof eq === 'string' ? eq : (eq.codigo ?? eq.code ?? '—');
                  const marca  = typeof eq === 'string' ? '' : (eq.marca ?? eq.brand ?? '—');
                  return `<tr>
                    <td><span class="td-code">${escHtml(String(codigo))}</span></td>
                    <td>${escHtml(String(marca))}</td>
                  </tr>`;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>` : '';

      const appsHtml = apps.length > 0 ? `
        <div class="sadar-section">
          <div class="sadar-section-label">Aplicaciones (${apps.length})</div>
          <div class="table-wrapper">
            <table class="sadar-apps-table">
              <thead>
                <tr>
                  <th>Fabricante</th>
                  <th>Modelo</th>
                  <th>Tipo</th>
                  <th class="th-num">Desde</th>
                  <th class="th-num">Hasta</th>
                </tr>
              </thead>
              <tbody>
                ${apps.map(a => `
                  <tr>
                    <td>${escHtml(a.fabricante ?? '—')}</td>
                    <td>${escHtml(a.modelo     ?? '—')}</td>
                    <td>${escHtml(a.tipo       ?? '—')}</td>
                    <td class="th-num">${escHtml(String(a.desde ?? '—'))}</td>
                    <td class="th-num">${escHtml(String(a.hasta ?? 'actualidad'))}</td>
                  </tr>`).join('')}
              </tbody>
            </table>
          </div>
        </div>` : '';

      const varDiv = document.createElement('div');
      varDiv.className = 'sadar-variant' + (idx > 0 ? ' sadar-variant--sep' : '');
      varDiv.innerHTML = `
        <div class="sadar-variant-header">
          <span class="sadar-variant-id">${escHtml(v.variant_id ?? `Variante ${idx + 1}`)}</span>
          <div class="sadar-variant-badges">
            ${posicion   ? `<span class="sadar-badge sadar-badge-pos">${escHtml(posicion)}</span>`     : ''}
            ${estructura ? `<span class="sadar-badge sadar-badge-struct">${escHtml(estructura)}</span>` : ''}
          </div>
        </div>
        ${aplicacion ? `<p class="sadar-aplicacion-text">${escHtml(aplicacion)}</p>` : ''}
        ${dimHtml}
        ${equivHtml}
        ${appsHtml}
      `;
      detalleBody.appendChild(varDiv);
    });
  }

  detalleOverlay.classList.add('open');
  detalleModal.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeDetalle() {
  detalleOverlay.classList.remove('open');
  detalleModal.classList.remove('open');
  document.body.style.overflow = '';
}

detalleClose.addEventListener('click', closeDetalle);
detalleOverlay.addEventListener('click', closeDetalle);
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeDetalle(); });

// ── Eventos de búsqueda ───────────────────────────────────────────────────────
btnBuscar.addEventListener('click', () => {
  const codigo = buscarInput.value.trim().toUpperCase();
  if (!codigo) {
    loadCatalogo();
    return;
  }
  buscarPorCodigo(codigo);
});

buscarInput.addEventListener('keydown', e => { if (e.key === 'Enter') btnBuscar.click(); });

btnVerTodo.addEventListener('click', () => {
  buscarInput.value = '';
  loadCatalogo();
});

pageSizeSelect.addEventListener('change', () => {
  pageSize = parseInt(pageSizeSelect.value);
  currentPage = 1;
  renderPage();
});

// ── Init ──────────────────────────────────────────────────────────────────────
loadCatalogo();
