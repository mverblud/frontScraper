/**
 * health.js — Verificación real del BFF en todas las páginas.
 *
 * Actualiza el badge .topbar-badge con el estado real de /health.
 * Expone window.health.onResult(fn) para que otras páginas (ej: home.js)
 * puedan reaccionar al resultado sin hacer un segundo fetch.
 */

(function () {
  'use strict';

  const POLL_INTERVAL_MS = 30_000; // re-chequea cada 30 s

  // Suscriptores de resultado (home.js se suscribe aquí)
  const _listeners = [];

  function onResult(fn) {
    _listeners.push(fn);
  }

  function _notify(result) {
    _listeners.forEach(function (fn) {
      try { fn(result); } catch (_) {}
    });
  }

  // ── Helpers de badge ─────────────────────────────────────────────────────────

  function setBadgeState(badge, state, text) {
    badge.classList.remove('badge-checking', 'badge-error');
    if (state === 'checking') badge.classList.add('badge-checking');
    if (state === 'error')    badge.classList.add('badge-error');
    var dot = badge.querySelector('.status-dot');
    badge.textContent = text;
    if (dot) badge.prepend(dot);
  }

  // ── Función principal ─────────────────────────────────────────────────────────

  async function checkBackendHealth() {
    var badge = document.querySelector('.topbar-badge');

    if (badge) setBadgeState(badge, 'checking', 'Verificando…');
    _notify(null); // señal de "verificando" a los listeners

    var result;
    try {
      var res = await fetch(window.ENV.PRODUCTOS_BFF + '/health');
      if (res.ok) {
        if (badge) setBadgeState(badge, 'ok', 'API Conectada');
        result = { ok: true, status: res.status };
      } else {
        if (badge) setBadgeState(badge, 'error', 'API con errores');
        result = { ok: false, status: res.status };
      }
    } catch (e) {
      if (badge) setBadgeState(badge, 'error', 'API Desconectada');
      result = { ok: false, error: e.message };
    }

    _notify(result);
    return result;
  }

  // Namespace público
  window.health = { onResult: onResult, check: checkBackendHealth };

  // ── Auto-run al cargar ────────────────────────────────────────────────────────

  function run() {
    checkBackendHealth();
    setInterval(checkBackendHealth, POLL_INTERVAL_MS);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
})();
