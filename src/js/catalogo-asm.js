import { ASM_CONFIG } from './config.js';

const API_BASE = 'http://localhost:3000';
const CART_STORAGE_KEY = 'ov_presupuesto';

// ── Constantes de autenticación (desde config.js) ───────────────────────────────
const ASM_USERNAME  = ASM_CONFIG.USERNAME;
const ASM_PASSWORD  = ASM_CONFIG.PASSWORD;
const ASM_TOKEN_KEY = ASM_CONFIG.TOKEN_KEY;

// ── Categorías ASM ────────────────────────────────────────────────────────────
const CATEGORIAS = [
  { id: "63", nombre: "AMORTIGUADORES" },
  { id: "67", nombre: "AXIALES" },
  { id: "71", nombre: "BUJES DE SUSPENSION" },
  { id: "230", nombre: "DISCOS DE FRENO" },
  { id: "242", nombre: "EXTREMOS" },
  { id: "281", nombre: "ROTULAS" },
  { id: "2593", nombre: "CAMPANAS DE FRENO" },
  { id: "2656", nombre: "BIELETAS" },
  { id: "2701", nombre: "JUNTAS HOMOCINETICAS" },
  { id: "2927", nombre: "SEMIEJES" },
  { id: "2931", nombre: "CAZOLETAS" },
  { id: "2937", nombre: "PASTILLAS DE FRENO" },
  { id: "2957", nombre: "BOMBAS DE FRENO" },
  { id: "2961", nombre: "CILINDROS DE RUEDA" },
  { id: "2973", nombre: "KITS DE EMBRAGUE" },
  { id: "2994", nombre: "TRICETAS" },
  { id: "2996", nombre: "TENSORES DE CADENA" },
  { id: "2998", nombre: "TUERCAS DE SEMIEJE" },
  { id: "2999", nombre: "ABRAZADERAS" },
  { id: "3002", nombre: "COLUMNAS DE DIRECCION" },
  { id: "3004", nombre: "MAZAS DE RUEDA" },
  { id: "3020", nombre: "PARRILLAS DE SUSPENSION" },
  { id: "3048", nombre: "ESPIGAS DE SEMIEJE" },
  { id: "3049", nombre: "BRAZOS DE SUSPENSION" },
  { id: "3057", nombre: "FUELLES SELECTOR" },
  { id: "3058", nombre: "FUELLES DE SUSPENSION" },
  { id: "3060", nombre: "KITS FUELLES DE TRANSMISION" },
  { id: "3075", nombre: "KITS FUELLES DE DIRECCION" },
  { id: "3077", nombre: "KITS FUELLES Y TOPES DE SUSPENSION" },
  { id: "3078", nombre: "TOPES DE SUSPENSION" },
  { id: "3082", nombre: "BARRAS DE DIRECCION" },
  { id: "3087", nombre: "MANCHONES" },
  { id: "3110", nombre: "CRUCETAS" },
  { id: "3118", nombre: "SOPORTES DE CARDAN" },
  { id: "3125", nombre: "PINZAS PARA ABRAZADERAS" },
  { id: "3126", nombre: "PRECINTOS PLASTICOS" },
  { id: "3127", nombre: "GRASAS" },
  { id: "3130", nombre: "KITS BUJES DE SUSPENSION" },
  { id: "3185", nombre: "RODAMIENTOS DE RUEDA" },
  { id: "3193", nombre: "PUNTAS DE EJE" },
  { id: "3194", nombre: "RODAMIENTOS DE AIRE ACONDICIONADO" },
  { id: "3195", nombre: "RODAMIENTOS DE CAJA" },
  { id: "3196", nombre: "RODAMIENTOS RETEN DE PALIER" },
  { id: "3205", nombre: "RODAMIENTOS DE SUSPENSION" },
  { id: "3209", nombre: "SOPORTES DE AMORTIGUADOR" },
  { id: "3210", nombre: "SOPORTES DE MOTOR" },
  { id: "3211", nombre: "SOPORTES TENSORES" },
  { id: "3212", nombre: "TENSORES DE CORREA" },
  { id: "3219", nombre: "CRAPODINAS DE EMBRAGUE" },
  { id: "3220", nombre: "CAPUCHONES" },
  { id: "3222", nombre: "CRAPODINAS DE SUSPENSION" },
  { id: "3226", nombre: "CREMALLERAS DE DIRECCION MECANICAS" },
  { id: "3227", nombre: "CREMALLERAS DE DIRECCION ELECTRICAS" },
  { id: "3228", nombre: "CREMALLERAS DE DIRECCION HIDRAULICAS" },
  { id: "3229", nombre: "RODAMIENTOS DE RUEDA C/ ABS" },
  { id: "3230", nombre: "RODAMIENTOS DE VENTILADOR" },
  { id: "3232", nombre: "EJE DE PARRILLA" },
  { id: "3235", nombre: "CUBRE CAZOLETA" },
  { id: "3237", nombre: "PALIERS" },
  { id: "3238", nombre: "ACOPLES" },
  { id: "3239", nombre: "CAJONES TRASERO" },
  { id: "3240", nombre: "PUNTERAS DE CHASIS" },
  { id: "3241", nombre: "DADOS PALANCA DE CAMBIO" }
];

// ── DOM refs ──────────────────────────────────────────────────────────────────
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
const productModalProvider = document.getElementById('product-modal-provider');
const productModalAplicacion = document.getElementById('product-modal-aplicacion');
const productModalMarca   = document.getElementById('product-modal-marca');
const productModalLista   = document.getElementById('product-modal-lista');
const productModalCosto   = document.getElementById('product-modal-costo');
const productModalVenta   = document.getElementById('product-modal-venta');
const productModalAdd     = document.getElementById('product-modal-add');

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

// Rubro
const rubroSelect = document.getElementById('rubro');

// ── Estado ────────────────────────────────────────────────────────────────────
let allProducts = [];
let currentPage = 1;
let pageSize    = parseInt(pageSizeSelect.value);

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

// ── Normalizar producto ASM ───────────────────────────────────────────────────
function normalizeAsmProduct(p) {
  return {
    codigo: p.code ?? '—',
    nombre: p.name ?? p.vehicle ?? '—',
    marca: (p.brand ?? 'Sin marca').toUpperCase(),
    rubro: p.category ?? '—',
    foto: p.image ?? '',
    precioVenta: p.precioVenta ?? p.price ?? 0,
    _source: 'asm'
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
applyTheme(localStorage.getItem('theme') || 'light');

// ── Cargar rubros ────────────────────────────────────────────────────────────
function loadRubros() {
  CATEGORIAS.forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat.nombre;
    opt.textContent = cat.nombre;
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

// ── Autenticación ASM ─────────────────────────────────────────────────────────
async function getAsmToken() {
  const cached = sessionStorage.getItem(ASM_TOKEN_KEY);
  if (cached) return cached;

  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: ASM_USERNAME, password: ASM_PASSWORD })
  });

  if (!res.ok) throw new Error(`No se pudo autenticar con el servidor ASM (HTTP ${res.status}).`);

  const { token } = await res.json();
  sessionStorage.setItem(ASM_TOKEN_KEY, token);
  return token;
}

// ── Buscar ─────────────────────────────────────────────────────────────────────
btnBuscar.addEventListener('click', async () => {
  if (!validateTermino()) return;

  const query = terminoInput.value.trim();
  const rubroValue = rubroSelect.value;

  setLoading(true);
  hideResults();
  hideError();

  try {
    const token = await getAsmToken();

    const requestBody = { query };
    if (rubroValue) {
      requestBody.filters = { categoria: rubroValue };
    }

    const res = await fetch(`${API_BASE}/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(requestBody)
    });

    if (res.status === 401) {
      sessionStorage.removeItem(ASM_TOKEN_KEY);
      throw new Error('Sesión expirada. Por favor, recargue la página.');
    }
    if (!res.ok) throw new Error(`Error del servidor: HTTP ${res.status}`);
    const data = await res.json();

    allProducts = data.products ?? data.productos ?? [];
    const total = data.total ?? data.totalProductos ?? allProducts.length;

    resultsCount.textContent = `${total} producto${total !== 1 ? 's' : ''}`;
    resultsQuery.textContent = `"${query}"`;

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
  terminoInput.value = '';
  rubroSelect.value = '';
  terminoInput.classList.remove('has-error');
  terminoError.classList.remove('visible');
  allProducts = [];
  currentPage = 1;
  hideResults();
  hideError();
});

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
    const image = p.image ?? '';
    const code = p.code ?? '—';
    const category = p.category ?? p.name ?? '—';
    const brand = (p.brand ? p.brand : 'Sin marca').toUpperCase();
    const vehicle = p.vehicle ?? '—';
    const precioIva = p.precioIva ?? 0;
    const precioCosto = p.precioCosto ?? 0;
    const precioVenta = p.precioVenta ?? p.price ?? 0;
    const stock = p.stock ?? 0;

    const stockClass = stock > 0 ? 'stock-ok' : 'stock-zero';
    const cartKey = `asm:${code}`;
    const inCart  = !!cart[cartKey];

    tr.innerHTML = `
      <td style="text-align:center">
        ${image ? `<img src="${escHtml(String(image))}" alt="${escHtml(String(code))}" class="product-thumb" style="width:42px;height:42px;object-fit:cover;border-radius:8px;border:1px solid var(--line);cursor:pointer;" loading="lazy" />` : '—'}
      </td>
      <td><span class="td-code">${escHtml(String(code))}</span></td>
      <td class="td-aplicacion">${escHtml(String(vehicle))}</td>
      <td class="td-marca"><span>${escHtml(String(brand))}</span></td>
      <td class="td-rubro"><span>${escHtml(String(category))}</span></td>
      <td class="td-precio-lista"><span class="price-symbol">$</span>${escHtml(formatPrice(precioIva))}</td>
      <td class="td-precio-lista"><span class="price-symbol">$</span>${escHtml(formatPrice(precioCosto))}</td>
      <td class="td-precio-venta"><span class="price-symbol">$</span>${escHtml(formatPrice(precioVenta))}</td>
      <td class="td-stock ${stockClass}" style="text-align:center;font-weight:600">${stock}</td>
      <td class="td-add">
        <button class="btn-add ${inCart ? 'in-cart' : ''}" data-key="${escHtml(cartKey)}">
          ${inCart
            ? `<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg> Agregado`
            : `<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 2v8M2 6h8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg> Agregar`
          }
        </button>
      </td>
    `;

    tr.querySelector('.btn-add').__product = p;
    tr.querySelector('.btn-add').addEventListener('click', function() {
      addToCart(this.__product);
    });

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
  const normalized = normalizeAsmProduct(product);
  const key = `asm:${normalized.codigo}`;
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

    const sourceTag = product._source === 'rm' ? 'RM' : product._source === 'asm' ? 'ASM' : '';

    const div = document.createElement('div');
    div.className = 'cart-item';
    div.innerHTML = `
      <div class="cart-item-info">
        <div class="cart-item-header">
          <span class="cart-item-code">${escHtml(String(codigo))}</span>
          ${sourceTag ? `<span class="cart-item-provider">[${escHtml(sourceTag)}]</span>` : ''}
          <span class="cart-item-desc">${escHtml(String(desc))}</span>
          <span class="cart-item-marca">${escHtml(marca)}</span>
        </div>
      </div>
      <div class="cart-item-controls">
        <div class="qty-control">
          <button class="qty-btn" data-action="dec" data-key="${escHtml(key)}">−</button>
          <span class="qty-val">${qty}</span>
          <button class="qty-btn" data-action="inc" data-key="${escHtml(key)}">+</button>
        </div>
        <span class="cart-item-qty-print print-only">${qty}</span>
        <span class="cart-item-unit-print print-only">$${formatPrice(pVenta)}</span>
        <span class="cart-item-price">$${formatPrice(subtotal)}</span>
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

  totalFinal.textContent = `$${formatPrice(totalSum)}`;
}

// ── Product Modal ──────────────────────────────────────────────
function openProductModal(p) {
  const code       = p.code ?? '—';
  const name       = p.name ?? p.vehicle ?? '—';
  const brand      = (p.brand ?? 'Sin marca').toUpperCase();
  const image      = p.image ?? '';
  const precioIva  = p.precioIva ?? 0;
  const precioCosto = p.precioCosto ?? 0;
  const precioVenta = p.precioVenta ?? p.price ?? 0;

  productModalCode.textContent  = String(code);
  productModalName.textContent  = String(name);
  productModalProvider.textContent = 'ASM';
  productModalAplicacion.textContent = String(name);
  productModalMarca.textContent = String(brand);
  productModalLista.textContent = `$${formatPrice(precioIva)}`;
  productModalCosto.textContent = `$${formatPrice(precioCosto)}`;
  productModalVenta.textContent = `$${formatPrice(precioVenta)}`;

  if (image) {
    productModalImg.src = image;
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
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeProductModal(); });
productModalAdd.addEventListener('click', function() {
  if (this.__product) addToCart(this.__product);
  closeProductModal();
});

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
  openDrawer();
  setTimeout(() => window.print(), 100);
});

// ── Helpers ───────────────────────────────────────────────────
function escHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function formatPrice(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return '0,00';
  return num.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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
loadRubros();
loadCart();
updateCartUI();
