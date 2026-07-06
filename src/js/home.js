/**
 * home.js — Lógica de la pantalla de inicio.
 *
 * Maneja el toggle de tema y pinta la card de estado del backend
 * suscribiéndose al resultado de health.js (sin un segundo fetch).
 */

(function () {
  'use strict';

  // ── THEME (mismo patrón que app.js:97-107) ──────────────────────────────────

  var themeToggle = document.getElementById('theme-toggle');

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }

  if (themeToggle) {
    themeToggle.addEventListener('click', function () {
      var cur = document.documentElement.getAttribute('data-theme');
      applyTheme(cur === 'dark' ? 'light' : 'dark');
    });
  }

  applyTheme(localStorage.getItem('theme') || 'dark');

  // ── BACKEND STATUS CARD ─────────────────────────────────────────────────────

  var statusCard = document.getElementById('backend-status-card');
  var statusIcon = document.getElementById('backend-status-icon');
  var statusMsg  = document.getElementById('backend-status-msg');

  var ICON_CHECKING = '<svg width="18" height="18" viewBox="0 0 20 20" fill="none">'
    + '<circle cx="10" cy="10" r="8" stroke="currentColor" stroke-width="2.5"'
    + ' stroke-dasharray="25 25" stroke-linecap="round">'
    + '<animateTransform attributeName="transform" type="rotate"'
    + ' from="0 10 10" to="360 10 10" dur="0.7s" repeatCount="indefinite"/>'
    + '</circle></svg>';

  var ICON_OK = '<svg width="18" height="18" viewBox="0 0 18 18" fill="none">'
    + '<circle cx="9" cy="9" r="7.5" stroke="currentColor" stroke-width="1.5"/>'
    + '<path d="M5.5 9.5l2.5 2.5 4.5-5" stroke="currentColor" stroke-width="1.5"'
    + ' stroke-linecap="round" stroke-linejoin="round"/></svg>';

  var ICON_ERROR = '<svg width="18" height="18" viewBox="0 0 18 18" fill="none">'
    + '<circle cx="9" cy="9" r="7.5" stroke="currentColor" stroke-width="1.5"/>'
    + '<path d="M9 5.5V9.5M9 12h.01" stroke="currentColor" stroke-width="1.5"'
    + ' stroke-linecap="round"/></svg>';

  function renderStatusCard(result) {
    if (!statusCard) return;

    statusCard.classList.remove('status-ok', 'status-error', 'status-checking');

    if (result === null || result === undefined) {
      // health.js notifica null cuando empieza a verificar
      statusCard.classList.add('status-checking');
      if (statusIcon) statusIcon.innerHTML = ICON_CHECKING;
      if (statusMsg)  statusMsg.textContent = 'Verificando conexión…';
      return;
    }

    if (result.ok) {
      statusCard.classList.add('status-ok');
      if (statusIcon) statusIcon.innerHTML = ICON_OK;
      if (statusMsg)  statusMsg.textContent = 'El backend está operativo y respondiendo correctamente.';
    } else {
      statusCard.classList.add('status-error');
      if (statusIcon) statusIcon.innerHTML = ICON_ERROR;
      var detail = result.status
        ? ' (HTTP ' + result.status + ')'
        : (result.error ? ': ' + result.error : '');
      if (statusMsg) statusMsg.textContent = 'No se pudo conectar con el servidor' + detail + '.';
    }
  }

  // ── Init ────────────────────────────────────────────────────────────────────

  function init() {
    // Suscribirse al resultado de health.js (sin doble fetch)
    if (window.health && window.health.onResult) {
      window.health.onResult(renderStatusCard);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
