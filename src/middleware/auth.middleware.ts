/**
 * DATABROKERS - MIDDLEWARE DE AUTENTICACIÓN
 * Sistema de autenticación JWT y autorización RBAC
 *
 * @version 1.0
 * @author Sistema Databrokers
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Extender el tipo Request para incluir el usuario autenticado
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        email: string;
        nombre: string;
        rol?: {
          codigo: string;
          nombre: string;
        };
      };
    }
  }
}

/**
 * Middleware para verificar token JWT
 */
export async function authenticateToken(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Obtener token del header Authorization
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Token no proporcionado. Acceso denegado.',
      });
      return;
    }

    // Verificar token
    const secret = process.env.JWT_SECRET || 'default_secret_key';

    try {
      const decoded = jwt.verify(token, secret) as {
        userId: number;
        email: string;
      };

      // Buscar usuario en base de datos
      const usuario = await prisma.usuarios.findUnique({
        where: { id: decoded.userId },
        include: {
          rol: true,
        },
      });

      if (!usuario) {
        res.status(404).json({
          success: false,
          message: 'Usuario no encontrado',
        });
        return;
      }

      if (!usuario.activo) {
        res.status(403).json({
          success: false,
          message: 'Usuario inactivo. Acceso denegado.',
        });
        return;
      }

      // Agregar usuario al request
      req.user = {
        id: usuario.id,
        email: usuario.email,
        nombre: usuario.nombre,
        rol: usuario.rol ? {
          codigo: usuario.rol.codigo,
          nombre: usuario.rol.nombre,
        } : undefined,
      };

      next();
    } catch (jwtError) {
      if (jwtError instanceof jwt.TokenExpiredError) {
        res.status(401).json({
          success: false,
          message: 'Token expirado',
        });
        return;
      }

      res.status(403).json({
        success: false,
        message: 'Token inválido',
      });
      return;
    }
  } catch (error) {
    console.error('Error en authenticateToken:', error);
    res.status(500).json({
      success: false,
      message: 'Error en la autenticación',
    });
  }
}

/**
 * Middleware para autorizar roles específicos
 * Uso: authorizeRoles(['ADMIN', 'GESTOR'])
 */
export function authorizeRoles(rolesPermitidos: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Usuario no autenticado',
      });
      return;
    }

    if (!req.user.rol) {
      res.status(403).json({
        success: false,
        message: 'Usuario sin rol asignado',
      });
      return;
    }

    const tienePermiso = rolesPermitidos.includes(req.user.rol.codigo);

    if (!tienePermiso) {
      res.status(403).json({
        success: false,
        message: `Acceso denegado. Se requiere uno de los siguientes roles: ${rolesPermitidos.join(', ')}`,
      });
      return;
    }

    next();
  };
}

/**
 * Middleware opcional: verificar si el usuario es propietario del recurso
 */
export function authorizeOwnership(
  getResourceOwnerId: (req: Request) => Promise<number | null>
) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Usuario no autenticado',
        });
        return;
      }

      // Admin siempre tiene acceso
      if (req.user.rol?.codigo === 'ADMIN') {
        next();
        return;
      }

      const resourceOwnerId = await getResourceOwnerId(req);

      if (resourceOwnerId === null) {
        res.status(404).json({
          success: false,
          message: 'Recurso no encontrado',
        });
        return;
      }

      if (resourceOwnerId !== req.user.id) {
        res.status(403).json({
          success: false,
          message: 'No tiene permiso para acceder a este recurso',
        });
        return;
      }

      next();
    } catch (error) {
      console.error('Error en authorizeOwnership:', error);
      res.status(500).json({
        success: false,
        message: 'Error al verificar permisos',
      });
    }
  };
}

export default {
  authenticateToken,
  authorizeRoles,
  authorizeOwnership,
};
