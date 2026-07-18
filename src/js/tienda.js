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

function fmtPercent(val) {
  return `${Number(val).toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}%`;
}

function fmtDate(val) {
  if (!val) return '—';
  const d = new Date(val);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function boolBadge(val, trueLabel = 'Sí', falseLabel = 'No') {
  if (val === null || val === undefined) return '<span class="td-muted">—</span>';
  const isTrue = !!val;
  return `<span class="stock-badge ${isTrue ? 'stock-yes' : 'stock-no'}">${isTrue ? trueLabel : falseLabel}</span>`;
}

// Devuelve la URL de la imagen principal del producto: la marcada isPrimary,
// o si no hay ninguna, la de menor displayOrder.
function getPrimaryImageUrl(p) {
  const images = Array.isArray(p.images) ? p.images.slice() : [];
  if (images.length === 0) return '';
  images.sort((a, b) => {
    if (a.isPrimary && !b.isPrimary) return -1;
    if (!a.isPrimary && b.isPrimary) return 1;
    return (a.displayOrder ?? 0) - (b.displayOrder ?? 0);
  });
  return images[0].url ?? '';
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
  }
}

async function loadMarcas() {
  try {
    const res = await fetch(`${API_BASE}/api/v1/product-brands/?active=true`, {
      headers: { 'Accept': 'application/json' }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
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
    const res = await fetch(`${API_BASE}/api/v1/products/search?${params.toString()}`, {
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
    const supplier    = Array.isArray(p.suppliers) && p.suppliers.length > 0 ? p.suppliers[0] : null;
    const stock       = supplier?.stockSupplier ?? null;
    const precio      = supplier?.suggestedPrice ?? null;
    const img         = getPrimaryImageUrl(p);
    const hasStock    = stock !== null ? Number(stock) > 0 : null;

    const card = document.createElement('div');
    card.className = 'tienda-card';
    card.innerHTML = `
      <div class="tienda-card-img">
        ${img ? `<img src="${escHtml(img)}" loading="lazy" alt="${escHtml(String(aplicacion))}" onerror="this.parentElement.innerHTML='<span class=&quot;no-photo&quot;>Sin foto</span>'"/>` : '<span class="no-photo">Sin foto</span>'}
      </div>
      <div class="tienda-card-body">
        <div class="tienda-card-title" title="${escHtml(String(aplicacion))}">${escHtml(String(aplicacion))}</div>
        <div class="tienda-card-code">${escHtml(String(codigo))}</div>
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

  const images          = Array.isArray(p.images) ? p.images.slice() : [];
  const applications    = Array.isArray(p.applications) ? p.applications : [];
  const crossReferences = Array.isArray(p.crossReferences) ? p.crossReferences : [];
  const suppliers       = Array.isArray(p.suppliers) ? p.suppliers : [];
  const dimensions      = p.dimensions && typeof p.dimensions === 'object' ? p.dimensions : {};
  const dimEntries      = Object.entries(dimensions).filter(([, v]) => v !== null && v !== undefined && v !== '');

  detalleCode.textContent = codigo;
  detalleVariantsCount.textContent = `${suppliers.length} proveedor${suppliers.length !== 1 ? 'es' : ''}`;
  detalleBody.innerHTML = '';

  // ── Hero (imágenes + datos del proveedor principal) ─────────────────────────
  const heroSupplier = suppliers.length > 0 ? suppliers[0] : null;
  const heroProdImg   = getPrimaryImageUrl(p);
  const heroSupImg    = heroSupplier?.imageUrl ?? '';
  const heroAplicacion = heroSupplier?.application ?? '';
  const heroMarca  = heroSupplier?.brand   ?? p.productBrand?.name ?? '—';
  const heroRubro  = heroSupplier?.section ?? p.category?.name    ?? '—';
  const heroFuente = heroSupplier?.supplierName ?? '—';
  const heroStock  = heroSupplier?.stockSupplier ?? p.stock ?? null;
  const heroGanancia = (heroSupplier?.suggestedPrice != null && heroSupplier?.costWithIva != null)
    ? heroSupplier.suggestedPrice - heroSupplier.costWithIva
    : null;

  const heroSection = document.createElement('div');
  heroSection.className = 'sadar-hero';
  heroSection.innerHTML = `
    <div class="sadar-hero-images">
      ${heroProdImg ? `<img src="${escHtml(heroProdImg)}" alt="Producto ${escHtml(String(codigo))}" loading="lazy" onerror="this.style.display='none'"/>` : ''}
      ${heroSupImg  ? `<img src="${escHtml(heroSupImg)}" alt="Proveedor ${escHtml(String(codigo))}" loading="lazy" onerror="this.style.display='none'"/>` : ''}
      ${!heroProdImg && !heroSupImg ? '<span class="td-muted">Sin foto disponible</span>' : ''}
    </div>
    <div class="sadar-hero-info">
      ${heroAplicacion ? `
      <div class="product-modal-header">
        <h2 class="product-modal-name">${escHtml(heroAplicacion)}</h2>
      </div>` : ''}
      <div class="product-modal-tags">
        <div class="product-modal-tag">
          <span class="product-modal-tag-label">Marca</span>
          <span class="product-modal-tag-value">${escHtml(heroMarca)}</span>
        </div>
        <div class="product-modal-tag">
          <span class="product-modal-tag-label">Rubro</span>
          <span class="product-modal-tag-value">${escHtml(heroRubro)}</span>
        </div>
        <div class="product-modal-tag">
          <span class="product-modal-tag-label">Fuente</span>
          <span class="product-modal-tag-value">${escHtml(heroFuente)}</span>
        </div>
      </div>
      ${heroSupplier ? `
      <div class="product-modal-metrics">
        ${[
          { label: 'Precio Lista',    val: heroSupplier.priceList    != null ? `$${fmtPrice(heroSupplier.priceList)}`    : '—' },
          { label: 'Costo IVA',       val: heroSupplier.costWithIva  != null ? `$${fmtPrice(heroSupplier.costWithIva)}`  : '—' },
          { label: 'Precio Sugerido', val: heroSupplier.suggestedPrice != null ? `$${fmtPrice(heroSupplier.suggestedPrice)}` : '—', highlight: true },
          { label: 'IVA',             val: heroSupplier.iva          != null ? fmtPercent(heroSupplier.iva)              : '—' },
          { label: 'Descuento',       val: heroSupplier.discount     != null ? fmtPercent(heroSupplier.discount)         : '—' },
          { label: 'Monto IVA',       val: heroSupplier.ivaAmount    != null ? `$${fmtPrice(heroSupplier.ivaAmount)}`    : '—' },
          { label: 'Costo Neto',      val: heroSupplier.netCost      != null ? `$${fmtPrice(heroSupplier.netCost)}`      : '—' },
          { label: 'Margen',          val: heroSupplier.margin       != null ? fmtPercent(heroSupplier.margin)           : '—' },
          { label: 'Ganancia',        val: heroGanancia               != null ? `$${fmtPrice(heroGanancia)}`             : '—' },
          { label: 'Stock',           val: heroStock                  != null ? escHtml(String(heroStock))               : '—' },
        ].map(m => `
          <div class="product-modal-metric-item${m.highlight ? ' highlight' : ''}">
            <span class="product-modal-metric-label">${m.label}</span>
            <span class="product-modal-metric-val">${m.val}</span>
          </div>
        `).join('')}
      </div>` : ''}
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
      ${heroSupplier ? `
      <div class="sadar-section" style="margin-top:0">
        <div class="sadar-section-label">Datos del proveedor</div>
        <div class="sadar-dim-grid">
          <div class="sadar-dim-item">
            <span class="sadar-dim-label">Código prov.</span>
            <span class="sadar-dim-val">${escHtml(heroSupplier.supplierProductCode ?? '—')}</span>
          </div>
          <div class="sadar-dim-item">
            <span class="sadar-dim-label">Moneda</span>
            <span class="sadar-dim-val">${escHtml(heroSupplier.currency ?? '—')}</span>
          </div>
          <div class="sadar-dim-item">
            <span class="sadar-dim-label">Activo</span>
            <span class="sadar-dim-val">${boolBadge(heroSupplier.active)}</span>
          </div>
          <div class="sadar-dim-item">
            <span class="sadar-dim-label">Creado</span>
            <span class="sadar-dim-val">${escHtml(fmtDate(heroSupplier.createdAt))}</span>
          </div>
          <div class="sadar-dim-item">
            <span class="sadar-dim-label">Actualizado</span>
            <span class="sadar-dim-val">${escHtml(fmtDate(heroSupplier.updatedAt))}</span>
          </div>
        </div>
      </div>` : ''}
    </div>
  `;
  detalleBody.appendChild(heroSection);

  // ── Aplicaciones ──────────────────────────────────────────────────────────
  if (applications.length > 0) {
    const appsSection = document.createElement('div');
    appsSection.className = 'sadar-section';
    appsSection.innerHTML = `
      <div class="sadar-section-label">Aplicaciones (${applications.length})</div>
      <div class="table-wrapper">
        <table class="sadar-apps-table">
          <thead>
            <tr>
              <th>Fabricante</th>
              <th>Modelo</th>
              <th>Posición</th>
              <th>Lado</th>
              <th class="th-num">Año</th>
              <th>Descripción</th>
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
                  <td>${escHtml(a.description ?? '—')}</td>
                </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
    detalleBody.appendChild(appsSection);
  }

  if (images.length === 0 && dimEntries.length === 0 && applications.length === 0 &&
      crossReferences.length === 0 && suppliers.length === 0) {
    const emptyMsg = document.createElement('p');
    emptyMsg.className = 'sadar-empty';
    emptyMsg.textContent = 'Sin información adicional disponible.';
    detalleBody.appendChild(emptyMsg);
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
loadCategorias();
loadMarcas();
populateYears();
