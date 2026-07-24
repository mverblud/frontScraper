// presupuesto-detalle.js — Pantalla "Ver presupuesto": toma el carrito armado en el
// Cotizador (localStorage), permite aplicar descuentos por producto y descuento total,
// y genera el presupuesto en el backend Maestro (POST /api/v1/quotes/) antes de imprimir.

const API_BASE            = window.ENV.PRODUCTOS_API;
const CART_STORAGE_KEY     = 'ov_presupuesto';
const CLIENTE_STORAGE_KEY  = 'ov_presupuesto_cliente';
const DEFAULT_CURRENCY     = 'ARS';

// ── DOM refs ─────────────────────────────────────────────────────────────────
const themeToggle       = document.getElementById('theme-toggle');
const emptyState        = document.getElementById('empty-state');
const missingIdWarning  = document.getElementById('missing-id-warning');
const generateError     = document.getElementById('generate-error');
const generateErrorMsg  = document.getElementById('generate-error-msg');
const detalleContent    = document.getElementById('detalle-content');

const clienteNombreInput = document.getElementById('det-cliente-nombre');
const clienteTelInput    = document.getElementById('det-cliente-tel');
const notasInput         = document.getElementById('det-notas');
const vencimientoInput   = document.getElementById('det-vencimiento');

const itemsCountBadge   = document.getElementById('det-items-count');
const itemsBody         = document.getElementById('det-items-body');
const subtotalEl        = document.getElementById('det-subtotal');
const descTotalInput    = document.getElementById('det-desc-total');
const totalEl           = document.getElementById('det-total');
const btnGenerar        = document.getElementById('btn-generar');

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
function toDateInputValue(d) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}
function fmtDateInputDisplay(value) {
  if (!value) return '—';
  const [yyyy, mm, dd] = value.split('-');
  if (!yyyy || !mm || !dd) return '—';
  return `${dd}/${mm}/${yyyy}`;
}
function dateInputToISO(value) {
  if (!value) return null;
  const d = new Date(`${value}T23:59:59`);
  if (isNaN(d.getTime())) return null;
  return d.toISOString();
}
// Descuento siempre entero, de hasta 2 dígitos (0–99).
function clampPct(val) {
  return Math.min(99, Math.max(0, Math.round(Number(val)) || 0));
}
function clampQty(val) {
  return Math.max(1, Math.round(Number(val)) || 1);
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

// ── Carga de carrito / cliente ──────────────────────────────────────────────────
function loadCart() {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (_) {
    return {};
  }
}
function loadCliente() {
  try {
    const raw = localStorage.getItem(CLIENTE_STORAGE_KEY);
    return raw ? JSON.parse(raw) : { nombre: '', telefono: '' };
  } catch (_) {
    return { nombre: '', telefono: '' };
  }
}
function saveCart(cart) {
  try { localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart)); } catch (_) {}
}

let items = [];      // [{ key, productId, codigo, nombre, marca, rubro, unitPrice, quantity, descPct }]
let hasMissingIds = false;

function initItems() {
  const cart = loadCart();
  items = Object.entries(cart).map(([key, { product, qty }]) => ({
    key,
    productId: product.productId ?? null,
    codigo:    product.codigo ?? '—',
    nombre:    product.nombre ?? '—',
    marca:     product.marca ?? '—',
    rubro:     product.rubro ?? '—',
    unitPrice: Number(product.precioVenta) || 0,
    quantity:  qty,
    descPct:   0
  }));
  hasMissingIds = items.some(i => i.productId == null);
}

// ── Cálculo ───────────────────────────────────────────────────────────────────
function rowNeto(item) {
  return item.unitPrice * item.quantity * (1 - (Number(item.descPct) || 0) / 100);
}
function getSubtotal() {
  return items.reduce((sum, i) => sum + rowNeto(i), 0);
}
function getTotalDescPct() {
  return clampPct(descTotalInput.value);
}
function getTotal() {
  return getSubtotal() * (1 - getTotalDescPct() / 100);
}

// ── Render tabla de productos ───────────────────────────────────────────────────
function renderItems() {
  itemsCountBadge.textContent = `${items.length} producto${items.length !== 1 ? 's' : ''}`;

  itemsBody.innerHTML = '';
  items.forEach((item, idx) => {
    const tr = document.createElement('tr');
    if (item.productId == null) tr.classList.add('row-invalid-id');

    tr.innerHTML = `
      <td><span class="td-code">${escHtml(String(item.codigo))}</span>${item.productId == null ? '<span class="invalid-id-badge">Sin ID</span>' : ''}</td>
      <td>${escHtml(String(item.nombre))}</td>
      <td class="td-marca"><span>${escHtml(String(item.marca))}</span></td>
      <td class="td-rubro"><span>${escHtml(String(item.rubro))}</span></td>
      <td class="th-center">
        <input type="number" class="qty-input" min="1" step="1" value="${item.quantity}"/>
      </td>
      <td class="th-num"><span class="price-symbol">$</span>${fmtPrice(item.unitPrice)}</td>
      <td class="th-center">
        <input type="number" class="desc-pct-input" min="0" max="99" step="1" value="${item.descPct}"/>
      </td>
      <td class="th-num" id="row-subtotal-${idx}"><span class="price-symbol">$</span>${fmtPrice(rowNeto(item))}</td>
      <td class="td-actions">
        <button type="button" class="btn-icon btn-delete" title="Quitar producto" aria-label="Quitar producto">
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M1.5 1.5l8 8M9.5 1.5l-8 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
          Quitar
        </button>
      </td>
    `;

    const qtyInput = tr.querySelector('.qty-input');
    qtyInput.addEventListener('input', (e) => {
      items[idx].quantity = clampQty(e.target.value);
      updateRowSubtotal(idx);
      recomputeTotals();
    });
    qtyInput.addEventListener('blur', (e) => { e.target.value = items[idx].quantity; });

    const descPctInput = tr.querySelector('.desc-pct-input');
    descPctInput.addEventListener('input', (e) => {
      items[idx].descPct = clampPct(e.target.value);
      updateRowSubtotal(idx);
      recomputeTotals();
    });
    descPctInput.addEventListener('blur', (e) => { e.target.value = items[idx].descPct; });

    tr.querySelector('.btn-delete').addEventListener('click', () => removeItem(idx));

    itemsBody.appendChild(tr);
  });
}

function updateRowSubtotal(idx) {
  const cell = document.getElementById(`row-subtotal-${idx}`);
  if (cell) cell.innerHTML = `<span class="price-symbol">$</span>${fmtPrice(rowNeto(items[idx]))}`;
}

function recomputeTotals() {
  subtotalEl.textContent = `$${fmtPrice(getSubtotal())}`;
  totalEl.textContent = `$${fmtPrice(getTotal())}`;
}

function removeItem(idx) {
  const { key } = items[idx];
  const cart = loadCart();
  delete cart[key];
  saveCart(cart);

  items.splice(idx, 1);

  if (items.length === 0) {
    emptyState.style.display = '';
    detalleContent.style.display = 'none';
    return;
  }

  hasMissingIds = items.some(i => i.productId == null);
  missingIdWarning.style.display = hasMissingIds ? '' : 'none';

  renderItems();
  recomputeTotals();
  setGenerating(false);
}

// ── Estado inicial de la pantalla ───────────────────────────────────────────────
function init() {
  initItems();

  if (items.length === 0) {
    emptyState.style.display = '';
    detalleContent.style.display = 'none';
    return;
  }

  const cliente = loadCliente();
  clienteNombreInput.value = cliente.nombre || '';
  clienteTelInput.value    = cliente.telefono || '';

  const defaultVencimiento = new Date();
  defaultVencimiento.setDate(defaultVencimiento.getDate() + 7);
  vencimientoInput.value = toDateInputValue(defaultVencimiento);

  renderItems();
  recomputeTotals();

  if (hasMissingIds) {
    missingIdWarning.style.display = '';
    btnGenerar.disabled = true;
  }

  descTotalInput.addEventListener('input', recomputeTotals);
  descTotalInput.addEventListener('blur', () => { descTotalInput.value = getTotalDescPct(); });
}

// ── Generar presupuesto (POST + imprimir) ──────────────────────────────────────
function setGenerating(on) {
  btnGenerar.disabled = on || hasMissingIds;
  btnGenerar.querySelector('.btn-text').textContent = on ? 'Generando…' : 'Generar';
}

function buildPayload() {
  const totalDescPct = getTotalDescPct();
  return {
    items: items.map(i => ({
      productId: i.productId,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      discountType: i.descPct > 0 ? 'PERCENTAGE' : null,
      discountValue: i.descPct > 0 ? i.descPct : null
    })),
    customerName:  clienteNombreInput.value.trim(),
    customerPhone: clienteTelInput.value.trim(),
    notes:         notasInput.value.trim(),
    expiresAt:     dateInputToISO(vencimientoInput.value),
    currency:      DEFAULT_CURRENCY,
    discountType:  totalDescPct > 0 ? 'PERCENTAGE' : null,
    discountValue: totalDescPct > 0 ? totalDescPct : null
  };
}

function fillPrintMirror() {
  const now = new Date();
  const printDate = document.getElementById('print-date');
  if (printDate) {
    printDate.textContent = `Fecha: ${now.toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' })}`;
  }
  const printItemsCount = document.getElementById('print-items-count');
  if (printItemsCount) {
    printItemsCount.textContent = `· ${items.length} producto${items.length !== 1 ? 's' : ''}`;
  }

  document.getElementById('print-cliente-nombre').textContent = clienteNombreInput.value.trim();
  document.getElementById('print-cliente-tel').textContent    = clienteTelInput.value.trim();
  document.getElementById('print-vencimiento').textContent    = fmtDateInputDisplay(vencimientoInput.value);
  document.getElementById('print-notas').textContent          = notasInput.value.trim() || '—';

  const printItemsList = document.getElementById('print-items-list');
  printItemsList.innerHTML = '';
  items.forEach(item => {
    const subtotal = rowNeto(item);
    const div = document.createElement('div');
    div.className = 'cart-item qp-6col';
    div.innerHTML = `
      <div class="cart-item-info">
        <span class="cart-item-code">${escHtml(String(item.codigo))}</span>
        <div class="cart-item-desc">${escHtml(String(item.nombre))}</div>
      </div>
      <div class="cart-item-controls">
        <span class="cart-item-qty-print print-only">${item.quantity}</span>
        <span class="cart-item-unit-print print-only">$${fmtPrice(item.unitPrice)}</span>
        <span class="cart-item-desc-pct-print print-only">${item.descPct > 0 ? fmtPercent(item.descPct) : '—'}</span>
        <span class="cart-item-price">$${fmtPrice(subtotal)}</span>
      </div>
    `;
    printItemsList.appendChild(div);
  });

  document.getElementById('print-subtotal').textContent   = `$${fmtPrice(getSubtotal())}`;
  document.getElementById('print-desc-total').textContent = getTotalDescPct() > 0 ? fmtPercent(getTotalDescPct()) : '—';
  document.getElementById('print-total').textContent      = `$${fmtPrice(getTotal())}`;
}

btnGenerar.addEventListener('click', async () => {
  if (items.length === 0 || hasMissingIds) return;

  const confirmed = confirm(
    '¿Confirmás la generación del presupuesto?\n\nSe va a generar un PDF y, una vez generado, no vas a poder hacer cambios.'
  );
  if (!confirmed) return;

  generateError.style.display = 'none';
  setGenerating(true);

  try {
    const res = await fetch(`${API_BASE}/api/v1/quotes/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(buildPayload())
    });

    let data = null;
    try { data = await res.json(); } catch (_) {}

    if (!res.ok) {
      let msg = `No se pudo generar el presupuesto (HTTP ${res.status}).`;
      if (data && data.message) msg = Array.isArray(data.message) ? data.message.join(' · ') : String(data.message);
      throw new Error(msg);
    }

    const quoteId = data?.id ?? data?._id ?? data?.quoteId ?? data?.number ?? data?.data?.id ?? null;
    const prevTitle = document.title;
    if (quoteId != null) document.title = `presupuesto-${quoteId}`;

    fillPrintMirror();
    setTimeout(() => {
      window.print();
      document.title = prevTitle;
      try {
        localStorage.removeItem(CART_STORAGE_KEY);
        localStorage.removeItem(CLIENTE_STORAGE_KEY);
      } catch (_) {}
      window.location.href = 'presupuestos.html';
    }, 100);
  } catch (e) {
    generateErrorMsg.textContent = e.message || 'No se pudo conectar con el servidor.';
    generateError.style.display = '';
  } finally {
    setGenerating(false);
  }
});

// ── Init ──────────────────────────────────────────────────────────────────────
init();
