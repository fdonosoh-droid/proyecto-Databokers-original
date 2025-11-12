/**
 * DATABROKERS - CONTROLADOR DE DOMINIOS (Parámetros del Sistema)
 * Gestión de categorías y parámetros parametrizables
 *
 * @version 1.0
 * @author Sistema Databrokers
 */

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// =====================================================
// SCHEMAS DE VALIDACIÓN
// =====================================================

const createCategoriaSchema = z.object({
  codigo: z.string().min(1, 'Código requerido'),
  nombre: z.string().min(1, 'Nombre requerido'),
  descripcion: z.string().optional(),
  activo: z.boolean().optional().default(true),
});

const createParametroSchema = z.object({
  categoria_id: z.number().int().positive('Categoría requerida'),
  codigo: z.string().min(1, 'Código requerido'),
  nombre: z.string().min(1, 'Nombre requerido'),
  valor: z.string().optional(),
  orden: z.number().int().min(0).optional().default(0),
  activo: z.boolean().optional().default(true),
  metadata: z.any().optional(),
});

// =====================================================
// CONTROLADORES - CATEGORÍAS
// =====================================================

/**
 * @route   GET /api/domains/categorias
 * @desc    Obtener todas las categorías
 * @access  Private
 */
export async function getCategorias(req: Request, res: Response): Promise<void> {
  try {
    const { activo } = req.query;

    const where: any = {};

    if (activo !== undefined) {
      where.activo = activo === 'true';
    }

    const categorias = await prisma.dom_categorias.findMany({
      where,
      include: {
        parametros: {
          where: {
            activo: true,
          },
          orderBy: {
            orden: 'asc',
          },
        },
      },
      orderBy: {
        nombre: 'asc',
      },
    });

    res.json({
      success: true,
      data: categorias,
    });
  } catch (error) {
    console.error('Error en getCategorias:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener categorías',
    });
  }
}

/**
 * @route   GET /api/domains/categorias/:id
 * @desc    Obtener una categoría por ID
 * @access  Private
 */
export async function getCategoriaById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const categoria = await prisma.dom_categorias.findUnique({
      where: { id: parseInt(id) },
      include: {
        parametros: {
          orderBy: {
            orden: 'asc',
          },
        },
      },
    });

    if (!categoria) {
      res.status(404).json({
        success: false,
        message: 'Categoría no encontrada',
      });
      return;
    }

    res.json({
      success: true,
      data: categoria,
    });
  } catch (error) {
    console.error('Error en getCategoriaById:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener la categoría',
    });
  }
}

/**
 * @route   POST /api/domains/categorias
 * @desc    Crear una nueva categoría
 * @access  Private (ADMIN)
 */
export async function createCategoria(req: Request, res: Response): Promise<void> {
  try {
    // Validar datos de entrada
    const validacion = createCategoriaSchema.safeParse(req.body);

    if (!validacion.success) {
      res.status(400).json({
        success: false,
        message: 'Datos de entrada inválidos',
        errors: validacion.error.errors,
      });
      return;
    }

    const data = validacion.data;

    // Verificar si el código ya existe
    const categoriaExistente = await prisma.dom_categorias.findUnique({
      where: { codigo: data.codigo },
    });

    if (categoriaExistente) {
      res.status(409).json({
        success: false,
        message: 'El código ya está registrado',
      });
      return;
    }

    // Crear categoría
    const nuevaCategoria = await prisma.dom_categorias.create({
      data,
    });

    res.status(201).json({
      success: true,
      message: 'Categoría creada exitosamente',
      data: nuevaCategoria,
    });
  } catch (error) {
    console.error('Error en createCategoria:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear la categoría',
    });
  }
}

// =====================================================
// CONTROLADORES - PARÁMETROS
// =====================================================

/**
 * @route   GET /api/domains/parametros/:categoriaId
 * @desc    Obtener parámetros de una categoría
 * @access  Private
 */
export async function getParametrosByCategoria(req: Request, res: Response): Promise<void> {
  try {
    const { categoriaId } = req.params;
    const { activo } = req.query;

    const where: any = {
      categoria_id: parseInt(categoriaId),
    };

    if (activo !== undefined) {
      where.activo = activo === 'true';
    }

    const parametros = await prisma.dom_parametros.findMany({
      where,
      orderBy: {
        orden: 'asc',
      },
    });

    res.json({
      success: true,
      data: parametros,
    });
  } catch (error) {
    console.error('Error en getParametrosByCategoria:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener parámetros',
    });
  }
}

/**
 * @route   GET /api/domains/parametros/codigo/:codigo
 * @desc    Obtener parámetros por código de categoría
 * @access  Private
 */
export async function getParametrosByCategoriaCode(req: Request, res: Response): Promise<void> {
  try {
    const { codigo } = req.params;

    // Buscar categoría por código
    const categoria = await prisma.dom_categorias.findUnique({
      where: { codigo },
      include: {
        parametros: {
          where: {
            activo: true,
          },
          orderBy: {
            orden: 'asc',
          },
        },
      },
    });

    if (!categoria) {
      res.status(404).json({
        success: false,
        message: 'Categoría no encontrada',
      });
      return;
    }

    res.json({
      success: true,
      data: categoria.parametros,
    });
  } catch (error) {
    console.error('Error en getParametrosByCategoriaCode:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener parámetros',
    });
  }
}

/**
 * @route   POST /api/domains/parametros
 * @desc    Crear un nuevo parámetro
 * @access  Private (ADMIN)
 */
export async function createParametro(req: Request, res: Response): Promise<void> {
  try {
    // Validar datos de entrada
    const validacion = createParametroSchema.safeParse(req.body);

    if (!validacion.success) {
      res.status(400).json({
        success: false,
        message: 'Datos de entrada inválidos',
        errors: validacion.error.errors,
      });
      return;
    }

    const data = validacion.data;

    // Verificar que la categoría existe
    const categoria = await prisma.dom_categorias.findUnique({
      where: { id: data.categoria_id },
    });

    if (!categoria) {
      res.status(404).json({
        success: false,
        message: 'Categoría no encontrada',
      });
      return;
    }

    // Verificar si el código ya existe en esta categoría
    const parametroExistente = await prisma.dom_parametros.findFirst({
      where: {
        categoria_id: data.categoria_id,
        codigo: data.codigo,
      },
    });

    if (parametroExistente) {
      res.status(409).json({
        success: false,
        message: 'El código ya está registrado en esta categoría',
      });
      return;
    }

    // Crear parámetro
    const nuevoParametro = await prisma.dom_parametros.create({
      data,
    });

    res.status(201).json({
      success: true,
      message: 'Parámetro creado exitosamente',
      data: nuevoParametro,
    });
  } catch (error) {
    console.error('Error en createParametro:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear el parámetro',
    });
  }
}

/**
 * @route   PUT /api/domains/parametros/:id
 * @desc    Actualizar un parámetro
 * @access  Private (ADMIN)
 */
export async function updateParametro(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const parametroId = parseInt(id);

    // Verificar que el parámetro existe
    const parametroExistente = await prisma.dom_parametros.findUnique({
      where: { id: parametroId },
    });

    if (!parametroExistente) {
      res.status(404).json({
        success: false,
        message: 'Parámetro no encontrado',
      });
      return;
    }

    const { codigo, nombre, valor, orden, activo, metadata } = req.body;

    // Actualizar parámetro
    const parametroActualizado = await prisma.dom_parametros.update({
      where: { id: parametroId },
      data: {
        codigo,
        nombre,
        valor,
        orden,
        activo,
        metadata,
      },
    });

    res.json({
      success: true,
      message: 'Parámetro actualizado exitosamente',
      data: parametroActualizado,
    });
  } catch (error) {
    console.error('Error en updateParametro:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar el parámetro',
    });
  }
}

/**
 * @route   DELETE /api/domains/parametros/:id
 * @desc    Eliminar (desactivar) un parámetro
 * @access  Private (ADMIN)
 */
export async function deleteParametro(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const parametroId = parseInt(id);

    // Verificar que el parámetro existe
    const parametro = await prisma.dom_parametros.findUnique({
      where: { id: parametroId },
    });

    if (!parametro) {
      res.status(404).json({
        success: false,
        message: 'Parámetro no encontrado',
      });
      return;
    }

    // Soft delete: desactivar el parámetro
    await prisma.dom_parametros.update({
      where: { id: parametroId },
      data: { activo: false },
    });

    res.json({
      success: true,
      message: 'Parámetro desactivado exitosamente',
    });
  } catch (error) {
    console.error('Error en deleteParametro:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar el parámetro',
    });
  }
}

export default {
  getCategorias,
  getCategoriaById,
  createCategoria,
  getParametrosByCategoria,
  getParametrosByCategoriaCode,
  createParametro,
  updateParametro,
  deleteParametro,
};
