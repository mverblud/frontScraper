/**
 * auth.js — Módulo único de autenticación y guard de sesión.
 *
 * Un solo login (login-maestro.html / login-maestro.js, contra
 * PRODUCTOS_API) emite un único token que se usa para TODAS las llamadas,
 * tanto al BFF (PRODUCTOS_BFF) como al servicio Maestro (PRODUCTOS_API).
 *
 * Se carga como script clásico (sin defer) en el <head> de cada página.
 *   - Páginas protegidas: <script src="../src/js/auth.js" data-guard>
 *     → redirige a login-maestro.html si no hay sesión activa.
 *   - login-maestro.html: <script src="../src/js/auth.js">
 *     → no redirige; login-maestro.js hace la verificación inversa.
 *
 * Expone window.auth (y el alias window.authMaestro, por compatibilidad
 * con código existente) con helpers de sesión.
 * Instala un override de window.fetch que:
 *   - inyecta "Authorization: Bearer <token>" en las calls a PRODUCTOS_BFF
 *     y a PRODUCTOS_API.
 *   - llama logout() automáticamente si cualquiera de los dos responde 401.
 */

(function () {
  'use strict';

  var TOKEN_KEY = 'ov_auth_token';
  var EXP_KEY   = 'ov_auth_exp';
  var USER_KEY  = 'ov_auth_user';

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

  function setSession(token, user) {
    localStorage.setItem(TOKEN_KEY, token);
    var payload = decodePayload(token);
    var exp = (payload && payload.exp)
      ? payload.exp * 1000
      : Date.now() + 60 * 60 * 1000; // fallback 1h
    localStorage.setItem(EXP_KEY, String(exp));

    if (user && typeof user === 'object') {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_KEY);
    }
  }

  function clearSession() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(EXP_KEY);
    localStorage.removeItem(USER_KEY);
  }

  function getStoredUser() {
    var raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      var parsed = JSON.parse(raw);
      return (parsed && typeof parsed === 'object') ? parsed : null;
    } catch (_) {
      return null;
    }
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

  function getUser() {
    var stored = getStoredUser();
    if (stored) return stored;

    var token = localStorage.getItem(TOKEN_KEY);
    if (!token) return null;

    var payload = decodePayload(token) || {};
    return {
      id: payload.sub || null,
      email: payload.email || '',
      fullName: '',
      roles: Array.isArray(payload.roles) ? payload.roles : [],
    };
  }

  function getUsername() {
    var user = getUser();
    if (!user) return '';

    if (user.fullName) return String(user.fullName);
    if (user.email) return String(user.email);
    if (user.id !== null && user.id !== undefined) return String(user.id);
    return '';
  }

  function getUserRole() {
    var user = getUser();
    if (!user || !Array.isArray(user.roles) || user.roles.length === 0) return '';
    return String(user.roles[0] || '').trim();
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
    var bffBase = window.ENV && window.ENV.PRODUCTOS_BFF;
    var apiBase = window.ENV && window.ENV.PRODUCTOS_API;

    // Interceptar calls tanto al BFF como al servicio Maestro
    var isApiCall = (bffBase && url.indexOf(bffBase) === 0) ||
                     (apiBase && url.indexOf(apiBase) === 0);

    if (isApiCall) {
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

  window.auth = {
    setSession:      setSession,
    getToken:        getToken,
    getUser:         getUser,
    isAuthenticated: isAuthenticated,
    getUsername:     getUsername,
    getUserRole:     getUserRole,
    logout:          logout,
    requireAuth:     requireAuth,
  };

  // Alias por compatibilidad con código que aún referencia window.authMaestro
  window.authMaestro = window.auth;

  // ── Auto-guard si el <script> tiene data-guard ────────────────────────────

  var self = document.currentScript;
  if (self && self.hasAttribute('data-guard')) {
    requireAuth();
  }

})();
