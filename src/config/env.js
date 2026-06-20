/**
 * env.js — Configuración de entornos dev / prod.
 *
 * Cambiar APP_ENV a 'prod' para apuntar a los backends productivos.
 * Esta es la ÚNICA línea que hay que editar para alternar entorno.
 */
const APP_ENV = 'prod'; // 'dev' | 'prod'

const ENVIRONMENTS = {
  dev: {
    RM_BASE:    'http://localhost:3001',
    ASM_BASE:   'http://localhost:3000',
    SADAR_BASE: 'http://localhost:3005',
  },
  prod: {
    RM_BASE:    'https://scraper-repuestos.onrender.com',
    ASM_BASE:   'https://asm-scraper.onrender.com',
    SADAR_BASE: 'https://repuestos-suspension-bff.onrender.com',
  },
};

window.ENV = ENVIRONMENTS[APP_ENV];
console.info('[env] Entorno activo:', APP_ENV, window.ENV);
