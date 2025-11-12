/**
 * DATABROKERS - CONTROLADOR DE AUTENTICACIÓN
 * Manejo de login, logout, refresh token y perfil
 *
 * @version 1.0
 * @author Sistema Databrokers
 */

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

const prisma = new PrismaClient();

// =====================================================
// SCHEMAS DE VALIDACIÓN
// =====================================================

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Contraseña requerida'),
});

const forgotPasswordSchema = z.object({
  email: z.string().email('Email inválido'),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token requerido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

// =====================================================
// UTILIDADES JWT
// =====================================================

const JWT_SECRET = process.env.JWT_SECRET || 'default_secret_key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

/**
 * Generar access token
 */
function generateAccessToken(userId: number, email: string): string {
  return jwt.sign(
    { userId, email },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions
  );
}

/**
 * Generar refresh token
 */
function generateRefreshToken(userId: number, email: string): string {
  return jwt.sign(
    { userId, email, type: 'refresh' },
    JWT_SECRET,
    { expiresIn: JWT_REFRESH_EXPIRES_IN } as jwt.SignOptions
  );
}

// =====================================================
// CONTROLADORES
// =====================================================

/**
 * @route   POST /api/auth/login
 * @desc    Autenticar usuario y obtener token
 * @access  Public
 */
export async function login(req: Request, res: Response): Promise<void> {
  try {
    // Validar datos de entrada
    const validacion = loginSchema.safeParse(req.body);

    if (!validacion.success) {
      res.status(400).json({
        success: false,
        message: 'Datos de entrada inválidos',
        errors: validacion.error.errors,
      });
      return;
    }

    const { email, password } = validacion.data;

    // Buscar usuario por email
    const usuario = await prisma.usuarios.findUnique({
      where: { email },
      include: {
        rol: true,
      },
    });

    if (!usuario) {
      res.status(401).json({
        success: false,
        message: 'Credenciales inválidas',
      });
      return;
    }

    // Verificar si el usuario está activo
    if (!usuario.activo) {
      res.status(403).json({
        success: false,
        message: 'Usuario inactivo. Contacte al administrador.',
      });
      return;
    }

    // Verificar contraseña
    const passwordValido = await bcrypt.compare(password, usuario.password);

    if (!passwordValido) {
      res.status(401).json({
        success: false,
        message: 'Credenciales inválidas',
      });
      return;
    }

    // Generar tokens
    const accessToken = generateAccessToken(usuario.id, usuario.email);
    const refreshToken = generateRefreshToken(usuario.id, usuario.email);

    // Actualizar último acceso
    await prisma.usuarios.update({
      where: { id: usuario.id },
      data: { ultimo_acceso: new Date() },
    });

    // Responder con tokens y datos del usuario
    res.json({
      success: true,
      message: 'Login exitoso',
      data: {
        accessToken,
        refreshToken,
        user: {
          id: usuario.id,
          email: usuario.email,
          nombre: usuario.nombre,
          apellido: usuario.apellido,
          telefono: usuario.telefono,
          rol: usuario.rol ? {
            id: usuario.rol.id,
            codigo: usuario.rol.codigo,
            nombre: usuario.rol.nombre,
          } : null,
        },
      },
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({
      success: false,
      message: 'Error al procesar el login',
    });
  }
}

/**
 * @route   POST /api/auth/logout
 * @desc    Cerrar sesión del usuario
 * @access  Private
 */
export async function logout(_req: Request, res: Response): Promise<void> {
  try {
    // En una implementación con base de datos de tokens o blacklist,
    // aquí se invalidaría el token
    // Por ahora, simplemente confirmamos el logout (el cliente debe borrar el token)

    res.json({
      success: true,
      message: 'Logout exitoso',
    });
  } catch (error) {
    console.error('Error en logout:', error);
    res.status(500).json({
      success: false,
      message: 'Error al procesar el logout',
    });
  }
}

/**
 * @route   POST /api/auth/refresh
 * @desc    Refrescar access token usando refresh token
 * @access  Public
 */
export async function refreshToken(req: Request, res: Response): Promise<void> {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400).json({
        success: false,
        message: 'Refresh token no proporcionado',
      });
      return;
    }

    // Verificar refresh token
    try {
      const decoded = jwt.verify(refreshToken, JWT_SECRET) as {
        userId: number;
        email: string;
        type: string;
      };

      if (decoded.type !== 'refresh') {
        res.status(403).json({
          success: false,
          message: 'Token inválido',
        });
        return;
      }

      // Verificar que el usuario existe y está activo
      const usuario = await prisma.usuarios.findUnique({
        where: { id: decoded.userId },
      });

      if (!usuario || !usuario.activo) {
        res.status(403).json({
          success: false,
          message: 'Usuario no válido',
        });
        return;
      }

      // Generar nuevo access token
      const newAccessToken = generateAccessToken(decoded.userId, decoded.email);

      res.json({
        success: true,
        message: 'Token refrescado exitosamente',
        data: {
          accessToken: newAccessToken,
        },
      });
    } catch (jwtError) {
      if (jwtError instanceof jwt.TokenExpiredError) {
        res.status(401).json({
          success: false,
          message: 'Refresh token expirado. Inicie sesión nuevamente.',
        });
        return;
      }

      res.status(403).json({
        success: false,
        message: 'Refresh token inválido',
      });
    }
  } catch (error) {
    console.error('Error en refreshToken:', error);
    res.status(500).json({
      success: false,
      message: 'Error al refrescar el token',
    });
  }
}

/**
 * @route   GET /api/auth/me
 * @desc    Obtener información del usuario autenticado
 * @access  Private
 */
export async function getMe(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Usuario no autenticado',
      });
      return;
    }

    // Obtener información completa del usuario
    const usuario = await prisma.usuarios.findUnique({
      where: { id: req.user.id },
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

    res.json({
      success: true,
      data: {
        id: usuario.id,
        email: usuario.email,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        telefono: usuario.telefono,
        activo: usuario.activo,
        ultimo_acceso: usuario.ultimo_acceso,
        rol: usuario.rol ? {
          id: usuario.rol.id,
          codigo: usuario.rol.codigo,
          nombre: usuario.rol.nombre,
          descripcion: usuario.rol.descripcion,
        } : null,
      },
    });
  } catch (error) {
    console.error('Error en getMe:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener información del usuario',
    });
  }
}

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Solicitar restablecimiento de contraseña
 * @access  Public
 */
export async function forgotPassword(req: Request, res: Response): Promise<void> {
  try {
    // Validar datos de entrada
    const validacion = forgotPasswordSchema.safeParse(req.body);

    if (!validacion.success) {
      res.status(400).json({
        success: false,
        message: 'Email inválido',
        errors: validacion.error.errors,
      });
      return;
    }

    const { email } = validacion.data;

    // Buscar usuario
    const usuario = await prisma.usuarios.findUnique({
      where: { email },
    });

    // Por seguridad, siempre respondemos exitosamente (no revelamos si el email existe)
    res.json({
      success: true,
      message: 'Si el email existe, recibirá instrucciones para restablecer su contraseña',
    });

    // Si el usuario existe, aquí se enviaría el email con el token de reset
    // TODO: Implementar envío de email con token de reset
    if (usuario && usuario.activo) {
      // Generar token de reset (válido por 1 hora)
      const resetToken = jwt.sign(
        { userId: usuario.id, email: usuario.email, type: 'reset' },
        JWT_SECRET,
        { expiresIn: '1h' }
      );

      console.log(`Reset token generado para ${email}: ${resetToken}`);
      // TODO: Enviar email con el token
    }
  } catch (error) {
    console.error('Error en forgotPassword:', error);
    res.status(500).json({
      success: false,
      message: 'Error al procesar la solicitud',
    });
  }
}

/**
 * @route   POST /api/auth/reset-password
 * @desc    Restablecer contraseña con token
 * @access  Public
 */
export async function resetPassword(req: Request, res: Response): Promise<void> {
  try {
    // Validar datos de entrada
    const validacion = resetPasswordSchema.safeParse(req.body);

    if (!validacion.success) {
      res.status(400).json({
        success: false,
        message: 'Datos inválidos',
        errors: validacion.error.errors,
      });
      return;
    }

    const { token, password } = validacion.data;

    // Verificar token
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as {
        userId: number;
        email: string;
        type: string;
      };

      if (decoded.type !== 'reset') {
        res.status(403).json({
          success: false,
          message: 'Token inválido',
        });
        return;
      }

      // Verificar que el usuario existe y está activo
      const usuario = await prisma.usuarios.findUnique({
        where: { id: decoded.userId },
      });

      if (!usuario || !usuario.activo) {
        res.status(403).json({
          success: false,
          message: 'Usuario no válido',
        });
        return;
      }

      // Hashear nueva contraseña
      const hashedPassword = await bcrypt.hash(password, 10);

      // Actualizar contraseña
      await prisma.usuarios.update({
        where: { id: decoded.userId },
        data: { password: hashedPassword },
      });

      res.json({
        success: true,
        message: 'Contraseña restablecida exitosamente',
      });
    } catch (jwtError) {
      if (jwtError instanceof jwt.TokenExpiredError) {
        res.status(401).json({
          success: false,
          message: 'Token expirado. Solicite un nuevo restablecimiento.',
        });
        return;
      }

      res.status(403).json({
        success: false,
        message: 'Token inválido',
      });
    }
  } catch (error) {
    console.error('Error en resetPassword:', error);
    res.status(500).json({
      success: false,
      message: 'Error al restablecer la contraseña',
    });
  }
}

export default {
  login,
  logout,
  refreshToken,
  getMe,
  forgotPassword,
  resetPassword,
};
