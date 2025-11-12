/**
 * DATABROKERS - CONTROLADOR DE PROPIEDADES
 * CRUD completo de propiedades con filtros y búsqueda
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

const createPropertySchema = z.object({
  titulo: z.string().min(1, 'Título requerido'),
  descripcion: z.string().optional(),
  tipo_propiedad_id: z.number().int().positive('Tipo de propiedad requerido'),
  direccion: z.string().min(1, 'Dirección requerida'),
  comuna_id: z.number().int().positive('Comuna requerida'),
  region_id: z.number().int().positive('Región requerida'),
  precio: z.number().positive('Precio debe ser positivo'),
  superficie_total: z.number().positive().optional(),
  superficie_util: z.number().positive().optional(),
  dormitorios: z.number().int().min(0).optional(),
  banos: z.number().int().min(0).optional(),
  estacionamientos: z.number().int().min(0).optional(),
  bodegas: z.number().int().min(0).optional(),
  estado_propiedad_id: z.number().int().positive('Estado de propiedad requerido'),
  estado_construccion_id: z.number().int().positive().optional(),
  modelo_negocio_id: z.number().int().positive('Modelo de negocio requerido'),
  gestor_id: z.number().int().positive().optional(),
  comision_porcentaje: z.number().min(0).max(100).optional(),
  comision_monto: z.number().min(0).optional(),
  caracteristicas: z.any().optional(),
  imagenes: z.any().optional(),
  fecha_publicacion: z.string().optional(),
  activo: z.boolean().optional().default(true),
});

const updatePropertySchema = createPropertySchema.partial();

// =====================================================
// CONTROLADORES
// =====================================================

/**
 * @route   GET /api/properties
 * @desc    Obtener lista de propiedades con paginación y filtros
 * @access  Private
 */
export async function getProperties(req: Request, res: Response): Promise<void> {
  try {
    const {
      page = '1',
      limit = '10',
      search = '',
      tipo_propiedad_id,
      estado_propiedad_id,
      modelo_negocio_id,
      comuna_id,
      region_id,
      gestor_id,
      precio_min,
      precio_max,
      dormitorios_min,
      activo,
      sort = 'created_at',
      order = 'desc',
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Construir filtros
    const where: any = {};

    if (search) {
      where.OR = [
        { titulo: { contains: search as string, mode: 'insensitive' } },
        { descripcion: { contains: search as string, mode: 'insensitive' } },
        { direccion: { contains: search as string, mode: 'insensitive' } },
        { codigo: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    if (tipo_propiedad_id) {
      where.tipo_propiedad_id = parseInt(tipo_propiedad_id as string);
    }

    if (estado_propiedad_id) {
      where.estado_propiedad_id = parseInt(estado_propiedad_id as string);
    }

    if (modelo_negocio_id) {
      where.modelo_negocio_id = parseInt(modelo_negocio_id as string);
    }

    if (comuna_id) {
      where.comuna_id = parseInt(comuna_id as string);
    }

    if (region_id) {
      where.region_id = parseInt(region_id as string);
    }

    if (gestor_id) {
      where.gestor_id = parseInt(gestor_id as string);
    }

    if (precio_min || precio_max) {
      where.precio = {};
      if (precio_min) where.precio.gte = parseFloat(precio_min as string);
      if (precio_max) where.precio.lte = parseFloat(precio_max as string);
    }

    if (dormitorios_min) {
      where.dormitorios = { gte: parseInt(dormitorios_min as string) };
    }

    if (activo !== undefined) {
      where.activo = activo === 'true';
    }

    // Construir ordenamiento
    const orderBy: any = {};
    orderBy[sort as string] = order;

    // Obtener total de registros
    const total = await prisma.propiedades.count({ where });

    // Obtener propiedades con paginación
    const propiedades = await prisma.propiedades.findMany({
      where,
      skip,
      take: limitNum,
      include: {
        modelo_negocio: {
          select: {
            id: true,
            codigo: true,
            nombre: true,
          },
        },
        gestor: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            email: true,
          },
        },
        propiedades_nuevas: {
          include: {
            proyecto: {
              select: {
                id: true,
                nombre: true,
              },
            },
            tipologia: {
              select: {
                id: true,
                nombre: true,
              },
            },
          },
        },
      },
      orderBy,
    });

    res.json({
      success: true,
      data: propiedades,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Error en getProperties:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener propiedades',
    });
  }
}

/**
 * @route   GET /api/properties/:id
 * @desc    Obtener una propiedad por ID
 * @access  Private
 */
export async function getPropertyById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const propiedad = await prisma.propiedades.findUnique({
      where: { id: parseInt(id) },
      include: {
        modelo_negocio: true,
        gestor: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            email: true,
            telefono: true,
          },
        },
        propiedades_nuevas: {
          include: {
            proyecto: true,
            tipologia: true,
          },
        },
        publicaciones: {
          include: {
            corredor: {
              select: {
                id: true,
                nombre: true,
                apellido: true,
                email: true,
              },
            },
          },
        },
        transacciones: {
          orderBy: {
            fecha_transaccion: 'desc',
          },
        },
        canjes_entregadas: true,
        canjes_recibidas: true,
      },
    });

    if (!propiedad) {
      res.status(404).json({
        success: false,
        message: 'Propiedad no encontrada',
      });
      return;
    }

    res.json({
      success: true,
      data: propiedad,
    });
  } catch (error) {
    console.error('Error en getPropertyById:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener la propiedad',
    });
  }
}

/**
 * @route   POST /api/properties
 * @desc    Crear una nueva propiedad
 * @access  Private
 */
export async function createProperty(req: Request, res: Response): Promise<void> {
  try {
    // Validar datos de entrada
    const validacion = createPropertySchema.safeParse(req.body);

    if (!validacion.success) {
      res.status(400).json({
        success: false,
        message: 'Datos de entrada inválidos',
        errors: validacion.error.errors,
      });
      return;
    }

    const data = validacion.data;

    // Generar código único para la propiedad
    const ultimaPropiedad = await prisma.propiedades.findFirst({
      orderBy: { id: 'desc' },
      select: { id: true },
    });

    const nuevoId = (ultimaPropiedad?.id || 0) + 1;
    const codigo = `PROP-${nuevoId.toString().padStart(6, '0')}`;

    // Crear propiedad
    const nuevaPropiedad = await prisma.propiedades.create({
      data: {
        ...data,
        codigo,
        fecha_publicacion: data.fecha_publicacion ? new Date(data.fecha_publicacion) : null,
      },
      include: {
        modelo_negocio: true,
        gestor: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            email: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: 'Propiedad creada exitosamente',
      data: nuevaPropiedad,
    });
  } catch (error) {
    console.error('Error en createProperty:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear la propiedad',
    });
  }
}

/**
 * @route   PUT /api/properties/:id
 * @desc    Actualizar una propiedad
 * @access  Private
 */
export async function updateProperty(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const propertyId = parseInt(id);

    // Verificar que la propiedad existe
    const propiedadExistente = await prisma.propiedades.findUnique({
      where: { id: propertyId },
    });

    if (!propiedadExistente) {
      res.status(404).json({
        success: false,
        message: 'Propiedad no encontrada',
      });
      return;
    }

    // Validar datos de entrada
    const validacion = updatePropertySchema.safeParse(req.body);

    if (!validacion.success) {
      res.status(400).json({
        success: false,
        message: 'Datos de entrada inválidos',
        errors: validacion.error.errors,
      });
      return;
    }

    const data = validacion.data;

    // Actualizar propiedad
    const propiedadActualizada = await prisma.propiedades.update({
      where: { id: propertyId },
      data: {
        ...data,
        fecha_publicacion: data.fecha_publicacion ? new Date(data.fecha_publicacion) : undefined,
      },
      include: {
        modelo_negocio: true,
        gestor: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            email: true,
          },
        },
      },
    });

    res.json({
      success: true,
      message: 'Propiedad actualizada exitosamente',
      data: propiedadActualizada,
    });
  } catch (error) {
    console.error('Error en updateProperty:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar la propiedad',
    });
  }
}

/**
 * @route   DELETE /api/properties/:id
 * @desc    Eliminar (desactivar) una propiedad
 * @access  Private
 */
export async function deleteProperty(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const propertyId = parseInt(id);

    // Verificar que la propiedad existe
    const propiedad = await prisma.propiedades.findUnique({
      where: { id: propertyId },
    });

    if (!propiedad) {
      res.status(404).json({
        success: false,
        message: 'Propiedad no encontrada',
      });
      return;
    }

    // Soft delete: desactivar la propiedad
    await prisma.propiedades.update({
      where: { id: propertyId },
      data: { activo: false },
    });

    res.json({
      success: true,
      message: 'Propiedad desactivada exitosamente',
    });
  } catch (error) {
    console.error('Error en deleteProperty:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar la propiedad',
    });
  }
}

/**
 * @route   GET /api/properties/:id/history
 * @desc    Obtener historial de transacciones de una propiedad
 * @access  Private
 */
export async function getPropertyHistory(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const propertyId = parseInt(id);

    // Verificar que la propiedad existe
    const propiedad = await prisma.propiedades.findUnique({
      where: { id: propertyId },
      select: { id: true, codigo: true, titulo: true },
    });

    if (!propiedad) {
      res.status(404).json({
        success: false,
        message: 'Propiedad no encontrada',
      });
      return;
    }

    // Obtener transacciones
    const transacciones = await prisma.transacciones.findMany({
      where: { propiedad_id: propertyId },
      orderBy: { fecha_transaccion: 'desc' },
    });

    // Obtener publicaciones
    const publicaciones = await prisma.publicaciones_corredores.findMany({
      where: { propiedad_id: propertyId },
      include: {
        corredor: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            email: true,
          },
        },
      },
      orderBy: { fecha_inicio: 'desc' },
    });

    // Obtener canjes (entregada o recibida)
    const canjesEntregada = await prisma.canjes.findMany({
      where: { propiedad_entregada_id: propertyId },
      orderBy: { fecha_inicio: 'desc' },
    });

    const canjesRecibida = await prisma.canjes.findMany({
      where: { propiedad_recibida_id: propertyId },
      orderBy: { fecha_inicio: 'desc' },
    });

    res.json({
      success: true,
      data: {
        propiedad,
        transacciones,
        publicaciones,
        canjes: {
          entregadas: canjesEntregada,
          recibidas: canjesRecibida,
        },
      },
    });
  } catch (error) {
    console.error('Error en getPropertyHistory:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener el historial de la propiedad',
    });
  }
}

/**
 * @route   POST /api/properties/:id/images
 * @desc    Agregar imágenes a una propiedad
 * @access  Private
 */
export async function addPropertyImages(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const propertyId = parseInt(id);
    const { imagenes } = req.body;

    if (!imagenes || !Array.isArray(imagenes)) {
      res.status(400).json({
        success: false,
        message: 'Debe proporcionar un array de imágenes',
      });
      return;
    }

    // Verificar que la propiedad existe
    const propiedad = await prisma.propiedades.findUnique({
      where: { id: propertyId },
    });

    if (!propiedad) {
      res.status(404).json({
        success: false,
        message: 'Propiedad no encontrada',
      });
      return;
    }

    // Combinar imágenes existentes con las nuevas
    const imagenesExistentes = (propiedad.imagenes as any[]) || [];
    const imagenesActualizadas = [...imagenesExistentes, ...imagenes];

    // Actualizar propiedad
    const propiedadActualizada = await prisma.propiedades.update({
      where: { id: propertyId },
      data: { imagenes: imagenesActualizadas },
    });

    res.json({
      success: true,
      message: 'Imágenes agregadas exitosamente',
      data: propiedadActualizada,
    });
  } catch (error) {
    console.error('Error en addPropertyImages:', error);
    res.status(500).json({
      success: false,
      message: 'Error al agregar imágenes',
    });
  }
}

/**
 * @route   DELETE /api/properties/:id/images/:imageId
 * @desc    Eliminar una imagen de una propiedad
 * @access  Private
 */
export async function deletePropertyImage(req: Request, res: Response): Promise<void> {
  try {
    const { id, imageId } = req.params;
    const propertyId = parseInt(id);
    const imageIndex = parseInt(imageId);

    // Verificar que la propiedad existe
    const propiedad = await prisma.propiedades.findUnique({
      where: { id: propertyId },
    });

    if (!propiedad) {
      res.status(404).json({
        success: false,
        message: 'Propiedad no encontrada',
      });
      return;
    }

    // Obtener imágenes existentes
    const imagenesExistentes = (propiedad.imagenes as any[]) || [];

    if (imageIndex < 0 || imageIndex >= imagenesExistentes.length) {
      res.status(404).json({
        success: false,
        message: 'Imagen no encontrada',
      });
      return;
    }

    // Eliminar imagen del array
    const imagenesActualizadas = imagenesExistentes.filter((_, index) => index !== imageIndex);

    // Actualizar propiedad
    await prisma.propiedades.update({
      where: { id: propertyId },
      data: { imagenes: imagenesActualizadas },
    });

    res.json({
      success: true,
      message: 'Imagen eliminada exitosamente',
    });
  } catch (error) {
    console.error('Error en deletePropertyImage:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar la imagen',
    });
  }
}

export default {
  getProperties,
  getPropertyById,
  createProperty,
  updateProperty,
  deleteProperty,
  getPropertyHistory,
  addPropertyImages,
  deletePropertyImage,
};
