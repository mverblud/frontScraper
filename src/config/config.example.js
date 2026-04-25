/**
 * config.example.js
 * 
 * Plantilla de configuración para ASM.
 * Copia este archivo a config.js y reemplaza los valores con tus credenciales.
 */

export const ASM_CONFIG = {
  // URL base del servicio ASM
  API_BASE: 'http://localhost:3000',
  
  // Credenciales para el endpoint /auth/login
  USERNAME: 'admin',
  PASSWORD: 'tu_password_aqui',
  
  // Clave de sessionStorage para el token
  TOKEN_KEY: 'asm_token'
};
