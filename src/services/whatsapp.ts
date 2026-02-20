import { logger } from '../utils/logger';

export const whatsappService = {
  /**
   * Función base para enviar mensajes
   */
  sendMessage: async (phone: string, message: string): Promise<boolean> => {
    try {
      // TODO: Aquí integraremos la API real (Meta Cloud API, Twilio, o Baileys)
      logger.info(`[WhatsApp SIMULADO] Mensaje enviado a ${phone}`, { message });
      return true;
    } catch (error) {
      logger.error(`Error enviando WhatsApp a ${phone}:`, error);
      return false;
    }
  },

  /**
   * Notificación: Equipo Reparado y Listo
   */
  sendOrderReadyNotification: async (phone: string, customerName: string, orderNumber: string) => {
    const message = `¡Hola ${customerName}! Te escribimos de ServisTech. Tu equipo (Orden ${orderNumber}) ya está reparado tras pasar por nuestra estación de microelectrónica y está listo para retirar. ¡Te esperamos!`;
    return await whatsappService.sendMessage(phone, message);
  },

  /**
   * Notificación: Bienvenida a Nuevo Cliente
   */
  sendWelcomeMessage: async (phone: string, customerName: string) => {
    const message = `¡Hola ${customerName}! Bienvenido a ServisTech. Hemos registrado tu perfil en nuestro sistema. Estaremos cuidando de tu equipo.`;
    return await whatsappService.sendMessage(phone, message);
  }
};