// maestro-boot.js — Gate de arranque para páginas del servicio "Maestro"
// (Tienda Web, Presupuestos, Catálogo Maestro).
//
// Estas páginas obtienen sus datos de window.ENV.PRODUCTOS_API (no del BFF), así que
// no usan health.js: la señal real de "¿está vivo el servicio?" es si los selectores
// (categorías, marcas) lograron cargar. Este helper oculta la card de búsqueda hasta
// que esos loaders resuelvan, actualiza el badge de estado acorde, y ofrece un botón
// de Reintentar si la carga falla.
//
// Uso (al final del JS de cada página):
//   window.maestroBoot({ loaders: [loadCategorias, loadMarcas] });
//
// Requiere en el HTML: #boot-spinner, #search-card, #boot-error, #boot-retry y el
// .topbar-badge habitual.

(function () {
  'use strict';

  function setBadge(badge, state, text) {
    if (!badge) return;
    badge.classList.remove('badge-checking', 'badge-error');
    if (state === 'checking') badge.classList.add('badge-checking');
    if (state === 'error')    badge.classList.add('badge-error');
    var dot = badge.querySelector('.status-dot');
    badge.textContent = text;
    if (dot) badge.prepend(dot);
  }

  window.maestroBoot = function (opts) {
    var loaders    = (opts && opts.loaders) || [];
    var badge      = document.querySelector('.topbar-badge');
    var spinner    = document.getElementById('boot-spinner');
    var searchCard = document.getElementById('search-card');
    var errorBox   = document.getElementById('boot-error');
    var retryBtn   = document.getElementById('boot-retry');

    async function attempt() {
      if (spinner)    spinner.style.display = '';
      if (searchCard) searchCard.style.display = 'none';
      if (errorBox)   errorBox.style.display = 'none';
      setBadge(badge, 'checking', 'Verificando…');

      try {
        await Promise.all(loaders.map(function (fn) { return fn(); }));
        if (spinner)    spinner.style.display = 'none';
        if (searchCard) searchCard.style.display = '';
        setBadge(badge, 'ok', 'API Conectada');
      } catch (e) {
        if (spinner)  spinner.style.display = 'none';
        if (errorBox) errorBox.style.display = '';
        setBadge(badge, 'error', 'API Desconectada');
      }
    }

    if (retryBtn) retryBtn.addEventListener('click', attempt);

    attempt();
  };
})();
