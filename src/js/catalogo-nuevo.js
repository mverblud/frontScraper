const API_BASE = window.ENV.PRODUCTOS_BFF;
const CART_STORAGE_KEY    = 'ov_presupuesto';
const CLIENTE_STORAGE_KEY = 'ov_presupuesto_cliente';
const HIDDEN_COLS_KEY     = 'ov_nv_hidden_cols_v2';
const DEFAULT_HIDDEN_COLS = ['iva-pct', 'iva-monto', 'desc-pct', 'margen'];

// ── DOM refs ──────────────────────────────────────────────────────────────────
const rubroSelect        = document.getElementById('rubro');
const terminoInput       = document.getElementById('termino');
const terminoError       = document.getElementById('termino-error');
const terminoBadge       = document.getElementById('termino-badge');
const carBrandSelect     = document.getElementById('car-brand');
const carModelSelect     = document.getElementById('car-model');
const carModelError      = document.getElementById('car-model-error');
const btnBuscar          = document.getElementById('btn-buscar');
const btnLimpiar         = document.getElementById('btn-limpiar');
const loader             = document.getElementById('loader');
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
const productModalOverlay = document.getElementById('product-modal-overlay');
const productModal        = document.getElementById('product-modal');
const productModalClose   = document.getElementById('product-modal-close');
const productModalImg     = document.getElementById('product-modal-img');
const productModalNoPhoto = document.getElementById('product-modal-no-photo');
const productModalCode    = document.getElementById('product-modal-code');
const productModalName    = document.getElementById('product-modal-name');
const productModalMarca   = document.getElementById('product-modal-marca');
const productModalRubro   = document.getElementById('product-modal-rubro');
const productModalFuente  = document.getElementById('product-modal-fuente');
const productModalLista   = document.getElementById('product-modal-lista');
const productModalCosto   = document.getElementById('product-modal-costo');
const productModalVenta   = document.getElementById('product-modal-venta');
const productModalIva     = document.getElementById('product-modal-iva');
const productModalDesc    = document.getElementById('product-modal-descuento');
const productModalMontoIva= document.getElementById('product-modal-monto-iva');
const productModalCostoNeto= document.getElementById('product-modal-costo-neto');
const productModalMargen  = document.getElementById('product-modal-margen');
const productModalGanancia= document.getElementById('product-modal-ganancia');
const productModalStock   = document.getElementById('product-modal-stock');
const productModalAdd     = document.getElementById('product-modal-add');

// Catalog modal
const catalogModalOverlay      = document.getElementById('catalog-modal-overlay');
const catalogModal             = document.getElementById('catalog-modal');
const catalogModalClose        = document.getElementById('catalog-modal-close');
const catalogModalCode         = document.getElementById('catalog-modal-code');
const catalogModalVariantsCount= document.getElementById('catalog-modal-variants-count');
const catalogModalBody         = document.getElementById('catalog-modal-body');

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

// ── Configuración de columnas ─────────────────────────────────────────────────
// Fuente de verdad para thead, data-col, orden y visibilidad.
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
    key: 'aplicacion', label: 'Aplicación', align: 'left',
    sortable: true, hideable: true,
    sortValue: p => String(p.aplicacion ?? '')
  },
  {
    key: 'marca', label: 'Marca', align: 'left',
    sortable: true, hideable: true,
    sortValue: p => String(p.marca ?? p.marcaName ?? '')
  },
  {
    key: 'rubro', label: 'Rubro', align: 'left',
    sortable: true, hideable: true,
    sortValue: p => String(p.rubro ?? '')
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
      if (typeof p.hayStock === 'boolean') return p.hayStock ? 1 : 0;
      return p.stock != null ? (Number(p.stock) > 0 ? 1 : 0) : -1;
    }
  },
  {
    key: 'agregar', label: 'Agregar', align: 'center',
    sortable: false, hideable: false
  }
];

// Flecha SVG inline reutilizable en el <th>
const SORT_ARROWS_SVG = `<svg class="sort-arrows" width="8" height="12" viewBox="0 0 8 12" fill="none" aria-hidden="true"><path class="arr-up" d="M4 1L1 5h6L4 1z"/><path class="arr-down" d="M4 11L1 7h6L4 11z"/></svg>`;

// ── Estado ────────────────────────────────────────────────────────────────────
let allProducts = [];
let filterAplicacion = '';
let filterMarca      = new Set();
let filterRubro      = new Set();
let currentPage = 1;
let pageSize    = parseInt(pageSizeSelect.value);

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
      // Primera vez con esta versión: aplicar default
      hiddenCols = new Set(DEFAULT_HIDDEN_COLS);
    }
  } catch (_) { hiddenCols = new Set(DEFAULT_HIDDEN_COLS); }
}

// ── Normalizar producto ───────────────────────────────────────────────────────
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

  if (rawSource.includes('ramos')) return 'rm';
  if (rawSource.includes('rm')) return 'rm';
  if (rawSource.includes('asm')) return 'asm';
  return 'nv';
}

function getSourceLabel(sourceKey) {
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

    // Clase de alineación
    if (col.align === 'num')    th.classList.add('th-num');
    else if (col.align === 'center') th.classList.add('th-center');

    if (col.sortable) {
      th.classList.add('th-sortable');
      // Estado activo
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

// ── Ordenamiento ──────────────────────────────────────────────────────────────
function setSort(key) {
  if (sortKey === key) {
    sortDir = sortDir === 'asc' ? 'desc' : 'asc';
  } else {
    sortKey = key;
    sortDir = 'asc';
  }
  currentPage = 1;
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

    // Nulos / vacíos siempre al final
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

// ── Menú de columnas ──────────────────────────────────────────────────────────
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

// ── Init ──────────────────────────────────────────────────────────────────────
function init() {
  loadHiddenCols();
  renderTableHead();
  initColumnsMenu();
  initResultFilters();
  loadRubros();
  loadCars();
}

async function loadCars() {
  try {
    const res = await fetch(`${API_BASE}/cars?onlyEnabled=true`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    data.brands
      .slice()
      .sort((a, b) => String(a.name).localeCompare(String(b.name), 'es'))
      .forEach(b => {
        const opt = document.createElement('option');
        opt.value = b.id;
        opt.textContent = b.name;
        opt.dataset.models = JSON.stringify(
          b.models.slice().sort((x, y) => String(x.name).localeCompare(String(y.name), 'es'))
        );
        carBrandSelect.appendChild(opt);
      });
  } catch (e) {
    console.error('Error al cargar marcas de autos:', e);
  }
}

async function loadRubros() {
  try {
    const res = await fetch(`${API_BASE}/rubros?soloHabilitados=true`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    data.rubros.sort((a, b) => String(a.rubroNombre).localeCompare(String(b.rubroNombre), 'es'));
    data.rubros.forEach(r => {
      const opt = document.createElement('option');
      opt.value = r.rubroId;
      opt.textContent = r.rubroNombre;
      rubroSelect.appendChild(opt);
    });
  } catch (e) {
    console.error('Error al cargar rubros:', e);
  }
}

// ── Mutual exclusión brand/model ↔ termino ────────────────────────────────────
carBrandSelect.addEventListener('change', () => {
  const brandOpt = carBrandSelect.options[carBrandSelect.selectedIndex];
  const hasBrand = !!carBrandSelect.value;

  // Limpiar modelo
  carModelSelect.innerHTML = '';
  if (!hasBrand) {
    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = 'Seleccioná una marca primero';
    carModelSelect.appendChild(placeholder);
    carModelSelect.disabled = true;
    // Liberar termino si no hay modelo
    terminoInput.disabled = false;
    terminoBadge.textContent = 'Requerido';
    terminoBadge.className = 'required-badge';
  } else {
    const models = JSON.parse(brandOpt.dataset.models || '[]');
    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = 'Seleccioná un modelo';
    carModelSelect.appendChild(placeholder);
    models.forEach(m => {
      const opt = document.createElement('option');
      opt.value = m.name;
      opt.textContent = m.name;
      carModelSelect.appendChild(opt);
    });
    carModelSelect.disabled = false;
    // Bloquear termino
    terminoInput.disabled = true;
    terminoInput.value = '';
    terminoInput.classList.remove('has-error');
    terminoError.classList.remove('visible');
    terminoBadge.textContent = 'Opcional';
    terminoBadge.className = 'opt-badge';
  }
  carModelError.classList.remove('visible');
});

carModelSelect.addEventListener('change', () => {
  carModelError.classList.remove('visible');
});

// ── Validación ─────────────────────────────────────────────────────────────────
function validateTermino() {
  const val = terminoInput.value.trim();
  if (!val) {
    terminoInput.classList.add('has-error');
    terminoError.classList.add('visible');
    return false;
  }
  terminoInput.classList.remove('has-error');
  terminoError.classList.remove('visible');
  return true;
}
terminoInput.addEventListener('input', () => {
  const hasText = !!terminoInput.value.trim();
  if (hasText) {
    terminoInput.classList.remove('has-error');
    terminoError.classList.remove('visible');
    // Bloquear brand/model
    carBrandSelect.disabled = true;
    carModelSelect.disabled = true;
    carBrandSelect.value = '';
    carModelSelect.innerHTML = '<option value="">Seleccioná una marca primero</option>';
    carModelError.classList.remove('visible');
  } else {
    // Liberar brand/model
    carBrandSelect.disabled = false;
    if (!carBrandSelect.value) carModelSelect.disabled = true;
  }
});
terminoInput.addEventListener('keydown', e => { if (e.key === 'Enter') btnBuscar.click(); });
pageSizeSelect.addEventListener('change', () => {
  pageSize = parseInt(pageSizeSelect.value);
  currentPage = 1;
  renderPage();
});

// ── Buscar ─────────────────────────────────────────────────────────────────────
btnBuscar.addEventListener('click', async () => {
  const termino  = terminoInput.value.trim();
  const modelVal = carModelSelect.value.trim();
  const brandVal = carBrandSelect.value;
  const rubroId  = rubroSelect.value;

  // Determinar modo
  const usarTexto = !!termino && !brandVal;
  const usarCar   = !!modelVal;

  if (!usarTexto && !usarCar) {
    // Sin ningún dato útil
    if (brandVal && !modelVal) {
      carModelError.classList.add('visible');
      return;
    }
    if (!terminoInput.disabled) {
      terminoInput.classList.add('has-error');
      terminoError.classList.add('visible');
    }
    return;
  }

  if (usarCar && brandVal && !modelVal) {
    carModelError.classList.add('visible');
    return;
  }

  const codigoAuto = usarCar ? modelVal.toLowerCase() : termino;

  const requestBody = {
    codigoAuto,
    rubroId: rubroId ? parseInt(rubroId) : ""
  };

  setLoading(true);
  hideResults();
  hideError();

  try {
    const res = await fetch(`${API_BASE}/productos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });
    if (!res.ok) throw new Error(`Error del servidor: HTTP ${res.status}`);
    const data = await res.json();

    allProducts = data.productos ?? [];
    // Ordenar con el estado de orden actual (por defecto: marca asc)
    sortProducts();
    // Poblar y resetear filtros de resultados (client-side)
    populateResultFilters();

    const totalProductos = data.totalProductos ?? allProducts.length;

    resultsCount.textContent = `${totalProductos} producto${totalProductos !== 1 ? 's' : ''}`;

    const parts = [];
    if (usarCar) {
      const brandName = carBrandSelect.options[carBrandSelect.selectedIndex]?.textContent ?? brandVal;
      parts.push(`${brandName} · ${modelVal}`);
    } else {
      parts.push(`"${termino}"`);
    }
    if (rubroId) {
      const opt = rubroSelect.querySelector(`option[value="${rubroId}"]`);
      parts.push(`rubro: ${opt ? opt.textContent : rubroId}`);
    }
    resultsQuery.textContent = parts.join(' · ');

    currentPage = 1;
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
    showError(e.message || 'No se pudo conectar con el servidor.');
  } finally {
    setLoading(false);
  }
});

// ── Limpiar ────────────────────────────────────────────────────────────────────
btnLimpiar.addEventListener('click', () => {
  rubroSelect.value = '';
  terminoInput.value = '';
  terminoInput.disabled = false;
  terminoInput.classList.remove('has-error');
  terminoError.classList.remove('visible');
  terminoBadge.textContent = 'Requerido';
  terminoBadge.className = 'required-badge';
  carBrandSelect.value = '';
  carBrandSelect.disabled = false;
  carModelSelect.innerHTML = '<option value="">Seleccioná una marca primero</option>';
  carModelSelect.disabled = true;
  carModelError.classList.remove('visible');
  allProducts = [];
  filterAplicacion = '';
  filterMarca      = new Set();
  filterRubro      = new Set();
  const filterAplicacionInput = document.getElementById('filter-aplicacion');
  if (filterAplicacionInput) filterAplicacionInput.value = '';
  const filtersBar = document.getElementById('results-filters');
  if (filtersBar) filtersBar.style.display = 'none';
  currentPage = 1;
  hideResults();
  hideError();
});

// ── Filtros de resultados (client-side) ───────────────────────────────────────
function getFilteredProducts() {
  const q = filterAplicacion.trim().toLowerCase();
  return allProducts.filter(p => {
    if (q && !String(p.aplicacion ?? '').toLowerCase().includes(q)) return false;
    if (filterMarca.size && !filterMarca.has(p.marca ?? '')) return false;
    if (filterRubro.size && !filterRubro.has(p.rubro ?? '')) return false;
    return true;
  });
}

function buildPickerMenu(menuEl, btnEl, lblEl, values, activeSet, allLabel) {
  menuEl.innerHTML = '';

  values.forEach(val => {
    const lbl = document.createElement('label');
    lbl.className = 'rf-picker-item';

    const cb = document.createElement('input');
    cb.type    = 'checkbox';
    cb.value   = val;
    cb.checked = activeSet.has(val);
    cb.addEventListener('change', () => {
      if (cb.checked) activeSet.add(val);
      else            activeSet.delete(val);
      updatePickerLabel(lblEl, activeSet, allLabel);
      currentPage = 1;
      renderPage();
    });

    lbl.appendChild(cb);
    lbl.append(` ${val}`);
    menuEl.appendChild(lbl);
  });

  updatePickerLabel(lblEl, activeSet, allLabel);
}

function updatePickerLabel(lblEl, set, allLabel) {
  if (!lblEl) return;
  if (set.size === 0) {
    lblEl.textContent = allLabel;
  } else if (set.size === 1) {
    lblEl.textContent = [...set][0];
  } else {
    lblEl.textContent = `${set.size} seleccionadas`;
  }
}

function populateResultFilters() {
  // Resetear estado de filtros
  filterAplicacion = '';
  filterMarca      = new Set();
  filterRubro      = new Set();
  const filterAplicacionInput = document.getElementById('filter-aplicacion');
  if (filterAplicacionInput) filterAplicacionInput.value = '';

  // Marcas únicas ordenadas
  const marcas = [...new Set(allProducts.map(p => p.marca).filter(Boolean))].sort((a, b) =>
    String(a).localeCompare(String(b), 'es')
  );
  const menuMarca = document.getElementById('menu-filter-marca');
  const lblMarca  = document.getElementById('lbl-filter-marca');
  if (menuMarca) buildPickerMenu(menuMarca, null, lblMarca, marcas, filterMarca, 'Todas las marcas');

  // Rubros únicos ordenados
  const rubros = [...new Set(allProducts.map(p => p.rubro).filter(Boolean))].sort((a, b) =>
    String(a).localeCompare(String(b), 'es')
  );
  const menuRubro = document.getElementById('menu-filter-rubro');
  const lblRubro  = document.getElementById('lbl-filter-rubro');
  if (menuRubro) buildPickerMenu(menuRubro, null, lblRubro, rubros, filterRubro, 'Todos los rubros');

  // Mostrar barra de filtros
  const filtersBar = document.getElementById('results-filters');
  if (filtersBar) filtersBar.style.display = '';
}

function initResultFilters() {
  const filterAplicacionInput = document.getElementById('filter-aplicacion');
  if (filterAplicacionInput) {
    filterAplicacionInput.addEventListener('input', () => {
      filterAplicacion = filterAplicacionInput.value;
      currentPage = 1;
      renderPage();
    });
  }

  // Wiring open/close para cada picker
  [
    { pickerId: 'picker-marca', btnId: 'btn-filter-marca', menuId: 'menu-filter-marca' },
    { pickerId: 'picker-rubro', btnId: 'btn-filter-rubro', menuId: 'menu-filter-rubro' }
  ].forEach(({ pickerId, btnId, menuId }) => {
    const picker = document.getElementById(pickerId);
    const btn    = document.getElementById(btnId);
    const menu   = document.getElementById(menuId);
    if (!picker || !btn || !menu) return;

    btn.addEventListener('click', e => {
      e.stopPropagation();
      const isOpen = picker.classList.contains('open');
      // Cerrar todos los pickers abiertos
      document.querySelectorAll('.rf-picker.open').forEach(p => p.classList.remove('open'));
      if (!isOpen) picker.classList.add('open');
    });
  });

  document.addEventListener('click', e => {
    document.querySelectorAll('.rf-picker.open').forEach(picker => {
      if (!picker.contains(e.target)) picker.classList.remove('open');
    });
  });
}

// ── Render tabla ───────────────────────────────────────────────────────────────
function renderPage() {
  const filtered   = getFilteredProducts();
  const total      = filtered.length;
  const totalPages = Math.ceil(total / pageSize);
  if (currentPage > totalPages) currentPage = totalPages || 1;

  const start = (currentPage - 1) * pageSize;
  const end   = Math.min(start + pageSize, total);
  const slice = filtered.slice(start, end);

  productsBody.innerHTML = '';
  slice.forEach(p => {
    const tr = document.createElement('tr');
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
    const stockBool   = typeof p.hayStock === 'boolean'
      ? p.hayStock
      : (p.stock != null ? Number(p.stock) > 0 : null);

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
    const cartKey     = `${sourceKey}:${codigo}`;
    const inCart      = !!cart[cartKey];
    const catalogo    = p.catalog ?? p.catalogo ?? null;
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
      <td class="td-aplicacion" data-col="aplicacion">${escHtml(String(desc))}</td>
      <td class="td-marca" data-col="marca"><span class="brand-badge ${escHtml(brandClass)}">${escHtml(String(marca))}</span></td>
      <td class="td-rubro" data-col="rubro"><span>${escHtml(String(rubro))}</span></td>
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
      <td class="td-stock" data-col="stock" style="text-align:center">
        ${stockBool === null
          ? '<span>—</span>'
          : `<span class="stock-badge ${stockBool ? 'stock-yes' : 'stock-no'}">${stockBool ? 'Sí' : 'No'}</span>`
        }
      </td>
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

    // Toggle agregar/quitar
    const addBtn = tr.querySelector('.btn-add');
    addBtn.__product = p;
    addBtn.addEventListener('click', function() {
      const key = this.dataset.key;
      if (cart[key]) removeFromCart(key);
      else addToCart(this.__product);
    });

    // Botón de catálogo SADAR
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

  // Aplicar visibilidad después de renderizar filas
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

// ═══════════════════════════════════════════════════════════════
// ── CARRITO / PRESUPUESTO ──────────────────────────────────────
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

  drawerEmpty.style.display    = entries.length === 0 ? '' : 'none';
  drawerTotals.style.display   = entries.length > 0 ? '' : 'none';
  btnImprimir.style.display    = entries.length > 0 ? '' : 'none';

  cartItemsList.innerHTML = '';
  let totalSum = 0;

  entries.forEach(([key, { product, qty }]) => {
    const codigo = product.codigo ?? '—';
    const desc   = product.nombre ?? '—';
    const marca  = product.marca ?? '';
    const pVenta = Number(product.precioVenta) || 0;
    const subtotal = pVenta * qty;
    totalSum += subtotal;

    const sourceTag = product._source === 'rm' ? 'RM' : product._source === 'asm' ? 'ASM' : product._source === 'nv' ? 'NV' : '';

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

// ── Product Modal ──────────────────────────────────────────────
function openProductModal(p) {
  const codigo      = p.codigo         ?? '—';
  const desc        = p.aplicacion     ?? '—';
  const marca       = p.marca          ?? '—';
  const rubro       = p.rubro          ?? '—';
  const sourceKey   = getSourceKey(p);
  const sourceLabel = getSourceLabel(sourceKey);
  const foto        = p.imagen         ?? '';
  const precioLista = p.precioLista    ?? null;
  const costo       = p.costoIVA       ?? null;
  const precioVenta = p.precioSugerido ?? null;
  const iva         = p.iva            ?? null;
  const descuento   = p.descuento      ?? null;
  const montoIva    = p.montoIVA       ?? null;
  const costoIva    = p.costoIVA       ?? null;
  const margen      = p.margen         ?? null;
  const ganancia    = precioVenta != null && costoIva != null ? precioVenta - costoIva : null;
  const stockBool   = typeof p.hayStock === 'boolean'
    ? p.hayStock
    : (p.stock != null ? Number(p.stock) > 0 : null);

  productModalCode.textContent  = String(codigo);
  productModalName.textContent  = String(desc);
  productModalMarca.textContent = String(marca);
  productModalRubro.textContent = String(rubro);
  productModalFuente.textContent = sourceLabel;
  productModalLista.textContent = precioLista != null ? `$${fmtPrice(precioLista)}` : '—';
  productModalCosto.textContent = costo       != null ? `$${fmtPrice(costo)}`       : '—';
  productModalVenta.textContent = precioVenta != null ? `$${fmtPrice(precioVenta)}` : '—';
  productModalIva.textContent   = iva         != null ? fmtPercent(iva)              : '—';
  productModalDesc.textContent  = descuento   != null ? fmtPercent(descuento)        : '—';
  productModalMontoIva.textContent = montoIva != null ? `$${fmtPrice(montoIva)}`     : '—';
  productModalCostoNeto.textContent = p.costoNeto != null ? `$${fmtPrice(p.costoNeto)}` : '—';
  productModalMargen.textContent   = margen   != null ? fmtPercent(margen)           : '—';
  productModalGanancia.textContent = ganancia != null ? `$${fmtPrice(ganancia)}`     : '—';
  productModalStock.textContent = stockBool === null ? '—' : (stockBool ? 'Sí' : 'No');
  productModalStock.classList.remove('stock-yes', 'stock-no');
  if (stockBool !== null) productModalStock.classList.add(stockBool ? 'stock-yes' : 'stock-no');

  if (foto) {
    productModalImg.src = foto;
    productModalImg.style.display = '';
    productModalNoPhoto.classList.remove('visible');
  } else {
    productModalImg.src = '';
    productModalImg.style.display = 'none';
    productModalNoPhoto.classList.add('visible');
  }

  productModalAdd.__product = p;

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
document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeProductModal(); closeCatalogModal(); } });
productModalAdd.addEventListener('click', function() {
  if (this.__product) addToCart(this.__product);
  closeProductModal();
});

// ── Catalog Modal (SADAR style) ────────────────────────────────
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
        const itemHeader = document.createElement('div');
        itemHeader.className = 'sadar-section-label';
        itemHeader.style.cssText = 'margin-top:20px;margin-bottom:4px;';
        itemHeader.textContent = `Ítem ${itemIdx + 1}: ${item.codigo ?? '—'}`;
        catalogModalBody.appendChild(itemHeader);
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

        const hasDim = qf.has_dimensional || !!(dim.abierto || dim.cerrado || dim.superior || dim.inferior);

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
                <thead><tr><th>Código</th><th>Marca</th></tr></thead>
                <tbody>
                  ${equiv.map(eq => {
                    const eqCodigo = typeof eq === 'string' ? eq : (eq.codigo ?? eq.code ?? '—');
                    const eqMarca  = typeof eq === 'string' ? '' : (eq.marca  ?? eq.brand ?? '—');
                    return `<tr><td><span class="td-code">${escHtml(String(eqCodigo))}</span></td><td>${escHtml(String(eqMarca))}</td></tr>`;
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
                  <tr><th>Fabricante</th><th>Modelo</th><th>Tipo</th><th class="th-num">Desde</th><th class="th-num">Hasta</th></tr>
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

// ── Ver presupuesto (navega a la pantalla de detalle/generación) ───────────────
btnImprimir.addEventListener('click', () => {
  const nombreInput = document.getElementById('cliente-nombre');
  const telInput    = document.getElementById('cliente-tel');
  try {
    localStorage.setItem(CLIENTE_STORAGE_KEY, JSON.stringify({
      nombre:   nombreInput ? nombreInput.value.trim() : '',
      telefono: telInput    ? telInput.value.trim()    : ''
    }));
  } catch (_) {}
  window.location.href = 'presupuesto-detalle.html';
});

// ── Helpers ───────────────────────────────────────────────────
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

// ── Start ─────────────────────────────────────────────────────
init();
loadCart();
updateCartUI();
