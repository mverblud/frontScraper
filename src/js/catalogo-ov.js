const API_BASE        = window.ENV.PRODUCTOS_BFF;
const HIDDEN_COLS_KEY  = 'ov_ov_hidden_cols';

// ── DOM refs ──────────────────────────────────────────────────────────────────
const pageSpinner        = document.getElementById('page-spinner');
const resultsSection     = document.getElementById('results-section');
const errorSection       = document.getElementById('error-section');
const errorMsg           = document.getElementById('error-msg');
const productsBody       = document.getElementById('products-body');
const resultsCount       = document.getElementById('results-count');
const resultsQuery       = document.getElementById('results-query');
const noResults          = document.getElementById('no-results');
const productsTable      = document.getElementById('products-table');
const tableFooter        = document.getElementById('table-footer');
const pageSizeSelect     = document.getElementById('page-size');
const paginationInfo     = document.getElementById('pagination-info');
const paginationControls = document.getElementById('pagination-controls');

// Product modal
const productModalOverlay  = document.getElementById('product-modal-overlay');
const productModal         = document.getElementById('product-modal');
const productModalClose    = document.getElementById('product-modal-close');
const productModalImg      = document.getElementById('product-modal-img');
const productModalNoPhoto  = document.getElementById('product-modal-no-photo');
const productModalCode     = document.getElementById('product-modal-code');
const productModalName     = document.getElementById('product-modal-name');
const productModalMarca    = document.getElementById('product-modal-marca');
const productModalRubro    = document.getElementById('product-modal-rubro');
const productModalFuente   = document.getElementById('product-modal-fuente');
const productModalLista    = document.getElementById('product-modal-lista');
const productModalCosto    = document.getElementById('product-modal-costo');
const productModalVenta    = document.getElementById('product-modal-venta');
const productModalIva      = document.getElementById('product-modal-iva');
const productModalDesc     = document.getElementById('product-modal-descuento');
const productModalMontoIva = document.getElementById('product-modal-monto-iva');
const productModalCostoNeto= document.getElementById('product-modal-costo-neto');
const productModalMargen   = document.getElementById('product-modal-margen');
const productModalGanancia = document.getElementById('product-modal-ganancia');
const productModalStock    = document.getElementById('product-modal-stock');

// Catalog modal
const catalogModalOverlay       = document.getElementById('catalog-modal-overlay');
const catalogModal              = document.getElementById('catalog-modal');
const catalogModalClose         = document.getElementById('catalog-modal-close');
const catalogModalCode          = document.getElementById('catalog-modal-code');
const catalogModalVariantsCount = document.getElementById('catalog-modal-variants-count');
const catalogModalBody          = document.getElementById('catalog-modal-body');

// Theme
const themeToggle = document.getElementById('theme-toggle');

// ── Columnas ──────────────────────────────────────────────────────────────────
const COLUMNS = [
  {
    key: 'foto', label: 'Foto', align: 'center',
    sortable: false, hideable: true, filter: null
  },
  {
    key: 'codigo', label: 'Código', align: 'left',
    sortable: true, hideable: true, filter: null,
    sortValue: p => String(p.codigo ?? '')
  },
  {
    key: 'ubicacion', label: 'Ubicación', align: 'left',
    sortable: true, hideable: true, filter: 'select',
    sortValue: p => String(p.ubicacion ?? '')
  },
  {
    key: 'stock', label: 'Stock', align: 'num',
    sortable: true, hideable: true, filter: null,
    sortValue: p => p.stock ?? null
  },
  {
    key: 'aplicacion', label: 'Aplicación', align: 'left',
    sortable: true, hideable: true, filter: null,
    sortValue: p => String(p.aplicacion ?? '')
  },
  {
    key: 'marca', label: 'Marca', align: 'left',
    sortable: true, hideable: true, filter: 'select',
    sortValue: p => String(p.marca ?? '')
  },
  {
    key: 'rubro', label: 'Rubro', align: 'left',
    sortable: true, hideable: true, filter: 'select',
    sortValue: p => String(p.rubro ?? '')
  },
  {
    key: 'precio-lista', label: 'Precio lista', align: 'num',
    sortable: true, hideable: true, filter: null,
    sortValue: p => p.precioLista ?? null
  },
  {
    key: 'iva-pct', label: 'IVA(%)', align: 'num',
    sortable: true, hideable: true, filter: null,
    sortValue: p => p.iva ?? null
  },
  {
    key: 'iva-monto', label: 'IVA($)', align: 'num',
    sortable: true, hideable: true, filter: null,
    sortValue: p => p.montoIVA ?? null
  },
  {
    key: 'desc-pct', label: 'Desc.(%)', align: 'num',
    sortable: true, hideable: true, filter: null,
    sortValue: p => p.descuento ?? null
  },
  {
    key: 'costo-neto', label: 'Costo Neto', align: 'num',
    sortable: true, hideable: true, filter: null,
    sortValue: p => p.costoNeto ?? null
  },
  {
    key: 'costo-iva', label: 'Costo IVA', align: 'num',
    sortable: true, hideable: true, filter: null,
    sortValue: p => p.costoIVA ?? null
  },
  {
    key: 'margen', label: 'Margen', align: 'num',
    sortable: true, hideable: true, filter: null,
    sortValue: p => p.margen ?? null
  },
  {
    key: 'p-sugerido', label: 'P.sugerido', align: 'num',
    sortable: true, hideable: true, filter: null,
    sortValue: p => p.precioSugerido ?? null
  },
  {
    key: 'ganancia', label: 'Ganancia', align: 'num',
    sortable: true, hideable: true, filter: null,
    sortValue: p => {
      const pv = p.precioSugerido ?? null;
      const ci = p.costoIVA      ?? null;
      return (pv != null && ci != null) ? Number(pv) - Number(ci) : null;
    }
  }
];

const SORT_ARROWS_SVG = `<svg class="sort-arrows" width="8" height="12" viewBox="0 0 8 12" fill="none" aria-hidden="true"><path class="arr-up" d="M4 1L1 5h6L4 1z"/><path class="arr-down" d="M4 11L1 7h6L4 11z"/></svg>`;

// ── Estado ────────────────────────────────────────────────────────────────────
let allProducts = [];
let currentPage = 1;
let pageSize    = parseInt(pageSizeSelect.value);
let sortKey = 'ubicacion';
let sortDir = 'asc';
let hiddenCols = new Set();
let filteredProducts = [];
let filters = {};

// ── Persistencia columnas ocultas ─────────────────────────────────────────────
function saveHiddenCols() {
  try { localStorage.setItem(HIDDEN_COLS_KEY, JSON.stringify([...hiddenCols])); } catch (_) {}
}
function loadHiddenCols() {
  try {
    const raw = localStorage.getItem(HIDDEN_COLS_KEY);
    if (raw) hiddenCols = new Set(JSON.parse(raw));
  } catch (_) { hiddenCols = new Set(); }
}

// ── Aplanar item OV ───────────────────────────────────────────────────────────
function flattenOvProduct(item) {
  return {
    ...item,
    codigo:     item.codigo     ?? '—',
    ubicacion:  item.ubicacion  ?? '—',
    stock:      item.stock      ?? null,
    aplicacion: item.aplicacion ?? '—',
    marca:      item.marca      ?? '—',
    rubro:      item.categoria  ?? '—',
  };
}

function getBrandColorClass(brandName) {
  const normalized = String(brandName ?? 'sin-marca').trim().toLowerCase();
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    hash = (hash * 31 + normalized.charCodeAt(i)) >>> 0;
  }
  return `brand-palette-${hash % 8}`;
}

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

// ── Encabezado de tabla ───────────────────────────────────────────────────────
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
      if (sortKey === col.key) th.classList.add(sortDir === 'asc' ? 'sort-asc' : 'sort-desc');
      th.innerHTML = `<span class="th-inner"><span class="th-label">${col.label}</span>${SORT_ARROWS_SVG}</span>`;
      th.addEventListener('click', () => setSort(col.key));
    } else {
      th.textContent = col.label;
    }
    row.appendChild(th);
  });
}

// ── Ordenamiento ──────────────────────────────────────────────────────────────
function setSort(key) {
  if (sortKey === key) sortDir = sortDir === 'asc' ? 'desc' : 'asc';
  else { sortKey = key; sortDir = 'asc'; }
  currentPage = 1;
  sortProducts();
  applyFilters();
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
    if (typeof va === 'number' && typeof vb === 'number') cmp = va - vb;
    else cmp = String(va).localeCompare(String(vb), 'es');
    return sortDir === 'asc' ? cmp : -cmp;
  });
}

// ── Filtrado ──────────────────────────────────────────────────────────────────
function applyFilters() {
  const activeFilters = COLUMNS.filter(col => {
    if (!col.filter || !col.sortValue) return false;
    const f = filters[col.key];
    if (f == null) return false;
    if (typeof f === 'string') return f !== '';
    if (typeof f === 'object') return f.min !== '' || f.max !== '';
    return false;
  });

  filteredProducts = activeFilters.length === 0
    ? allProducts.slice()
    : allProducts.filter(p =>
        activeFilters.every(col => {
          const v   = col.sortValue(p);
          const f   = filters[col.key];
          if (col.filter === 'text') {
            return String(v ?? '').toLowerCase().includes(f.toLowerCase());
          }
          if (col.filter === 'select') {
            return String(v ?? '') === f;
          }
          if (col.filter === 'range') {
            if (v == null) return false;
            const num = Number(v);
            if (f.min !== '' && !isNaN(Number(f.min)) && num < Number(f.min)) return false;
            if (f.max !== '' && !isNaN(Number(f.max)) && num > Number(f.max)) return false;
            return true;
          }
          return true;
        })
      );

}

// ── Visibilidad columnas ──────────────────────────────────────────────────────
function applyColumnVisibility() {
  COLUMNS.forEach(col => {
    if (!col.hideable) return;
    const hidden = hiddenCols.has(col.key);
    document.querySelectorAll(`[data-col="${col.key}"]`).forEach(el => {
      el.style.display = hidden ? 'none' : '';
    });
  });
}

// ── Menú columnas ─────────────────────────────────────────────────────────────
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
  btn.addEventListener('click', e => { e.stopPropagation(); menu.classList.toggle('open'); });
  document.addEventListener('click', e => {
    if (!menu.contains(e.target) && e.target !== btn) menu.classList.remove('open');
  });
}

// ── Fila de filtros ───────────────────────────────────────────────────────────
function renderFilterRow() {
  const row = document.getElementById('products-filter-row');
  if (!row) return;
  row.innerHTML = '';

  COLUMNS.forEach(col => {
    const th = document.createElement('th');
    th.className = 'filter-cell';
    th.dataset.col = col.key;

    if (col.filter === 'select') {
      const sel = document.createElement('select');
      sel.className = 'filter-select';

      const defOpt = document.createElement('option');
      defOpt.value = '';
      defOpt.textContent = 'Todas';
      sel.appendChild(defOpt);

      const vals = [...new Set(
        allProducts
          .map(p => col.sortValue ? col.sortValue(p) : null)
          .filter(v => v != null && v !== '' && v !== '—')
          .map(v => String(v))
      )].sort((a, b) => a.localeCompare(b, 'es'));

      vals.forEach(v => {
        const opt = document.createElement('option');
        opt.value = v;
        opt.textContent = v;
        sel.appendChild(opt);
      });

      sel.addEventListener('change', function() {
        const val = this.value;
        if (val === '') delete filters[col.key];
        else filters[col.key] = val;
        currentPage = 1;
        applyFilters();
        renderPage();
      });
      th.appendChild(sel);
    }
    // resto de columnas → celda vacía

    row.appendChild(th);
  });

  // Sincronizar visibilidad de columnas
  applyColumnVisibility();
}

// ── Cargar catálogo OV ────────────────────────────────────────────────────────
async function loadProducts() {
  setLoading(true);
  hideError();
  try {
    const res = await fetch(`${API_BASE}/productos/ov?page=1&limit=1000`);
    if (!res.ok) throw new Error(`Error del servidor: HTTP ${res.status}`);
    const data = await res.json();
    allProducts = (data.productos ?? []).map(flattenOvProduct);
    sortProducts();
    applyFilters();
    const total = data.totalProductos ?? allProducts.length;
    resultsCount.textContent = `${total} producto${total !== 1 ? 's' : ''}`;
    resultsQuery.textContent = 'Catálogo OV completo';
    currentPage = 1;
    resultsSection.style.display = '';
    renderFilterRow();
    renderPage();
  } catch (e) {
    showError(e.message || 'No se pudo conectar con el servidor.');
  } finally {
    setLoading(false);
  }
}

pageSizeSelect.addEventListener('change', () => {
  pageSize = parseInt(pageSizeSelect.value);
  currentPage = 1;
  renderPage();
});

// ── Render tabla ──────────────────────────────────────────────────────────────
function renderPage() {
  const total      = filteredProducts.length;
  const totalPages = Math.ceil(total / pageSize);
  if (currentPage > totalPages) currentPage = totalPages || 1;

  // Estado vacío (API sin datos o todos filtrados)
  if (total === 0) {
    productsBody.innerHTML = '';
    paginationInfo.innerHTML = '';
    renderPaginationControls(0);
    tableFooter.style.display   = 'none';
    productsTable.style.display = 'none';
    const sub = noResults.querySelector('.no-results-sub');
    if (sub) {
      sub.textContent = allProducts.length > 0
        ? 'Ningún producto coincide con los filtros aplicados.'
        : 'No encontramos productos en el catálogo OV.';
    }
    noResults.style.display = '';
    return;
  }

  noResults.style.display     = 'none';
  productsTable.style.display = '';

  const start = (currentPage - 1) * pageSize;
  const end   = Math.min(start + pageSize, total);
  const slice = filteredProducts.slice(start, end);

  productsBody.innerHTML = '';
  slice.forEach(p => {
    const tr          = document.createElement('tr');
    const codigo      = p.codigo         ?? '—';
    const ubicacion   = p.ubicacion      ?? '—';
    const stock       = p.stock          ?? null;
    const desc        = p.aplicacion     ?? '—';
    const marca       = p.marca          ?? '—';
    const brandClass  = getBrandColorClass(marca);
    const rubro       = p.rubro          ?? '—';
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
    let gananciaIndicatorIcon  = '<svg viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M2 6h8M7.5 3.5L10 6 7.5 8.5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>';

    if (ganancia != null) {
      if (ganancia > 15000) {
        gananciaIndicatorClass = 'ganancia-indicator-high';
        gananciaIndicatorTitle = 'Ganancia mayor a $15.000';
        gananciaIndicatorIcon  = '<svg viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M6 10V2M6 2L3.5 4.5M6 2l2.5 2.5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>';
      } else if (ganancia < 10000) {
        gananciaIndicatorClass = 'ganancia-indicator-low';
        gananciaIndicatorTitle = 'Ganancia menor a $10.000';
        gananciaIndicatorIcon  = '<svg viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M6 2v8M6 10L3.5 7.5M6 10l2.5-2.5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>';
      }
    }

    const gananciaCell = ganancia != null
      ? `<span class="ganancia-wrap"><span class="ganancia-indicator ${gananciaIndicatorClass}" title="${gananciaIndicatorTitle}">${gananciaIndicatorIcon}</span><span class="price-symbol">$</span>${gananciaStr}</span>`
      : '—';

    const catalogo = p.catalog ?? p.catalogo ?? null;
    const hasCatalogo = Array.isArray(catalogo) && catalogo.length > 0;

    tr.innerHTML = `
      <td class="td-foto" data-col="foto">
        ${foto ? `<img src="${escHtml(foto)}" alt="Foto del producto" class="product-thumb" loading="lazy" onerror="this.style.display='none'"/>` : '<span class="no-photo">—</span>'}
      </td>
      <td data-col="codigo">
        <span class="code-with-cat">
          <span class="td-code">${escHtml(String(codigo))}</span>
          ${hasCatalogo ? `<button class="btn-cat-link" title="Ver catálogo SADAR"><svg width="12" height="12" viewBox="0 0 16 16" fill="none"><rect x="2" y="1" width="10" height="14" rx="1.5" stroke="currentColor" stroke-width="1.5"/><path d="M5 5h6M5 8h6M5 11h3" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg></button>` : ''}
        </span>
      </td>
      <td data-col="ubicacion">${escHtml(String(ubicacion))}</td>
      <td class="td-num" data-col="stock">${stock != null ? stock : '—'}</td>
      <td class="td-aplicacion" data-col="aplicacion">${escHtml(String(desc))}</td>
      <td class="td-marca" data-col="marca"><span class="brand-badge ${escHtml(brandClass)}">${escHtml(String(marca))}</span></td>
      <td class="td-rubro" data-col="rubro"><span>${escHtml(String(rubro))}</span></td>
      <td class="td-precio-lista" data-col="precio-lista"><span class="price-symbol">$</span>${precioListaStr}</td>
      <td class="td-percent" data-col="iva-pct">${ivaStr}</td>
      <td class="td-costo-iva" data-col="iva-monto"><span class="price-symbol">$</span>${montoIvaStr}</td>
      <td class="td-percent" data-col="desc-pct">${descuentoStr}</td>
      <td class="td-costo" data-col="costo-neto"><span class="price-symbol">$</span>${costoNetoStr}</td>
      <td class="td-costo-iva" data-col="costo-iva"><span class="price-symbol">$</span>${costoIvaStr}</td>
      <td class="td-percent" data-col="margen">${margenStr}</td>
      <td class="td-precio-venta" data-col="p-sugerido"><span class="price-symbol">$</span>${precioVentaStr}</td>
      <td class="td-ganancia" data-col="ganancia">${gananciaCell}</td>
    `;

    const catBtn = tr.querySelector('.btn-cat-link');
    if (catBtn) {
      catBtn.__product = p;
      catBtn.addEventListener('click', function(e) { e.stopPropagation(); openCatalogModal(this.__product); });
    }

    const thumb = tr.querySelector('.product-thumb');
    if (thumb) {
      thumb.__product = p;
      thumb.addEventListener('click', function() { openProductModal(this.__product); });
    }

    productsBody.appendChild(tr);
  });

  paginationInfo.innerHTML = `Mostrando <strong>${start + 1}–${end}</strong> de <strong>${total}</strong>`;
  renderPaginationControls(totalPages);
  tableFooter.style.display = total > 0 ? '' : 'none';
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

// ── Product Modal ─────────────────────────────────────────────────────────────
function openProductModal(p) {
  const codigo      = p.codigo         ?? '—';
  const desc        = p.aplicacion     ?? '—';
  const marca       = p.marca          ?? '—';
  const rubro       = p.rubro          ?? '—';
  const foto        = p.imagen         ?? '';
  const precioLista = p.precioLista    ?? null;
  const costo       = p.costoIVA       ?? null;
  const precioVenta = p.precioSugerido ?? null;
  const iva         = p.iva            ?? null;
  const descuento   = p.descuento      ?? null;
  const montoIva    = p.montoIVA       ?? null;
  const margen      = p.margen         ?? null;
  const ganancia    = precioVenta != null && costo != null ? precioVenta - costo : null;
  const stock       = p.stock          ?? null;

  productModalCode.textContent       = String(codigo);
  productModalName.textContent       = String(desc);
  productModalMarca.textContent      = String(marca);
  productModalRubro.textContent      = String(rubro);
  productModalFuente.textContent     = 'OV';
  productModalLista.textContent      = precioLista != null ? `$${fmtPrice(precioLista)}` : '—';
  productModalCosto.textContent      = costo       != null ? `$${fmtPrice(costo)}`       : '—';
  productModalVenta.textContent      = precioVenta != null ? `$${fmtPrice(precioVenta)}` : '—';
  productModalIva.textContent        = iva         != null ? fmtPercent(iva)              : '—';
  productModalDesc.textContent       = descuento   != null ? fmtPercent(descuento)        : '—';
  productModalMontoIva.textContent   = montoIva    != null ? `$${fmtPrice(montoIva)}`    : '—';
  productModalCostoNeto.textContent  = p.costoNeto != null ? `$${fmtPrice(p.costoNeto)}` : '—';
  productModalMargen.textContent     = margen      != null ? fmtPercent(margen)           : '—';
  productModalGanancia.textContent   = ganancia    != null ? `$${fmtPrice(ganancia)}`     : '—';
  productModalStock.textContent      = stock       != null ? String(stock)                : '—';

  if (foto) {
    productModalImg.src = foto;
    productModalImg.style.display = '';
    productModalNoPhoto.classList.remove('visible');
  } else {
    productModalImg.src = '';
    productModalImg.style.display = 'none';
    productModalNoPhoto.classList.add('visible');
  }

  productModalOverlay.classList.add('open');
  productModal.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeProductModal() {
  productModalOverlay.classList.remove('open');
  productModal.classList.remove('open');
  document.body.style.overflow = '';
}

productModalClose.addEventListener('click', closeProductModal);
productModalOverlay.addEventListener('click', closeProductModal);
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { closeProductModal(); closeCatalogModal(); }
});

// ── Catalog Modal ─────────────────────────────────────────────────────────────
function openCatalogModal(p) {
  const catalogo = p.catalog ?? p.catalogo ?? [];
  catalogModalCode.textContent = String(p.codigo ?? '—');

  const totalVariants = catalogo.reduce((sum, item) => sum + (Array.isArray(item.variantes) ? item.variantes.length : 0), 0);
  catalogModalVariantsCount.textContent = `${totalVariants} variante${totalVariants !== 1 ? 's' : ''}`;
  catalogModalBody.innerHTML = '';

  if (catalogo.length === 0) {
    catalogModalBody.innerHTML = '<p class="sadar-empty">Sin datos de catálogo disponibles.</p>';
  } else {
    catalogo.forEach((item, itemIdx) => {
      if (catalogo.length > 1) {
        const h = document.createElement('div');
        h.className = 'sadar-section-label';
        h.style.cssText = 'margin-top:20px;margin-bottom:4px;';
        h.textContent = `Ítem ${itemIdx + 1}: ${item.codigo ?? '—'}`;
        catalogModalBody.appendChild(h);
      }
      const variantes = Array.isArray(item.variantes) ? item.variantes : [];
      if (variantes.length === 0) {
        const empty = document.createElement('p');
        empty.className = 'sadar-empty';
        empty.textContent = 'Sin variantes registradas.';
        catalogModalBody.appendChild(empty);
        return;
      }
      variantes.forEach((v, idx) => {
        const posicion   = v.posicion   ?? '';
        const estructura = v.estructura ?? '';
        const aplicacion = v.aplicacion ?? '';
        const dim        = v.dimensional ?? {};
        const equiv      = Array.isArray(v.equivalencia) ? v.equivalencia : Array.isArray(v.equivalencias) ? v.equivalencias : [];
        const apps       = Array.isArray(v.aplicaciones) ? v.aplicaciones : [];
        const qf         = v.quality_flags ?? {};
        const hasDim     = qf.has_dimensional || !!(dim.abierto || dim.cerrado || dim.superior || dim.inferior);

        const dimHtml = hasDim ? `
          <div class="sadar-section"><div class="sadar-section-label">Dimensional</div>
            <div class="sadar-dim-grid">
              ${dim.abierto  ? `<div class="sadar-dim-item"><span class="sadar-dim-label">Abierto</span><span class="sadar-dim-val">${escHtml(dim.abierto)}</span></div>`   : ''}
              ${dim.cerrado  ? `<div class="sadar-dim-item"><span class="sadar-dim-label">Cerrado</span><span class="sadar-dim-val">${escHtml(dim.cerrado)}</span></div>`   : ''}
              ${dim.superior ? `<div class="sadar-dim-item"><span class="sadar-dim-label">Superior</span><span class="sadar-dim-val">${escHtml(dim.superior)}</span></div>` : ''}
              ${dim.inferior ? `<div class="sadar-dim-item"><span class="sadar-dim-label">Inferior</span><span class="sadar-dim-val">${escHtml(dim.inferior)}</span></div>` : ''}
            </div></div>` : '';

        const equivHtml = equiv.length > 0 ? `
          <div class="sadar-section"><div class="sadar-section-label">Equivalencias (${equiv.length})</div>
            <div class="table-wrapper"><table class="sadar-apps-table">
              <thead><tr><th>Código</th><th>Marca</th></tr></thead>
              <tbody>${equiv.map(eq => {
                const eqCodigo = typeof eq === 'string' ? eq : (eq.codigo ?? eq.code ?? '—');
                const eqMarca  = typeof eq === 'string' ? '' : (eq.marca  ?? eq.brand ?? '—');
                return `<tr><td><span class="td-code">${escHtml(String(eqCodigo))}</span></td><td>${escHtml(String(eqMarca))}</td></tr>`;
              }).join('')}</tbody>
            </table></div></div>` : '';

        const appsHtml = apps.length > 0 ? `
          <div class="sadar-section"><div class="sadar-section-label">Aplicaciones (${apps.length})</div>
            <div class="table-wrapper"><table class="sadar-apps-table">
              <thead><tr><th>Fabricante</th><th>Modelo</th><th>Tipo</th><th class="th-num">Desde</th><th class="th-num">Hasta</th></tr></thead>
              <tbody>${apps.map(a => `
                <tr>
                  <td>${escHtml(a.fabricante ?? '—')}</td>
                  <td>${escHtml(a.modelo     ?? '—')}</td>
                  <td>${escHtml(a.tipo       ?? '—')}</td>
                  <td class="th-num">${escHtml(String(a.desde ?? '—'))}</td>
                  <td class="th-num">${escHtml(String(a.hasta ?? 'actualidad'))}</td>
                </tr>`).join('')}
              </tbody>
            </table></div></div>` : '';

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
          ${dimHtml}${equivHtml}${appsHtml}
        `;
        catalogModalBody.appendChild(varDiv);
      });
    });
  }

  catalogModalOverlay.classList.add('open');
  catalogModal.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeCatalogModal() {
  catalogModalOverlay.classList.remove('open');
  catalogModal.classList.remove('open');
  document.body.style.overflow = '';
}

catalogModalClose.addEventListener('click', closeCatalogModal);
catalogModalOverlay.addEventListener('click', e => { if (e.target === catalogModalOverlay) closeCatalogModal(); });

// ── Export CSV ────────────────────────────────────────────────────────────────
function escCsv(val) {
  if (val == null || val === '—') return '';
  const s = String(val);
  if (s.includes(';') || s.includes('"') || s.includes('\n') || s.includes('\r')) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

function buildCsv() {
  const headers = [
    'Código', 'Ubicación', 'Stock', 'Aplicación', 'Marca', 'Rubro',
    'Precio Lista', 'IVA (%)', 'IVA ($)', 'Descuento (%)',
    'Costo Neto', 'Costo IVA', 'Margen (%)', 'P. Sugerido', 'Ganancia'
  ];

  // Convierte a número con coma decimal; null → '0'
  const num = val => val != null ? String(Number(val)).replace('.', ',') : '0';

  const rows = allProducts.map(p => {
    const precioVenta = p.precioSugerido ?? null;
    const costoIva    = p.costoIVA       ?? null;
    const ganancia    = precioVenta != null && costoIva != null
      ? Number(precioVenta) - Number(costoIva)
      : null;

    return [
      escCsv(p.codigo),
      escCsv(p.ubicacion),
      num(p.stock),
      escCsv(p.aplicacion),
      escCsv(p.marca),
      escCsv(p.rubro),
      num(p.precioLista),
      num(p.iva),
      num(p.montoIVA),
      num(p.descuento),
      num(p.costoNeto),
      num(costoIva),
      num(p.margen),
      num(precioVenta),
      num(ganancia),
    ].join(';');
  });

  return [headers.join(';'), ...rows].join('\r\n');
}

function exportCsv() {
  if (allProducts.length === 0) return;
  const csv  = buildCsv();
  const bom  = '﻿';
  const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  const date = new Date().toISOString().slice(0, 10);
  a.href     = url;
  a.download = `catalogo-ov-${date}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtPrice(val) {
  return Number(val).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fmtPercent(val) {
  return `${Number(val).toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}%`;
}
function escHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function setLoading(on) {
  pageSpinner.style.display = on ? '' : 'none';
}
function hideError() { errorSection.style.display = 'none'; }
function showError(msg) { errorMsg.textContent = msg; errorSection.style.display = ''; }

// ── Start ─────────────────────────────────────────────────────────────────────
function init() {
  loadHiddenCols();
  renderTableHead();
  initColumnsMenu();
  document.getElementById('btn-export-csv').addEventListener('click', exportCsv);
  loadProducts();
}

init();
