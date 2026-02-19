/**
 * SERVISTECH V4.0 - Delivery Routes
 * Portal Web Clientes + App Mensajero
 */

import { Router } from 'express';
import {
  createDeliveryRequest,
  getDeliveryRequests,
  getDeliveryRequestById,
  assignMessenger,
  updateDeliveryStatus,
  convertToOrder,
  getMessengerRequests,
  trackDelivery,
} from '../controllers/deliveryController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Rutas públicas (portal web clientes)
router.post('/requests', createDeliveryRequest);
router.get('/tracking/:id', trackDelivery);

// Rutas protegidas (admin/mensajero)
router.use(authenticate);

router.get('/requests', getDeliveryRequests);
router.get('/requests/:id', getDeliveryRequestById);
router.patch('/requests/:id/assign', assignMessenger);
router.patch('/requests/:id/status', updateDeliveryStatus);
router.post('/requests/:id/convert', convertToOrder);

// App móvil mensajero
router.get('/messenger/:messengerId/requests', getMessengerRequests);

export default router;
