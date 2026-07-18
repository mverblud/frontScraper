/**
 * login-maestro.js — Lógica de la página de acceso al Catálogo Maestro.
 *
 * - Si ya hay sesión Maestro activa, redirige a catalogo-maestro.html.
 * - Envía las credenciales al servicio MS (PRODUCTOS_API) y, en caso de
 *   éxito, guarda el token con window.authMaestro.setSession() y redirige
 *   a catalogo-maestro.html.
 */

(function () {
  'use strict';

  // ── Tema ──────────────────────────────────────────────────────────────────

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }

  applyTheme(localStorage.getItem('theme') || 'dark');

  // ── Redirección si ya está autenticado ────────────────────────────────────

  if (window.authMaestro && window.authMaestro.isAuthenticated()) {
    window.location.replace('catalogo-maestro.html');
  }

  // ── Lógica del formulario ─────────────────────────────────────────────────

  document.addEventListener('DOMContentLoaded', function () {
    var form      = document.getElementById('login-form');
    var btnLogin  = document.getElementById('btn-login');
    var btnText   = btnLogin.querySelector('.btn-text');
    var loader    = document.getElementById('login-loader');
    var errorBox  = document.getElementById('login-error');
    var errorMsg  = document.getElementById('login-error-msg');
    var themeBtn  = document.getElementById('theme-toggle');

    // Toggle de tema
    if (themeBtn) {
      themeBtn.addEventListener('click', function () {
        var current = document.documentElement.getAttribute('data-theme') || 'light';
        applyTheme(current === 'light' ? 'dark' : 'light');
      });
    }

    function setLoading(loading) {
      btnLogin.disabled     = loading;
      btnText.style.display = loading ? 'none' : '';
      loader.style.display  = loading ? 'inline-flex' : 'none';
    }

    function showError(msg) {
      errorMsg.textContent   = msg;
      errorBox.style.display = 'flex';
    }

    function hideError() {
      errorBox.style.display = 'none';
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      hideError();

      var email    = document.getElementById('email').value.trim();
      var password = document.getElementById('password').value;

      if (!email || !password) {
        showError('Ingresá email y contraseña para continuar.');
        return;
      }

      setLoading(true);

      fetch(window.ENV.PRODUCTOS_API + '/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ email: email, password: password }),
      })
        .then(function (res) {
          if (res.ok) {
            return res.json().then(function (data) {
              var token = data && (
                data.token ||
                data.accessToken ||
                data.access_token ||
                (data.data && data.data.token)
              );
              if (!token) {
                showError('Respuesta inesperada del servidor. Intentá de nuevo.');
                setLoading(false);
                return;
              }
              window.authMaestro.setSession(token);
              window.location.replace('catalogo-maestro.html');
            });
          } else if (res.status === 401) {
            showError('Email o contraseña incorrectos.');
            setLoading(false);
          } else {
            showError('Error del servidor (' + res.status + '). Intentá de nuevo.');
            setLoading(false);
          }
        })
        .catch(function () {
          showError('No se pudo conectar con el servidor. Verificá tu conexión.');
          setLoading(false);
        });
    });
  });

})();
