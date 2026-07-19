/**
 * auth-maestro.js — Módulo de autenticación y guard de sesión para el
 * servicio "Maestro" (PRODUCTOS_API / repuestos-suspension-ms).
 *
 * Convive con auth.js (que autentica contra el BFF) sin interferir: usa
 * claves de localStorage propias y solo intercepta llamadas a PRODUCTOS_API.
 *
 * Se carga como script clásico (sin defer) en el <head> de cada página.
 *   - Páginas protegidas: <script src="../src/js/auth-maestro.js" data-guard>
 *     → redirige a login-maestro.html si no hay sesión activa.
 *   - login-maestro.html: <script src="../src/js/auth-maestro.js">
 *     → no redirige; login-maestro.js hace la verificación inversa.
 *
 * Expone window.authMaestro con helpers de sesión.
 * Instala un override de window.fetch que:
 *   - inyecta "Authorization: Bearer <token>" en todas las calls a PRODUCTOS_API.
 *   - llama logout() automáticamente si PRODUCTOS_API responde 401.
 */

(function () {
  'use strict';

  var TOKEN_KEY = 'ov_maestro_token';
  var EXP_KEY   = 'ov_maestro_exp';

  // ── JWT decode ────────────────────────────────────────────────────────────

  function decodePayload(token) {
    try {
      var parts = token.split('.');
      if (parts.length !== 3) return null;
      var base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      var pad = base64.length % 4;
      if (pad) base64 += '===='.slice(pad);
      return JSON.parse(atob(base64));
    } catch (_) {
      return null;
    }
  }

  // ── Gestión de sesión ─────────────────────────────────────────────────────

  function setSession(token) {
    localStorage.setItem(TOKEN_KEY, token);
    var payload = decodePayload(token);
    var exp = (payload && payload.exp)
      ? payload.exp * 1000
      : Date.now() + 60 * 60 * 1000; // fallback 1h
    localStorage.setItem(EXP_KEY, String(exp));
  }

  function clearSession() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(EXP_KEY);
  }

  function getToken() {
    var token = localStorage.getItem(TOKEN_KEY);
    if (!token) return null;
    var exp = parseInt(localStorage.getItem(EXP_KEY) || '0', 10);
    if (exp && Date.now() >= exp) {
      clearSession();
      return null;
    }
    return token;
  }

  function isAuthenticated() {
    return !!getToken();
  }

  function getUsername() {
    var token = localStorage.getItem(TOKEN_KEY);
    if (!token) return '';
    var payload = decodePayload(token);
    return (payload && payload.sub) ? String(payload.sub) : '';
  }

  function logout(redirect) {
    clearSession();
    if (redirect !== false) {
      window.location.replace('login-maestro.html');
    }
  }

  // ── Guard de sesión ───────────────────────────────────────────────────────

  function requireAuth() {
    if (!isAuthenticated()) {
      window.location.replace('login-maestro.html');
    }
  }

  // ── Override de window.fetch ──────────────────────────────────────────────

  var _nativeFetch = window.fetch.bind(window);

  window.fetch = function (input, init) {
    var url = typeof input === 'string'
      ? input
      : (input && typeof input.url === 'string' ? input.url : '');
    var apiBase = window.ENV && window.ENV.PRODUCTOS_API;

    // Solo interceptar calls a la API Maestro
    if (apiBase && url.indexOf(apiBase) === 0) {
      var token = getToken();
      init = Object.assign({}, init);
      var headers = Object.assign({}, init.headers || {});
      if (token) {
        headers['Authorization'] = 'Bearer ' + token;
      }
      init.headers = headers;

      return _nativeFetch(input, init).then(function (res) {
        // Auto-logout en 401, excepto en el propio endpoint de login
        if (res.status === 401 && url.indexOf('/auth/login') === -1) {
          logout();
        }
        return res;
      });
    }

    return _nativeFetch(input, init);
  };

  // ── API pública ───────────────────────────────────────────────────────────

  window.authMaestro = {
    setSession:      setSession,
    getToken:        getToken,
    isAuthenticated: isAuthenticated,
    getUsername:     getUsername,
    logout:          logout,
    requireAuth:     requireAuth,
  };

  // ── Auto-guard si el <script> tiene data-guard ────────────────────────────

  var self = document.currentScript;
  if (self && self.hasAttribute('data-guard')) {
    requireAuth();
  }

})();
