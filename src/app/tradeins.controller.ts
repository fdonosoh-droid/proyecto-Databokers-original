/**
 * DATABROKERS - TRADE-INS CONTROLLER
 * Controlador para gestión de canjes (intercambios de propiedades)
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

const createTradeInSchema = z.object({
  modelo_negocio_id: z.number().int().positive().optional(),
  propiedad_entregada_id: z.number().int().positive(),
  valor_tasacion_entregada: z.number().positive(),
  propiedad_recibida_id: z.number().int().positive(),
  valor_tasacion_recibida: z.number().positive(),
  forma_pago_diferencia_id: z.number().int().positive().optional(),
  fecha_inicio: z.string().optional(),
  observaciones: z.string().optional(),
  metadata: z.record(z.any()).optional()
});

const updateTradeInSchema = createTradeInSchema.partial();

const changeStateSchema = z.object({
  codigo_estado: z.enum(['INICIADO', 'EN_EVALUACION', 'APROBADO', 'RECHAZADO', 'FINALIZADO']),
  observaciones: z.string().optional()
});

// =====================================================
// FUNCIONES AUXILIARES
// =====================================================

/**
 * Generar código único para canje
 */
async function generarCodigoCanje(): Promise<string> {
  const count = await prisma.canjes.count();
  const numero = (count + 1).toString().padStart(6, '0');
  return `CANJE-${numero}`;
}

/**
 * Calcular diferencia de valor entre propiedades
 */
function calcularDiferencia(valorEntregada: number, valorRecibida: number): number {
  return valorRecibida - valorEntregada;
}

/**
 * Obtener ID de estado de canje
 */
async function getEstadoCanjeId(codigo: string): Promise<number | null> {
  const estado = await prisma.dom_parametros.findFirst({
    where: {
      categoria: { codigo: 'ESTADO_CANJE' },
      codigo
    }
  });
  return estado?.id || null;
}

// =====================================================
// CONTROLADORES PRINCIPALES
// =====================================================

/**
 * Crear nuevo canje
 * POST /api/trade-ins
 */
export async function createTradeIn(req: Request, res: Response) {
  try {
    const startTime = Date.now();
    
    // Validar datos
    const validatedData = createTradeInSchema.parse(req.body);
    
    // Verificar que las propiedades existan
    const [propiedadEntregada, propiedadRecibida] = await Promise.all([
      prisma.propiedades.findUnique({
        where: { id: validatedData.propiedad_entregada_id }
      }),
      prisma.propiedades.findUnique({
        where: { id: validatedData.propiedad_recibida_id }
      })
    ]);

    if (!propiedadEntregada || !propiedadRecibida) {
      return res.status(404).json({
        success: false,
        message: 'Una o ambas propiedades no existen'
      });
    }

    // Verificar que no sean la misma propiedad
    if (validatedData.propiedad_entregada_id === validatedData.propiedad_recibida_id) {
      return res.status(400).json({
        success: false,
        message: 'No se puede hacer canje de la misma propiedad'
      });
    }

    // Generar código único
    const codigo = await generarCodigoCanje();

    // Calcular diferencia
    const diferencia = calcularDiferencia(
      validatedData.valor_tasacion_entregada,
      validatedData.valor_tasacion_recibida
    );

    // Obtener estado inicial (INICIADO)
    const estadoInicial = await getEstadoCanjeId('INICIADO');
    if (!estadoInicial) {
      return res.status(500).json({
        success: false,
        message: 'Error al obtener estado inicial'
      });
    }

    // Crear canje
    const canje = await prisma.canjes.create({
      data: {
        codigo,
        modelo_negocio_id: validatedData.modelo_negocio_id || propiedadRecibida.modelo_negocio_id,
        propiedad_entregada_id: validatedData.propiedad_entregada_id,
        valor_tasacion_entregada: validatedData.valor_tasacion_entregada,
        propiedad_recibida_id: validatedData.propiedad_recibida_id,
        valor_tasacion_recibida: validatedData.valor_tasacion_recibida,
        diferencia_valor: diferencia,
        forma_pago_diferencia_id: validatedData.forma_pago_diferencia_id,
        estado_canje_id: estadoInicial,
        fecha_inicio: validatedData.fecha_inicio ? new Date(validatedData.fecha_inicio) : new Date(),
        gestor_id: req.user?.id,
        observaciones: validatedData.observaciones,
        metadata: validatedData.metadata
      },
      include: {
        propiedad_entregada: {
          select: {
            id: true,
            codigo: true,
            titulo: true,
            precio: true,
            direccion: true
          }
        },
        propiedad_recibida: {
          select: {
            id: true,
            codigo: true,
            titulo: true,
            precio: true,
            direccion: true
          }
        },
        estado_canje: true,
        forma_pago_diferencia: true,
        gestor: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            email: true
          }
        },
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
        entidad_tipo_id: await getEntidadTipoId('CANJE'),
        entidad_id: canje.id,
        descripcion: `Canje creado: ${codigo}`,
        valores_nuevos: canje,
        ip_address: req.ip,
        user_agent: req.get('user-agent')
      }
    });

    const responseTime = Date.now() - startTime;

    res.status(201).json({
      success: true,
      message: 'Canje creado exitosamente',
      data: canje,
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

    console.error('Error al crear canje:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

/**
 * Listar canjes con filtros y paginación
 * GET /api/trade-ins
 */
export async function listTradeIns(req: Request, res: Response) {
  try {
    const startTime = Date.now();
    
    // Parámetros de consulta
    const {
      page = 1,
      limit = 20,
      estado,
      modelo_negocio_id,
      gestor_id,
      fecha_inicio_desde,
      fecha_inicio_hasta,
      buscar,
      sort_by = 'fecha_creacion',
      sort_order = 'desc'
    } = req.query;

    // Construir filtros
    const where: any = {};

    // Filtrar por rol
    if (req.user?.rol?.codigo === 'GESTOR') {
      where.gestor_id = req.user.id;
    }

    if (estado) {
      const estadoParam = await prisma.dom_parametros.findFirst({
        where: {
          categoria: { codigo: 'ESTADO_CANJE' },
          codigo: String(estado)
        }
      });
      if (estadoParam) where.estado_canje_id = estadoParam.id;
    }

    if (modelo_negocio_id) {
      where.modelo_negocio_id = Number(modelo_negocio_id);
    }

    if (gestor_id) {
      where.gestor_id = Number(gestor_id);
    }

    if (fecha_inicio_desde || fecha_inicio_hasta) {
      where.fecha_inicio = {};
      if (fecha_inicio_desde) {
        where.fecha_inicio.gte = new Date(String(fecha_inicio_desde));
      }
      if (fecha_inicio_hasta) {
        where.fecha_inicio.lte = new Date(String(fecha_inicio_hasta));
      }
    }

    if (buscar) {
      where.OR = [
        { codigo: { contains: String(buscar), mode: 'insensitive' } },
        { observaciones: { contains: String(buscar), mode: 'insensitive' } }
      ];
    }

    // Calcular paginación
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    // Obtener canjes
    const [canjes, total] = await Promise.all([
      prisma.canjes.findMany({
        where,
        skip,
        take,
        orderBy: {
          [String(sort_by)]: sort_order === 'asc' ? 'asc' : 'desc'
        },
        include: {
          propiedad_entregada: {
            select: {
              codigo: true,
              titulo: true,
              direccion: true
            }
          },
          propiedad_recibida: {
            select: {
              codigo: true,
              titulo: true,
              direccion: true
            }
          },
          estado_canje: {
            select: {
              valor_texto: true,
              codigo: true
            }
          },
          forma_pago_diferencia: {
            select: {
              valor_texto: true
            }
          },
          gestor: {
            select: {
              nombre: true,
              apellido: true
            }
          },
          modelo_negocio: {
            select: {
              nombre: true
            }
          }
        }
      }),
      prisma.canjes.count({ where })
    ]);

    const responseTime = Date.now() - startTime;

    res.json({
      success: true,
      data: canjes,
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
    console.error('Error al listar canjes:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
}

/**
 * Obtener canje por ID
 * GET /api/trade-ins/:id
 */
export async function getTradeInById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const startTime = Date.now();

    const canje = await prisma.canjes.findUnique({
      where: { id: Number(id) },
      include: {
        propiedad_entregada: {
          include: {
            tipo_propiedad: true,
            comuna: true,
            estado_propiedad: true
          }
        },
        propiedad_recibida: {
          include: {
            tipo_propiedad: true,
            comuna: true,
            estado_propiedad: true
          }
        },
        estado_canje: true,
        forma_pago_diferencia: true,
        gestor: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            email: true,
            telefono: true
          }
        },
        modelo_negocio: {
          select: {
            id: true,
            nombre: true,
            descripcion: true
          }
        },
        documentos: {
          include: {
            tipo_documento: true,
            usuario_carga: {
              select: {
                nombre: true,
                apellido: true
              }
            }
          }
        }
      }
    });

    if (!canje) {
      return res.status(404).json({
        success: false,
        message: 'Canje no encontrado'
      });
    }

    // Verificar autorización (gestores solo ven sus canjes)
    if (req.user?.rol?.codigo === 'GESTOR' && canje.gestor_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'No tiene permiso para ver este canje'
      });
    }

    const responseTime = Date.now() - startTime;

    res.json({
      success: true,
      data: canje,
      meta: {
        responseTime: `${responseTime}ms`
      }
    });

  } catch (error) {
    console.error('Error al obtener canje:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
}

/**
 * Actualizar canje
 * PUT /api/trade-ins/:id
 */
export async function updateTradeIn(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const startTime = Date.now();

    // Validar datos
    const validatedData = updateTradeInSchema.parse(req.body);

    // Obtener canje anterior
    const canjeAnterior = await prisma.canjes.findUnique({
      where: { id: Number(id) }
    });

    if (!canjeAnterior) {
      return res.status(404).json({
        success: false,
        message: 'Canje no encontrado'
      });
    }

    // Verificar autorización
    if (req.user?.rol?.codigo === 'GESTOR' && canjeAnterior.gestor_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'No tiene permiso para modificar este canje'
      });
    }

    // Recalcular diferencia si cambian los valores de tasación
    let diferencia = canjeAnterior.diferencia_valor;
    if (validatedData.valor_tasacion_entregada || validatedData.valor_tasacion_recibida) {
      const valorEntregada = validatedData.valor_tasacion_entregada || canjeAnterior.valor_tasacion_entregada;
      const valorRecibida = validatedData.valor_tasacion_recibida || canjeAnterior.valor_tasacion_recibida;
      diferencia = calcularDiferencia(valorEntregada, valorRecibida);
    }

    // Actualizar canje
    const canje = await prisma.canjes.update({
      where: { id: Number(id) },
      data: {
        ...validatedData,
        diferencia_valor: diferencia,
        fecha_inicio: validatedData.fecha_inicio
          ? new Date(validatedData.fecha_inicio)
          : undefined
      },
      include: {
        propiedad_entregada: true,
        propiedad_recibida: true,
        estado_canje: true,
        gestor: {
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
        accion_id: await getAccionId('ACTUALIZAR'),
        entidad_tipo_id: await getEntidadTipoId('CANJE'),
        entidad_id: canje.id,
        descripcion: `Canje actualizado: ${canje.codigo}`,
        valores_anteriores: canjeAnterior,
        valores_nuevos: canje,
        ip_address: req.ip,
        user_agent: req.get('user-agent')
      }
    });

    const responseTime = Date.now() - startTime;

    res.json({
      success: true,
      message: 'Canje actualizado exitosamente',
      data: canje,
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

    console.error('Error al actualizar canje:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
}

/**
 * Cambiar estado del canje
 * PUT /api/trade-ins/:id/estado
 */
export async function changeTradeInState(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const validatedData = changeStateSchema.parse(req.body);

    // Obtener canje
    const canje = await prisma.canjes.findUnique({
      where: { id: Number(id) },
      include: {
        estado_canje: true
      }
    });

    if (!canje) {
      return res.status(404).json({
        success: false,
        message: 'Canje no encontrado'
      });
    }

    // Verificar autorización
    if (req.user?.rol?.codigo === 'GESTOR' && canje.gestor_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'No tiene permiso para cambiar el estado de este canje'
      });
    }

    // Obtener nuevo estado
    const nuevoEstado = await getEstadoCanjeId(validatedData.codigo_estado);
    if (!nuevoEstado) {
      return res.status(400).json({
        success: false,
        message: 'Estado no válido'
      });
    }

    // Si se finaliza, establecer fecha de cierre
    const dataUpdate: any = {
      estado_canje_id: nuevoEstado
    };

    if (validatedData.observaciones) {
      dataUpdate.observaciones = validatedData.observaciones;
    }

    if (validatedData.codigo_estado === 'FINALIZADO') {
      dataUpdate.fecha_cierre = new Date();
    }

    // Actualizar estado
    const canjeActualizado = await prisma.canjes.update({
      where: { id: Number(id) },
      data: dataUpdate,
      include: {
        estado_canje: true,
        propiedad_entregada: {
          select: {
            codigo: true,
            titulo: true
          }
        },
        propiedad_recibida: {
          select: {
            codigo: true,
            titulo: true
          }
        }
      }
    });

    // Registrar auditoría
    await prisma.auditoria_log.create({
      data: {
        usuario_id: req.user?.id,
        accion_id: await getAccionId('CAMBIO_ESTADO'),
        entidad_tipo_id: await getEntidadTipoId('CANJE'),
        entidad_id: canjeActualizado.id,
        descripcion: `Estado cambiado de "${canje.estado_canje.valor_texto}" a "${canjeActualizado.estado_canje.valor_texto}"`,
        ip_address: req.ip,
        user_agent: req.get('user-agent')
      }
    });

    res.json({
      success: true,
      message: 'Estado actualizado exitosamente',
      data: canjeActualizado
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

/**
 * Eliminar canje (soft delete)
 * DELETE /api/trade-ins/:id
 */
export async function deleteTradeIn(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const canje = await prisma.canjes.findUnique({
      where: { id: Number(id) }
    });

    if (!canje) {
      return res.status(404).json({
        success: false,
        message: 'Canje no encontrado'
      });
    }

    // Solo admin puede eliminar
    if (req.user?.rol?.codigo !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Solo administradores pueden eliminar canjes'
      });
    }

    // Soft delete: cambiar a estado CANCELADO
    const estadoCancelado = await getEstadoCanjeId('CANCELADO');
    if (estadoCancelado) {
      await prisma.canjes.update({
        where: { id: Number(id) },
        data: {
          estado_canje_id: estadoCancelado
        }
      });
    } else {
      // Si no existe estado CANCELADO, eliminar permanentemente
      await prisma.canjes.delete({
        where: { id: Number(id) }
      });
    }

    // Auditoría
    await prisma.auditoria_log.create({
      data: {
        usuario_id: req.user?.id,
        accion_id: await getAccionId('ELIMINAR'),
        entidad_tipo_id: await getEntidadTipoId('CANJE'),
        entidad_id: Number(id),
        descripcion: `Canje eliminado: ${canje.codigo}`,
        valores_anteriores: canje,
        ip_address: req.ip,
        user_agent: req.get('user-agent')
      }
    });

    res.json({
      success: true,
      message: 'Canje eliminado exitosamente'
    });

  } catch (error) {
    console.error('Error al eliminar canje:', error);
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
 * Obtener estadísticas de canjes
 * GET /api/trade-ins/statistics
 */
export async function getTradeInsStatistics(req: Request, res: Response) {
  try {
    const { modelo_negocio_id, fecha_desde, fecha_hasta } = req.query;
    const startTime = Date.now();

    // Construir filtros
    const where: any = {};

    if (req.user?.rol?.codigo === 'GESTOR') {
      where.gestor_id = req.user.id;
    }

    if (modelo_negocio_id) {
      where.modelo_negocio_id = Number(modelo_negocio_id);
    }

    if (fecha_desde || fecha_hasta) {
      where.fecha_inicio = {};
      if (fecha_desde) where.fecha_inicio.gte = new Date(String(fecha_desde));
      if (fecha_hasta) where.fecha_inicio.lte = new Date(String(fecha_hasta));
    }

    // Obtener todos los estados
    const estados = await prisma.dom_parametros.findMany({
      where: {
        categoria: { codigo: 'ESTADO_CANJE' }
      }
    });

    // Contar por estado
    const porEstado = await Promise.all(
      estados.map(async (estado) => ({
        estado: estado.valor_texto,
        codigo: estado.codigo,
        cantidad: await prisma.canjes.count({
          where: {
            ...where,
            estado_canje_id: estado.id
          }
        })
      }))
    );

    // Totales
    const [totalCanjes, finalizados] = await Promise.all([
      prisma.canjes.count({ where }),
      prisma.canjes.count({
        where: {
          ...where,
          estado_canje_id: await getEstadoCanjeId('FINALIZADO')
        }
      })
    ]);

    // Valores
    const agregados = await prisma.canjes.aggregate({
      where,
      _sum: {
        diferencia_valor: true,
        valor_tasacion_entregada: true,
        valor_tasacion_recibida: true
      },
      _avg: {
        diferencia_valor: true,
        valor_tasacion_entregada: true,
        valor_tasacion_recibida: true
      }
    });

    // Tasa de éxito
    const tasaExito = totalCanjes > 0 
      ? ((finalizados / totalCanjes) * 100).toFixed(2)
      : 0;

    const responseTime = Date.now() - startTime;

    res.json({
      success: true,
      data: {
        totales: {
          canjes: totalCanjes,
          finalizados,
          tasa_exito: Number(tasaExito)
        },
        por_estado: porEstado,
        valores: {
          diferencia_total: agregados._sum.diferencia_valor || 0,
          diferencia_promedio: agregados._avg.diferencia_valor || 0,
          valor_promedio_entregadas: agregados._avg.valor_tasacion_entregada || 0,
          valor_promedio_recibidas: agregados._avg.valor_tasacion_recibida || 0
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
