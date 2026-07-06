const API_BASE = window.ENV.PRODUCTOS_BFF;
const CART_STORAGE_KEY = 'ov_presupuesto';
const HIDDEN_COLS_KEY  = 'ov_rm_hidden_cols';

// ── Definición de columnas ─────────────────────────────────────────────────────
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
    sortValue: p => String(p.marca ?? '')
  },
  {
    key: 'rubro', label: 'Rubro', align: 'left',
    sortable: true, hideable: true,
    sortValue: p => String(p.rubro ?? '')
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
    key: 'agregar', label: 'Agregar', align: 'center',
    sortable: false, hideable: false
  }
];

// Flecha SVG inline reutilizable en el <th>
const SORT_ARROWS_SVG = `<svg class="sort-arrows" width="8" height="12" viewBox="0 0 8 12" fill="none" aria-hidden="true"><path class="arr-up" d="M4 1L1 5h6L4 1z"/><path class="arr-down" d="M4 11L1 7h6L4 11z"/></svg>`;

// ── DOM refs ──────────────────────────────────────────────────────────────────
const marcaSelect        = document.getElementById('marca');
const rubroSelect        = document.getElementById('rubro');
const terminoInput       = document.getElementById('termino');
const terminoError       = document.getElementById('termino-error');
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
const catalogModalOverlay = document.getElementById('catalog-modal-overlay');
const catalogModal        = document.getElementById('catalog-modal');
const catalogModalClose   = document.getElementById('catalog-modal-close');
const catalogModalCode    = document.getElementById('catalog-modal-code');
const catalogModalName    = document.getElementById('catalog-modal-name');
const catalogModalBody    = document.getElementById('catalog-modal-body');

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

// ── Estado ────────────────────────────────────────────────────────────────────
let allProducts = [];
let currentPage = 1;
let pageSize    = parseInt(pageSizeSelect.value);

let sortKey = 'marca';
let sortDir = 'asc';
let hiddenCols = new Set();

// carrito compartido: { [key]: { product, qty } }
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

// ── Normalizar producto RM ────────────────────────────────────────────────────
function normalizeRmProduct(p) {
  return {
    codigo: p.codigo ?? '—',
    nombre: p.aplicacion ?? '—',
    marca: p.marca ?? '—',
    rubro: p.rubro ?? '—',
    foto: p.imagen ?? '',
    precioVenta: p.precioSugerido ?? 0,
    _source: 'rm'
  };
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
// Restaurar tema guardado
applyTheme(localStorage.getItem('theme') || 'dark');

// ── Init ──────────────────────────────────────────────────────────────────────
function init() {
  loadMarcas();
  loadRubros();
}

function loadMarcas() {
  const marcas = [
    { marcaId: 1, marcaName: "ADON", marcaHabilitado: true },
    { marcaId: 2, marcaName: "AF CABLES", marcaHabilitado: true },
    { marcaId: 3, marcaName: "APEX", marcaHabilitado: true },
    { marcaId: 4, marcaName: "BRK (IMPORTADO)", marcaHabilitado: true },
    { marcaId: 5, marcaName: "CEPERGOM", marcaHabilitado: true },
    { marcaId: 6, marcaName: "CORVEN", marcaHabilitado: true },
    { marcaId: 7, marcaName: "CRAVERO (NACIONAL)", marcaHabilitado: true },
    { marcaId: 8, marcaName: "DAUER", marcaHabilitado: true },
    { marcaId: 9, marcaName: "DEXCO", marcaHabilitado: true },
    { marcaId: 10, marcaName: "DIMET", marcaHabilitado: true },
    { marcaId: 11, marcaName: "DINAMARCA", marcaHabilitado: true },
    { marcaId: 12, marcaName: "DS SUSPENSION", marcaHabilitado: true },
    { marcaId: 13, marcaName: "EUROMOTOR", marcaHabilitado: true },
    { marcaId: 14, marcaName: "FAREPA", marcaHabilitado: true },
    { marcaId: 15, marcaName: "FRENOS SILENT", marcaHabilitado: true },
    { marcaId: 16, marcaName: "FTE (ORIGINAL)", marcaHabilitado: true },
    { marcaId: 17, marcaName: "GAMBINA", marcaHabilitado: true },
    { marcaId: 18, marcaName: "HELIODINO", marcaHabilitado: true },
    { marcaId: 19, marcaName: "HIPPER FREIOS", marcaHabilitado: true },
    { marcaId: 20, marcaName: "HUTCHINSON", marcaHabilitado: true },
    { marcaId: 21, marcaName: "ICSA", marcaHabilitado: true },
    { marcaId: 22, marcaName: "IMPORTADO", marcaHabilitado: true },
    { marcaId: 23, marcaName: "IR ARGENTINA", marcaHabilitado: true },
    { marcaId: 24, marcaName: "IR ESPAÑA", marcaHabilitado: true },
    { marcaId: 26, marcaName: "LEO", marcaHabilitado: true },
    { marcaId: 27, marcaName: "LIFTGATE", marcaHabilitado: true },
    { marcaId: 28, marcaName: "LITTON (NA)", marcaHabilitado: true },
    { marcaId: 29, marcaName: "LITTON (ULTRA PAD)", marcaHabilitado: true },
    { marcaId: 30, marcaName: "LUGA", marcaHabilitado: true },
    { marcaId: 31, marcaName: "MARIN (NACIONAL)", marcaHabilitado: true },
    { marcaId: 32, marcaName: "ML GOMA", marcaHabilitado: true },
    { marcaId: 34, marcaName: "NACIONAL", marcaHabilitado: true },
    { marcaId: 37, marcaName: "PHALES", marcaHabilitado: true },
    { marcaId: 38, marcaName: "PINTARELLI", marcaHabilitado: true },
    { marcaId: 39, marcaName: "PRUYER PARTS", marcaHabilitado: true },
    { marcaId: 40, marcaName: "RECORD (IMPORTADO)", marcaHabilitado: true },
    { marcaId: 41, marcaName: "REMSA (ESPAÑA)", marcaHabilitado: true },
    { marcaId: 42, marcaName: "RESORTES CAR", marcaHabilitado: true },
    { marcaId: 43, marcaName: "RODA", marcaHabilitado: true },
    { marcaId: 44, marcaName: "RODAX", marcaHabilitado: true },
    { marcaId: 45, marcaName: "ROLL", marcaHabilitado: true },
    { marcaId: 46, marcaName: "SADAR", marcaHabilitado: true },
    { marcaId: 48, marcaName: "TRINTER", marcaHabilitado: true },
    { marcaId: 49, marcaName: "VALEO", marcaHabilitado: true },
    { marcaId: 50, marcaName: "VIEMAR", marcaHabilitado: true },
    { marcaId: 51, marcaName: "DUPLA", marcaHabilitado: true },
    { marcaId: 52, marcaName: "SADAR REPUESTOS", marcaHabilitado: true },
    { marcaId: 53, marcaName: "OS IMPORTADA", marcaHabilitado: true },
    { marcaId: 54, marcaName: "GRZ METAL", marcaHabilitado: true },
    { marcaId: 55, marcaName: "GFA", marcaHabilitado: true },
    { marcaId: 56, marcaName: "IMBASA", marcaHabilitado: true },
    { marcaId: 57, marcaName: "IRAUTO", marcaHabilitado: true },
    { marcaId: 1000, marcaName: "SIN MARCA", marcaHabilitado: true }
  ];

  // Cargar solo marcas habilitadas
  marcas
    .filter(m => m.marcaHabilitado)
    .forEach(m => {
      const opt = document.createElement('option');
      opt.value = m.marcaId;
      opt.textContent = m.marcaName;
      marcaSelect.appendChild(opt);
    });
}

function loadRubros() {
  const rubros = [
    { rubroId: 1, rubroName: "ABRAZADERA DE CAJA DE DIRECCION", rubroHabilitado: true },
    { rubroId: 2, rubroName: "ABRAZADERA DE EJE DE PARRILLA", rubroHabilitado: true },
    { rubroId: 3, rubroName: "ABRAZADERA DE HOMICINETICA", rubroHabilitado: true },
    { rubroId: 4, rubroName: "ABRAZADERA DE SUSPENSION", rubroHabilitado: true },
    { rubroId: 5, rubroName: "ACOPLE DE CREMALLERA", rubroHabilitado: true },
    { rubroId: 6, rubroName: "ACOPLE DE DIRECCION", rubroHabilitado: true },
    { rubroId: 7, rubroName: "ACOPLE TENSOR", rubroHabilitado: true },
    { rubroId: 8, rubroName: "ACTUADORES HIDRAULICOS", rubroHabilitado: true },
    { rubroId: 10, rubroName: "AMORTIGUADOR", rubroHabilitado: true },
    { rubroId: 11, rubroName: "AMORTIGUADOR ESTABILIZADOR", rubroHabilitado: true },
    { rubroId: 12, rubroName: "AMORTIGUADOR RALLY", rubroHabilitado: true },
    { rubroId: 13, rubroName: "ARANDELA JUNTA HOMOCINETA", rubroHabilitado: true },
    { rubroId: 14, rubroName: "AXIAL DE CREMALLERA", rubroHabilitado: true },
    { rubroId: 15, rubroName: "BARRA DE DIRECCION", rubroHabilitado: true },
    { rubroId: 16, rubroName: "BARRA TENSORA", rubroHabilitado: true },
    { rubroId: 17, rubroName: "BASE DE ESPIRAL", rubroHabilitado: true },
    { rubroId: 18, rubroName: "BIELETA DE SUSPENSION", rubroHabilitado: true },
    { rubroId: 22, rubroName: "BOMBA DE FRENO", rubroHabilitado: true },
    { rubroId: 23, rubroName: "BOMBA DIRECCION HIDRAULICA", rubroHabilitado: true },
    { rubroId: 24, rubroName: "BRAZO AUXILIAR DE DIRECCION", rubroHabilitado: true },
    { rubroId: 25, rubroName: "BRAZO DE ROTULA", rubroHabilitado: true },
    { rubroId: 26, rubroName: "BRAZO PITMAN DE DIRECCION", rubroHabilitado: true },
    { rubroId: 27, rubroName: "BRAZO SUSPENSION", rubroHabilitado: true },
    { rubroId: 28, rubroName: "BUJE DE SUSPENSION", rubroHabilitado: true },
    { rubroId: 29, rubroName: "BULON DE EJE DE PARRILLA", rubroHabilitado: true },
    { rubroId: 31, rubroName: "CABLE DE FRENO", rubroHabilitado: true },
    { rubroId: 33, rubroName: "CAJA DE DIRECCION (PICK UP)", rubroHabilitado: true },
    { rubroId: 34, rubroName: "CAJA DE DIRECCION REPARADA", rubroHabilitado: true },
    { rubroId: 35, rubroName: "CAMPANA DE FRENO", rubroHabilitado: true },
    { rubroId: 36, rubroName: "CAZOLETA DE SUSPENSION", rubroHabilitado: true },
    { rubroId: 37, rubroName: "CILINDRO DE RUEDA", rubroHabilitado: true },
    { rubroId: 38, rubroName: "COLUMNA DE DIRECCION", rubroHabilitado: true },
    { rubroId: 42, rubroName: "CRAPODINA DE SUSPENSION", rubroHabilitado: true },
    { rubroId: 43, rubroName: "CAJA DIR. ELEC. ASIST.", rubroHabilitado: true },
    { rubroId: 44, rubroName: "CAJA DIR. HIDRAULICA", rubroHabilitado: true },
    { rubroId: 45, rubroName: "CAJA DIR. MECANICA", rubroHabilitado: true },
    { rubroId: 46, rubroName: "CAJA DIR. REPARADA", rubroHabilitado: true },
    { rubroId: 47, rubroName: "CRUCETA DE CARDAN", rubroHabilitado: true },
    { rubroId: 48, rubroName: "CRUCETA DE DIRECCION", rubroHabilitado: true },
    { rubroId: 49, rubroName: "DESPIECE CAJA DE DIRECCION", rubroHabilitado: true },
    { rubroId: 50, rubroName: "DISCO DE FRENO", rubroHabilitado: true },
    { rubroId: 51, rubroName: "EJE DE PARRILLA", rubroHabilitado: true },
    { rubroId: 54, rubroName: "EQUILIBRADOR DE BAUL Y COMPUERTA", rubroHabilitado: true },
    { rubroId: 55, rubroName: "ESPIGA DE SEMIEJE", rubroHabilitado: true },
    { rubroId: 56, rubroName: "EXTREMO DE DIRECCION", rubroHabilitado: true },
    { rubroId: 57, rubroName: "FUELLE DE AMORTIGUADOR", rubroHabilitado: true },
    { rubroId: 58, rubroName: "FUELLE DE CARDAN", rubroHabilitado: true },
    { rubroId: 59, rubroName: "FUELLE DE CREMALLERA", rubroHabilitado: true },
    { rubroId: 60, rubroName: "FUELLE DE SEMIEJE", rubroHabilitado: true },
    { rubroId: 61, rubroName: "GRASA SEMIEJE", rubroHabilitado: true },
    { rubroId: 62, rubroName: "JUNTA DESLIZANTE", rubroHabilitado: true },
    { rubroId: 63, rubroName: "JUNTA HOMOCINETICA", rubroHabilitado: true },
    { rubroId: 64, rubroName: "KIT DE BUJES DE SUSPENSION", rubroHabilitado: true },
    { rubroId: 66, rubroName: "MANCHON DE CARDAN", rubroHabilitado: true },
    { rubroId: 67, rubroName: "MANCHON DE DIRECCION", rubroHabilitado: true },
    { rubroId: 68, rubroName: "MAZA DE RUEDA", rubroHabilitado: true },
    { rubroId: 69, rubroName: "MONTANTE DE EJE DE PARRILLA", rubroHabilitado: true },
    { rubroId: 70, rubroName: "PALIER", rubroHabilitado: true },
    { rubroId: 71, rubroName: "PALIER FLOTANTE", rubroHabilitado: true },
    { rubroId: 72, rubroName: "PARRILLA DE SUSPENSION", rubroHabilitado: true },
    { rubroId: 73, rubroName: "PASTILLA DE FRENO", rubroHabilitado: true },
    { rubroId: 74, rubroName: "PLATO AMORTIGUADOR-ESPIRAL", rubroHabilitado: true },
    { rubroId: 77, rubroName: "PUNTA (MANGA DIFERENCIAL)", rubroHabilitado: true },
    { rubroId: 78, rubroName: "PUNTA DE EJE", rubroHabilitado: true },
    { rubroId: 80, rubroName: "REPARACION EJE TRAS (TORRINGTON)", rubroHabilitado: true },
    { rubroId: 81, rubroName: "RESORTE DE SUSPENSION PROGRESIVO", rubroHabilitado: true },
    { rubroId: 82, rubroName: "RESORTE DE SUSPENSION RALLY", rubroHabilitado: true },
    { rubroId: 83, rubroName: "RESORTE DE SUSPENSION STANDART", rubroHabilitado: true },
    { rubroId: 84, rubroName: "RODAMIENTO DE RUEDA", rubroHabilitado: true },
    { rubroId: 85, rubroName: "RODAMIENTO DE SEMIEJE", rubroHabilitado: true },
    { rubroId: 86, rubroName: "ROTULA DE SUSPENSION", rubroHabilitado: true },
    { rubroId: 88, rubroName: "SECTOR DE DIRECCION", rubroHabilitado: true },
    { rubroId: 89, rubroName: "SEGURO DE ROTULA", rubroHabilitado: true },
    { rubroId: 90, rubroName: "SEMIEJE", rubroHabilitado: true },
    { rubroId: 91, rubroName: "SINFIN DE DIRECCION", rubroHabilitado: true },
    { rubroId: 92, rubroName: "SOPORTE ADON VARIOS", rubroHabilitado: true },
    { rubroId: 93, rubroName: "SOPORTE CAÑO DE ESCAPE", rubroHabilitado: true },
    { rubroId: 94, rubroName: "SOPORTE DE AMORTIGUADOR", rubroHabilitado: true },
    { rubroId: 95, rubroName: "SOPORTE DE CABINA Y CARROCERIA", rubroHabilitado: true },
    { rubroId: 96, rubroName: "SOPORTE DE CARDAN", rubroHabilitado: true },
    { rubroId: 97, rubroName: "SOPORTE DE ELASTICO", rubroHabilitado: true },
    { rubroId: 98, rubroName: "SOPORTE DE MOTOR / CAJA / DIFERENCIAL", rubroHabilitado: true },
    { rubroId: 99, rubroName: "SOPORTE DE RADIDADOR", rubroHabilitado: true },
    { rubroId: 100, rubroName: "TENSOR DE SUSPENSION", rubroHabilitado: true },
    { rubroId: 101, rubroName: "TOPE DE SUSPENSION", rubroHabilitado: true },
    { rubroId: 102, rubroName: "TRICETA DE SEMIEJE", rubroHabilitado: true },
    { rubroId: 103, rubroName: "TUBO EJE TRASERO", rubroHabilitado: true },
    { rubroId: 104, rubroName: "TUERCAS VARIAS", rubroHabilitado: true }
  ];

  // Cargar solo rubros habilitados
  rubros
    .filter(r => r.rubroHabilitado)
    .forEach(r => {
      const opt = document.createElement('option');
      opt.value = r.rubroId;
      opt.textContent = r.rubroName;
      rubroSelect.appendChild(opt);
    });
}

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
  if (terminoInput.value.trim()) {
    terminoInput.classList.remove('has-error');
    terminoError.classList.remove('visible');
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
  if (!validateTermino()) return;

  const termino = terminoInput.value.trim();
  const marcaId = marcaSelect.value;
  const rubroId = rubroSelect.value;

  const requestBody = {
    codigoAuto: termino,
    marcaId: marcaId || "",
    rubroId: rubroId || "",
    cantidadRenglones: 500
  };

  setLoading(true);
  hideResults();
  hideError();

  try {
    const res = await fetch(`${API_BASE}/productos/ramos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    if (!res.ok) throw new Error(`Error del servidor: HTTP ${res.status}`);
    const data = await res.json();
    
    // Adaptar al nuevo formato de respuesta
    allProducts = data.productos ?? [];
    const totalProductos = data.totalProductos ?? allProducts.length;

    resultsCount.textContent = `${totalProductos} producto${totalProductos !== 1 ? 's' : ''}`;

    const parts = [`"${termino}"`];
    if (marcaId) {
      const opt = marcaSelect.querySelector(`option[value="${marcaId}"]`);
      parts.push(`marca: ${opt ? opt.textContent : marcaId}`);
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
      sortProducts();
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
  marcaSelect.value = '';
  rubroSelect.value = '';
  terminoInput.value = '';
  terminoInput.classList.remove('has-error');
  terminoError.classList.remove('visible');
  allProducts = [];
  currentPage = 1;
  hideResults();
  hideError();
});

// ── Persistencia columnas ocultas ──────────────────────────────────────────────
function saveHiddenCols() {
  try { localStorage.setItem(HIDDEN_COLS_KEY, JSON.stringify([...hiddenCols])); } catch (_) {}
}
function loadHiddenCols() {
  try {
    const raw = localStorage.getItem(HIDDEN_COLS_KEY);
    if (raw) hiddenCols = new Set(JSON.parse(raw));
  } catch (_) { hiddenCols = new Set(); }
}

// ── Encabezado de tabla (generado desde COLUMNS) ───────────────────────────────
function renderTableHead() {
  const row = document.getElementById('products-head-row');
  row.innerHTML = '';

  COLUMNS.forEach(col => {
    const th = document.createElement('th');
    th.dataset.col = col.key;

    if (col.align === 'num')         th.classList.add('th-num');
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

// ── Render tabla ───────────────────────────────────────────────────────────────
function renderPage() {
  const total      = allProducts.length;
  const totalPages = Math.ceil(total / pageSize);
  if (currentPage > totalPages) currentPage = totalPages || 1;

  const start = (currentPage - 1) * pageSize;
  const end   = Math.min(start + pageSize, total);
  const slice = allProducts.slice(start, end);

  productsBody.innerHTML = '';
  slice.forEach(p => {
    const tr = document.createElement('tr');
    const codigo      = p.codigo      ?? '—';
    const desc        = p.aplicacion ?? '—';
    const marca       = p.marca ?? '—';
    const rubro       = p.rubro ?? '—';
    const foto        = p.imagen ?? '';
    const precioLista = p.precioLista ?? null;
    const montoIva    = p.montoIVA ?? null;
    const costoNeto   = p.costoNeto ?? null;
    const costoIva    = p.costoIVA ?? null;
    const precioVenta = p.precioSugerido ?? null;
    const iva         = p.iva ?? null;
    const descuento   = p.descuento ?? null;
    const margen      = p.margen ?? null;
    const ganancia    = precioVenta != null && costoIva != null
      ? Number(precioVenta) - Number(costoIva)
      : null;

    const precioListaStr = precioLista != null ? fmtPrice(precioLista) : '—';
    const montoIvaStr    = montoIva != null ? fmtPrice(montoIva) : '—';
    const costoNetoStr   = costoNeto != null ? fmtPrice(costoNeto) : '—';
    const precioVentaStr = precioVenta != null ? fmtPrice(precioVenta) : '—';
    const costoIvaStr    = costoIva != null ? fmtPrice(costoIva) : '—';
    const ivaStr         = iva != null ? fmtPercent(iva) : '—';
    const descuentoStr   = descuento != null ? fmtPercent(descuento) : '—';
    const margenStr      = margen != null ? fmtPercent(margen) : '—';
    const gananciaStr    = ganancia != null ? fmtPrice(ganancia) : '—';
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
    const cartKey    = `rm:${codigo}`;
    const inCart     = !!cart[cartKey];
    const catalogo   = p.catalog ?? p.catalogo ?? null;
    const hasCatalogo = Array.isArray(catalogo) && catalogo.length > 0;

    tr.innerHTML = `
      <td class="td-foto" data-col="foto">
        ${foto ? `<img src="${escHtml(foto)}" alt="Foto del producto" class="product-thumb" loading="lazy" onerror="this.style.display='none'"/>` : '<span class="no-photo">—</span>'}
      </td>
      <td data-col="codigo">
        ${hasCatalogo
          ? `<span class="td-code has-catalog" title="Ver catálogo">${escHtml(String(codigo))}</span>`
          : `<span class="td-code">${escHtml(String(codigo))}</span>`
        }
      </td>
      <td class="td-aplicacion" data-col="aplicacion">${escHtml(String(desc))}</td>
      <td class="td-marca" data-col="marca"><span>${escHtml(String(marca))}</span></td>
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

    // Toggle agregar/quitar del carrito
    const addBtn = tr.querySelector('.btn-add');
    addBtn.__product = p;
    addBtn.addEventListener('click', function() {
      const key = this.dataset.key;
      if (cart[key]) removeFromCart(key);
      else addToCart(this.__product);
    });

    // Código clickeable cuando hay catálogo
    const codeSpan = tr.querySelector('.td-code.has-catalog');
    if (codeSpan) {
      codeSpan.__product = p;
      codeSpan.addEventListener('click', function() { openCatalogModal(this.__product); });
    }

    // Click en foto → abrir modal
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
  const normalized = normalizeRmProduct(product);
  const key = `rm:${normalized.codigo}`;
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

  // Badge en botón topbar
  cartCount.textContent = count;
  cartCount.style.display = count > 0 ? '' : 'none';

  // Badge en drawer
  drawerCount.textContent = `${count} producto${count !== 1 ? 's' : ''}`;

  // Empty state
  drawerEmpty.style.display    = entries.length === 0 ? '' : 'none';
  drawerTotals.style.display   = entries.length > 0 ? '' : 'none';
  btnImprimir.style.display    = entries.length > 0 ? '' : 'none';

  // Render items
  cartItemsList.innerHTML = '';
  let totalSum = 0;
  
  entries.forEach(([key, { product, qty }]) => {
    const codigo = product.codigo ?? '—';
    const desc   = product.nombre ?? '—';
    const marca  = product.marca ?? '';
    const pVenta = Number(product.precioVenta) || 0;
    const subtotal = pVenta * qty;
    totalSum += subtotal;

    const sourceTag = product._source === 'rm' ? 'RM' : product._source === 'asm' ? 'ASM' : '';

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

  // Actualizar total
  totalFinal.textContent = `$${fmtPrice(totalSum)}`;
}

// ── Helpers de badge ──────────────────────────────────────────
function getBrandColorClass(brandName) {
  const normalized = String(brandName ?? 'sin-marca').trim().toLowerCase();
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    hash = (hash * 31 + normalized.charCodeAt(i)) >>> 0;
  }
  return `brand-palette-${hash % 8}`;
}

// ── Product Modal ──────────────────────────────────────────────
function openProductModal(p) {
  const codigo      = p.codigo      ?? '—';
  const desc        = p.aplicacion  ?? '—';
  const marca       = p.marca       ?? '—';
  const rubro       = p.rubro       ?? '—';
  const foto        = p.imagen      ?? '';
  const precioLista = p.precioLista ?? null;
  const costo       = p.costoIVA       ?? null;
  const precioVenta = p.precioSugerido ?? null;
  const iva         = p.iva ?? null;
  const descuento   = p.descuento ?? null;
  const montoIva    = p.montoIVA ?? null;
  const costoIva    = p.costoIVA ?? null;
  const margen      = p.margen ?? null;
  const ganancia    = precioVenta != null && costoIva != null ? precioVenta - costoIva : null;
  const stock       = p.stock ?? null;

  productModalCode.textContent  = String(codigo);
  productModalName.textContent  = String(desc);
  productModalMarca.textContent = String(marca);
  productModalRubro.textContent = String(rubro);
  productModalFuente.textContent = 'RM';
  productModalLista.textContent = precioLista != null ? `$${fmtPrice(precioLista)}` : '—';
  productModalCosto.textContent = costo       != null ? `$${fmtPrice(costo)}`       : '—';
  productModalVenta.textContent = precioVenta != null ? `$${fmtPrice(precioVenta)}` : '—';
  productModalIva.textContent   = iva         != null ? fmtPercent(iva)              : '—';
  productModalDesc.textContent  = descuento   != null ? fmtPercent(descuento)        : '—';
  productModalMontoIva.textContent = montoIva != null ? `$${fmtPrice(montoIva)}`     : '—';
  productModalCostoNeto.textContent = p.costoNeto != null ? `$${fmtPrice(p.costoNeto)}` : '—';
  productModalMargen.textContent   = margen   != null ? fmtPercent(margen)           : '—';
  productModalGanancia.textContent = ganancia != null ? `$${fmtPrice(ganancia)}`     : '—';
  productModalStock.textContent    = stock    != null ? String(stock)                : '—';

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
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { closeProductModal(); closeCatalogModal(); }
});
productModalAdd.addEventListener('click', function() {
  if (this.__product) addToCart(this.__product);
  closeProductModal();
});

// ── Catalog Modal ──────────────────────────────────────────────
function openCatalogModal(p) {
  const catalogo = p.catalog ?? p.catalogo ?? [];
  catalogModalCode.textContent = String(p.codigo ?? '—');
  catalogModalName.textContent = String(p.aplicacion ?? p.nombre ?? '—');

  let html = '';

  catalogo.forEach((item, itemIdx) => {
    if (catalogo.length > 1) {
      html += `<div class="cat-item-header">Ítem ${itemIdx + 1}: ${escHtml(String(item.codigo ?? '—'))}</div>`;
    }
    const variantes = item.variantes ?? [];
    variantes.forEach((v, vIdx) => {
      if (variantes.length > 1) {
        html += `<div class="cat-variant-header">Variante ${vIdx + 1}</div>`;
      }

      // Datos básicos de la variante
      html += `<div class="cat-section-title">Variante</div><div class="cat-rows">`;
      [
        ['Posición',    v.posicion],
        ['Estructura',  v.estructura],
        ['Aplicación',  v.aplicacion],
        ['ID Variante', v.variant_id],
      ].forEach(([lbl, val]) => {
        html += `<div class="cat-row"><span class="cat-label">${escHtml(lbl)}</span><span class="cat-value">${escHtml(String(val ?? '—'))}</span></div>`;
      });
      html += `</div>`;

      // Dimensional
      if (v.dimensional && typeof v.dimensional === 'object') {
        const dimLabels = { abierto: 'Abierto (mm)', cerrado: 'Cerrado (mm)', superior: 'Sup. (rosca)', inferior: 'Inf. (rosca)' };
        html += `<div class="cat-section-title">Dimensional</div><div class="cat-rows">`;
        Object.entries(v.dimensional).forEach(([key, val]) => {
          const lbl = dimLabels[key] ?? key;
          html += `<div class="cat-row"><span class="cat-label">${escHtml(lbl)}</span><span class="cat-value">${escHtml(String(val ?? '—'))}</span></div>`;
        });
        html += `</div>`;
      }

      // Equivalencias
      const equivs = v.equivalencia ?? v.equivalencias ?? [];
      if (equivs.length > 0) {
        html += `<div class="cat-section-title">Equivalencias</div><div class="cat-rows">`;
        equivs.forEach(eq => {
          html += `<div class="cat-row"><span class="cat-label">${escHtml(String(eq.marca ?? '—'))}</span><span class="cat-value">${escHtml(String(eq.codigo ?? '—'))}</span></div>`;
        });
        html += `</div>`;
      }

      // Aplicaciones
      const apps = v.aplicaciones ?? [];
      if (apps.length > 0) {
        html += `<div class="cat-section-title">Aplicaciones</div><div class="cat-rows">`;
        apps.forEach(ap => {
          const desde = ap.desde ?? '—';
          const hasta  = ap.hasta != null ? ap.hasta : '…';
          const tipo   = ap.tipo ? ` (${escHtml(String(ap.tipo))})` : '';
          html += `<div class="cat-row cat-app-row"><span class="cat-label">${escHtml(String(ap.fabricante ?? '—'))} ${escHtml(String(ap.modelo ?? ''))}</span><span class="cat-value">${escHtml(String(desde))} – ${escHtml(String(hasta))}${tipo}</span></div>`;
        });
        html += `</div>`;
      }
    });
  });

  catalogModalBody.innerHTML = html || '<p class="cat-empty">Sin datos de catálogo disponibles.</p>';
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

// ── Imprimir ───────────────────────────────────────────────────
btnImprimir.addEventListener('click', () => {
  // Establecer fecha actual
  const printDate = document.getElementById('print-date');
  if (printDate) {
    const now = new Date();
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    printDate.textContent = `Fecha: ${now.toLocaleDateString('es-AR', options)}`;
  }
  // Establecer cantidad de productos
  const printItemsCount = document.getElementById('print-items-count');
  if (printItemsCount) {
    const entries = Object.entries(cart);
    const count = entries.reduce((s, [, i]) => s + i.qty, 0);
    printItemsCount.textContent = `· ${count} producto${count !== 1 ? 's' : ''}`;
  }
  // Poblar campos de cliente en los spans print-only
  const nombreInput = document.getElementById('cliente-nombre');
  const nombrePrint = document.getElementById('cliente-nombre-print');
  if (nombrePrint) nombrePrint.textContent = nombreInput ? nombreInput.value.trim() : '';

  const telInput = document.getElementById('cliente-tel');
  const telPrint = document.getElementById('cliente-tel-print');
  if (telPrint) telPrint.textContent = telInput ? telInput.value.trim() : '';

  openDrawer();
  setTimeout(() => window.print(), 100);
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
loadHiddenCols();
renderTableHead();
initColumnsMenu();
init();
loadCart();
updateCartUI();
