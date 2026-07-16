const API_BASE = window.ENV.PRODUCTOS_API;

// ── DOM refs ──────────────────────────────────────────────────────────────────
const filtroActive      = document.getElementById('filtro-active');
const filtroCategoryId   = document.getElementById('filtro-category-id');
const filtroBrandId     = document.getElementById('filtro-brand-id');
const btnBuscar          = document.getElementById('btn-buscar');
const btnLimpiar         = document.getElementById('btn-limpiar');
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

// ── Columnas ──────────────────────────────────────────────────────────────────
const HIDDEN_COLS_KEY = 'ov_maestro_hidden_cols';
let hiddenCols = new Set();

const COLUMNS = [
  { key: 'imagen',      label: 'Imagen',      hideable: true },
  { key: 'id',          label: 'ID',          hideable: true },
  { key: 'codigo',      label: 'Código',      hideable: true },
  { key: 'categoria',   label: 'Categoría',   hideable: true },
  { key: 'marca',       label: 'Marca',       hideable: true },
  { key: 'aplicacion',  label: 'Aplicación',  hideable: true },
  { key: 'descripcion', label: 'Descripción', hideable: true },
  { key: 'stock',       label: 'Stock',       hideable: true },
  { key: 'activo',      label: 'Activo',      hideable: true },
  { key: 'web',         label: 'Web',         hideable: true },
  { key: 'precioLista',     label: 'P. Lista',     hideable: true },
  { key: 'iva',             label: 'IVA %',        hideable: true },
  { key: 'descuento',       label: 'Desc. %',      hideable: true },
  { key: 'costoNeto',       label: 'Costo Neto',   hideable: true },
  { key: 'montoIva',        label: 'Monto IVA',    hideable: true },
  { key: 'costoIva',        label: 'Costo c/IVA',  hideable: true },
  { key: 'margen',          label: 'Margen %',     hideable: true },
  { key: 'precioSugerido',  label: 'P. Sugerido',  hideable: true },
  { key: 'acciones',    label: '',            hideable: false },
];

// ── Estado ────────────────────────────────────────────────────────────────────
let allItems       = [];
let totalItems     = 0;
let currentPage    = 1;
let pageSize       = parseInt(pageSizeSelect.value);
let currentFilters = { active: '', categoryId: '', brandId: '' };

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
  resultsBody.innerHTML = '';
  tableFooter.style.display = 'none';
}

function hideError() { errorSection.style.display = 'none'; }
function showError(msg) { errorMsg.textContent = msg; errorSection.style.display = ''; }

// ── Filtros: carga de categorías y marcas ────────────────────────────────────
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

// ── Fetch productos ───────────────────────────────────────────────────────────
function runSearch() {
  currentFilters = {
    active:     filtroActive.value.trim(),
    categoryId: filtroCategoryId.value.trim(),
    brandId:    filtroBrandId.value.trim(),
  };
  currentPage = 1;
  fetchPage();
}

async function fetchPage() {
  const { active, categoryId, brandId } = currentFilters;
  const params = new URLSearchParams();

  if (active)     params.set('active', active);
  if (categoryId) params.set('categoryId', categoryId);
  if (brandId)    params.set('productBrandId', brandId);
  params.set('page', currentPage);
  params.set('limit', pageSize);

  setLoading(true);
  hideError();

  try {
    const res = await fetch(`${API_BASE}/api/v1/products/?${params.toString()}`, {
      headers: { 'Accept': 'application/json' }
    });
    if (!res.ok) throw new Error(`Error del servidor: HTTP ${res.status}`);
    const data = await res.json();

    allItems   = Array.isArray(data.products) ? data.products : [];
    totalItems = data.total ?? allItems.length;

    resultsCount.textContent = `${totalItems} producto${totalItems !== 1 ? 's' : ''}`;

    const parts = [];
    if (categoryId) parts.push(`categoría: ${filtroCategoryId.selectedOptions[0]?.textContent ?? categoryId}`);
    if (brandId)    parts.push(`marca: ${filtroBrandId.selectedOptions[0]?.textContent ?? brandId}`);
    if (active)     parts.push(`activo: ${active === 'true' ? 'Activos' : 'Inactivos'}`);
    resultsQuery.textContent = parts.join(' · ');

    resultsSection.style.display = '';

    if (allItems.length === 0) {
      resultsTable.style.display = 'none';
      tableFooter.style.display  = 'none';
      noResults.style.display    = '';
      noResultsSub.textContent   = 'No se encontraron productos con esos filtros.';
    } else {
      resultsTable.style.display = '';
      noResults.style.display    = 'none';
      renderPage();
    }
  } catch (e) {
    hideResults();
    showError(e.message || 'No se pudo conectar con el servidor.');
  } finally {
    setLoading(false);
  }
}

// ── Render tabla ──────────────────────────────────────────────────────────────
function renderPage() {
  const totalPages = Math.ceil(totalItems / pageSize) || 1;

  resultsBody.innerHTML = '';
  allItems.forEach(p => {
    const id          = p.id          ?? '—';
    const codigo      = p.code        ?? '—';
    const stock       = p.stock       ?? null;
    const descripcion = p.description ?? '—';
    const aplicacion  = p.application ?? '—';
    const categoria   = p.category?.name     ?? '—';
    const marca       = p.productBrand?.name ?? '—';
    const supplier    = Array.isArray(p.suppliers) && p.suppliers.length > 0 ? p.suppliers[0] : null;
    const prodImg     = getPrimaryImageUrl(p);
    const supImg      = supplier?.imageUrl ?? '';

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td data-col="imagen" class="th-center td-compact td-foto-maestro">
        <div class="td-foto-maestro-wrap">
          ${prodImg ? `<img src="${escHtml(prodImg)}" class="product-thumb" loading="lazy" alt="Producto ${escHtml(String(codigo))}" onerror="this.style.display='none'"/>` : ''}
          ${supImg  ? `<img src="${escHtml(supImg)}"  class="product-thumb product-thumb--sup" loading="lazy" alt="Proveedor" onerror="this.style.display='none'"/>` : ''}
          ${!prodImg && !supImg ? '<span class="td-muted">—</span>' : ''}
        </div>
      </td>
      <td data-col="id"><span class="td-code">${escHtml(String(id))}</span></td>
      <td data-col="codigo"><span class="td-code">${escHtml(String(codigo))}</span></td>
      <td data-col="categoria">${escHtml(categoria)}</td>
      <td data-col="marca">${escHtml(marca)}</td>
      <td data-col="aplicacion" class="td-aplicacion-main">${aplicacion && aplicacion !== '—' ? `<span class="td-aplicacion-txt">${escHtml(aplicacion)}</span>` : '<span class="td-muted">—</span>'}</td>
      <td data-col="descripcion" class="td-aplicacion-main">${descripcion && descripcion !== '—' ? `<span class="td-aplicacion-txt">${escHtml(descripcion)}</span>` : '<span class="td-muted">—</span>'}</td>
      <td data-col="stock" class="th-center td-compact">${stock !== null ? escHtml(String(stock)) : '<span class="td-muted">—</span>'}</td>
      <td data-col="activo" class="th-center td-compact">${boolBadge(p.active)}</td>
      <td data-col="web" class="th-center td-compact">${boolBadge(p.webEnabled)}</td>
      <td data-col="precioLista" class="th-num td-compact">${supplier?.priceList     != null ? `<span class="price-symbol">$</span>${escHtml(fmtPrice(supplier.priceList))}`     : '<span class="td-muted">—</span>'}</td>
      <td data-col="iva" class="th-center td-compact">${supplier?.iva              != null ? escHtml(fmtPercent(supplier.iva))       : '<span class="td-muted">—</span>'}</td>
      <td data-col="descuento" class="th-center td-compact">${supplier?.discount   != null ? escHtml(fmtPercent(supplier.discount))  : '<span class="td-muted">—</span>'}</td>
      <td data-col="costoNeto" class="th-num td-compact">${supplier?.netCost       != null ? `<span class="price-symbol">$</span>${escHtml(fmtPrice(supplier.netCost))}`      : '<span class="td-muted">—</span>'}</td>
      <td data-col="montoIva" class="th-num td-compact">${supplier?.ivaAmount      != null ? `<span class="price-symbol">$</span>${escHtml(fmtPrice(supplier.ivaAmount))}`   : '<span class="td-muted">—</span>'}</td>
      <td data-col="costoIva" class="th-num td-compact">${supplier?.costWithIva    != null ? `<span class="price-symbol">$</span>${escHtml(fmtPrice(supplier.costWithIva))}` : '<span class="td-muted">—</span>'}</td>
      <td data-col="margen" class="th-center td-compact">${supplier?.margin        != null ? escHtml(fmtPercent(supplier.margin))     : '<span class="td-muted">—</span>'}</td>
      <td data-col="precioSugerido" class="th-num td-compact">${supplier?.suggestedPrice != null ? `<span class="price-symbol">$</span>${escHtml(fmtPrice(supplier.suggestedPrice))}` : '<span class="td-muted">—</span>'}</td>
      <td data-col="acciones" class="th-center td-compact">
        <button class="sadar-det-btn" title="Ver detalle">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="6.5" cy="6.5" r="4" stroke="currentColor" stroke-width="1.5"/><path d="M10 10L13.5 13.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
        </button>
      </td>
    `;

    tr.__item = p;
    tr.addEventListener('click', function(e) {
      if (e.target.closest('.sadar-det-btn')) return;
      openDetalle(this.__item);
    });
    tr.querySelector('.sadar-det-btn').addEventListener('click', () => openDetalle(p));

    resultsBody.appendChild(tr);
  });

  const start = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const end   = (currentPage - 1) * pageSize + allItems.length;
  paginationInfo.innerHTML = `Mostrando <strong>${start}–${end}</strong> de <strong>${totalItems}</strong>`;
  renderPaginationControls(totalPages);
  tableFooter.style.display = totalItems > 0 ? '' : 'none';
  applyColumnVisibility();
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

// ── Columnas: mostrar/ocultar ─────────────────────────────────────────────────
function saveHiddenCols() {
  try { localStorage.setItem(HIDDEN_COLS_KEY, JSON.stringify([...hiddenCols])); } catch (_) {}
}

function loadHiddenCols() {
  try {
    const raw = localStorage.getItem(HIDDEN_COLS_KEY);
    if (raw) hiddenCols = new Set(JSON.parse(raw));
  } catch (_) { hiddenCols = new Set(); }
}

function applyColumnVisibility() {
  COLUMNS.forEach(col => {
    if (!col.hideable) return;
    const hidden = hiddenCols.has(col.key);
    document.querySelectorAll(`[data-col="${col.key}"]`).forEach(el => {
      el.style.display = hidden ? 'none' : '';
    });
  });
}

function initColumnsMenu() {
  const menu = document.getElementById('columns-menu');
  const btn  = document.getElementById('btn-columns');
  if (!menu || !btn) return;

  COLUMNS.filter(c => c.hideable).forEach(col => {
    const lbl = document.createElement('label');
    lbl.className = 'col-menu-item';

    const cb = document.createElement('input');
    cb.type    = 'checkbox';
    cb.checked = !hiddenCols.has(col.key);
    cb.addEventListener('change', () => {
      if (cb.checked) hiddenCols.delete(col.key);
      else            hiddenCols.add(col.key);
      saveHiddenCols();
      applyColumnVisibility();
    });

    lbl.appendChild(cb);
    lbl.append(` ${col.label}`);
    menu.appendChild(lbl);
  });

  btn.addEventListener('click', e => {
    e.stopPropagation();
    menu.classList.toggle('open');
  });

  document.addEventListener('click', e => {
    if (!menu.contains(e.target) && e.target !== btn) {
      menu.classList.remove('open');
    }
  });
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
  const heroStock  = heroSupplier?.stock ?? p.stock ?? null;
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
            <span class="sadar-dim-label">Disponible</span>
            <span class="sadar-dim-val">${boolBadge(heroSupplier.available)}</span>
          </div>
          <div class="sadar-dim-item">
            <span class="sadar-dim-label">Activo</span>
            <span class="sadar-dim-val">${boolBadge(heroSupplier.active)}</span>
          </div>
          <div class="sadar-dim-item">
            <span class="sadar-dim-label">Precio actualizado</span>
            <span class="sadar-dim-val">${escHtml(fmtDate(heroSupplier.priceUpdatedAt))}</span>
          </div>
          <div class="sadar-dim-item">
            <span class="sadar-dim-label">Stock actualizado</span>
            <span class="sadar-dim-val">${escHtml(fmtDate(heroSupplier.stockUpdatedAt))}</span>
          </div>
          <div class="sadar-dim-item">
            <span class="sadar-dim-label">Último scrape</span>
            <span class="sadar-dim-val">${escHtml(fmtDate(heroSupplier.lastScrapedAt))}</span>
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

[filtroActive, filtroCategoryId, filtroBrandId].forEach(input => {
  input.addEventListener('keydown', e => { if (e.key === 'Enter') btnBuscar.click(); });
});

btnLimpiar.addEventListener('click', () => {
  filtroActive.value     = '';
  filtroCategoryId.value = '';
  filtroBrandId.value    = '';
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
loadHiddenCols();
initColumnsMenu();
loadCategorias();
loadMarcas();
runSearch();
