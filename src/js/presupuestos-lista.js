// presupuestos-lista.js — Pantalla "Presupuestos": lista todos los presupuestos ya generados
// (GET /api/v1/quotes/) con paginado server-side y detalle expandible inline por fila.

const API_BASE = window.ENV.PRODUCTOS_API;

// ── DOM refs ─────────────────────────────────────────────────────────────────
const themeToggle       = document.getElementById('theme-toggle');
const resultsCountBadge = document.getElementById('results-count');
const spinner           = document.getElementById('quotes-spinner');
const errorCard         = document.getElementById('quotes-error');
const errorMsgEl        = document.getElementById('quotes-error-msg');
const retryBtn          = document.getElementById('quotes-retry');
const tableWrapper      = document.getElementById('quotes-table-wrapper');
const quotesBody        = document.getElementById('quotes-body');
const tableFooter       = document.getElementById('table-footer');
const noResults         = document.getElementById('no-results');
const pageSizeSelect    = document.getElementById('page-size');
const paginationInfo    = document.getElementById('pagination-info');
const paginationControls = document.getElementById('pagination-controls');

// ── Helpers de formato (mismo criterio que el resto de las pantallas) ──────────
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
  return d.toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false });
}
function fmtDateShort(val) {
  if (!val) return '—';
  const d = new Date(val);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
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

// ── Estado ───────────────────────────────────────────────────────────────────
let currentPage  = 1;
let pageSize     = parseInt(pageSizeSelect.value, 10);
let expandedId   = null; // id del presupuesto con el detalle abierto (uno solo a la vez)

// ── Fetch ────────────────────────────────────────────────────────────────────
async function fetchQuotes() {
  spinner.style.display = '';
  errorCard.style.display = 'none';
  tableWrapper.style.display = 'none';
  tableFooter.style.display = 'none';
  noResults.style.display = 'none';
  resultsCountBadge.style.display = 'none';
  expandedId = null;

  try {
    const url = `${API_BASE}/api/v1/quotes/?page=${currentPage}&limit=${pageSize}`;
    const res = await fetch(url, { headers: { 'Accept': 'application/json' } });

    if (!res.ok) {
      let msg = `No se pudieron cargar los presupuestos (HTTP ${res.status}).`;
      try {
        const data = await res.json();
        if (data && data.message) msg = Array.isArray(data.message) ? data.message.join(' · ') : String(data.message);
      } catch (_) {}
      throw new Error(msg);
    }

    const data = await res.json();
    renderResult(data);
  } catch (e) {
    errorMsgEl.textContent = e.message || 'No se pudo conectar con el servidor.';
    errorCard.style.display = '';
  } finally {
    spinner.style.display = 'none';
  }
}

function renderResult(data) {
  const quotes     = Array.isArray(data.quotes) ? data.quotes : [];
  const total      = Number(data.total) || 0;
  const totalPages = Number(data.totalPages) || 1;

  resultsCountBadge.textContent = `${total} presupuesto${total !== 1 ? 's' : ''}`;
  resultsCountBadge.style.display = '';

  if (quotes.length === 0) {
    noResults.style.display = '';
    return;
  }

  tableWrapper.style.display = '';
  renderRows(quotes);

  const start = (currentPage - 1) * pageSize + 1;
  const end   = start + quotes.length - 1;
  paginationInfo.innerHTML = `Mostrando <strong>${start}–${end}</strong> de <strong>${total}</strong>`;
  renderPaginationControls(totalPages);
  tableFooter.style.display = '';
}

// ── Render de filas + detalle expandible inline ─────────────────────────────────
function renderRows(quotes) {
  quotesBody.innerHTML = '';

  quotes.forEach(q => {
    const tr = document.createElement('tr');
    tr.className = 'quote-row';

    const descuentoStr = q.discountValue
      ? (q.discountType === 'PERCENTAGE' ? fmtPercent(q.discountValue) : `$${fmtPrice(q.discountAmount)}`)
      : '—';

    const vendedor = (q.createdByUser && q.createdByUser.fullName) || '—';
    const notas = q.notes ? escHtml(q.notes) : '—';

    tr.innerHTML = `
      <td class="quote-row-chevron">
        <svg class="row-chevron" width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M3 1.5L7 5L3 8.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </td>
      <td class="th-center">
        <button type="button" class="btn-detail btn-print-row" title="Generar PDF" aria-label="Generar PDF">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="3" y="1" width="8" height="5" rx="1" stroke="currentColor" stroke-width="1.3"/><path d="M3 6H2a1 1 0 00-1 1v4h2v-2h8v2h2V7a1 1 0 00-1-1h-1" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/><rect x="3" y="8" width="8" height="4" rx="1" stroke="currentColor" stroke-width="1.3"/></svg>
        </button>
      </td>
      <td>${escHtml(q.id)}</td>
      <td>${fmtDateShort(q.createdAt)}</td>
      <td>${fmtDateShort(q.expiresAt)}</td>
      <td>${escHtml(q.customerName || '—')}</td>
      <td>${escHtml(q.customerPhone || '—')}</td>
      <td>${escHtml(vendedor)}</td>
      <td class="th-center">${Array.isArray(q.items) ? q.items.length : 0}</td>
      <td class="th-num">${descuentoStr}</td>
      <td class="th-num"><span class="price-symbol">$</span>${fmtPrice(q.total)}</td>
      <td class="td-notas" title="${notas}">${notas}</td>
    `;

    tr.querySelector('.btn-print-row').addEventListener('click', (e) => {
      e.stopPropagation();
      printQuote(q);
    });
    tr.addEventListener('click', () => toggleDetalle(q, tr));
    quotesBody.appendChild(tr);
  });
}

function toggleDetalle(quote, tr) {
  // Si ya hay una fila abierta, se cierra (aunque sea otra) antes de abrir la nueva.
  const openRow = quotesBody.querySelector('tr.quote-detalle-row');
  if (openRow) openRow.remove();
  quotesBody.querySelectorAll('tr.quote-row.expanded').forEach(r => r.classList.remove('expanded'));

  const wasExpanded = expandedId === quote.id;
  expandedId = wasExpanded ? null : quote.id;
  if (wasExpanded) return;

  tr.classList.add('expanded');
  const detalleRow = document.createElement('tr');
  detalleRow.className = 'quote-detalle-row';
  detalleRow.innerHTML = `<td colspan="12">${buildDetalleHtml(quote)}</td>`;
  tr.insertAdjacentElement('afterend', detalleRow);
}

function buildDetalleHtml(quote) {
  const items = Array.isArray(quote.items) ? quote.items : [];
  const rows = items.map(it => `
    <tr>
      <td><span class="td-code">${escHtml(it.productCode)}</span></td>
      <td>${it.productApplication ? escHtml(it.productApplication) : '—'}</td>
      <td class="th-center">${escHtml(it.quantity)}</td>
      <td class="th-num"><span class="price-symbol">$</span>${fmtPrice(it.unitPrice)}</td>
      <td class="th-center">${it.discountValue ? fmtPercent(it.discountValue) : '—'}</td>
      <td class="th-num"><span class="price-symbol">$</span>${fmtPrice(it.subtotal)}</td>
    </tr>
  `).join('');

  return `
    <div class="quote-detalle">
      <table class="quote-detalle-items">
        <colgroup>
          <col style="width:14%"><col style="width:38%"><col style="width:8%">
          <col style="width:14%"><col style="width:10%"><col style="width:16%">
        </colgroup>
        <thead>
          <tr>
            <th>Código</th>
            <th>Aplicación</th>
            <th class="th-center">Cant.</th>
            <th class="th-num">P. Unit.</th>
            <th class="th-center">Desc.</th>
            <th class="th-num">Subtotal</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <div class="quote-detalle-footer">
        <div class="quote-detalle-totals">
          <div class="total-row"><span>Subtotal</span><span>$${fmtPrice(quote.itemsSubtotal)}</span></div>
          <div class="total-row"><span>Descuento</span><span>$${fmtPrice(quote.discountAmount)}</span></div>
          <div class="total-row total-final"><span>TOTAL</span><span>$${fmtPrice(quote.total)}</span></div>
        </div>
      </div>
    </div>
  `;
}

// ── Reimpresión (reusa el bloque imprimible oculto) ─────────────────────────────
function fillPrintMirror(quote) {
  const items = Array.isArray(quote.items) ? quote.items : [];
  const now = new Date();

  document.getElementById('print-date').textContent = `Fecha: ${now.toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' })}`;
  document.getElementById('print-items-count').textContent = `· ${items.length} producto${items.length !== 1 ? 's' : ''}`;
  document.getElementById('print-cliente-nombre').textContent = quote.customerName || '';
  document.getElementById('print-cliente-tel').textContent    = quote.customerPhone || '';
  document.getElementById('print-vencimiento').textContent    = fmtDateShort(quote.expiresAt);
  document.getElementById('print-notas').textContent          = quote.notes || '—';

  const printItemsList = document.getElementById('print-items-list');
  printItemsList.innerHTML = '';
  items.forEach(it => {
    const div = document.createElement('div');
    div.className = 'cart-item qp-6col';
    div.innerHTML = `
      <div class="cart-item-info">
        <span class="cart-item-code">${escHtml(it.productCode)}</span>
        <div class="cart-item-desc">${it.productApplication ? escHtml(it.productApplication) : '—'}</div>
      </div>
      <div class="cart-item-controls">
        <span class="cart-item-qty-print print-only">${it.quantity}</span>
        <span class="cart-item-unit-print print-only">$${fmtPrice(it.unitPrice)}</span>
        <span class="cart-item-desc-pct-print print-only">${it.discountValue ? fmtPercent(it.discountValue) : '—'}</span>
        <span class="cart-item-price">$${fmtPrice(it.subtotal)}</span>
      </div>
    `;
    printItemsList.appendChild(div);
  });

  document.getElementById('print-subtotal').textContent   = `$${fmtPrice(quote.itemsSubtotal)}`;
  document.getElementById('print-desc-total').textContent = quote.discountValue
    ? (quote.discountType === 'PERCENTAGE' ? fmtPercent(quote.discountValue) : `$${fmtPrice(quote.discountAmount)}`)
    : '—';
  document.getElementById('print-total').textContent      = `$${fmtPrice(quote.total)}`;
}

function printQuote(quote) {
  fillPrintMirror(quote);
  setTimeout(() => window.print(), 100);
}

// ── Paginación (server-side: cada cambio de página/tamaño vuelve a consultar) ──
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
    if (!disabled) b.addEventListener('click', () => { currentPage = page; fetchQuotes(); });
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

// ── Eventos ──────────────────────────────────────────────────────────────────
pageSizeSelect.addEventListener('change', () => {
  pageSize = parseInt(pageSizeSelect.value, 10);
  currentPage = 1;
  fetchQuotes();
});
retryBtn.addEventListener('click', fetchQuotes);

// ── Init ─────────────────────────────────────────────────────────────────────
fetchQuotes();
