const API_BASE = 'http://localhost:3001';

// ── Helpers ───────────────────────────────────────────────────
function escHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── Theme ─────────────────────────────────────────────────────
function initTheme() {
  const toggle = document.getElementById('theme-toggle');
  const saved = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', saved);

  toggle.addEventListener('click', () => {
    const cur = document.documentElement.getAttribute('data-theme');
    const next = cur === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
  });
}

// ── Toast ─────────────────────────────────────────────────────
function ensureToastContainer() {
  let c = document.getElementById('toast-container');
  if (!c) {
    c = document.createElement('div');
    c.id = 'toast-container';
    c.className = 'toast-container';
    document.body.appendChild(c);
  }
  return c;
}

function showToast(message, type = 'success') {
  const container = ensureToastContainer();
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  const icon = type === 'success'
    ? '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8.5l3 3 7-7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>'
    : '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.5"/><path d="M8 5v3.5M8 11h.01" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>';
  toast.innerHTML = `${icon}<span>${escHtml(message)}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('removing');
    toast.addEventListener('animationend', () => toast.remove());
  }, 3500);
}

// ── Confirm Dialog ────────────────────────────────────────────
function showConfirm(title, message) {
  return new Promise(resolve => {
    const overlay = document.createElement('div');
    overlay.className = 'confirm-overlay';
    overlay.innerHTML = `
      <div class="confirm-dialog">
        <h3>${escHtml(title)}</h3>
        <p>${escHtml(message)}</p>
        <div class="confirm-actions">
          <button class="btn-ghost" id="confirm-cancel">Cancelar</button>
          <button class="btn-danger" id="confirm-ok">Eliminar</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    const close = (val) => {
      overlay.remove();
      resolve(val);
    };

    overlay.querySelector('#confirm-cancel').addEventListener('click', () => close(false));
    overlay.querySelector('#confirm-ok').addEventListener('click', () => close(true));
    overlay.addEventListener('click', e => { if (e.target === overlay) close(false); });
    document.addEventListener('keydown', function handler(e) {
      if (e.key === 'Escape') { close(false); document.removeEventListener('keydown', handler); }
    });
  });
}

// ── API Calls ─────────────────────────────────────────────────
async function apiGetMarcas() {
  const res = await fetch(`${API_BASE}/marcas`);
  if (!res.ok) throw new Error(`Error del servidor: HTTP ${res.status}`);
  return res.json();
}

async function apiGetMarca(id) {
  const res = await fetch(`${API_BASE}/marcas/${encodeURIComponent(id)}`);
  if (res.status === 404) throw new Error('Marca no encontrada');
  if (!res.ok) throw new Error(`Error del servidor: HTTP ${res.status}`);
  return res.json();
}

async function apiCreateMarca(data) {
  const res = await fetch(`${API_BASE}/marcas`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (res.status === 400) {
    const body = await res.json();
    throw { status: 400, details: body.details, message: body.error };
  }
  if (res.status === 409) {
    const body = await res.json();
    throw { status: 409, message: body.message };
  }
  if (!res.ok) throw new Error(`Error del servidor: HTTP ${res.status}`);
  return res.json();
}

async function apiUpdateMarca(id, data) {
  const res = await fetch(`${API_BASE}/marcas/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (res.status === 404) throw { status: 404, message: 'Marca no encontrada' };
  if (res.status === 409) {
    const body = await res.json();
    throw { status: 409, message: body.message };
  }
  if (res.status === 400) {
    const body = await res.json();
    throw { status: 400, details: body.details, message: body.error };
  }
  if (!res.ok) throw new Error(`Error del servidor: HTTP ${res.status}`);
  return res.json();
}

async function apiDeleteMarca(id) {
  const res = await fetch(`${API_BASE}/marcas/${encodeURIComponent(id)}`, {
    method: 'DELETE'
  });
  if (res.status === 404) throw { status: 404, message: 'Marca no encontrada' };
  if (!res.ok) throw new Error(`Error del servidor: HTTP ${res.status}`);
}

// ══════════════════════════════════════════════════════════════
// ── Página: LISTADO (/marcas.html) ───────────────────────────
// ══════════════════════════════════════════════════════════════
function initMarcasListado() {
  initTheme();
  const tbody = document.getElementById('marcas-body');
  const loadingEl = document.getElementById('marcas-loading');
  const tableEl = document.getElementById('marcas-table');
  const emptyEl = document.getElementById('marcas-empty');
  const errorEl = document.getElementById('marcas-error');
  const countEl = document.getElementById('marcas-count');

  async function load() {
    loadingEl.style.display = '';
    tableEl.style.display = 'none';
    emptyEl.style.display = 'none';
    errorEl.style.display = 'none';

    try {
      const marcas = await apiGetMarcas();
      loadingEl.style.display = 'none';

      if (marcas.length === 0) {
        emptyEl.style.display = '';
        countEl.textContent = '0 marcas';
        return;
      }

      countEl.textContent = `${marcas.length} marca${marcas.length !== 1 ? 's' : ''}`;
      tbody.innerHTML = '';
      marcas.forEach(m => {
        const tr = document.createElement('tr');
        const badgeClass = m.marcaHabilitado ? 'badge-activo' : 'badge-inactivo';
        const badgeText = m.marcaHabilitado ? 'Activo' : 'Inactivo';
        tr.innerHTML = `
          <td>${escHtml(m.marcaName)}</td>
          <td><span class="badge ${badgeClass}"><span class="badge-dot"></span>${badgeText}</span></td>
          <td>
            <div class="td-actions">
              <a href="marcas-editar.html?id=${encodeURIComponent(m.marcaId)}" class="btn-icon btn-edit">
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M9.5 1.5l2 2L4 11H2v-2L9.5 1.5z" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>
                Editar
              </a>
              <button class="btn-icon btn-delete" data-id="${m.marcaId}" data-name="${escHtml(m.marcaName)}">
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 3.5h9M4.5 3.5V2.5a1 1 0 011-1h2a1 1 0 011 1v1M5.5 6v3.5M7.5 6v3.5M3.5 3.5l.5 7.5a1 1 0 001 1h3a1 1 0 001-1l.5-7.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                Eliminar
              </button>
            </div>
          </td>
        `;
        tr.querySelector('.btn-delete').addEventListener('click', async function() {
          const id = this.dataset.id;
          const name = this.dataset.name;
          const confirmed = await showConfirm(
            '¿Eliminar marca?',
            `Se eliminará la marca "${name}". Esta acción no se puede deshacer.`
          );
          if (!confirmed) return;
          try {
            await apiDeleteMarca(id);
            showToast(`Marca "${name}" eliminada correctamente`);
            load();
          } catch (err) {
            showToast(err.message || 'Error al eliminar la marca', 'error');
          }
        });
        tbody.appendChild(tr);
      });
      tableEl.style.display = '';

    } catch (err) {
      loadingEl.style.display = 'none';
      errorEl.style.display = '';
      errorEl.querySelector('p').textContent = err.message || 'No se pudo conectar con el servidor.';
    }
  }

  load();
}

// ══════════════════════════════════════════════════════════════
// ── Página: CREAR (/marcas-nueva.html) ───────────────────────
// ══════════════════════════════════════════════════════════════
function initMarcasNueva() {
  initTheme();
  const form = document.getElementById('marca-form');
  const nameInput = document.getElementById('marca-name');
  const nameError = document.getElementById('marca-name-error');
  const btnSubmit = document.getElementById('btn-guardar');
  const btnText = btnSubmit.querySelector('.btn-text');
  const btnLoader = btnSubmit.querySelector('.btn-loader');

  function validate() {
    const val = nameInput.value.trim();
    if (!val) {
      nameInput.classList.add('has-error');
      nameError.textContent = 'El nombre de la marca es requerido.';
      nameError.classList.add('visible');
      return false;
    }
    if (val.length > 100) {
      nameInput.classList.add('has-error');
      nameError.textContent = 'El nombre no puede superar los 100 caracteres.';
      nameError.classList.add('visible');
      return false;
    }
    nameInput.classList.remove('has-error');
    nameError.classList.remove('visible');
    return true;
  }

  nameInput.addEventListener('input', () => {
    if (nameInput.value.trim()) {
      nameInput.classList.remove('has-error');
      nameError.classList.remove('visible');
    }
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validate()) return;

    btnSubmit.disabled = true;
    btnText.textContent = 'Guardando…';
    btnLoader.style.display = 'inline-flex';

    try {
      await apiCreateMarca({
        marcaName: nameInput.value.trim(),
        marcaHabilitado: true
      });
      // Guardar mensaje para mostrar en la página de listado
      sessionStorage.setItem('marcas_toast', 'Marca creada correctamente');
      window.location.href = 'marcas.html';
    } catch (err) {
      if (err.status === 409) {
        nameInput.classList.add('has-error');
        nameError.textContent = err.message || 'Ya existe una marca con ese nombre.';
        nameError.classList.add('visible');
      } else if (err.status === 400 && err.details) {
        const msgs = Object.values(err.details).flat();
        nameInput.classList.add('has-error');
        nameError.textContent = msgs[0] || 'Datos inválidos.';
        nameError.classList.add('visible');
      } else {
        showToast(err.message || 'Error al crear la marca', 'error');
      }
    } finally {
      btnSubmit.disabled = false;
      btnText.textContent = 'Guardar';
      btnLoader.style.display = 'none';
    }
  });
}

// ══════════════════════════════════════════════════════════════
// ── Página: EDITAR (/marcas-editar.html) ─────────────────────
// ══════════════════════════════════════════════════════════════
function initMarcasEditar() {
  initTheme();
  const params = new URLSearchParams(window.location.search);
  const marcaId = params.get('id');

  const form = document.getElementById('marca-form');
  const nameInput = document.getElementById('marca-name');
  const nameError = document.getElementById('marca-name-error');
  const habilitadoInput = document.getElementById('marca-habilitado');
  const btnSubmit = document.getElementById('btn-guardar');
  const btnText = btnSubmit.querySelector('.btn-text');
  const btnLoader = btnSubmit.querySelector('.btn-loader');
  const formCard = document.getElementById('form-card');
  const loadingEl = document.getElementById('form-loading');
  const errorEl = document.getElementById('form-error');

  if (!marcaId) {
    window.location.href = 'marcas.html';
    return;
  }

  async function loadMarca() {
    loadingEl.style.display = '';
    formCard.style.display = 'none';
    errorEl.style.display = 'none';

    try {
      const marca = await apiGetMarca(marcaId);
      nameInput.value = marca.marcaName;
      habilitadoInput.checked = marca.marcaHabilitado;
      loadingEl.style.display = 'none';
      formCard.style.display = '';
    } catch (err) {
      loadingEl.style.display = 'none';
      errorEl.style.display = '';
      errorEl.querySelector('p').textContent = err.message || 'No se pudo cargar la marca.';
    }
  }

  function validate() {
    const val = nameInput.value.trim();
    if (!val) {
      nameInput.classList.add('has-error');
      nameError.textContent = 'El nombre de la marca es requerido.';
      nameError.classList.add('visible');
      return false;
    }
    if (val.length > 100) {
      nameInput.classList.add('has-error');
      nameError.textContent = 'El nombre no puede superar los 100 caracteres.';
      nameError.classList.add('visible');
      return false;
    }
    nameInput.classList.remove('has-error');
    nameError.classList.remove('visible');
    return true;
  }

  nameInput.addEventListener('input', () => {
    if (nameInput.value.trim()) {
      nameInput.classList.remove('has-error');
      nameError.classList.remove('visible');
    }
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validate()) return;

    btnSubmit.disabled = true;
    btnText.textContent = 'Guardando…';
    btnLoader.style.display = 'inline-flex';

    try {
      await apiUpdateMarca(marcaId, {
        marcaName: nameInput.value.trim(),
        marcaHabilitado: habilitadoInput.checked
      });
      sessionStorage.setItem('marcas_toast', 'Marca actualizada correctamente');
      window.location.href = 'marcas.html';
    } catch (err) {
      if (err.status === 409) {
        nameInput.classList.add('has-error');
        nameError.textContent = err.message || 'Ya existe una marca con ese nombre.';
        nameError.classList.add('visible');
      } else if (err.status === 404) {
        showToast('La marca ya no existe.', 'error');
      } else if (err.status === 400 && err.details) {
        const msgs = Object.values(err.details).flat();
        nameInput.classList.add('has-error');
        nameError.textContent = msgs[0] || 'Datos inválidos.';
        nameError.classList.add('visible');
      } else {
        showToast(err.message || 'Error al actualizar la marca', 'error');
      }
    } finally {
      btnSubmit.disabled = false;
      btnText.textContent = 'Guardar cambios';
      btnLoader.style.display = 'none';
    }
  });

  loadMarca();
}

// ── Check pending toast on page load ─────────────────────────
function checkPendingToast() {
  const msg = sessionStorage.getItem('marcas_toast');
  if (msg) {
    sessionStorage.removeItem('marcas_toast');
    setTimeout(() => showToast(msg), 200);
  }
}
