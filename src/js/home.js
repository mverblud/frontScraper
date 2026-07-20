/**
 * home.js — Lógica de la pantalla de inicio.
 *
 * Maneja el toggle de tema y pinta las cards de estado de los dos
 * servicios: el BFF (suscribiéndose al resultado de health.js, sin un
 * segundo fetch) y el servicio Maestro / PRODUCTOS_API (chequeo propio).
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

  // ── BACKEND STATUS CARDS ─────────────────────────────────────────────────────

  var MAESTRO_POLL_INTERVAL_MS = 30000;

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

  function makeStatusRenderer(card, icon, msg, okText) {
    return function renderStatusCard(result) {
      if (!card) return;

      card.classList.remove('status-ok', 'status-error', 'status-checking');

      if (result === null || result === undefined) {
        card.classList.add('status-checking');
        if (icon) icon.innerHTML = ICON_CHECKING;
        if (msg)  msg.textContent = 'Verificando conexión…';
        return;
      }

      if (result.ok) {
        card.classList.add('status-ok');
        if (icon) icon.innerHTML = ICON_OK;
        if (msg)  msg.textContent = okText;
      } else {
        card.classList.add('status-error');
        if (icon) icon.innerHTML = ICON_ERROR;
        var detail = result.status
          ? ' (HTTP ' + result.status + ')'
          : (result.error ? ': ' + result.error : '');
        if (msg) msg.textContent = 'No se pudo conectar con el servidor' + detail + '.';
      }
    };
  }

  var renderBackendStatus = makeStatusRenderer(
    document.getElementById('backend-status-card'),
    document.getElementById('backend-status-icon'),
    document.getElementById('backend-status-msg'),
    'El backend está operativo y respondiendo correctamente.'
  );

  var renderMaestroStatus = makeStatusRenderer(
    document.getElementById('maestro-status-card'),
    document.getElementById('maestro-status-icon'),
    document.getElementById('maestro-status-msg'),
    'El servicio Maestro está operativo y respondiendo correctamente.'
  );

  // Chequeo propio para el servicio Maestro (no pasa por health.js: ese
  // módulo solo verifica el BFF vía el badge del topbar).
  async function checkMaestroHealth() {
    renderMaestroStatus(null);
    var result;
    try {
      var res = await fetch(window.ENV.PRODUCTOS_API + '/health');
      result = res.ok ? { ok: true, status: res.status } : { ok: false, status: res.status };
    } catch (e) {
      result = { ok: false, error: e.message };
    }
    renderMaestroStatus(result);
  }

  // ── Init ────────────────────────────────────────────────────────────────────

  function init() {
    // Suscribirse al resultado de health.js (sin doble fetch)
    if (window.health && window.health.onResult) {
      window.health.onResult(renderBackendStatus);
    }

    if (window.ENV && window.ENV.PRODUCTOS_API) {
      checkMaestroHealth();
      setInterval(checkMaestroHealth, MAESTRO_POLL_INTERVAL_MS);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
