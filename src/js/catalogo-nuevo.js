const API_BASE = 'http://localhost:3005';
const CART_STORAGE_KEY = 'ov_presupuesto';

// ── DOM refs ──────────────────────────────────────────────────────────────────
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

// ── Estado ────────────────────────────────────────────────────────────────────
let allProducts = [];
let currentPage = 1;
let pageSize    = parseInt(pageSizeSelect.value);

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

// ── Normalizar producto ───────────────────────────────────────────────────────
function normalizeProduct(p) {
  return {
    codigo: p.codigo ?? '—',
    nombre: p.descripcion ?? p.nombre ?? '—',
    marca: p.marca ?? p.marcaName ?? '—',
    rubro: p.categoria ?? p.rubro ?? p.rubroName ?? '—',
    foto: p.foto ?? '',
    precioVenta: p.precioVenta ?? p.precioSugerido ?? p.precio ?? 0,
    _source: 'nv'
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

// ── Init ──────────────────────────────────────────────────────────────────────
function init() {
  loadRubros();
}

async function loadRubros() {
  try {
    const res = await fetch(`${API_BASE}/rubros?soloHabilitados=true`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
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
  const rubroId = rubroSelect.value;

  const requestBody = {
    codigoAuto: termino,
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
    const totalProductos = data.totalProductos ?? allProducts.length;

    resultsCount.textContent = `${totalProductos} producto${totalProductos !== 1 ? 's' : ''}`;

    const parts = [`"${termino}"`];
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
    const codigo      = p.codigo      ?? '—';
    const desc        = p.descripcion ?? p.nombre ?? '—';
    const marca       = p.marca ?? p.marcaName ?? '—';
    const rubro       = p.categoria ?? p.rubro ?? p.rubroName ?? '—';
    const foto        = p.foto ?? '';
    const precioLista = null;
    const costo       = null;
    const precioVenta = p.precioVenta ?? null;

    const precioListaStr = precioLista != null ? fmtPrice(precioLista) : '—';
    const costoStr       = costo != null ? fmtPrice(costo) : '—';
    const precioVentaStr = precioVenta != null ? fmtPrice(precioVenta) : '—';
    const cartKey = `nv:${codigo}`;
    const inCart  = !!cart[cartKey];

    tr.innerHTML = `
      <td class="td-foto">
        ${foto ? `<img src="${escHtml(foto)}" alt="Foto del producto" class="product-thumb" loading="lazy" onerror="this.style.display='none'"/>` : '<span class="no-photo">—</span>'}
      </td>
      <td><span class="td-code">${escHtml(String(codigo))}</span></td>
      <td class="td-aplicacion">${escHtml(String(desc))}</td>
      <td class="td-marca"><span>${escHtml(String(marca))}</span></td>
      <td class="td-rubro"><span>${escHtml(String(rubro))}</span></td>
      <td class="td-precio-lista"><span class="price-symbol">$</span>${precioListaStr}</td>
      <td class="td-costo"><span class="price-symbol">$</span>${costoStr}</td>
      <td class="td-precio-venta"><span class="price-symbol">$</span>${precioVentaStr}</td>
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
  const normalized = normalizeProduct(product);
  const key = `nv:${normalized.codigo}`;
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
        <span class="cart-item-code">${sourceTag ? `<small style="opacity:.5">[${escHtml(sourceTag)}]</small> ` : ''}${escHtml(String(codigo))}</span>
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
  const codigo      = p.codigo      ?? '—';
  const desc        = p.descripcion ?? p.nombre      ?? '—';
  const marca       = p.marca       ?? p.marcaName ?? '—';
  const rubro       = p.categoria   ?? p.rubro ?? p.rubroName ?? '—';
  const foto        = p.foto        ?? '';
  const precioLista = null;
  const costo       = null;
  const precioVenta = p.precioVenta ?? null;

  productModalCode.textContent  = String(codigo);
  productModalName.textContent  = String(desc);
  productModalMarca.textContent = String(marca);
  productModalRubro.textContent = String(rubro);
  productModalLista.textContent = precioLista != null ? `$${fmtPrice(precioLista)}` : '—';
  productModalCosto.textContent = costo       != null ? `$${fmtPrice(costo)}`       : '—';
  productModalVenta.textContent = precioVenta != null ? `$${fmtPrice(precioVenta)}` : '—';

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
function fmtPrice(val) {
  return Number(val).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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
