// presupuestos.js — Pantalla de cotización: mismo filtro/servicio que tienda.js (Maestro),
// misma grilla y sistema de presupuesto que catalogo-nuevo.js.

const API_BASE = window.ENV.PRODUCTOS_API;
const CART_STORAGE_KEY    = 'ov_presupuesto';
const HIDDEN_COLS_KEY     = 'ov_presupuestos_hidden_cols_v1';
const DEFAULT_HIDDEN_COLS = ['iva-pct', 'iva-monto', 'desc-pct', 'margen', 'fuente'];

// ── DOM refs: filtros de búsqueda (tienda) ─────────────────────────────────────
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
const productsBody       = document.getElementById('products-body');
const productsTable      = document.getElementById('products-table');
const resultsCount       = document.getElementById('results-count');
const resultsQuery       = document.getElementById('results-query');
const noResults          = document.getElementById('no-results');
const tableFooter        = document.getElementById('table-footer');
const pageSizeSelect     = document.getElementById('page-size');
const paginationInfo     = document.getElementById('pagination-info');
const paginationControls = document.getElementById('pagination-controls');

// Detalle modal (SADAR style, datos Maestro crudos)
const detalleOverlay       = document.getElementById('detalle-modal-overlay');
const detalleModal         = document.getElementById('detalle-modal');
const detalleClose         = document.getElementById('detalle-modal-close');
const detalleCode          = document.getElementById('detalle-modal-code');
const detalleVariantsCount = document.getElementById('detalle-modal-variants-count');
const detalleBody          = document.getElementById('detalle-modal-body');
const detalleAdd           = document.getElementById('detalle-modal-add');

// Drawer / carrito
const cartBtn        = document.getElementById('cart-btn');
const cartCount      = document.getElementById('cart-count');
const drawer         = document.getElementById('drawer');
const drawerOverlay  = document.getElementById('drawer-overlay');
const drawerClose    = document.getElementById('drawer-close');
const drawerCount    = document.getElementById('drawer-count');
const drawerEmpty    = document.getElementById('drawer-empty');
const cartItemsList  = document.getElementById('cart-items-list');
const drawerTotals   = document.getElementById('drawer-totals');
const totalFinal     = document.getElementById('total-final');
const btnImprimir    = document.getElementById('btn-imprimir');
const btnClearCart   = document.getElementById('btn-clear-cart');

// Theme
const themeToggle = document.getElementById('theme-toggle');

// ── Configuración de columnas (igual a catálogo-nuevo) ─────────────────────────
const COLUMNS = [
  {
    key: 'foto', label: 'Foto', align: 'center',
    sortable: false, hideable: true
  },
  {
    key: 'codigo', label: 'Código', align: 'left',
    sortable: true, hideable: true,
    sortValue: p => String(p.codigo ?? '')
  },
  {
    key: 'marca', label: 'Marca', align: 'left',
    sortable: true, hideable: true,
    sortValue: p => String(p.marca ?? '')
  },
  {
    key: 'rubro', label: 'Rubro', align: 'left',
    sortable: true, hideable: true,
    sortValue: p => String(p.rubro ?? '')
  },
  {
    key: 'aplicacion', label: 'Aplicación', align: 'left',
    sortable: true, hideable: true,
    sortValue: p => String(p.aplicacion ?? '')
  },
  {
    key: 'fuente', label: 'Fuente', align: 'center',
    sortable: true, hideable: true,
    sortValue: p => getSourceKey(p)
  },
  {
    key: 'precio-lista', label: 'Precio lista', align: 'num',
    sortable: true, hideable: true,
    sortValue: p => p.precioLista ?? null
  },
  {
    key: 'iva-pct', label: 'IVA(%)', align: 'num',
    sortable: true, hideable: true,
    sortValue: p => p.iva ?? null
  },
  {
    key: 'iva-monto', label: 'IVA($)', align: 'num',
    sortable: true, hideable: true,
    sortValue: p => p.montoIVA ?? null
  },
  {
    key: 'desc-pct', label: 'Desc.(%)', align: 'num',
    sortable: true, hideable: true,
    sortValue: p => p.descuento ?? null
  },
  {
    key: 'costo-neto', label: 'Costo Neto', align: 'num',
    sortable: true, hideable: true,
    sortValue: p => p.costoNeto ?? null
  },
  {
    key: 'costo-iva', label: 'Costo IVA', align: 'num',
    sortable: true, hideable: true,
    sortValue: p => p.costoIVA ?? null
  },
  {
    key: 'margen', label: 'Margen', align: 'num',
    sortable: true, hideable: true,
    sortValue: p => p.margen ?? null
  },
  {
    key: 'p-sugerido', label: 'P.sugerido', align: 'num',
    sortable: true, hideable: true,
    sortValue: p => p.precioSugerido ?? null
  },
  {
    key: 'ganancia', label: 'Ganancia', align: 'num',
    sortable: true, hideable: true,
    sortValue: p => {
      const pv = p.precioSugerido ?? null;
      const ci = p.costoIVA      ?? null;
      return (pv != null && ci != null) ? Number(pv) - Number(ci) : null;
    }
  },
  {
    key: 'stock', label: 'Stock', align: 'center',
    sortable: true, hideable: true,
    sortValue: p => {
      if (p.stockEstado === 'propio')    return 3;
      if (p.stockEstado === 'proveedor') return 2;
      if (p.stockEstado === 'no')        return 1;
      return -1;
    }
  },
  {
    key: 'agregar', label: 'Agregar', align: 'center',
    sortable: false, hideable: false
  }
];

const SORT_ARROWS_SVG = `<svg class="sort-arrows" width="8" height="12" viewBox="0 0 8 12" fill="none" aria-hidden="true"><path class="arr-up" d="M4 1L1 5h6L4 1z"/><path class="arr-down" d="M4 11L1 7h6L4 11z"/></svg>`;

// ── Estado ────────────────────────────────────────────────────────────────────
let rawItems       = [];   // productos Maestro crudos de la página actual (para el modal de detalle)
let allProducts     = [];  // productos adaptados a shape plano (para tabla y carrito)
let totalItems      = 0;
let currentPage      = 1;
let pageSize         = parseInt(pageSizeSelect.value);
let currentFilters   = { term: '', categoryId: '', brandId: '', position: '', side: '', year: '' };

let sortKey = 'marca';
let sortDir = 'asc';

let hiddenCols = new Set();

let cart = {};

// ── Persistencia carrito ──────────────────────────────────────────────────────
function saveCart() {
  try { localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart)); } catch (_) {}
}
function loadCart() {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (raw) cart = JSON.parse(raw);
  } catch (_) { cart = {}; }
}

// ── Persistencia columnas ocultas ──────────────────────────────────────────────
function saveHiddenCols() {
  try { localStorage.setItem(HIDDEN_COLS_KEY, JSON.stringify([...hiddenCols])); } catch (_) {}
}
function loadHiddenCols() {
  try {
    const raw = localStorage.getItem(HIDDEN_COLS_KEY);
    if (raw !== null) {
      hiddenCols = new Set(JSON.parse(raw));
    } else {
      hiddenCols = new Set(DEFAULT_HIDDEN_COLS);
    }
  } catch (_) { hiddenCols = new Set(DEFAULT_HIDDEN_COLS); }
}

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
// Badge de stock combinado: prioriza el stock propio (local OV) sobre el del proveedor.
function stockBadge(p) {
  const title = `Local: ${p.stockPropio ?? '—'} · Proveedor: ${p.stockProveedor ?? '—'}`;
  if (p.stockEstado === 'propio') {
    return `<span class="stock-badge stock-propio" title="${escHtml(title)}"><span class="stock-dot"></span>Sí</span>`;
  }
  if (p.stockEstado === 'proveedor') {
    return `<span class="stock-badge stock-proveedor" title="${escHtml(title)}"><span class="stock-dot"></span>Sí</span>`;
  }
  if (p.stockEstado === 'no') {
    return `<span class="stock-badge stock-no" title="${escHtml(title)}">No</span>`;
  }
  return '<span class="td-muted">—</span>';
}
function setLoading(on) {
  btnBuscar.disabled = on;
  loader.style.display = on ? 'inline-flex' : 'none';
  btnBuscar.querySelector('.btn-text').textContent = on ? 'Buscando…' : 'Buscar';
}
function hideResults() {
  resultsSection.style.display = 'none';
  productsBody.innerHTML = '';
  tableFooter.style.display = 'none';
}
function hideError() { errorSection.style.display = 'none'; }
function showError(msg) { errorMsg.textContent = msg; errorSection.style.display = ''; }

// Devuelve la URL de la imagen principal del producto Maestro: la marcada isPrimary,
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

// ── Adaptador: producto Maestro (crudo) → shape plano de la grilla/carrito ─────
function adaptProduct(p) {
  const supplier = Array.isArray(p.suppliers) && p.suppliers.length > 0 ? p.suppliers[0] : null;

  // Stock combinado: propio (products.stock, lo que hay en el local de OV) prevalece
  // sobre el del proveedor (suppliers.stockSupplier).
  const stockPropio    = p.stock != null ? Number(p.stock) : null;
  const stockProveedor = supplier?.stockSupplier != null ? Number(supplier.stockSupplier) : null;
  let stockEstado = null; // desconocido
  if (stockPropio != null && stockPropio > 0) {
    stockEstado = 'propio';
  } else if (stockProveedor != null && stockProveedor > 0) {
    stockEstado = 'proveedor';
  } else if (stockPropio != null || stockProveedor != null) {
    stockEstado = 'no';
  }

  return {
    codigo: p.code ?? '—',
    aplicacion: p.application ?? p.description ?? supplier?.application ?? '—',
    marca: p.productBrand?.name ?? '—',
    rubro: p.category?.name ?? '—',
    imagen: getPrimaryImageUrl(p) || supplier?.imageUrl || '',
    precioLista: supplier?.priceList ?? null,
    iva: supplier?.iva ?? null,
    montoIVA: supplier?.ivaAmount ?? null,
    descuento: supplier?.discount ?? null,
    costoNeto: supplier?.netCost ?? null,
    costoIVA: supplier?.costWithIva ?? null,
    precioSugerido: supplier?.suggestedPrice ?? null,
    margen: supplier?.margin ?? null,
    stockPropio,
    stockProveedor,
    stockEstado,
    _source: 'maestro',
    __raw: p
  };
}

function normalizeProduct(p) {
  return {
    codigo: p.codigo ?? '—',
    nombre: p.aplicacion ?? '—',
    marca: p.marca ?? '—',
    rubro: p.rubro ?? '—',
    foto: p.imagen ?? '',
    precioVenta: p.precioSugerido ?? 0,
    _source: getSourceKey(p)
  };
}

function getSourceKey(p) {
  const rawSource = String(
    p._source ?? p.source ?? p.fuente ?? p.origen ?? p.provider ?? p.proveedor ?? ''
  ).trim().toLowerCase();

  if (rawSource.includes('maestro')) return 'maestro';
  if (rawSource.includes('ramos')) return 'rm';
  if (rawSource.includes('rm')) return 'rm';
  if (rawSource.includes('asm')) return 'asm';
  return 'nv';
}

function getSourceLabel(sourceKey) {
  if (sourceKey === 'maestro') return 'MAESTRO';
  if (sourceKey === 'rm') return 'RM';
  if (sourceKey === 'asm') return 'ASM';
  return 'NV';
}

function getBrandColorClass(brandName) {
  const normalized = String(brandName ?? 'sin-marca').trim().toLowerCase();
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    hash = (hash * 31 + normalized.charCodeAt(i)) >>> 0;
  }
  return `brand-palette-${hash % 8}`;
}

// ── THEME ─────────────────────────────────────────────────────────────────────
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
}
themeToggle.addEventListener('click', () => {
  const cur = document.documentElement.getAttribute('data-theme');
  applyTheme(cur === 'dark' ? 'light' : 'dark');
});
applyTheme(localStorage.getItem('theme') || 'dark');

// ── Encabezado de tabla (generado desde COLUMNS) ───────────────────────────────
function renderTableHead() {
  const row = document.getElementById('products-head-row');
  row.innerHTML = '';

  COLUMNS.forEach(col => {
    const th = document.createElement('th');
    th.dataset.col = col.key;

    if (col.align === 'num')    th.classList.add('th-num');
    else if (col.align === 'center') th.classList.add('th-center');

    if (col.sortable) {
      th.classList.add('th-sortable');
      if (sortKey === col.key) {
        th.classList.add(sortDir === 'asc' ? 'sort-asc' : 'sort-desc');
      }
      th.innerHTML = `<span class="th-inner"><span class="th-label">${col.label}</span>${SORT_ARROWS_SVG}</span>`;
      th.addEventListener('click', () => setSort(col.key));
    } else {
      th.textContent = col.label;
    }

    row.appendChild(th);
  });
}

// ── Ordenamiento (sobre la página actual, sin volver a pedir al servidor) ──────
function setSort(key) {
  if (sortKey === key) {
    sortDir = sortDir === 'asc' ? 'desc' : 'asc';
  } else {
    sortKey = key;
    sortDir = 'asc';
  }
  sortProducts();
  renderTableHead();
  renderPage();
}

function sortProducts() {
  const col = COLUMNS.find(c => c.key === sortKey);
  if (!col || !col.sortable || !col.sortValue) return;

  allProducts.sort((a, b) => {
    const va = col.sortValue(a);
    const vb = col.sortValue(b);

    const aNul = va == null || va === '' || va === '—';
    const bNul = vb == null || vb === '' || vb === '—';
    if (aNul && bNul) return 0;
    if (aNul) return 1;
    if (bNul) return -1;

    let cmp;
    if (typeof va === 'number' && typeof vb === 'number') {
      cmp = va - vb;
    } else {
      cmp = String(va).localeCompare(String(vb), 'es');
    }

    return sortDir === 'asc' ? cmp : -cmp;
  });
}

// ── Visibilidad de columnas ────────────────────────────────────────────────────
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

// ── Filtros: carga de categorías, marcas y años (Maestro) ──────────────────────
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

// ── Búsqueda (server-side, igual a tienda.js) ──────────────────────────────────
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

    rawItems    = Array.isArray(data.products) ? data.products : [];
    totalItems  = data.total ?? rawItems.length;
    allProducts = rawItems.map(adaptProduct);
    sortProducts();

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

    if (allProducts.length === 0) {
      productsTable.style.display = 'none';
      tableFooter.style.display   = 'none';
      noResults.style.display     = '';
    } else {
      productsTable.style.display = '';
      noResults.style.display     = 'none';
      renderPage();
    }
  } catch (e) {
    hideResults();
    showError(e.message || 'No se pudo conectar con el servidor.');
  } finally {
    setLoading(false);
  }
}

// ── Render tabla (una sola página del servidor por vez) ────────────────────────
function renderPage() {
  const totalPages = Math.ceil(totalItems / pageSize) || 1;

  productsBody.innerHTML = '';
  allProducts.forEach(p => {
    const tr = document.createElement('tr');
    tr.style.cursor = 'pointer';

    const codigo      = p.codigo         ?? '—';
    const desc        = p.aplicacion     ?? '—';
    const marca       = p.marca          ?? '—';
    const brandClass  = getBrandColorClass(marca);
    const rubro       = p.rubro          ?? '—';
    const sourceKey   = getSourceKey(p);
    const sourceLabel = getSourceLabel(sourceKey);
    const foto        = p.imagen         ?? '';
    const precioLista = p.precioLista    ?? null;
    const montoIva    = p.montoIVA       ?? null;
    const costoNeto   = p.costoNeto      ?? null;
    const costoIva    = p.costoIVA       ?? null;
    const precioVenta = p.precioSugerido ?? null;
    const iva         = p.iva            ?? null;
    const descuento   = p.descuento      ?? null;
    const margen      = p.margen         ?? null;
    const ganancia    = precioVenta != null && costoIva != null
      ? Number(precioVenta) - Number(costoIva)
      : null;

    const precioListaStr = precioLista != null ? fmtPrice(precioLista) : '—';
    const montoIvaStr    = montoIva    != null ? fmtPrice(montoIva)    : '—';
    const costoNetoStr   = costoNeto   != null ? fmtPrice(costoNeto)   : '—';
    const precioVentaStr = precioVenta != null ? fmtPrice(precioVenta) : '—';
    const costoIvaStr    = costoIva    != null ? fmtPrice(costoIva)    : '—';
    const ivaStr         = iva         != null ? fmtPercent(iva)       : '—';
    const descuentoStr   = descuento   != null ? fmtPercent(descuento) : '—';
    const margenStr      = margen      != null ? fmtPercent(margen)    : '—';
    const gananciaStr    = ganancia    != null ? fmtPrice(ganancia)    : '—';

    let gananciaIndicatorClass = 'ganancia-indicator-mid';
    let gananciaIndicatorTitle = 'Ganancia entre $10.000 y $15.000';
    let gananciaIndicatorIcon = '<svg viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M2 6h8M7.5 3.5L10 6 7.5 8.5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>';

    if (ganancia != null) {
      if (ganancia > 15000) {
        gananciaIndicatorClass = 'ganancia-indicator-high';
        gananciaIndicatorTitle = 'Ganancia mayor a $15.000';
        gananciaIndicatorIcon = '<svg viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M6 10V2M6 2L3.5 4.5M6 2l2.5 2.5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>';
      } else if (ganancia < 10000) {
        gananciaIndicatorClass = 'ganancia-indicator-low';
        gananciaIndicatorTitle = 'Ganancia menor a $10.000';
        gananciaIndicatorIcon = '<svg viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M6 2v8M6 10L3.5 7.5M6 10l2.5-2.5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>';
      }
    }

    const gananciaCell = ganancia != null
      ? `<span class="ganancia-wrap"><span class="ganancia-indicator ${gananciaIndicatorClass}" title="${gananciaIndicatorTitle}">${gananciaIndicatorIcon}</span><span class="price-symbol">$</span>${gananciaStr}</span>`
      : '—';
    const cartKey = `${sourceKey}:${codigo}`;
    const inCart  = !!cart[cartKey];

    tr.innerHTML = `
      <td class="td-foto" data-col="foto">
        ${foto ? `<img src="${escHtml(foto)}" alt="Foto del producto" class="product-thumb" loading="lazy" onerror="this.style.display='none'"/>` : '<span class="no-photo">—</span>'}
      </td>
      <td data-col="codigo"><span class="td-code">${escHtml(String(codigo))}</span></td>
      <td class="td-marca" data-col="marca"><span class="brand-badge ${escHtml(brandClass)}">${escHtml(String(marca))}</span></td>
      <td class="td-rubro" data-col="rubro"><span>${escHtml(String(rubro))}</span></td>
      <td class="td-aplicacion" data-col="aplicacion">${escHtml(String(desc))}</td>
      <td class="td-fuente" data-col="fuente"><span class="source-badge source-${escHtml(sourceKey)}">${escHtml(sourceLabel)}</span></td>
      <td class="td-precio-lista" data-col="precio-lista"><span class="price-symbol">$</span>${precioListaStr}</td>
      <td class="td-percent" data-col="iva-pct">${ivaStr}</td>
      <td class="td-costo-iva" data-col="iva-monto"><span class="price-symbol">$</span>${montoIvaStr}</td>
      <td class="td-percent" data-col="desc-pct">${descuentoStr}</td>
      <td class="td-costo" data-col="costo-neto"><span class="price-symbol">$</span>${costoNetoStr}</td>
      <td class="td-costo-iva" data-col="costo-iva"><span class="price-symbol">$</span>${costoIvaStr}</td>
      <td class="td-percent" data-col="margen">${margenStr}</td>
      <td class="td-precio-venta" data-col="p-sugerido"><span class="price-symbol">$</span>${precioVentaStr}</td>
      <td class="td-ganancia" data-col="ganancia">${gananciaCell}</td>
      <td class="td-stock" data-col="stock" style="text-align:center">${stockBadge(p)}</td>
      <td class="td-add" data-col="agregar">
        <button class="btn-add ${inCart ? 'in-cart' : ''}" data-key="${escHtml(cartKey)}"
                title="${inCart ? 'Quitar del presupuesto' : 'Agregar al presupuesto'}"
                aria-label="${inCart ? 'Quitar' : 'Agregar'}">
          ${inCart
            ? `<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`
            : `<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 2v8M2 6h8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`
          }
        </button>
      </td>
    `;

    // Agregar/quitar del presupuesto (no dispara el click de la fila)
    const addBtn = tr.querySelector('.btn-add');
    addBtn.__product = p;
    addBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      const key = this.dataset.key;
      if (cart[key]) removeFromCart(key);
      else addToCart(this.__product);
    });

    // Click en la fila → modal de detalle rico (datos Maestro crudos)
    tr.addEventListener('click', () => openDetalle(p.__raw));

    productsBody.appendChild(tr);
  });

  const start = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const end   = (currentPage - 1) * pageSize + allProducts.length;
  paginationInfo.innerHTML = `Mostrando <strong>${start}–${end}</strong> de <strong>${totalItems}</strong>`;
  renderPaginationControls(totalPages);
  tableFooter.style.display = totalItems > 0 ? '' : 'none';

  applyColumnVisibility();
}

// ── Paginación (server-side: cada click pide una página nueva) ─────────────────
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

// ═══════════════════════════════════════════════════════════════
// ── CARRITO / PRESUPUESTO (compartido con las demás pantallas) ─
// ═══════════════════════════════════════════════════════════════

function addToCart(product) {
  const normalized = normalizeProduct(product);
  const key = `${normalized._source}:${normalized.codigo}`;
  if (cart[key]) {
    cart[key].qty += 1;
  } else {
    cart[key] = { product: normalized, qty: 1 };
  }
  saveCart();
  updateCartUI();
  renderPage();
}

function removeFromCart(key) {
  delete cart[key];
  saveCart();
  updateCartUI();
  renderPage();
}

function changeQty(key, delta) {
  if (!cart[key]) return;
  cart[key].qty = Math.max(1, cart[key].qty + delta);
  saveCart();
  updateCartUI();
}

function clearCart() {
  cart = {};
  saveCart();
  updateCartUI();
  renderPage();
}

function updateCartUI() {
  const entries = Object.entries(cart);
  const count   = entries.reduce((s, [, i]) => s + i.qty, 0);

  cartCount.textContent = count;
  cartCount.style.display = count > 0 ? '' : 'none';

  drawerCount.textContent = `${count} producto${count !== 1 ? 's' : ''}`;

  drawerEmpty.style.display  = entries.length === 0 ? '' : 'none';
  drawerTotals.style.display = entries.length > 0 ? '' : 'none';
  btnImprimir.style.display  = entries.length > 0 ? '' : 'none';

  cartItemsList.innerHTML = '';
  let totalSum = 0;

  entries.forEach(([key, { product, qty }]) => {
    const codigo = product.codigo ?? '—';
    const desc   = product.nombre ?? '—';
    const marca  = product.marca ?? '';
    const pVenta = Number(product.precioVenta) || 0;
    const subtotal = pVenta * qty;
    totalSum += subtotal;

    const sourceTag = product._source === 'rm' ? 'RM'
      : product._source === 'asm' ? 'ASM'
      : product._source === 'maestro' ? 'MAESTRO'
      : product._source === 'nv' ? 'NV' : '';

    const div = document.createElement('div');
    div.className = 'cart-item';
    div.innerHTML = `
      <div class="cart-item-info">
        <span class="cart-item-code">${sourceTag ? `<span class="cart-item-provider" style="opacity:.5">[${escHtml(sourceTag)}]</span> ` : ''}${escHtml(String(codigo))}</span>
        <div class="cart-item-desc" title="${escHtml(String(desc))}">${escHtml(String(desc))}</div>
        <div class="cart-item-sub">${escHtml(marca)} · $${fmtPrice(pVenta)}</div>
      </div>
      <div class="cart-item-controls">
        <div class="qty-control">
          <button class="qty-btn" data-action="dec" data-key="${escHtml(key)}">−</button>
          <span class="qty-val">${qty}</span>
          <button class="qty-btn" data-action="inc" data-key="${escHtml(key)}">+</button>
        </div>
        <span class="cart-item-qty-print print-only">${qty}</span>
        <span class="cart-item-unit-print print-only">$${fmtPrice(pVenta)}</span>
        <span class="cart-item-price">$${fmtPrice(subtotal)}</span>
        <button class="cart-item-remove" data-key="${escHtml(key)}">
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M1.5 1.5l8 8M9.5 1.5l-8 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
          Quitar
        </button>
      </div>
    `;

    div.querySelectorAll('.qty-btn').forEach(b => {
      b.addEventListener('click', () => {
        const delta = b.dataset.action === 'inc' ? 1 : -1;
        changeQty(b.dataset.key, delta);
      });
    });
    div.querySelector('.cart-item-remove').addEventListener('click', function() {
      removeFromCart(this.dataset.key);
    });

    cartItemsList.appendChild(div);
  });

  totalFinal.textContent = `$${fmtPrice(totalSum)}`;
}

// ── Modal detalle (rico, SADAR style, datos Maestro) ────────────────────────────
function openDetalle(p) {
  const codigo = p.code ?? '—';

  const images          = Array.isArray(p.images) ? p.images.slice() : [];
  const applications     = Array.isArray(p.applications) ? p.applications : [];
  const crossReferences  = Array.isArray(p.crossReferences) ? p.crossReferences : [];
  const suppliers        = Array.isArray(p.suppliers) ? p.suppliers : [];
  const dimensions       = p.dimensions && typeof p.dimensions === 'object' ? p.dimensions : {};
  const dimEntries       = Object.entries(dimensions).filter(([, v]) => v !== null && v !== undefined && v !== '');

  detalleCode.textContent = codigo;
  detalleVariantsCount.textContent = `${suppliers.length} proveedor${suppliers.length !== 1 ? 'es' : ''}`;
  detalleBody.innerHTML = '';
  detalleAdd.__rawProduct = p;

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
detalleAdd.addEventListener('click', () => {
  if (detalleAdd.__rawProduct) addToCart(adaptProduct(detalleAdd.__rawProduct));
});
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeDetalle(); });

// ── Drawer open/close ──────────────────────────────────────────
cartBtn.addEventListener('click', openDrawer);
drawerClose.addEventListener('click', closeDrawer);
drawerOverlay.addEventListener('click', closeDrawer);
btnClearCart.addEventListener('click', () => { if (confirm('¿Vaciar el presupuesto?')) clearCart(); });

function openDrawer() {
  drawer.classList.add('open');
  drawerOverlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeDrawer() {
  drawer.classList.remove('open');
  drawerOverlay.classList.remove('open');
  document.body.style.overflow = '';
}

// ── Imprimir ───────────────────────────────────────────────────
btnImprimir.addEventListener('click', () => {
  const printDate = document.getElementById('print-date');
  if (printDate) {
    const now = new Date();
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    printDate.textContent = `Fecha: ${now.toLocaleDateString('es-AR', options)}`;
  }
  const printItemsCount = document.getElementById('print-items-count');
  if (printItemsCount) {
    const entries = Object.entries(cart);
    const count = entries.reduce((s, [, i]) => s + i.qty, 0);
    printItemsCount.textContent = `· ${count} producto${count !== 1 ? 's' : ''}`;
  }
  const nombreInput = document.getElementById('cliente-nombre');
  const nombrePrint = document.getElementById('cliente-nombre-print');
  if (nombrePrint) nombrePrint.textContent = nombreInput ? nombreInput.value.trim() : '';

  const telInput = document.getElementById('cliente-tel');
  const telPrint = document.getElementById('cliente-tel-print');
  if (telPrint) telPrint.textContent = telInput ? telInput.value.trim() : '';

  openDrawer();
  setTimeout(() => window.print(), 100);
});

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
  rawItems = [];
  allProducts = [];
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
renderTableHead();
initColumnsMenu();
populateYears();
loadCart();
updateCartUI();
maestroBoot({ loaders: [loadCategorias, loadMarcas] });
