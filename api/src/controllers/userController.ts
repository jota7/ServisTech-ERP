import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'servistech_secret_key';

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
      // USAMOS SELECT UNIFICADO (SIN INCLUDE)
      select: {
        id: true,
        name: true,
        email: true,
        password: true,
        role: true,
        isActive: true,
        avatar: true,
        storeId: true,
        store: {
          select: {
            id: true,
            name: true,
            code: true
          }
        }
      }
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Credenciales inválidas o usuario inactivo' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role, storeId: user.storeId },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // No enviamos el password al frontend
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      token,
      user: userWithoutPassword
    });
  } catch (error) {
    res.status(500).json({ message: 'Error en el login', error });
  }
};

export const getMe = async (req: any, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        avatar: true,
        storeId: true,
        createdAt: true,
        lastLogin: true,
        store: {
          select: {
            id: true,
            name: true,
            code: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener perfil', error });
  }
};