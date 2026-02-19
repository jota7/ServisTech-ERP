import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '@/config/database';
import { errorResponse } from '@/utils/response';

interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
        storeId?: string;
      };
    }
  }
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader?.startsWith('Bearer ')) {
      errorResponse(res, 'Authentication required', 401);
      return;
    }
    
    const token = authHeader.substring(7);
    
    if (!token) {
      errorResponse(res, 'Token not provided', 401);
      return;
    }
    
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET not configured');
    }
    
    const decoded = jwt.verify(token, jwtSecret) as JwtPayload;
    
    // Verify user exists and is active
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId, isActive: true },
      select: {
        id: true,
        email: true,
        role: true,
        storeId: true,
      },
    });
    
    if (!user) {
      errorResponse(res, 'User not found or inactive', 401);
      return;
    }
    
    req.user = user;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      errorResponse(res, 'Invalid token', 401);
      return;
    }
    if (error instanceof jwt.TokenExpiredError) {
      errorResponse(res, 'Token expired', 401);
      return;
    }
    errorResponse(res, 'Authentication failed', 500);
  }
};

// Role-based access control
export const authorize = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      errorResponse(res, 'Authentication required', 401);
      return;
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      errorResponse(res, 'Insufficient permissions', 403);
      return;
    }
    
    next();
  };
};

// Store access control (users can only access their store data)
export const restrictToStore = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    errorResponse(res, 'Authentication required', 401);
    return;
  }
  
  // Super admin can access all stores
  if (req.user.role === 'SUPER_ADMIN') {
    next();
    return;
  }
  
  // Check if user has a store assigned
  if (!req.user.storeId) {
    errorResponse(res, 'No store assigned to user', 403);
    return;
  }
  
  // Add store filter to query
  req.query.storeId = req.user.storeId;
  next();
};
