/**
 * login.js — Lógica de la página de inicio de sesión.
 *
 * - Si ya hay sesión activa, redirige a home.html.
 * - Envía las credenciales al BFF y, en caso de éxito, guarda el token
 *   con window.auth.setSession() y redirige a home.html.
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

  if (window.auth && window.auth.isAuthenticated()) {
    window.location.replace('home.html');
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

      var username = document.getElementById('username').value.trim();
      var password = document.getElementById('password').value;

      if (!username || !password) {
        showError('Ingresá usuario y contraseña para continuar.');
        return;
      }

      setLoading(true);

      fetch(window.ENV.PRODUCTOS_BFF + '/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username, password: password }),
      })
        .then(function (res) {
          if (res.ok) {
            return res.json().then(function (data) {
              window.auth.setSession(data.token);
              window.location.replace('home.html');
            });
          } else if (res.status === 401) {
            showError('Usuario o contraseña incorrectos.');
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
