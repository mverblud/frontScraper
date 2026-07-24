const API_BASE = window.ENV.PRODUCTOS_API;

// ── DOM refs ──────────────────────────────────────────────────────────────────
const filtroTerm         = document.getElementById('filtro-term');
const filtroCategoryId   = document.getElementById('filtro-category-id');
const filtroBrandId      = document.getElementById('filtro-brand-id');
const filtroPosition     = document.getElementById('filtro-position');
const filtroSide         = document.getElementById('filtro-side');
const filtroYear         = document.getElementById('filtro-year');
const btnBuscar          = document.getElementById('btn-buscar');
const btnLimpiar         = document.getElementById('btn-limpiar');
const loader             = document.getElementById('loader');
const resultsSection     = document.getElementById('results-section');
const errorSection       = document.getElementById('error-section');
const errorMsg           = document.getElementById('error-msg');
const tiendaGrid          = document.getElementById('tienda-grid');
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
let allItems       = [];
let totalItems     = 0;
let currentPage    = 1;
let pageSize       = parseInt(pageSizeSelect.value);
let currentFilters = { term: '', categoryId: '', brandId: '', position: '', side: '', year: '' };

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
  return Number(val).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function boolBadge(val, trueLabel = 'Sí', falseLabel = 'No') {
  if (val === null || val === undefined) return '<span class="td-muted">—</span>';
  const isTrue = !!val;
  return `<span class="stock-badge ${isTrue ? 'stock-yes' : 'stock-no'}">${isTrue ? trueLabel : falseLabel}</span>`;
}

// Devuelve la URL de imagen a mostrar: la primera de images[], y si no hay
// ninguna, la del proveedor (supplier.imageUrl). Si no hay nada, string vacío.
function getDisplayImage(p) {
  const images = Array.isArray(p.images) ? p.images : [];
  const fromImages = images.find(img => img && img.url)?.url;
  if (fromImages) return fromImages;
  return p.supplier?.imageUrl || '';
}

// Disponibilidad transparente para el cliente: alcanza con que el stock
// propio (p.stock) o el del proveedor (p.supplier.stockSupplier) esté OK.
// Devuelve true/false, o null si no hay ningún dato de stock.
function getStockStatus(p) {
  const hasOwn      = p.stock !== null && p.stock !== undefined;
  const hasSupplier = p.supplier?.stockSupplier !== null && p.supplier?.stockSupplier !== undefined;
  if (!hasOwn && !hasSupplier) return null;
  return (hasOwn && Number(p.stock) > 0) || (hasSupplier && !!p.supplier.stockSupplier);
}

function setLoading(on) {
  btnBuscar.disabled = on;
  loader.style.display = on ? 'inline-flex' : 'none';
  btnBuscar.querySelector('.btn-text').textContent = on ? 'Buscando…' : 'Buscar';
}

function hideResults() {
  resultsSection.style.display = 'none';
  tiendaGrid.innerHTML = '';
  tableFooter.style.display = 'none';
}

function hideError() { errorSection.style.display = 'none'; }
function showError(msg) { errorMsg.textContent = msg; errorSection.style.display = ''; }

// ── Filtros: carga de categorías, marcas y años ──────────────────────────────
async function loadCategorias() {
  try {
    const res = await fetch(`${API_BASE}/api/v1/categories/?active=true`, {
      headers: { 'Accept': 'application/json' }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    filtroCategoryId.querySelectorAll('option:not(:first-child)').forEach(o => o.remove());
    (data.categories || [])
      .slice()
      .sort((a, b) => String(a.name).localeCompare(String(b.name), 'es'))
      .forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.id;
        opt.textContent = c.name;
        filtroCategoryId.appendChild(opt);
      });
  } catch (e) {
    console.error('Error al cargar categorías:', e);
    throw e;
  }
}

async function loadMarcas() {
  try {
    const res = await fetch(`${API_BASE}/api/v1/product-brands/?active=true`, {
      headers: { 'Accept': 'application/json' }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    filtroBrandId.querySelectorAll('option:not(:first-child)').forEach(o => o.remove());
    (data.brands || [])
      .slice()
      .sort((a, b) => String(a.name).localeCompare(String(b.name), 'es'))
      .forEach(b => {
        const opt = document.createElement('option');
        opt.value = b.id;
        opt.textContent = b.name;
        filtroBrandId.appendChild(opt);
      });
  } catch (e) {
    console.error('Error al cargar marcas:', e);
    throw e;
  }
}

function populateYears() {
  const currentYear = new Date().getFullYear();
  for (let year = currentYear; year >= 1900; year--) {
    const opt = document.createElement('option');
    opt.value = year;
    opt.textContent = year;
    filtroYear.appendChild(opt);
  }
}

// ── Fetch productos ───────────────────────────────────────────────────────────
function runSearch() {
  currentFilters = {
    term:       filtroTerm.value.trim(),
    categoryId: filtroCategoryId.value.trim(),
    brandId:    filtroBrandId.value.trim(),
    position:   filtroPosition.value.trim(),
    side:       filtroSide.value.trim(),
    year:       filtroYear.value.trim(),
  };
  currentPage = 1;
  fetchPage();
}

async function fetchPage() {
  const { term, categoryId, brandId, position, side, year } = currentFilters;
  const params = new URLSearchParams();

  if (term)       params.set('term', term);
  if (categoryId) params.set('categoryId', categoryId);
  if (brandId)    params.set('productBrandId', brandId);
  if (position)   params.set('position', position);
  if (side)       params.set('side', side);
  if (year)       params.set('year', year);
  params.set('page', currentPage);
  params.set('limit', pageSize);

  setLoading(true);
  hideError();

  try {
    const res = await fetch(`${API_BASE}/api/v1/store/products/search?${params.toString()}`, {
      headers: { 'Accept': 'application/json' }
    });
    if (!res.ok) throw new Error(`Error del servidor: HTTP ${res.status}`);
    const data = await res.json();

    allItems   = Array.isArray(data.products) ? data.products : [];
    totalItems = data.total ?? allItems.length;

    resultsCount.textContent = `${totalItems} producto${totalItems !== 1 ? 's' : ''}`;

    const parts = [];
    if (term)       parts.push(`"${term}"`);
    if (categoryId) parts.push(`categoría: ${filtroCategoryId.selectedOptions[0]?.textContent ?? categoryId}`);
    if (brandId)    parts.push(`marca: ${filtroBrandId.selectedOptions[0]?.textContent ?? brandId}`);
    if (position)   parts.push(`posición: ${filtroPosition.selectedOptions[0]?.textContent ?? position}`);
    if (side)       parts.push(`lado: ${filtroSide.selectedOptions[0]?.textContent ?? side}`);
    if (year)       parts.push(`año: ${year}`);
    resultsQuery.textContent = parts.join(' · ');

    resultsSection.style.display = '';

    if (allItems.length === 0) {
      tiendaGrid.innerHTML       = '';
      tableFooter.style.display  = 'none';
      noResults.style.display    = '';
      noResultsSub.textContent   = 'No se encontraron productos con esos filtros.';
    } else {
      noResults.style.display    = 'none';
      renderCards();
    }
  } catch (e) {
    hideResults();
    showError(e.message || 'No se pudo conectar con el servidor.');
  } finally {
    setLoading(false);
  }
}

// ── Render grilla de cards ─────────────────────────────────────────────────────
function renderCards() {
  const totalPages = Math.ceil(totalItems / pageSize) || 1;

  tiendaGrid.innerHTML = '';
  allItems.forEach(p => {
    const codigo      = p.code        ?? '—';
    const aplicacion  = p.application ?? p.description ?? '—';
    const marca       = p.productBrand?.name ?? '—';
    const categoria   = p.category?.name     ?? '—';
    const precio      = p.supplier?.suggestedPrice ?? null;
    const img         = getDisplayImage(p);
    const hasStock    = getStockStatus(p);

    const card = document.createElement('div');
    card.className = 'tienda-card';
    card.innerHTML = `
      <div class="tienda-card-img">
        ${img ? `<img src="${escHtml(img)}" loading="lazy" alt="${escHtml(String(aplicacion))}" onerror="this.parentElement.innerHTML='<span class=&quot;no-photo&quot;>Sin imagen</span>'"/>` : '<span class="no-photo">Sin imagen</span>'}
      </div>
      <div class="tienda-card-body">
        <div class="tienda-card-code">${escHtml(String(codigo))}</div>
        <div class="tienda-card-title" title="${escHtml(String(aplicacion))}">${escHtml(String(aplicacion))}</div>
        <div class="tienda-card-badges">
          <span class="tienda-card-badge">${escHtml(marca)}</span>
          <span class="tienda-card-badge">${escHtml(categoria)}</span>
        </div>
        <div class="tienda-card-footer">
          <span class="tienda-card-price">${precio != null ? `<span class="price-symbol">$</span>${fmtPrice(precio)}` : '<span class="td-muted">—</span>'}</span>
          ${hasStock === null ? '' : `<span class="stock-badge ${hasStock ? 'stock-yes' : 'stock-no'}">${hasStock ? 'En stock' : 'Sin stock'}</span>`}
        </div>
      </div>
    `;
    card.addEventListener('click', () => openDetalle(p));
    tiendaGrid.appendChild(card);
  });

  const start = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const end   = (currentPage - 1) * pageSize + allItems.length;
  paginationInfo.innerHTML = `Mostrando <strong>${start}–${end}</strong> de <strong>${totalItems}</strong>`;
  renderPaginationControls(totalPages);
  tableFooter.style.display = totalItems > 0 ? '' : 'none';
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
    if (!disabled) b.addEventListener('click', () => { currentPage = page; fetchPage(); });
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
function openDetalle(p) {
  const codigo = p.code ?? '—';

  const applications    = Array.isArray(p.applications) ? p.applications : [];
  const crossReferences = Array.isArray(p.crossReferences) ? p.crossReferences : [];
  const dimensions      = p.dimensions && typeof p.dimensions === 'object' ? p.dimensions : {};
  const dimEntries      = Object.entries(dimensions).filter(([, v]) => v !== null && v !== undefined && v !== '');

  const supplier    = p.supplier ?? null;
  const img         = getDisplayImage(p);
  const hasStock    = getStockStatus(p);
  const aplicacion  = p.application ?? p.description ?? '';
  const marca       = p.productBrand?.name ?? '—';
  const rubro       = p.category?.name    ?? '—';

  detalleCode.textContent = codigo;
  detalleVariantsCount.classList.remove('stock-yes', 'stock-no');
  if (hasStock === null) {
    detalleVariantsCount.textContent = '';
  } else {
    detalleVariantsCount.textContent = hasStock ? 'En stock' : 'Sin stock';
    detalleVariantsCount.classList.add(hasStock ? 'stock-yes' : 'stock-no');
  }
  detalleBody.innerHTML = '';

  // ── 2 columnas: toda la info a la izquierda, imagen a la derecha ────────────
  const splitSection = document.createElement('div');
  splitSection.className = 'tienda-modal-split';
  splitSection.innerHTML = `
    <div class="tienda-modal-info">
      ${aplicacion ? `
      <div class="product-modal-header">
        <h2 class="product-modal-name">${escHtml(aplicacion)}</h2>
      </div>` : ''}
      <div class="product-modal-tags">
        <div class="product-modal-tag">
          <span class="product-modal-tag-label">Marca</span>
          <span class="product-modal-tag-value">${escHtml(marca)}</span>
        </div>
        <div class="product-modal-tag">
          <span class="product-modal-tag-label">Rubro</span>
          <span class="product-modal-tag-value">${escHtml(rubro)}</span>
        </div>
      </div>
      <div class="product-modal-metrics">
        ${[
          { label: 'Precio Sugerido', val: supplier?.suggestedPrice != null ? `$${fmtPrice(supplier.suggestedPrice)}` : '—', highlight: true },
          { label: 'Disponibilidad',  val: hasStock === null ? '—' : boolBadge(hasStock, 'En stock', 'Sin stock') },
        ].map(m => `
          <div class="product-modal-metric-item${m.highlight ? ' highlight' : ''}">
            <span class="product-modal-metric-label">${m.label}</span>
            <span class="product-modal-metric-val">${m.val}</span>
          </div>
        `).join('')}
      </div>
      ${dimEntries.length > 0 ? `
      <div class="sadar-section" style="margin-top:0">
        <div class="sadar-section-label">Dimensiones</div>
        <div class="sadar-dim-grid">
          ${dimEntries.map(([key, val]) => `
            <div class="sadar-dim-item">
              <span class="sadar-dim-label">${escHtml(key)}</span>
              <span class="sadar-dim-val">${escHtml(String(val))}</span>
            </div>
          `).join('')}
        </div>
      </div>` : ''}
      ${crossReferences.length > 0 ? `
      <div class="sadar-section" style="margin-top:0">
        <div class="sadar-section-label">Equivalencias (${crossReferences.length})</div>
        <div class="sadar-equiv-list">
          ${crossReferences.map(cr => `
            <div class="sadar-equiv-item">
              <span class="td-code">${escHtml(cr.code ?? '—')}</span>
              <span class="sadar-equiv-marca">${escHtml(cr.brandName ?? '—')}</span>
            </div>`).join('')}
        </div>
      </div>` : ''}
      <div class="sadar-section" style="margin-top:0">
        <div class="sadar-section-label">Aplicaciones (${applications.length})</div>
        ${applications.length > 0 ? `
        <div class="table-wrapper">
          <table class="sadar-apps-table">
            <thead>
              <tr>
                <th>Fabricante</th>
                <th>Modelo</th>
                <th>Posición</th>
                <th>Lado</th>
                <th class="th-num">Año</th>
              </tr>
            </thead>
            <tbody>
              ${applications.map(a => {
                const anio = a.yearOriginal ?? [a.yearFrom, a.yearTo].filter(Boolean).join('–') ?? '—';
                return `
                  <tr>
                    <td>${escHtml(a.manufacturerName ?? '—')}</td>
                    <td>${escHtml(a.modelName ?? '—')}</td>
                    <td>${escHtml(a.position ?? '—')}</td>
                    <td>${escHtml(a.side ?? '—')}</td>
                    <td class="th-num">${escHtml(String(anio || '—'))}</td>
                  </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>` : '<p class="sadar-empty">Sin aplicaciones registradas.</p>'}
      </div>
    </div>
    <div class="tienda-modal-image">
      ${img ? `<img src="${escHtml(img)}" alt="${escHtml(String(codigo))}" loading="lazy" onerror="this.parentElement.innerHTML='<span class=&quot;no-photo&quot;>Sin imagen</span>'"/>` : '<span class="no-photo">Sin imagen</span>'}
    </div>
  `;
  detalleBody.appendChild(splitSection);

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
btnBuscar.addEventListener('click', runSearch);

[filtroTerm, filtroCategoryId, filtroBrandId, filtroPosition, filtroSide, filtroYear].forEach(input => {
  input.addEventListener('keydown', e => { if (e.key === 'Enter') btnBuscar.click(); });
});

btnLimpiar.addEventListener('click', () => {
  filtroTerm.value       = '';
  filtroCategoryId.value = '';
  filtroBrandId.value    = '';
  filtroPosition.value   = '';
  filtroSide.value       = '';
  filtroYear.value       = '';
  allItems = [];
  totalItems = 0;
  currentPage = 1;
  hideResults();
  hideError();
});

pageSizeSelect.addEventListener('change', () => {
  pageSize = parseInt(pageSizeSelect.value);
  currentPage = 1;
  fetchPage();
});

// ── Init ──────────────────────────────────────────────────────────────────────
populateYears();
maestroBoot({ loaders: [loadCategorias, loadMarcas] });
