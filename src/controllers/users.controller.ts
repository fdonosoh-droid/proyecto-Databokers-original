/**
 * DATABROKERS - CONTROLADOR DE USUARIOS
 * CRUD de usuarios y gestión de perfiles
 *
 * @version 1.0
 * @author Sistema Databrokers
 */

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { z } from 'zod';

const prisma = new PrismaClient();

// =====================================================
// SCHEMAS DE VALIDACIÓN
// =====================================================

const createUserSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  nombre: z.string().min(1, 'Nombre requerido'),
  apellido: z.string().optional(),
  telefono: z.string().optional(),
  rol_id: z.number().int().positive().optional(),
  activo: z.boolean().optional().default(true),
});

const updateUserSchema = z.object({
  email: z.string().email('Email inválido').optional(),
  nombre: z.string().min(1, 'Nombre requerido').optional(),
  apellido: z.string().optional().nullable(),
  telefono: z.string().optional().nullable(),
  rol_id: z.number().int().positive().optional().nullable(),
  activo: z.boolean().optional(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Contraseña actual requerida'),
  newPassword: z.string().min(6, 'La nueva contraseña debe tener al menos 6 caracteres'),
});

// =====================================================
// CONTROLADORES
// =====================================================

/**
 * @route   GET /api/users
 * @desc    Obtener lista de usuarios con paginación y filtros
 * @access  Private (ADMIN)
 */
export async function getUsers(req: Request, res: Response): Promise<void> {
  try {
    const {
      page = '1',
      limit = '10',
      search = '',
      rol_id,
      activo,
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Construir filtros
    const where: any = {};

    if (search) {
      where.OR = [
        { nombre: { contains: search as string, mode: 'insensitive' } },
        { apellido: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    if (rol_id) {
      where.rol_id = parseInt(rol_id as string);
    }

    if (activo !== undefined) {
      where.activo = activo === 'true';
    }

    // Obtener total de registros
    const total = await prisma.usuarios.count({ where });

    // Obtener usuarios con paginación
    const usuarios = await prisma.usuarios.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: {
        created_at: 'desc',
      },
      select: {
        id: true,
        email: true,
        nombre: true,
        apellido: true,
        telefono: true,
        activo: true,
        ultimo_acceso: true,
        created_at: true,
        updated_at: true,
        rol: {
          select: {
            id: true,
            codigo: true,
            nombre: true,
          },
        },
        // No incluir password
      },
    });

    res.json({
      success: true,
      data: usuarios,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Error en getUsers:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener usuarios',
    });
  }
}

/**
 * @route   GET /api/users/:id
 * @desc    Obtener un usuario por ID
 * @access  Private
 */
export async function getUserById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const usuario = await prisma.usuarios.findUnique({
      where: { id: parseInt(id) },
      select: {
        id: true,
        email: true,
        nombre: true,
        apellido: true,
        telefono: true,
        activo: true,
        ultimo_acceso: true,
        created_at: true,
        updated_at: true,
        rol: {
          select: {
            id: true,
            codigo: true,
            nombre: true,
            descripcion: true,
          },
        },
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
      data: usuario,
    });
  } catch (error) {
    console.error('Error en getUserById:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener el usuario',
    });
  }
}

/**
 * @route   POST /api/users
 * @desc    Crear un nuevo usuario
 * @access  Private (ADMIN)
 */
export async function createUser(req: Request, res: Response): Promise<void> {
  try {
    // Validar datos de entrada
    const validacion = createUserSchema.safeParse(req.body);

    if (!validacion.success) {
      res.status(400).json({
        success: false,
        message: 'Datos de entrada inválidos',
        errors: validacion.error.errors,
      });
      return;
    }

    const { email, password, nombre, apellido, telefono, rol_id, activo } = validacion.data;

    // Verificar si el email ya existe
    const usuarioExistente = await prisma.usuarios.findUnique({
      where: { email },
    });

    if (usuarioExistente) {
      res.status(409).json({
        success: false,
        message: 'El email ya está registrado',
      });
      return;
    }

    // Hashear contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear usuario
    const nuevoUsuario = await prisma.usuarios.create({
      data: {
        email,
        password: hashedPassword,
        nombre,
        apellido: apellido || null,
        telefono: telefono || null,
        rol_id: rol_id || null,
        activo,
      },
      select: {
        id: true,
        email: true,
        nombre: true,
        apellido: true,
        telefono: true,
        activo: true,
        created_at: true,
        rol: {
          select: {
            id: true,
            codigo: true,
            nombre: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: 'Usuario creado exitosamente',
      data: nuevoUsuario,
    });
  } catch (error) {
    console.error('Error en createUser:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear el usuario',
    });
  }
}

/**
 * @route   PUT /api/users/:id
 * @desc    Actualizar un usuario
 * @access  Private (ADMIN o propio usuario)
 */
export async function updateUser(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const userId = parseInt(id);

    // Verificar que el usuario existe
    const usuarioExistente = await prisma.usuarios.findUnique({
      where: { id: userId },
    });

    if (!usuarioExistente) {
      res.status(404).json({
        success: false,
        message: 'Usuario no encontrado',
      });
      return;
    }

    // Validar datos de entrada
    const validacion = updateUserSchema.safeParse(req.body);

    if (!validacion.success) {
      res.status(400).json({
        success: false,
        message: 'Datos de entrada inválidos',
        errors: validacion.error.errors,
      });
      return;
    }

    const datosActualizacion = validacion.data;

    // Si se está actualizando el email, verificar que no exista
    if (datosActualizacion.email && datosActualizacion.email !== usuarioExistente.email) {
      const emailExiste = await prisma.usuarios.findUnique({
        where: { email: datosActualizacion.email },
      });

      if (emailExiste) {
        res.status(409).json({
          success: false,
          message: 'El email ya está registrado',
        });
        return;
      }
    }

    // Actualizar usuario
    const usuarioActualizado = await prisma.usuarios.update({
      where: { id: userId },
      data: datosActualizacion,
      select: {
        id: true,
        email: true,
        nombre: true,
        apellido: true,
        telefono: true,
        activo: true,
        updated_at: true,
        rol: {
          select: {
            id: true,
            codigo: true,
            nombre: true,
          },
        },
      },
    });

    res.json({
      success: true,
      message: 'Usuario actualizado exitosamente',
      data: usuarioActualizado,
    });
  } catch (error) {
    console.error('Error en updateUser:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar el usuario',
    });
  }
}

/**
 * @route   DELETE /api/users/:id
 * @desc    Eliminar (desactivar) un usuario
 * @access  Private (ADMIN)
 */
export async function deleteUser(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const userId = parseInt(id);

    // Verificar que el usuario existe
    const usuario = await prisma.usuarios.findUnique({
      where: { id: userId },
    });

    if (!usuario) {
      res.status(404).json({
        success: false,
        message: 'Usuario no encontrado',
      });
      return;
    }

    // En lugar de eliminar, desactivamos el usuario (soft delete)
    await prisma.usuarios.update({
      where: { id: userId },
      data: { activo: false },
    });

    res.json({
      success: true,
      message: 'Usuario desactivado exitosamente',
    });
  } catch (error) {
    console.error('Error en deleteUser:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar el usuario',
    });
  }
}

/**
 * @route   PUT /api/users/:id/password
 * @desc    Cambiar contraseña de un usuario
 * @access  Private (propio usuario o ADMIN)
 */
export async function changePassword(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const userId = parseInt(id);

    // Verificar que el usuario existe
    const usuario = await prisma.usuarios.findUnique({
      where: { id: userId },
    });

    if (!usuario) {
      res.status(404).json({
        success: false,
        message: 'Usuario no encontrado',
      });
      return;
    }

    // Validar datos de entrada
    const validacion = changePasswordSchema.safeParse(req.body);

    if (!validacion.success) {
      res.status(400).json({
        success: false,
        message: 'Datos de entrada inválidos',
        errors: validacion.error.errors,
      });
      return;
    }

    const { currentPassword, newPassword } = validacion.data;

    // Verificar contraseña actual (solo si no es admin cambiando a otro usuario)
    if (req.user?.id === userId) {
      const passwordValido = await bcrypt.compare(currentPassword, usuario.password);

      if (!passwordValido) {
        res.status(401).json({
          success: false,
          message: 'Contraseña actual incorrecta',
        });
        return;
      }
    }

    // Hashear nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Actualizar contraseña
    await prisma.usuarios.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    res.json({
      success: true,
      message: 'Contraseña actualizada exitosamente',
    });
  } catch (error) {
    console.error('Error en changePassword:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cambiar la contraseña',
    });
  }
}

/**
 * @route   GET /api/users/profile
 * @desc    Obtener perfil del usuario autenticado
 * @access  Private
 */
export async function getProfile(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Usuario no autenticado',
      });
      return;
    }

    const usuario = await prisma.usuarios.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        nombre: true,
        apellido: true,
        telefono: true,
        activo: true,
        ultimo_acceso: true,
        created_at: true,
        updated_at: true,
        rol: {
          select: {
            id: true,
            codigo: true,
            nombre: true,
            descripcion: true,
            permisos: true,
          },
        },
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
      data: usuario,
    });
  } catch (error) {
    console.error('Error en getProfile:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener el perfil',
    });
  }
}

export default {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  changePassword,
  getProfile,
};
