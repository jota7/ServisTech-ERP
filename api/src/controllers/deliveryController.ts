/**
 * SERVISTECH V4.0 - Delivery Controller
 * Portal Web Clientes: Solicitud de delivery con GPS, fotos y credenciales
 */

import { Request, Response } from 'express';
import { PrismaClient, DeviceType, LockType } from '@prisma/client';
import { buildWhereClause } from '../middleware/storeIsolation';

const prisma = new PrismaClient();

/**
 * Crear solicitud de delivery
 * POST /api/delivery/requests
 * Público - Accesible desde portal web de clientes
 */
export const createDeliveryRequest = async (req: Request, res: Response) => {
  try {
    const {
      // Cliente (puede ser existente o nuevo)
      customerId,
      customerName,
      customerPhone,
      customerEmail,
      customerDocument,
      
      // Ubicación
      address,
      latitude,
      longitude,
      
      // Equipo
      deviceType,
      deviceModel,
      deviceColor,
      serialNumber,
      imei,
      
      // Credenciales
      lockType,
      pattern,
      pin,
      password,
      
      // Problema
      issue,
      photos,
      
      // Sede preferida (opcional)
      preferredStoreId,
    } = req.body;

    // Validar datos mínimos
    if (!customerName || !customerPhone || !address || !deviceModel || !issue) {
      return res.status(400).json({ 
        error: 'Datos incompletos',
        required: ['customerName', 'customerPhone', 'address', 'deviceModel', 'issue'],
      });
    }

    let finalCustomerId = customerId;

    // Si no hay customerId, crear nuevo cliente
    if (!finalCustomerId) {
      const existingCustomer = await prisma.customer.findUnique({
        where: { documentId: customerDocument || `TEMP-${Date.now()}` },
      });

      if (existingCustomer) {
        finalCustomerId = existingCustomer.id;
      } else {
        const newCustomer = await prisma.customer.create({
          data: {
            name: customerName,
            phone: customerPhone,
            email: customerEmail,
            documentId: customerDocument || `TEMP-${Date.now()}`,
            address,
          },
        });
        finalCustomerId = newCustomer.id;
      }
    }

    // Crear solicitud de delivery
    const deliveryRequest = await prisma.deliveryRequest.create({
      data: {
        customerId: finalCustomerId,
        address,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        deviceType: deviceType as DeviceType || 'OTHER',
        deviceModel,
        deviceColor,
        serialNumber,
        imei,
        lockType: lockType as LockType || 'NONE',
        pattern: pattern || [],
        pin: pin || null,
        password: password || null,
        issue,
        photos: photos || [],
        status: 'pending',
      },
      include: {
        customer: {
          select: { name: true, phone: true, email: true },
        },
      },
    });

    // Notificar a la sede (aquí iría integración con WhatsApp/Socket)
    console.log(`Nueva solicitud de delivery: ${deliveryRequest.id}`);

    res.status(201).json({
      message: 'Solicitud creada exitosamente',
      requestId: deliveryRequest.id,
      data: deliveryRequest,
    });
  } catch (error) {
    console.error('Error creating delivery request:', error);
    res.status(500).json({ error: 'Error al crear solicitud' });
  }
};

/**
 * Obtener solicitudes de delivery
 * GET /api/delivery/requests
 */
export const getDeliveryRequests = async (req: Request, res: Response) => {
  try {
    const { status, messengerId, page = '1', limit = '20' } = req.query;

    const where = buildWhereClause(req, {
      ...(status && { status: status as string }),
      ...(messengerId && { messengerId: messengerId as string }),
    });

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const [requests, total] = await Promise.all([
      prisma.deliveryRequest.findMany({
        where,
        include: {
          customer: {
            select: { name: true, phone: true, address: true },
          },
        },
        orderBy: { requestedAt: 'desc' },
        skip,
        take: parseInt(limit as string),
      }),
      prisma.deliveryRequest.count({ where }),
    ]);

    res.json({
      data: requests,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string)),
      },
    });
  } catch (error) {
    console.error('Error fetching delivery requests:', error);
    res.status(500).json({ error: 'Error al obtener solicitudes' });
  }
};

/**
 * Obtener una solicitud específica
 * GET /api/delivery/requests/:id
 */
export const getDeliveryRequestById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const request = await prisma.deliveryRequest.findUnique({
      where: { id },
      include: {
        customer: true,
      },
    });

    if (!request) {
      return res.status(404).json({ error: 'Solicitud no encontrada' });
    }

    res.json(request);
  } catch (error) {
    console.error('Error fetching delivery request:', error);
    res.status(500).json({ error: 'Error al obtener solicitud' });
  }
};

/**
 * Asignar mensajero a solicitud
 * PATCH /api/delivery/requests/:id/assign
 */
export const assignMessenger = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { messengerId, scheduledDate } = req.body;

    const updated = await prisma.deliveryRequest.update({
      where: { id },
      data: {
        messengerId,
        scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
        status: 'confirmed',
      },
    });

    res.json(updated);
  } catch (error) {
    console.error('Error assigning messenger:', error);
    res.status(500).json({ error: 'Error al asignar mensajero' });
  }
};

/**
 * Actualizar estado de solicitud
 * PATCH /api/delivery/requests/:id/status
 */
export const updateDeliveryStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, photos } = req.body;

    const updateData: any = { status };
    
    if (status === 'picked_up') {
      // Agregar fotos de recolección
      if (photos && photos.length > 0) {
        updateData.photos = { push: photos };
      }
    }
    
    if (status === 'delivered') {
      updateData.completedAt = new Date();
    }

    const updated = await prisma.deliveryRequest.update({
      where: { id },
      data: updateData,
    });

    res.json(updated);
  } catch (error) {
    console.error('Error updating delivery status:', error);
    res.status(500).json({ error: 'Error al actualizar estado' });
  }
};

/**
 * Convertir solicitud de delivery en orden de servicio
 * POST /api/delivery/requests/:id/convert
 */
export const convertToOrder = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { storeId } = req.storeContext || {};

    if (!storeId) {
      return res.status(400).json({ error: 'No se pudo determinar la sede' });
    }

    const deliveryRequest = await prisma.deliveryRequest.findUnique({
      where: { id },
    });

    if (!deliveryRequest) {
      return res.status(404).json({ error: 'Solicitud no encontrada' });
    }

    // Crear o actualizar dispositivo
    const device = await prisma.device.create({
      data: {
        type: deliveryRequest.deviceType,
        brand: 'OTHER',
        model: deliveryRequest.deviceModel,
        serialNumber: deliveryRequest.serialNumber || `DEL-${Date.now()}`,
        imei: deliveryRequest.imei,
        color: deliveryRequest.deviceColor,
        customerId: deliveryRequest.customerId,
        lockType: deliveryRequest.lockType,
        pattern: deliveryRequest.pattern,
        pin: deliveryRequest.pin,
        password: deliveryRequest.password,
      },
    });

    // Generar número de orden
    const orderCount = await prisma.serviceOrder.count({ where: { storeId } });
    const orderNumber = `ST-${storeId}-${Date.now().toString(36).toUpperCase()}`;

    // Crear orden de servicio
    const order = await prisma.serviceOrder.create({
      data: {
        orderNumber,
        customerId: deliveryRequest.customerId,
        deviceId: device.id,
        storeId,
        createdById: req.user!.id,
        reportedIssue: `[DELIVERY] ${deliveryRequest.issue}`,
        status: 'TRIAJE',
        priority: 'MEDIA',
        estimatedCost: 0,
        finalCost: 0,
        paidAmount: 0,
      },
      include: {
        customer: true,
        device: true,
      },
    });

    // Actualizar solicitud de delivery
    await prisma.deliveryRequest.update({
      where: { id },
      data: { status: 'delivered' },
    });

    res.status(201).json({
      message: 'Orden creada exitosamente',
      order,
    });
  } catch (error) {
    console.error('Error converting delivery to order:', error);
    res.status(500).json({ error: 'Error al convertir a orden' });
  }
};

/**
 * Obtener solicitudes por mensajero (para app móvil)
 * GET /api/delivery/messenger/:messengerId/requests
 */
export const getMessengerRequests = async (req: Request, res: Response) => {
  try {
    const { messengerId } = req.params;
    const { status } = req.query;

    const requests = await prisma.deliveryRequest.findMany({
      where: {
        messengerId,
        ...(status && { status: status as string }),
      },
      include: {
        customer: {
          select: { 
            name: true, 
            phone: true, 
            address: true,
          },
        },
      },
      orderBy: { scheduledDate: 'asc' },
    });

    // Formatear para app móvil (offline-friendly)
    const formatted = requests.map(r => ({
      id: r.id,
      customerName: r.customer.name,
      customerPhone: r.customer.phone,
      address: r.address,
      latitude: r.latitude,
      longitude: r.longitude,
      deviceModel: r.deviceModel,
      issue: r.issue,
      status: r.status,
      scheduledDate: r.scheduledDate,
      photos: r.photos,
    }));

    res.json(formatted);
  } catch (error) {
    console.error('Error fetching messenger requests:', error);
    res.status(500).json({ error: 'Error al obtener solicitudes' });
  }
};

/**
 * Tracking público de solicitud (sin autenticación)
 * GET /api/delivery/tracking/:id
 */
export const trackDelivery = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const request = await prisma.deliveryRequest.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        scheduledDate: true,
        completedAt: true,
        deviceModel: true,
        customer: {
          select: { name: true },
        },
      },
    });

    if (!request) {
      return res.status(404).json({ error: 'Solicitud no encontrada' });
    }

    res.json({
      requestId: request.id,
      customerName: request.customer.name,
      deviceModel: request.deviceModel,
      status: request.status,
      scheduledDate: request.scheduledDate,
      completedAt: request.completedAt,
    });
  } catch (error) {
    console.error('Error tracking delivery:', error);
    res.status(500).json({ error: 'Error al consultar tracking' });
  }
};
