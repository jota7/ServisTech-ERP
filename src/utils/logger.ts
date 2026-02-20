/**
 * Sistema de Logs para ServisTech
 * Registra eventos, errores y auditoría del soporte técnico.
 */
export const logger = {
  info: (msg: any, context: any = '') => {
    console.log(`\x1b[32m[INFO]\x1b[0m ${new Date().toLocaleString()}:`, msg, context);
  },
  error: (msg: any, context: any = '') => {
    console.error(`\x1b[31m[ERROR]\x1b[0m ${new Date().toLocaleString()}:`, msg, context);
  },
  warn: (msg: any, context: any = '') => {
    console.warn(`\x1b[33m[WARN]\x1b[0m ${new Date().toLocaleString()}:`, msg, context);
  }
};