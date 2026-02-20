import { Router } from 'express';
// Importamos el controlador de autenticación que ya verificamos
import * as authController from '../controllers/authController';

const router = Router();

/**
 * 🔐 RUTAS DE AUTENTICACIÓN
 * Estas rutas permiten el ingreso de los técnicos de ServisTech al sistema
 */

// Ruta para iniciar sesión (POST /api/auth/login)
router.post('/auth/login', authController.login);

// Ruta para obtener datos del usuario actual (GET /api/auth/me)
router.get('/auth/me', authController.getMe);


/**
 * 📱 FUTURAS RUTAS DE SERVISTECH
 * Aquí es donde añadirás las rutas para clientes, reparaciones y equipos
 * Ejemplo: router.use('/reparaciones', reparacionRoutes);
 */

// Ruta de prueba (Ping)
router.get('/ping', (req, res) => {
  res.json({ message: 'Pong! El sistema de rutas de ServisTech funciona correctamente.' });
});

// NUEVO: Ruta Healthcheck obligatoria para Railway y Docker
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'ServisTech API is healthy and running!' });
});

export default router;