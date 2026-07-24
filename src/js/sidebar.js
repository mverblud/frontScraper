/**
 * sidebar.js — Componente compartido del menú lateral.
 *
 * Inyecta el sidebar en todas las páginas, calcula el ítem activo
 * por URL, maneja colapso desktop (iconos) y menú off-canvas mobile.
 */

(function () {
  'use strict';

  // ── Definición de ítems de navegación ──────────────────────────────────────

  const NAV_ITEMS = [
    {
      href: 'home.html',
      label: 'Inicio',
      icon: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M2 6.5L8 2l6 4.5V14a1 1 0 01-1 1H3a1 1 0 01-1-1V6.5z"
          stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
        <path d="M6 15V9h4v6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>`,
    },
    {
      href: 'catalogo-nuevo.html',
      label: 'Catálogo Unificado',
      icon: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle cx="6.5" cy="6.5" r="4" stroke="currentColor" stroke-width="1.5"/>
        <path d="M10 10L13.5 13.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      </svg>`,
    },
    {
      href: 'catalogo-ov.html',
      label: 'Inventario OV',
      icon: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" stroke-width="1.5"/>
        <path d="M5 5.5h6M5 8h4M5 10.5h5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      </svg>`,
    },
    {
      href: 'index.html',
      label: 'Catálogo RM',
      icon: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" stroke-width="1.5"/>
        <path d="M5 5.5h6M5 8h6M5 10.5h6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      </svg>`,
    },
    {
      href: 'catalogo-asm.html',
      label: 'Catálogo ASM',
      icon: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" stroke-width="1.5"/>
        <path d="M5 5.5h6M5 8h6M5 10.5h6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      </svg>`,
    },
    {
      href: 'catalogo-sadar.html',
      label: 'Catálogo SADAR',
      icon: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" stroke-width="1.5"/>
        <path d="M4 5.5h5M4 8h8M4 10.5h6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      </svg>`,
    },
    {
      href: 'catalogo-maestro.html',
      label: 'Productos',
      icon: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M8 2l1.6 3.6L13.5 6l-2.9 2.6.8 3.9L8 10.6l-3.4 1.9.8-3.9L2.5 6l3.9-.4L8 2z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
      </svg>`,
    },
    {
      href: 'tienda.html',
      label: 'Simulación Tienda Web',
      icon: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M2 5l1-3h10l1 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M2 5h12v8a1 1 0 01-1 1H3a1 1 0 01-1-1V5z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
        <path d="M5.5 8a2.5 2.5 0 005 0" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      </svg>`,
    },
    {
      href: 'presupuestos.html',
      label: 'Cotizador',
      icon: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <rect x="3" y="2.5" width="10" height="12" rx="1.5" stroke="currentColor" stroke-width="1.5"/>
        <path d="M6 1.5h4a1 1 0 011 1v1H5v-1a1 1 0 011-1z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
        <path d="M5.5 7h5M5.5 9.5h5M5.5 12h3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      </svg>`,
    },
    {
      href: 'presupuestos-lista.html',
      label: 'Presupuestos',
      icon: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M4 2h6l3 3v9a1 1 0 01-1 1H4a1 1 0 01-1-1V3a1 1 0 011-1z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
        <path d="M10 2v3h3" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
        <path d="M5 8.5h6M5 11h6M5 6h2.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      </svg>`,
    },
  ];

  // ── Detectar ítem activo ────────────────────────────────────────────────────

  function getActiveHref() {
    const parts = window.location.pathname.split('/');
    return parts[parts.length - 1] || 'home.html';
  }

  // ── Generar markup del sidebar ──────────────────────────────────────────────

  function buildSidebar(activeHref) {
    const navItems = NAV_ITEMS.map(({ href, label, icon }) => {
      const isActive = href === activeHref ? ' active' : '';
      return `<a class="nav-item${isActive}" href="${href}" title="${label}">
        ${icon}
        <span class="nav-label">${label}</span>
      </a>`;
    }).join('\n');

    const username = (window.auth && window.auth.getUsername()) || 'OV';
    const avatar = username.slice(0, 2).toUpperCase();

    return `<aside class="sidebar" id="sidebar">
  <a class="sidebar-logo" href="home.html">
    <div class="logo-mark">
      <img src="../images/cRecurso%204@4x.png" alt="Logo OV Suspension" class="logo-mark-img" />
    </div>
    <div class="logo-text">
      <span class="logo-name">OV Suspensión</span>
      <span class="logo-sub">Sistema de Gestión</span>
    </div>
  </a>

  <nav class="sidebar-nav">
    <div class="nav-section-label">Principal</div>
    ${navItems}
  </nav>

  <div class="sidebar-footer">
    <div class="user-info">
      <div class="user-avatar">${avatar}</div>
      <div class="user-details">
        <span class="user-name">${username}</span>
        <span class="user-role">Administrador</span>
      </div>
      <button class="sidebar-logout-btn" id="sidebar-logout-btn" title="Cerrar sesión" aria-label="Cerrar sesión">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M6 14H3a1 1 0 01-1-1V3a1 1 0 011-1h3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          <path d="M10 11l3-3-3-3M13 8H6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    </div>
  </div>

  <button class="sidebar-collapse-btn" id="sidebar-collapse-btn" title="Colapsar menú" aria-label="Colapsar menú">
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M9 2L4 7l5 5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
    <span class="collapse-label">Colapsar</span>
  </button>
</aside>

<div class="sidebar-overlay" id="sidebar-overlay"></div>`;
  }

  // ── Inyectar botón hamburguesa en topbar ────────────────────────────────────

  function injectHamburger() {
    const topbarLeft = document.querySelector('.topbar-left');
    if (!topbarLeft) return;

    const btn = document.createElement('button');
    btn.className = 'sidebar-toggle';
    btn.id = 'sidebar-toggle';
    btn.title = 'Abrir menú';
    btn.setAttribute('aria-label', 'Abrir menú');
    btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M3 5h12M3 9h12M3 13h12" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
    </svg>`;

    topbarLeft.prepend(btn);
  }

  // ── Lógica de colapso desktop ───────────────────────────────────────────────

  const COLLAPSED_KEY = 'ov_sidebar_collapsed';

  function applyCollapsedState() {
    const isCollapsed = localStorage.getItem(COLLAPSED_KEY) === 'true';
    document.documentElement.classList.toggle('sidebar-collapsed', isCollapsed);
  }

  function toggleCollapse() {
    const collapsed = document.documentElement.classList.toggle('sidebar-collapsed');
    localStorage.setItem(COLLAPSED_KEY, collapsed);
  }

  // ── Lógica mobile off-canvas ────────────────────────────────────────────────

  function openMobile() {
    document.documentElement.classList.add('sidebar-open');
  }

  function closeMobile() {
    document.documentElement.classList.remove('sidebar-open');
  }

  // ── Init ────────────────────────────────────────────────────────────────────

  function init() {
    const activeHref = getActiveHref();

    // 1. Inyectar sidebar HTML al inicio del body
    const tmp = document.createElement('div');
    tmp.innerHTML = buildSidebar(activeHref);
    // insertamos el <aside> y el overlay antes del primer hijo existente
    while (tmp.firstChild) {
      document.body.insertBefore(tmp.firstChild, document.body.firstChild);
    }

    // 2. Botón hamburguesa en topbar
    injectHamburger();

    // 3. Restaurar estado colapsado (desktop)
    applyCollapsedState();

    // 4. Wiring eventos
    const collapseBtn = document.getElementById('sidebar-collapse-btn');
    if (collapseBtn) collapseBtn.addEventListener('click', toggleCollapse);

    const toggleBtn = document.getElementById('sidebar-toggle');
    if (toggleBtn) toggleBtn.addEventListener('click', openMobile);

    const overlay = document.getElementById('sidebar-overlay');
    if (overlay) overlay.addEventListener('click', closeMobile);

    // Botón de logout
    const logoutBtn = document.getElementById('sidebar-logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', function () {
        if (window.auth) window.auth.logout();
      });
    }

    // Cerrar al hacer click en cualquier nav-item (mobile)
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
      sidebar.querySelectorAll('.nav-item').forEach(function (link) {
        link.addEventListener('click', function () {
          if (window.innerWidth <= 768) closeMobile();
        });
      });
    }

    // Cerrar con Escape
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeMobile();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
