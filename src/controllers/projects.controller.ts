/**
 * DATABROKERS - PROJECTS CONTROLLER
 * Controlador para gestión de proyectos inmobiliarios (propiedades nuevas)
 * Jerarquía: Proyecto → Tipología → Unidad
 * 
 * @version 1.0
 * @author Sistema Databrokers
 */

import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// =====================================================
// SCHEMAS DE VALIDACIÓN
// =====================================================

const createProjectSchema = z.object({
  nombre: z.string().min(3).max(200),
  inmobiliaria: z.string().optional(),
  direccion: z.string().min(5).max(300),
  comuna_id: z.number().int().positive(),
  region_id: z.number().int().positive(),
  estado_proyecto_id: z.number().int().positive(),
  fecha_inicio_ventas: z.string().optional(),
  fecha_entrega_estimada: z.string().optional(),
  total_unidades: z.number().int().positive().optional(),
  descripcion: z.string().optional(),
  caracteristicas: z.record(z.any()).optional(),
  latitud: z.number().optional(),
  longitud: z.number().optional(),
  modelo_negocio_id: z.number().int().positive().optional()
});

const updateProjectSchema = createProjectSchema.partial();

const createTypologySchema = z.object({
  proyecto_id: z.number().int().positive(),
  nombre: z.string().min(2).max(100),
  tipo_propiedad_id: z.number().int().positive(),
  superficie_total: z.number().positive().optional(),
  superficie_util: z.number().positive().optional(),
  superficie_terraza: z.number().positive().optional(),
  dormitorios: z.number().int().min(0).optional(),
  banos: z.number().int().min(0).optional(),
  estacionamientos: z.number().int().min(0).optional(),
  bodegas: z.number().int().min(0).optional(),
  orientacion_id: z.number().int().positive().optional(),
  piso_desde: z.number().int().optional(),
  piso_hasta: z.number().int().optional(),
  precio_desde: z.number().positive().optional(),
  precio_hasta: z.number().positive().optional(),
  caracteristicas: z.record(z.any()).optional()
});

const updateTypologySchema = createTypologySchema.partial().omit({ proyecto_id: true });

const createUnitSchema = z.object({
  proyecto_id: z.number().int().positive(),
  tipologia_id: z.number().int().positive(),
  codigo: z.string().min(3).max(50),
  numero_unidad: z.string().max(20),
  piso: z.number().int().optional(),
  precio: z.number().positive(),
  fecha_entrega_estimada: z.string().optional(),
  estado_construccion_id: z.number().int().positive().optional(),
  estado_propiedad_id: z.number().int().positive(),
  // Datos adicionales de la propiedad
  titulo: z.string().max(300).optional(),
  descripcion: z.string().optional(),
  caracteristicas: z.record(z.any()).optional()
});

// =====================================================
// FUNCIONES AUXILIARES
// =====================================================

/**
 * Actualizar contador de unidades disponibles en proyecto
 */
async function actualizarUnidadesDisponibles(proyectoId: number) {
  const unidadesDisponibles = await prisma.propiedades.count({
    where: {
      propiedades_nuevas: {
        proyecto_id: proyectoId
      },
      estado_propiedad_id: {
        in: await getEstadosDisponibles()
      }
    }
  });

  await prisma.proyectos.update({
    where: { id: proyectoId },
    data: { unidades_disponibles: unidadesDisponibles }
  });

  return unidadesDisponibles;
}

/**
 * Obtener IDs de estados "disponible" y "reservada"
 */
async function getEstadosDisponibles(): Promise<number[]> {
  const estados = await prisma.dom_parametros.findMany({
    where: {
      categoria: {
        codigo: 'ESTADO_PROPIEDAD'
      },
      codigo: {
        in: ['DISPONIBLE', 'RESERVADA']
      }
    },
    select: { id: true }
  });
  
  return estados.map(e => e.id);
}

// =====================================================
// CONTROLADORES DE PROYECTOS
// =====================================================

/**
 * Crear nuevo proyecto
 * POST /api/projects
 */
export async function createProject(req: Request, res: Response) {
  try {
    const startTime = Date.now();
    
    // Validar datos
    const validatedData = createProjectSchema.parse(req.body);
    
    // Crear proyecto
    const proyecto = await prisma.proyectos.create({
      data: {
        ...validatedData,
        fecha_inicio_ventas: validatedData.fecha_inicio_ventas 
          ? new Date(validatedData.fecha_inicio_ventas) 
          : undefined,
        fecha_entrega_estimada: validatedData.fecha_entrega_estimada
          ? new Date(validatedData.fecha_entrega_estimada)
          : undefined,
        unidades_disponibles: 0
      },
      include: {
        estado_proyecto: true,
        comuna: true,
        region: true,
        modelo_negocio: {
          select: {
            id: true,
            nombre: true
          }
        }
      }
    });

    // Registrar auditoría
    await prisma.auditoria_log.create({
      data: {
        usuario_id: req.user?.id,
        accion_id: await getAccionId('CREAR'),
        entidad_tipo_id: await getEntidadTipoId('PROYECTO'),
        entidad_id: proyecto.id,
        descripcion: `Proyecto creado: ${proyecto.nombre}`,
        valores_nuevos: proyecto,
        ip_address: req.ip,
        user_agent: req.get('user-agent')
      }
    });

    const responseTime = Date.now() - startTime;

    res.status(201).json({
      success: true,
      message: 'Proyecto creado exitosamente',
      data: proyecto,
      meta: {
        responseTime: `${responseTime}ms`
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Error de validación',
        errors: error.errors
      });
    }

    console.error('Error al crear proyecto:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

/**
 * Listar proyectos con filtros y paginación
 * GET /api/projects
 */
export async function listProjects(req: Request, res: Response) {
  try {
    const startTime = Date.now();
    
    // Parámetros de consulta
    const {
      page = 1,
      limit = 20,
      estado_proyecto,
      modelo_negocio_id,
      comuna_id,
      region_id,
      inmobiliaria,
      buscar,
      sort_by = 'created_at',
      sort_order = 'desc'
    } = req.query;

    // Construir filtros
    const where: any = {};

    if (estado_proyecto) {
      const estadoId = await prisma.dom_parametros.findFirst({
        where: {
          categoria: { codigo: 'ESTADO_PROYECTO' },
          codigo: String(estado_proyecto)
        }
      });
      if (estadoId) where.estado_proyecto_id = estadoId.id;
    }

    if (modelo_negocio_id) {
      where.modelo_negocio_id = Number(modelo_negocio_id);
    }

    if (comuna_id) {
      where.comuna_id = Number(comuna_id);
    }

    if (region_id) {
      where.region_id = Number(region_id);
    }

    if (inmobiliaria) {
      where.inmobiliaria = {
        contains: String(inmobiliaria),
        mode: 'insensitive'
      };
    }

    if (buscar) {
      where.OR = [
        { nombre: { contains: String(buscar), mode: 'insensitive' } },
        { direccion: { contains: String(buscar), mode: 'insensitive' } },
        { descripcion: { contains: String(buscar), mode: 'insensitive' } }
      ];
    }

    // Calcular paginación
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    // Obtener proyectos
    const [proyectos, total] = await Promise.all([
      prisma.proyectos.findMany({
        where,
        skip,
        take,
        orderBy: {
          [String(sort_by)]: sort_order === 'asc' ? 'asc' : 'desc'
        },
        include: {
          estado_proyecto: {
            select: {
              valor_texto: true,
              codigo: true
            }
          },
          comuna: {
            select: {
              valor_texto: true
            }
          },
          region: {
            select: {
              valor_texto: true
            }
          },
          modelo_negocio: {
            select: {
              id: true,
              nombre: true
            }
          },
          _count: {
            select: {
              tipologias: true,
              propiedades_nuevas: true
            }
          }
        }
      }),
      prisma.proyectos.count({ where })
    ]);

    const responseTime = Date.now() - startTime;

    res.json({
      success: true,
      data: proyectos,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit))
      },
      meta: {
        responseTime: `${responseTime}ms`
      }
    });

  } catch (error) {
    console.error('Error al listar proyectos:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
}

/**
 * Obtener proyecto por ID con información completa
 * GET /api/projects/:id
 */
export async function getProjectById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const startTime = Date.now();

    const proyecto = await prisma.proyectos.findUnique({
      where: { id: Number(id) },
      include: {
        estado_proyecto: true,
        comuna: true,
        region: true,
        modelo_negocio: {
          select: {
            id: true,
            nombre: true,
            gestor: {
              select: {
                id: true,
                nombre: true,
                apellido: true,
                email: true
              }
            }
          }
        },
        tipologias: {
          include: {
            tipo_propiedad: true,
            orientacion: true,
            _count: {
              select: {
                propiedades_nuevas: true
              }
            }
          }
        },
        propiedades_nuevas: {
          include: {
            propiedad: {
              select: {
                id: true,
                codigo: true,
                titulo: true,
                precio: true,
                estado_propiedad_id: true
              }
            }
          }
        }
      }
    });

    if (!proyecto) {
      return res.status(404).json({
        success: false,
        message: 'Proyecto no encontrado'
      });
    }

    const responseTime = Date.now() - startTime;

    res.json({
      success: true,
      data: proyecto,
      meta: {
        responseTime: `${responseTime}ms`
      }
    });

  } catch (error) {
    console.error('Error al obtener proyecto:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
}

/**
 * Actualizar proyecto
 * PUT /api/projects/:id
 */
export async function updateProject(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const startTime = Date.now();

    // Validar datos
    const validatedData = updateProjectSchema.parse(req.body);

    // Obtener proyecto anterior
    const proyectoAnterior = await prisma.proyectos.findUnique({
      where: { id: Number(id) }
    });

    if (!proyectoAnterior) {
      return res.status(404).json({
        success: false,
        message: 'Proyecto no encontrado'
      });
    }

    // Actualizar proyecto
    const proyecto = await prisma.proyectos.update({
      where: { id: Number(id) },
      data: {
        ...validatedData,
        fecha_inicio_ventas: validatedData.fecha_inicio_ventas
          ? new Date(validatedData.fecha_inicio_ventas)
          : undefined,
        fecha_entrega_estimada: validatedData.fecha_entrega_estimada
          ? new Date(validatedData.fecha_entrega_estimada)
          : undefined
      },
      include: {
        estado_proyecto: true,
        comuna: true,
        region: true,
        modelo_negocio: true
      }
    });

    // Registrar auditoría
    await prisma.auditoria_log.create({
      data: {
        usuario_id: req.user?.id,
        accion_id: await getAccionId('ACTUALIZAR'),
        entidad_tipo_id: await getEntidadTipoId('PROYECTO'),
        entidad_id: proyecto.id,
        descripcion: `Proyecto actualizado: ${proyecto.nombre}`,
        valores_anteriores: proyectoAnterior,
        valores_nuevos: proyecto,
        ip_address: req.ip,
        user_agent: req.get('user-agent')
      }
    });

    const responseTime = Date.now() - startTime;

    res.json({
      success: true,
      message: 'Proyecto actualizado exitosamente',
      data: proyecto,
      meta: {
        responseTime: `${responseTime}ms`
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Error de validación',
        errors: error.errors
      });
    }

    console.error('Error al actualizar proyecto:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
}

/**
 * Cambiar estado del proyecto
 * PUT /api/projects/:id/estado
 */
export async function changeProjectStatus(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { codigo_estado } = req.body;

    if (!codigo_estado) {
      return res.status(400).json({
        success: false,
        message: 'Código de estado requerido'
      });
    }

    // Obtener ID del estado
    const estadoParam = await prisma.dom_parametros.findFirst({
      where: {
        categoria: { codigo: 'ESTADO_PROYECTO' },
        codigo: codigo_estado
      }
    });

    if (!estadoParam) {
      return res.status(400).json({
        success: false,
        message: 'Estado no válido'
      });
    }

    // Actualizar estado
    const proyecto = await prisma.proyectos.update({
      where: { id: Number(id) },
      data: {
        estado_proyecto_id: estadoParam.id
      },
      include: {
        estado_proyecto: true
      }
    });

    // Registrar auditoría
    await prisma.auditoria_log.create({
      data: {
        usuario_id: req.user?.id,
        accion_id: await getAccionId('CAMBIO_ESTADO'),
        entidad_tipo_id: await getEntidadTipoId('PROYECTO'),
        entidad_id: proyecto.id,
        descripcion: `Estado cambiado a: ${estadoParam.valor_texto}`,
        ip_address: req.ip,
        user_agent: req.get('user-agent')
      }
    });

    res.json({
      success: true,
      message: 'Estado actualizado exitosamente',
      data: proyecto
    });

  } catch (error) {
    console.error('Error al cambiar estado:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
}

// =====================================================
// CONTROLADORES DE TIPOLOGÍAS
// =====================================================

/**
 * Crear tipología en un proyecto
 * POST /api/projects/:id/typologies
 */
export async function createTypology(req: Request, res: Response) {
  try {
    const { id: proyectoId } = req.params;
    const validatedData = createTypologySchema.parse({
      ...req.body,
      proyecto_id: Number(proyectoId)
    });

    // Verificar que el proyecto existe
    const proyecto = await prisma.proyectos.findUnique({
      where: { id: Number(proyectoId) }
    });

    if (!proyecto) {
      return res.status(404).json({
        success: false,
        message: 'Proyecto no encontrado'
      });
    }

    // Crear tipología
    const tipologia = await prisma.tipologias.create({
      data: validatedData,
      include: {
        tipo_propiedad: true,
        orientacion: true,
        proyecto: {
          select: {
            id: true,
            nombre: true
          }
        }
      }
    });

    // Auditoría
    await prisma.auditoria_log.create({
      data: {
        usuario_id: req.user?.id,
        accion_id: await getAccionId('CREAR'),
        entidad_tipo_id: await getEntidadTipoId('TIPOLOGIA'),
        entidad_id: tipologia.id,
        descripcion: `Tipología creada: ${tipologia.nombre}`,
        valores_nuevos: tipologia,
        ip_address: req.ip,
        user_agent: req.get('user-agent')
      }
    });

    res.status(201).json({
      success: true,
      message: 'Tipología creada exitosamente',
      data: tipologia
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Error de validación',
        errors: error.errors
      });
    }

    console.error('Error al crear tipología:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
}

/**
 * Listar tipologías de un proyecto
 * GET /api/projects/:id/typologies
 */
export async function listTypologies(req: Request, res: Response) {
  try {
    const { id: proyectoId } = req.params;

    const tipologias = await prisma.tipologias.findMany({
      where: {
        proyecto_id: Number(proyectoId)
      },
      include: {
        tipo_propiedad: true,
        orientacion: true,
        _count: {
          select: {
            propiedades_nuevas: true
          }
        }
      },
      orderBy: {
        nombre: 'asc'
      }
    });

    res.json({
      success: true,
      data: tipologias
    });

  } catch (error) {
    console.error('Error al listar tipologías:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
}

/**
 * Actualizar tipología
 * PUT /api/typologies/:id
 */
export async function updateTypology(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const validatedData = updateTypologySchema.parse(req.body);

    const tipologia = await prisma.tipologias.update({
      where: { id: Number(id) },
      data: validatedData,
      include: {
        tipo_propiedad: true,
        orientacion: true
      }
    });

    res.json({
      success: true,
      message: 'Tipología actualizada exitosamente',
      data: tipologia
    });

  } catch (error) {
    console.error('Error al actualizar tipología:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
}

/**
 * Eliminar tipología
 * DELETE /api/typologies/:id
 */
export async function deleteTypology(req: Request, res: Response) {
  try {
    const { id } = req.params;

    // Verificar si tiene unidades asociadas
    const unidadesCount = await prisma.propiedades_nuevas.count({
      where: { tipologia_id: Number(id) }
    });

    if (unidadesCount > 0) {
      return res.status(400).json({
        success: false,
        message: `No se puede eliminar. Hay ${unidadesCount} unidades asociadas a esta tipología`
      });
    }

    await prisma.tipologias.delete({
      where: { id: Number(id) }
    });

    res.json({
      success: true,
      message: 'Tipología eliminada exitosamente'
    });

  } catch (error) {
    console.error('Error al eliminar tipología:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
}

// =====================================================
// CONTROLADORES DE UNIDADES
// =====================================================

/**
 * Crear unidad en un proyecto
 * POST /api/projects/:id/units
 */
export async function createUnit(req: Request, res: Response) {
  try {
    const { id: proyectoId } = req.params;
    const validatedData = createUnitSchema.parse({
      ...req.body,
      proyecto_id: Number(proyectoId)
    });

    // Verificar que código no exista
    const existingProperty = await prisma.propiedades.findUnique({
      where: { codigo: validatedData.codigo }
    });

    if (existingProperty) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe una propiedad con ese código'
      });
    }

    // Obtener datos de la tipología
    const tipologia = await prisma.tipologias.findUnique({
      where: { id: validatedData.tipologia_id },
      include: {
        proyecto: true
      }
    });

    if (!tipologia) {
      return res.status(404).json({
        success: false,
        message: 'Tipología no encontrada'
      });
    }

    // Obtener IDs de dominios necesarios
    const [tipoOperacionId, clasificacionId] = await Promise.all([
      prisma.dom_parametros.findFirst({
        where: {
          categoria: { codigo: 'TIPO_OPERACION' },
          codigo: 'VENTA'
        }
      }),
      prisma.dom_parametros.findFirst({
        where: {
          categoria: { codigo: 'CLASIFICACION' },
          codigo: 'NUEVA'
        }
      })
    ]);

    // Crear propiedad base
    const propiedad = await prisma.propiedades.create({
      data: {
        codigo: validatedData.codigo,
        modelo_negocio_id: tipologia.proyecto.modelo_negocio_id,
        tipo_operacion_id: tipoOperacionId!.id,
        tipo_propiedad_id: tipologia.tipo_propiedad_id,
        clasificacion_id: clasificacionId!.id,
        estado_propiedad_id: validatedData.estado_propiedad_id,
        direccion: tipologia.proyecto.direccion,
        comuna_id: tipologia.proyecto.comuna_id,
        region_id: tipologia.proyecto.region_id,
        superficie_total: tipologia.superficie_total,
        superficie_util: tipologia.superficie_util,
        superficie_terraza: tipologia.superficie_terraza,
        dormitorios: tipologia.dormitorios,
        banos: tipologia.banos,
        estacionamientos: tipologia.estacionamientos,
        bodegas: tipologia.bodegas,
        orientacion_id: tipologia.orientacion_id,
        precio: validatedData.precio,
        titulo: validatedData.titulo || `${tipologia.nombre} - ${validatedData.numero_unidad}`,
        descripcion: validatedData.descripcion,
        caracteristicas: validatedData.caracteristicas,
        fecha_publicacion: new Date()
      }
    });

    // Crear especialización de propiedad nueva
    const propiedadNueva = await prisma.propiedades_nuevas.create({
      data: {
        propiedad_id: propiedad.id,
        proyecto_id: validatedData.proyecto_id,
        tipologia_id: validatedData.tipologia_id,
        numero_unidad: validatedData.numero_unidad,
        piso: validatedData.piso,
        fecha_entrega_estimada: validatedData.fecha_entrega_estimada
          ? new Date(validatedData.fecha_entrega_estimada)
          : undefined,
        estado_construccion_id: validatedData.estado_construccion_id
      },
      include: {
        propiedad: {
          include: {
            estado_propiedad: true,
            tipo_propiedad: true
          }
        },
        tipologia: {
          select: {
            nombre: true
          }
        },
        proyecto: {
          select: {
            nombre: true
          }
        }
      }
    });

    // Actualizar contador de unidades disponibles
    await actualizarUnidadesDisponibles(validatedData.proyecto_id);

    // Auditoría
    await prisma.auditoria_log.create({
      data: {
        usuario_id: req.user?.id,
        accion_id: await getAccionId('CREAR'),
        entidad_tipo_id: await getEntidadTipoId('PROPIEDAD_NUEVA'),
        entidad_id: propiedadNueva.id,
        descripcion: `Unidad creada: ${validatedData.numero_unidad}`,
        valores_nuevos: propiedadNueva,
        ip_address: req.ip,
        user_agent: req.get('user-agent')
      }
    });

    res.status(201).json({
      success: true,
      message: 'Unidad creada exitosamente',
      data: propiedadNueva
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Error de validación',
        errors: error.errors
      });
    }

    console.error('Error al crear unidad:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
}

/**
 * Listar unidades de un proyecto
 * GET /api/projects/:id/units
 */
export async function listUnits(req: Request, res: Response) {
  try {
    const { id: proyectoId } = req.params;
    const { estado, tipologia_id, piso } = req.query;

    const where: any = {
      proyecto_id: Number(proyectoId)
    };

    if (tipologia_id) {
      where.tipologia_id = Number(tipologia_id);
    }

    if (piso) {
      where.piso = Number(piso);
    }

    if (estado) {
      const estadoParam = await prisma.dom_parametros.findFirst({
        where: {
          categoria: { codigo: 'ESTADO_PROPIEDAD' },
          codigo: String(estado)
        }
      });
      if (estadoParam) {
        where.propiedad = {
          estado_propiedad_id: estadoParam.id
        };
      }
    }

    const unidades = await prisma.propiedades_nuevas.findMany({
      where,
      include: {
        propiedad: {
          include: {
            estado_propiedad: true,
            tipo_propiedad: true
          }
        },
        tipologia: {
          select: {
            nombre: true
          }
        },
        estado_construccion: true
      },
      orderBy: [
        { piso: 'asc' },
        { numero_unidad: 'asc' }
      ]
    });

    res.json({
      success: true,
      data: unidades
    });

  } catch (error) {
    console.error('Error al listar unidades:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
}

// =====================================================
// ESTADÍSTICAS Y REPORTES
// =====================================================

/**
 * Obtener estadísticas de un proyecto
 * GET /api/projects/:id/statistics
 */
export async function getProjectStatistics(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const startTime = Date.now();

    const proyecto = await prisma.proyectos.findUnique({
      where: { id: Number(id) },
      select: { id: true, nombre: true, total_unidades: true }
    });

    if (!proyecto) {
      return res.status(404).json({
        success: false,
        message: 'Proyecto no encontrado'
      });
    }

    // Obtener IDs de estados
    const [estadoDisponible, estadoReservada, estadoVendida] = await Promise.all([
      prisma.dom_parametros.findFirst({
        where: { categoria: { codigo: 'ESTADO_PROPIEDAD' }, codigo: 'DISPONIBLE' }
      }),
      prisma.dom_parametros.findFirst({
        where: { categoria: { codigo: 'ESTADO_PROPIEDAD' }, codigo: 'RESERVADA' }
      }),
      prisma.dom_parametros.findFirst({
        where: { categoria: { codigo: 'ESTADO_PROPIEDAD' }, codigo: 'VENDIDA' }
      })
    ]);

    // Contar unidades por estado
    const [totalUnidades, disponibles, reservadas, vendidas] = await Promise.all([
      prisma.propiedades_nuevas.count({
        where: { proyecto_id: Number(id) }
      }),
      prisma.propiedades_nuevas.count({
        where: {
          proyecto_id: Number(id),
          propiedad: { estado_propiedad_id: estadoDisponible?.id }
        }
      }),
      prisma.propiedades_nuevas.count({
        where: {
          proyecto_id: Number(id),
          propiedad: { estado_propiedad_id: estadoReservada?.id }
        }
      }),
      prisma.propiedades_nuevas.count({
        where: {
          proyecto_id: Number(id),
          propiedad: { estado_propiedad_id: estadoVendida?.id }
        }
      })
    ]);

    // Calcular valores
    const unidadesAggregate = await prisma.propiedades.aggregate({
      where: {
        propiedades_nuevas: {
          proyecto_id: Number(id)
        }
      },
      _sum: {
        precio: true,
        comision_monto: true
      },
      _avg: {
        precio: true
      }
    });

    // Contar tipologías
    const totalTipologias = await prisma.tipologias.count({
      where: { proyecto_id: Number(id) }
    });

    // Calcular progreso
    const porcentajeVendido = proyecto.total_unidades 
      ? ((vendidas / proyecto.total_unidades) * 100).toFixed(2)
      : 0;

    const responseTime = Date.now() - startTime;

    res.json({
      success: true,
      data: {
        proyecto: {
          id: proyecto.id,
          nombre: proyecto.nombre
        },
        unidades: {
          total: totalUnidades,
          planificadas: proyecto.total_unidades,
          disponibles,
          reservadas,
          vendidas,
          porcentaje_vendido: Number(porcentajeVendido)
        },
        tipologias: {
          total: totalTipologias
        },
        financiero: {
          valoracion_total: unidadesAggregate._sum.precio || 0,
          precio_promedio: unidadesAggregate._avg.precio || 0,
          comision_total: unidadesAggregate._sum.comision_monto || 0
        }
      },
      meta: {
        responseTime: `${responseTime}ms`
      }
    });

  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
}

// =====================================================
// FUNCIONES AUXILIARES
// =====================================================

async function getAccionId(codigo: string): Promise<number> {
  const accion = await prisma.dom_parametros.findFirst({
    where: {
      categoria: { codigo: 'ACCION_AUDITORIA' },
      codigo
    }
  });
  return accion?.id || 0;
}

async function getEntidadTipoId(codigo: string): Promise<number> {
  const entidad = await prisma.dom_parametros.findFirst({
    where: {
      categoria: { codigo: 'ENTIDAD_TIPO' },
      codigo
    }
  });
  return entidad?.id || 0;
}
