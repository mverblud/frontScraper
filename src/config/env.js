/**
 * env.js — Configuración de entornos dev / prod.
 *
 * Cambiar APP_ENV a 'prod' para apuntar al BFF productivo.
 * Esta es la ÚNICA línea que hay que editar para alternar entorno.
 */
const APP_ENV = 'dev'; // 'dev' | 'prod'

const ENVIRONMENTS = {
  dev:  { PRODUCTOS_BFF: 'http://localhost:3005' },
  prod: { PRODUCTOS_BFF: 'https://repuestos-suspension-bff.onrender.com' },
};

window.ENV = ENVIRONMENTS[APP_ENV];
console.info('[env] Entorno activo:', APP_ENV, window.ENV);
