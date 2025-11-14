/**
 * DATABROKERS - PUBLICATIONS CONTROLLER
 * Controlador para gestión de publicaciones a corredores externos
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

const createPublicationSchema = z.object({
  propiedad_id: z.number().int().positive(),
  corredor_id: z.number().int().positive(),
  tipo_exclusividad_id: z.number().int().positive(),
  fecha_inicio: z.string().optional(),
  fecha_vencimiento: z.string(),
  comision_porcentaje: z.number().min(0).max(100),
  comision_monto: z.number().positive().optional(),
  condiciones: z.string().optional(),
  metadata: z.record(z.any()).optional()
});

const updatePublicationSchema = createPublicationSchema.partial().omit({ 
  propiedad_id: true, 
  corredor_id: true 
});

const recordActivitySchema = z.object({
  tipo_actividad_id: z.number().int().positive(),
  descripcion: z.string().max(500),
  metadata: z.record(z.any()).optional()
});

const changeStateSchema = z.object({
  codigo_estado: z.enum(['ACTIVA', 'PAUSADA', 'FINALIZADA', 'CANCELADA']),
  motivo: z.string().optional()
});

// =====================================================
// FUNCIONES AUXILIARES
// =====================================================

/**
 * Generar código único para publicación
 */
async function generarCodigoPublicacion(): Promise<string> {
  const count = await prisma.publicaciones_corredores.count();
  const numero = (count + 1).toString().padStart(6, '0');
  const fecha = new Date().toISOString().slice(2, 10).replace(/-/g, '');
  return `PUB-${fecha}-${numero}`;
}

/**
 * Verificar disponibilidad de propiedad para publicación
 */
async function verificarDisponibilidadPropiedad(
  propiedadId: number,
  tipoExclusividadId: number
): Promise<{ disponible: boolean; mensaje?: string }> {
  // Obtener tipo de exclusividad
  const exclusividad = await prisma.dom_parametros.findUnique({
    where: { id: tipoExclusividadId }
  });

  if (!exclusividad) {
    return { disponible: false, mensaje: 'Tipo de exclusividad no válido' };
  }

  // Obtener estado "ACTIVA"
  const estadoActiva = await prisma.dom_parametros.findFirst({
    where: {
      categoria: { codigo: 'ESTADO_PUBLICACION' },
      codigo: 'ACTIVA'
    }
  });

  if (!estadoActiva) {
    return { disponible: true };
  }

  // Verificar publicaciones activas
  const publicacionesActivas = await prisma.publicaciones_corredores.findMany({
    where: {
      propiedad_id: propiedadId,
      estado_publicacion_id: estadoActiva.id,
      fecha_vencimiento: {
        gte: new Date()
      }
    },
    include: {
      tipo_exclusividad: true
    }
  });

  if (publicacionesActivas.length === 0) {
    return { disponible: true };
  }

  // Si hay exclusividad total, no permitir nuevas publicaciones
  const tieneExclusividadTotal = publicacionesActivas.some(
    pub => pub.tipo_exclusividad.codigo === 'EXCLUSIVA_TOTAL'
  );

  if (tieneExclusividadTotal && exclusividad.codigo !== 'EXCLUSIVA_TOTAL') {
    return {
      disponible: false,
      mensaje: 'La propiedad tiene exclusividad total con otro corredor'
    };
  }

  // Si se intenta crear exclusividad total, verificar que no haya otras publicaciones
  if (exclusividad.codigo === 'EXCLUSIVA_TOTAL' && publicacionesActivas.length > 0) {
    return {
      disponible: false,
      mensaje: 'No se puede establecer exclusividad total. Existen publicaciones activas'
    };
  }

  return { disponible: true };
}

/**
 * Calcular comisión en monto si solo se tiene porcentaje
 */
async function calcularComision(
  propiedadId: number,
  porcentaje: number,
  montoExplicito?: number
): Promise<number> {
  if (montoExplicito) {
    return montoExplicito;
  }

  const propiedad = await prisma.propiedades.findUnique({
    where: { id: propiedadId },
    select: { precio: true }
  });

  if (!propiedad) {
    return 0;
  }

  return (propiedad.precio * porcentaje) / 100;
}

/**
 * Obtener ID de estado de publicación
 */
async function getEstadoPublicacionId(codigo: string): Promise<number | null> {
  const estado = await prisma.dom_parametros.findFirst({
    where: {
      categoria: { codigo: 'ESTADO_PUBLICACION' },
      codigo
    }
  });
  return estado?.id || null;
}

// =====================================================
// CONTROLADORES PRINCIPALES
// =====================================================

/**
 * Crear nueva publicación
 * POST /api/publications
 */
export async function createPublication(req: Request, res: Response) {
  try {
    const startTime = Date.now();
    
    // Validar datos
    const validatedData = createPublicationSchema.parse(req.body);
    
    // Verificar que la propiedad existe y está disponible
    const propiedad = await prisma.propiedades.findUnique({
      where: { id: validatedData.propiedad_id },
      include: {
        estado_propiedad: true
      }
    });

    if (!propiedad) {
      return res.status(404).json({
        success: false,
        message: 'Propiedad no encontrada'
      });
    }

    // Verificar que el corredor existe
    const corredor = await prisma.usuarios.findUnique({
      where: { id: validatedData.corredor_id },
      include: {
        rol: true
      }
    });

    if (!corredor || corredor.rol.codigo !== 'CORREDOR') {
      return res.status(400).json({
        success: false,
        message: 'El usuario especificado no es un corredor'
      });
    }

    // Verificar disponibilidad según exclusividad
    const disponibilidad = await verificarDisponibilidadPropiedad(
      validatedData.propiedad_id,
      validatedData.tipo_exclusividad_id
    );

    if (!disponibilidad.disponible) {
      return res.status(400).json({
        success: false,
        message: disponibilidad.mensaje
      });
    }

    // Calcular comisión
    const comisionMonto = await calcularComision(
      validatedData.propiedad_id,
      validatedData.comision_porcentaje,
      validatedData.comision_monto
    );

    // Generar código único
    const codigo = await generarCodigoPublicacion();

    // Obtener estado inicial (ACTIVA)
    const estadoInicial = await getEstadoPublicacionId('ACTIVA');
    if (!estadoInicial) {
      return res.status(500).json({
        success: false,
        message: 'Error al obtener estado inicial'
      });
    }

    // Crear publicación
    const publicacion = await prisma.publicaciones_corredores.create({
      data: {
        codigo,
        propiedad_id: validatedData.propiedad_id,
        corredor_id: validatedData.corredor_id,
        tipo_exclusividad_id: validatedData.tipo_exclusividad_id,
        estado_publicacion_id: estadoInicial,
        fecha_inicio: validatedData.fecha_inicio 
          ? new Date(validatedData.fecha_inicio) 
          : new Date(),
        fecha_vencimiento: new Date(validatedData.fecha_vencimiento),
        comision_porcentaje: validatedData.comision_porcentaje,
        comision_monto: comisionMonto,
        condiciones: validatedData.condiciones,
        gestor_asignador_id: req.user?.id,
        metadata: validatedData.metadata
      },
      include: {
        propiedad: {
          select: {
            id: true,
            codigo: true,
            titulo: true,
            precio: true,
            direccion: true
          }
        },
        corredor: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            email: true,
            telefono: true
          }
        },
        tipo_exclusividad: true,
        estado_publicacion: true,
        gestor_asignador: {
          select: {
            nombre: true,
            apellido: true
          }
        }
      }
    });

    // Registrar auditoría
    await prisma.auditoria_log.create({
      data: {
        usuario_id: req.user?.id,
        accion_id: await getAccionId('CREAR'),
        entidad_tipo_id: await getEntidadTipoId('PUBLICACION'),
        entidad_id: publicacion.id,
        descripcion: `Publicación creada: ${codigo} para corredor ${corredor.nombre} ${corredor.apellido}`,
        valores_nuevos: publicacion,
        ip_address: req.ip,
        user_agent: req.get('user-agent')
      }
    });

    const responseTime = Date.now() - startTime;

    res.status(201).json({
      success: true,
      message: 'Publicación creada exitosamente',
      data: publicacion,
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

    console.error('Error al crear publicación:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

/**
 * Listar publicaciones con filtros y paginación
 * GET /api/publications
 */
export async function listPublications(req: Request, res: Response) {
  try {
    const startTime = Date.now();
    
    // Parámetros de consulta
    const {
      page = 1,
      limit = 20,
      estado,
      corredor_id,
      propiedad_id,
      tipo_exclusividad,
      vencimiento,
      buscar,
      sort_by = 'created_at',
      sort_order = 'desc'
    } = req.query;

    // Construir filtros
    const where: any = {};

    // Filtrar por rol - corredores solo ven sus publicaciones
    if (req.user?.rol?.codigo === 'CORREDOR') {
      where.corredor_id = req.user.id;
    }

    if (estado) {
      const estadoParam = await prisma.dom_parametros.findFirst({
        where: {
          categoria: { codigo: 'ESTADO_PUBLICACION' },
          codigo: String(estado)
        }
      });
      if (estadoParam) where.estado_publicacion_id = estadoParam.id;
    }

    if (corredor_id) {
      where.corredor_id = Number(corredor_id);
    }

    if (propiedad_id) {
      where.propiedad_id = Number(propiedad_id);
    }

    if (tipo_exclusividad) {
      const exclusividadParam = await prisma.dom_parametros.findFirst({
        where: {
          categoria: { codigo: 'TIPO_EXCLUSIVIDAD' },
          codigo: String(tipo_exclusividad)
        }
      });
      if (exclusividadParam) where.tipo_exclusividad_id = exclusividadParam.id;
    }

    // Filtro por vencimiento
    if (vencimiento === 'vencidas') {
      where.fecha_vencimiento = { lt: new Date() };
    } else if (vencimiento === 'proximas') {
      const treintaDias = new Date();
      treintaDias.setDate(treintaDias.getDate() + 30);
      where.fecha_vencimiento = {
        gte: new Date(),
        lte: treintaDias
      };
    } else if (vencimiento === 'vigentes') {
      where.fecha_vencimiento = { gte: new Date() };
    }

    if (buscar) {
      where.OR = [
        { codigo: { contains: String(buscar), mode: 'insensitive' } },
        { condiciones: { contains: String(buscar), mode: 'insensitive' } }
      ];
    }

    // Calcular paginación
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    // Obtener publicaciones
    const [publicaciones, total] = await Promise.all([
      prisma.publicaciones_corredores.findMany({
        where,
        skip,
        take,
        orderBy: {
          [String(sort_by)]: sort_order === 'asc' ? 'asc' : 'desc'
        },
        include: {
          propiedad: {
            select: {
              codigo: true,
              titulo: true,
              precio: true,
              direccion: true,
              estado_propiedad: {
                select: {
                  valor_texto: true,
                  codigo: true
                }
              }
            }
          },
          corredor: {
            select: {
              nombre: true,
              apellido: true,
              email: true,
              telefono: true
            }
          },
          tipo_exclusividad: {
            select: {
              valor_texto: true,
              codigo: true
            }
          },
          estado_publicacion: {
            select: {
              valor_texto: true,
              codigo: true
            }
          },
          gestor_asignador: {
            select: {
              nombre: true,
              apellido: true
            }
          },
          _count: {
            select: {
              actividades: true
            }
          }
        }
      }),
      prisma.publicaciones_corredores.count({ where })
    ]);

    // Agregar información de vencimiento
    const publicacionesConInfo = publicaciones.map(pub => {
      const diasParaVencer = Math.ceil(
        (pub.fecha_vencimiento.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      );
      
      return {
        ...pub,
        dias_para_vencer: diasParaVencer,
        esta_vencida: diasParaVencer < 0,
        vence_pronto: diasParaVencer > 0 && diasParaVencer <= 7
      };
    });

    const responseTime = Date.now() - startTime;

    res.json({
      success: true,
      data: publicacionesConInfo,
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
    console.error('Error al listar publicaciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
}

/**
 * Obtener publicación por ID
 * GET /api/publications/:id
 */
export async function getPublicationById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const startTime = Date.now();

    const publicacion = await prisma.publicaciones_corredores.findUnique({
      where: { id: Number(id) },
      include: {
        propiedad: {
          include: {
            tipo_propiedad: true,
            comuna: true,
            region: true,
            estado_propiedad: true,
            imagenes: true
          }
        },
        corredor: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            email: true,
            telefono: true,
            avatar_url: true
          }
        },
        tipo_exclusividad: true,
        estado_publicacion: true,
        gestor_asignador: {
          select: {
            nombre: true,
            apellido: true,
            email: true
          }
        },
        actividades: {
          include: {
            tipo_actividad: true,
            usuario: {
              select: {
                nombre: true,
                apellido: true
              }
            }
          },
          orderBy: {
            fecha_actividad: 'desc'
          }
        }
      }
    });

    if (!publicacion) {
      return res.status(404).json({
        success: false,
        message: 'Publicación no encontrada'
      });
    }

    // Verificar autorización - corredores solo ven sus publicaciones
    if (req.user?.rol?.codigo === 'CORREDOR' && publicacion.corredor_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'No tiene permiso para ver esta publicación'
      });
    }

    // Agregar métricas calculadas
    const diasParaVencer = Math.ceil(
      (publicacion.fecha_vencimiento.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );

    const diasActiva = Math.ceil(
      (new Date().getTime() - publicacion.fecha_inicio.getTime()) / (1000 * 60 * 60 * 24)
    );

    const responseTime = Date.now() - startTime;

    res.json({
      success: true,
      data: {
        ...publicacion,
        metricas: {
          dias_activa: diasActiva,
          dias_para_vencer: diasParaVencer,
          esta_vencida: diasParaVencer < 0,
          vence_pronto: diasParaVencer > 0 && diasParaVencer <= 7,
          total_actividades: publicacion.actividades.length,
          visualizaciones: publicacion.actividades.filter(
            a => a.tipo_actividad.codigo === 'VISUALIZACION'
          ).length,
          contactos: publicacion.actividades.filter(
            a => a.tipo_actividad.codigo === 'CONTACTO'
          ).length
        }
      },
      meta: {
        responseTime: `${responseTime}ms`
      }
    });

  } catch (error) {
    console.error('Error al obtener publicación:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
}

/**
 * Actualizar publicación
 * PUT /api/publications/:id
 */
export async function updatePublication(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const startTime = Date.now();

    // Validar datos
    const validatedData = updatePublicationSchema.parse(req.body);

    // Obtener publicación anterior
    const publicacionAnterior = await prisma.publicaciones_corredores.findUnique({
      where: { id: Number(id) }
    });

    if (!publicacionAnterior) {
      return res.status(404).json({
        success: false,
        message: 'Publicación no encontrada'
      });
    }

    // Verificar autorización
    if (req.user?.rol?.codigo === 'CORREDOR') {
      return res.status(403).json({
        success: false,
        message: 'Los corredores no pueden modificar publicaciones'
      });
    }

    // Recalcular comisión si cambia el porcentaje
    let comisionMonto = publicacionAnterior.comision_monto;
    if (validatedData.comision_porcentaje !== undefined) {
      comisionMonto = await calcularComision(
        publicacionAnterior.propiedad_id,
        validatedData.comision_porcentaje,
        validatedData.comision_monto
      );
    }

    // Actualizar publicación
    const publicacion = await prisma.publicaciones_corredores.update({
      where: { id: Number(id) },
      data: {
        ...validatedData,
        comision_monto,
        fecha_vencimiento: validatedData.fecha_vencimiento
          ? new Date(validatedData.fecha_vencimiento)
          : undefined
      },
      include: {
        propiedad: true,
        corredor: true,
        tipo_exclusividad: true,
        estado_publicacion: true
      }
    });

    // Registrar auditoría
    await prisma.auditoria_log.create({
      data: {
        usuario_id: req.user?.id,
        accion_id: await getAccionId('ACTUALIZAR'),
        entidad_tipo_id: await getEntidadTipoId('PUBLICACION'),
        entidad_id: publicacion.id,
        descripcion: `Publicación actualizada: ${publicacion.codigo}`,
        valores_anteriores: publicacionAnterior,
        valores_nuevos: publicacion,
        ip_address: req.ip,
        user_agent: req.get('user-agent')
      }
    });

    const responseTime = Date.now() - startTime;

    res.json({
      success: true,
      message: 'Publicación actualizada exitosamente',
      data: publicacion,
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

    console.error('Error al actualizar publicación:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
}

/**
 * Cambiar estado de publicación
 * PUT /api/publications/:id/estado
 */
export async function changePublicationState(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const validatedData = changeStateSchema.parse(req.body);

    const publicacion = await prisma.publicaciones_corredores.findUnique({
      where: { id: Number(id) },
      include: {
        estado_publicacion: true
      }
    });

    if (!publicacion) {
      return res.status(404).json({
        success: false,
        message: 'Publicación no encontrada'
      });
    }

    // Verificar autorización
    if (req.user?.rol?.codigo === 'CORREDOR' && publicacion.corredor_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'No tiene permiso para cambiar el estado de esta publicación'
      });
    }

    // Obtener nuevo estado
    const nuevoEstado = await getEstadoPublicacionId(validatedData.codigo_estado);
    if (!nuevoEstado) {
      return res.status(400).json({
        success: false,
        message: 'Estado no válido'
      });
    }

    // Si se finaliza, establecer fecha de cierre
    const dataUpdate: any = {
      estado_publicacion_id: nuevoEstado
    };

    if (validatedData.codigo_estado === 'FINALIZADA') {
      dataUpdate.fecha_cierre = new Date();
    }

    // Actualizar estado
    const publicacionActualizada = await prisma.publicaciones_corredores.update({
      where: { id: Number(id) },
      data: dataUpdate,
      include: {
        estado_publicacion: true,
        propiedad: {
          select: {
            codigo: true,
            titulo: true
          }
        },
        corredor: {
          select: {
            nombre: true,
            apellido: true
          }
        }
      }
    });

    // Registrar auditoría
    await prisma.auditoria_log.create({
      data: {
        usuario_id: req.user?.id,
        accion_id: await getAccionId('CAMBIO_ESTADO'),
        entidad_tipo_id: await getEntidadTipoId('PUBLICACION'),
        entidad_id: publicacionActualizada.id,
        descripcion: `Estado cambiado de "${publicacion.estado_publicacion.valor_texto}" a "${publicacionActualizada.estado_publicacion.valor_texto}"${validatedData.motivo ? `. Motivo: ${validatedData.motivo}` : ''}`,
        ip_address: req.ip,
        user_agent: req.get('user-agent')
      }
    });

    res.json({
      success: true,
      message: 'Estado actualizado exitosamente',
      data: publicacionActualizada
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Error de validación',
        errors: error.errors
      });
    }

    console.error('Error al cambiar estado:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
}

// =====================================================
// GESTIÓN DE ACTIVIDADES
// =====================================================

/**
 * Registrar actividad en publicación
 * POST /api/publications/:id/activities
 */
export async function recordActivity(req: Request, res: Response) {
  try {
    const { id: publicacionId } = req.params;
    const validatedData = recordActivitySchema.parse(req.body);

    // Verificar que la publicación existe
    const publicacion = await prisma.publicaciones_corredores.findUnique({
      where: { id: Number(publicacionId) }
    });

    if (!publicacion) {
      return res.status(404).json({
        success: false,
        message: 'Publicación no encontrada'
      });
    }

    // Crear actividad
    const actividad = await prisma.actividades_publicacion.create({
      data: {
        publicacion_corredor_id: Number(publicacionId),
        tipo_actividad_id: validatedData.tipo_actividad_id,
        descripcion: validatedData.descripcion,
        usuario_id: req.user?.id,
        metadata: validatedData.metadata
      },
      include: {
        tipo_actividad: true,
        usuario: {
          select: {
            nombre: true,
            apellido: true
          }
        }
      }
    });

    // Actualizar contador en publicación
    const tipoActividad = await prisma.dom_parametros.findUnique({
      where: { id: validatedData.tipo_actividad_id }
    });

    if (tipoActividad?.codigo === 'VISUALIZACION') {
      await prisma.publicaciones_corredores.update({
        where: { id: Number(publicacionId) },
        data: {
          visualizaciones: {
            increment: 1
          }
        }
      });
    } else if (tipoActividad?.codigo === 'CONTACTO') {
      await prisma.publicaciones_corredores.update({
        where: { id: Number(publicacionId) },
        data: {
          contactos: {
            increment: 1
          }
        }
      });
    }

    res.status(201).json({
      success: true,
      message: 'Actividad registrada exitosamente',
      data: actividad
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Error de validación',
        errors: error.errors
      });
    }

    console.error('Error al registrar actividad:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
}

/**
 * Listar actividades de una publicación
 * GET /api/publications/:id/activities
 */
export async function listActivities(req: Request, res: Response) {
  try {
    const { id: publicacionId } = req.params;
    const { tipo_actividad, fecha_desde, fecha_hasta } = req.query;

    const where: any = {
      publicacion_corredor_id: Number(publicacionId)
    };

    if (tipo_actividad) {
      const tipoParam = await prisma.dom_parametros.findFirst({
        where: {
          categoria: { codigo: 'TIPO_ACTIVIDAD' },
          codigo: String(tipo_actividad)
        }
      });
      if (tipoParam) where.tipo_actividad_id = tipoParam.id;
    }

    if (fecha_desde || fecha_hasta) {
      where.fecha_actividad = {};
      if (fecha_desde) where.fecha_actividad.gte = new Date(String(fecha_desde));
      if (fecha_hasta) where.fecha_actividad.lte = new Date(String(fecha_hasta));
    }

    const actividades = await prisma.actividades_publicacion.findMany({
      where,
      include: {
        tipo_actividad: true,
        usuario: {
          select: {
            nombre: true,
            apellido: true
          }
        }
      },
      orderBy: {
        fecha_actividad: 'desc'
      }
    });

    res.json({
      success: true,
      data: actividades
    });

  } catch (error) {
    console.error('Error al listar actividades:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
}

// =====================================================
// ESTADÍSTICAS
// =====================================================

/**
 * Obtener estadísticas de publicaciones
 * GET /api/publications/statistics
 */
export async function getPublicationsStatistics(req: Request, res: Response) {
  try {
    const { corredor_id, fecha_desde, fecha_hasta } = req.query;
    const startTime = Date.now();

    // Construir filtros
    const where: any = {};

    if (req.user?.rol?.codigo === 'CORREDOR') {
      where.corredor_id = req.user.id;
    } else if (corredor_id) {
      where.corredor_id = Number(corredor_id);
    }

    if (fecha_desde || fecha_hasta) {
      where.fecha_inicio = {};
      if (fecha_desde) where.fecha_inicio.gte = new Date(String(fecha_desde));
      if (fecha_hasta) where.fecha_inicio.lte = new Date(String(fecha_hasta));
    }

    // Obtener todos los estados
    const estados = await prisma.dom_parametros.findMany({
      where: {
        categoria: { codigo: 'ESTADO_PUBLICACION' }
      }
    });

    // Contar por estado
    const porEstado = await Promise.all(
      estados.map(async (estado) => ({
        estado: estado.valor_texto,
        codigo: estado.codigo,
        cantidad: await prisma.publicaciones_corredores.count({
          where: {
            ...where,
            estado_publicacion_id: estado.id
          }
        })
      }))
    );

    // Totales
    const [totalPublicaciones, activas, vencidas, finalizadas] = await Promise.all([
      prisma.publicaciones_corredores.count({ where }),
      prisma.publicaciones_corredores.count({
        where: {
          ...where,
          estado_publicacion_id: await getEstadoPublicacionId('ACTIVA'),
          fecha_vencimiento: { gte: new Date() }
        }
      }),
      prisma.publicaciones_corredores.count({
        where: {
          ...where,
          estado_publicacion_id: await getEstadoPublicacionId('ACTIVA'),
          fecha_vencimiento: { lt: new Date() }
        }
      }),
      prisma.publicaciones_corredores.count({
        where: {
          ...where,
          estado_publicacion_id: await getEstadoPublicacionId('FINALIZADA')
        }
      })
    ]);

    // Agregados
    const agregados = await prisma.publicaciones_corredores.aggregate({
      where,
      _sum: {
        comision_monto: true,
        visualizaciones: true,
        contactos: true
      },
      _avg: {
        comision_porcentaje: true,
        visualizaciones: true,
        contactos: true
      }
    });

    // Tasa de conversión (finalizadas / total)
    const tasaConversion = totalPublicaciones > 0
      ? ((finalizadas / totalPublicaciones) * 100).toFixed(2)
      : 0;

    const responseTime = Date.now() - startTime;

    res.json({
      success: true,
      data: {
        totales: {
          publicaciones: totalPublicaciones,
          activas,
          vencidas,
          finalizadas,
          tasa_conversion: Number(tasaConversion)
        },
        por_estado: porEstado,
        comisiones: {
          total: agregados._sum.comision_monto || 0,
          porcentaje_promedio: agregados._avg.comision_porcentaje || 0
        },
        metricas: {
          visualizaciones_total: agregados._sum.visualizaciones || 0,
          contactos_total: agregados._sum.contactos || 0,
          visualizaciones_promedio: agregados._avg.visualizaciones || 0,
          contactos_promedio: agregados._avg.contactos || 0
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
