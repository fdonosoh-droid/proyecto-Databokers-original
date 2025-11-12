/**
 * DATABROKERS - CONTROLADOR DE MODELOS DE NEGOCIO
 * CRUD de modelos de negocio
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

const createBusinessModelSchema = z.object({
  codigo: z.string().min(1, 'Código requerido'),
  nombre: z.string().min(1, 'Nombre requerido'),
  descripcion: z.string().optional(),
  comision_porcentaje: z.number().min(0).max(100).optional(),
  activo: z.boolean().optional().default(true),
  configuracion: z.any().optional(),
});

const updateBusinessModelSchema = createBusinessModelSchema.partial();

// =====================================================
// CONTROLADORES
// =====================================================

/**
 * @route   GET /api/business-models
 * @desc    Obtener lista de modelos de negocio
 * @access  Private
 */
export async function getBusinessModels(req: Request, res: Response): Promise<void> {
  try {
    const { activo } = req.query;

    const where: any = {};

    if (activo !== undefined) {
      where.activo = activo === 'true';
    }

    const modelosNegocio = await prisma.modelos_negocio.findMany({
      where,
      orderBy: {
        nombre: 'asc',
      },
    });

    res.json({
      success: true,
      data: modelosNegocio,
    });
  } catch (error) {
    console.error('Error en getBusinessModels:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener modelos de negocio',
    });
  }
}

/**
 * @route   GET /api/business-models/:id
 * @desc    Obtener un modelo de negocio por ID
 * @access  Private
 */
export async function getBusinessModelById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const modeloNegocio = await prisma.modelos_negocio.findUnique({
      where: { id: parseInt(id) },
    });

    if (!modeloNegocio) {
      res.status(404).json({
        success: false,
        message: 'Modelo de negocio no encontrado',
      });
      return;
    }

    res.json({
      success: true,
      data: modeloNegocio,
    });
  } catch (error) {
    console.error('Error en getBusinessModelById:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener el modelo de negocio',
    });
  }
}

/**
 * @route   POST /api/business-models
 * @desc    Crear un nuevo modelo de negocio
 * @access  Private (ADMIN)
 */
export async function createBusinessModel(req: Request, res: Response): Promise<void> {
  try {
    // Validar datos de entrada
    const validacion = createBusinessModelSchema.safeParse(req.body);

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
    const modeloExistente = await prisma.modelos_negocio.findUnique({
      where: { codigo: data.codigo },
    });

    if (modeloExistente) {
      res.status(409).json({
        success: false,
        message: 'El código ya está registrado',
      });
      return;
    }

    // Crear modelo de negocio
    const nuevoModelo = await prisma.modelos_negocio.create({
      data,
    });

    res.status(201).json({
      success: true,
      message: 'Modelo de negocio creado exitosamente',
      data: nuevoModelo,
    });
  } catch (error) {
    console.error('Error en createBusinessModel:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear el modelo de negocio',
    });
  }
}

/**
 * @route   PUT /api/business-models/:id
 * @desc    Actualizar un modelo de negocio
 * @access  Private (ADMIN)
 */
export async function updateBusinessModel(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const modeloId = parseInt(id);

    // Verificar que el modelo existe
    const modeloExistente = await prisma.modelos_negocio.findUnique({
      where: { id: modeloId },
    });

    if (!modeloExistente) {
      res.status(404).json({
        success: false,
        message: 'Modelo de negocio no encontrado',
      });
      return;
    }

    // Validar datos de entrada
    const validacion = updateBusinessModelSchema.safeParse(req.body);

    if (!validacion.success) {
      res.status(400).json({
        success: false,
        message: 'Datos de entrada inválidos',
        errors: validacion.error.errors,
      });
      return;
    }

    const data = validacion.data;

    // Si se está actualizando el código, verificar que no exista
    if (data.codigo && data.codigo !== modeloExistente.codigo) {
      const codigoExiste = await prisma.modelos_negocio.findUnique({
        where: { codigo: data.codigo },
      });

      if (codigoExiste) {
        res.status(409).json({
          success: false,
          message: 'El código ya está registrado',
        });
        return;
      }
    }

    // Actualizar modelo de negocio
    const modeloActualizado = await prisma.modelos_negocio.update({
      where: { id: modeloId },
      data,
    });

    res.json({
      success: true,
      message: 'Modelo de negocio actualizado exitosamente',
      data: modeloActualizado,
    });
  } catch (error) {
    console.error('Error en updateBusinessModel:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar el modelo de negocio',
    });
  }
}

/**
 * @route   DELETE /api/business-models/:id
 * @desc    Eliminar (desactivar) un modelo de negocio
 * @access  Private (ADMIN)
 */
export async function deleteBusinessModel(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const modeloId = parseInt(id);

    // Verificar que el modelo existe
    const modelo = await prisma.modelos_negocio.findUnique({
      where: { id: modeloId },
    });

    if (!modelo) {
      res.status(404).json({
        success: false,
        message: 'Modelo de negocio no encontrado',
      });
      return;
    }

    // Soft delete: desactivar el modelo
    await prisma.modelos_negocio.update({
      where: { id: modeloId },
      data: { activo: false },
    });

    res.json({
      success: true,
      message: 'Modelo de negocio desactivado exitosamente',
    });
  } catch (error) {
    console.error('Error en deleteBusinessModel:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar el modelo de negocio',
    });
  }
}

export default {
  getBusinessModels,
  getBusinessModelById,
  createBusinessModel,
  updateBusinessModel,
  deleteBusinessModel,
};
