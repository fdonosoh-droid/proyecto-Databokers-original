/**
 * DATABROKERS - DASHBOARD CONTROLLER
 * Controlador para dashboard ejecutivo con KPIs, métricas y visualizaciones
 * 
 * @version 1.0
 * @author Sistema Databrokers
 */

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import {
  calcularTodosLosKPIs,
  compararKPI,
  obtenerHistoricoKPI
} from '../services/kpis.service';

const prisma = new PrismaClient();

// =====================================================
// DASHBOARD PRINCIPAL
// =====================================================

/**
 * Obtener datos completos del dashboard ejecutivo
 * GET /api/dashboard
 */
export async function getDashboardData(req: Request, res: Response) {
  try {
    const { modelo_negocio_id } = req.query;
    const startTime = Date.now();

    const modeloId = modelo_negocio_id ? Number(modelo_negocio_id) : undefined;

    // Calcular KPIs actuales
    const kpisResult = await calcularTodosLosKPIs(modeloId);

    // Obtener resúmenes por módulo
    const [
      resumenPropiedades,
      resumenProyectos,
      resumenCanjes,
      resumenPublicaciones,
      resumenModelos
    ] = await Promise.all([
      obtenerResumenPropiedades(modeloId),
      obtenerResumenProyectos(modeloId),
      obtenerResumenCanjes(modeloId),
      obtenerResumenPublicaciones(modeloId),
      obtenerResumenModelos()
    ]);

    // Obtener alertas activas
    const alertasActivas = await obtenerAlertasActivas(10);

    // Obtener actividad reciente
    const actividadReciente = await obtenerActividadReciente(10);

    const responseTime = Date.now() - startTime;

    res.json({
      success: true,
      data: {
        kpis: kpisResult.kpis,
        modulos: {
          propiedades: resumenPropiedades,
          proyectos: resumenProyectos,
          canjes: resumenCanjes,
          publicaciones: resumenPublicaciones,
          modelos: resumenModelos
        },
        alertas: alertasActivas,
        actividad_reciente: actividadReciente
      },
      meta: {
        responseTime: `${responseTime}ms`,
        periodo: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error al obtener datos del dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

// =====================================================
// KPIS Y MÉTRICAS
// =====================================================

/**
 * Obtener KPIs con comparación temporal
 * GET /api/dashboard/kpis
 */
export async function getKPIsWithComparison(req: Request, res: Response) {
  try {
    const { modelo_negocio_id } = req.query;
    const modeloId = modelo_negocio_id ? Number(modelo_negocio_id) : undefined;

    // Calcular KPIs actuales
    const kpisResult = await calcularTodosLosKPIs(modeloId);

    if (!kpisResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Error al calcular KPIs',
        error: kpisResult.error
      });
    }

    // Obtener comparaciones con mes anterior
    const kpisConComparacion = await Promise.all(
      kpisResult.kpis.map(async (kpi) => {
        const comparacion = await compararKPI(kpi.codigo, new Date(), modeloId);
        return {
          ...kpi,
          comparacion
        };
      })
    );

    res.json({
      success: true,
      data: kpisConComparacion
    });

  } catch (error) {
    console.error('Error al obtener KPIs:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
}

/**
 * Obtener histórico de un KPI específico
 * GET /api/dashboard/kpis/:codigo/historico
 */
export async function getKPIHistorico(req: Request, res: Response) {
  try {
    const { codigo } = req.params;
    const { meses = 6, modelo_negocio_id } = req.query;

    const modeloId = modelo_negocio_id ? Number(modelo_negocio_id) : undefined;

    const historico = await obtenerHistoricoKPI(
      String(codigo),
      Number(meses),
      modeloId
    );

    res.json({
      success: true,
      data: {
        codigo,
        historico
      }
    });

  } catch (error) {
    console.error('Error al obtener histórico KPI:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
}

// =====================================================
// RESÚMENES POR MÓDULO
// =====================================================

/**
 * Obtener resumen del módulo de propiedades
 */
async function obtenerResumenPropiedades(modeloId?: number): Promise<any> {
  const where: any = {};
  if (modeloId) where.modelo_negocio_id = modeloId;

  // Obtener estados
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

  const [total, disponibles, reservadas, vendidas] = await Promise.all([
    prisma.propiedades.count({ where }),
    prisma.propiedades.count({
      where: { ...where, estado_propiedad_id: estadoDisponible?.id }
    }),
    prisma.propiedades.count({
      where: { ...where, estado_propiedad_id: estadoReservada?.id }
    }),
    prisma.propiedades.count({
      where: { ...where, estado_propiedad_id: estadoVendida?.id }
    })
  ]);

  // Calcular valorización
  const valorizacion = await prisma.propiedades.aggregate({
    where: {
      ...where,
      estado_propiedad_id: {
        in: [estadoDisponible?.id, estadoReservada?.id].filter(Boolean)
      }
    },
    _sum: { precio: true }
  });

  return {
    total,
    activas: disponibles + reservadas,
    disponibles,
    reservadas,
    vendidas,
    valorizacion_total: valorizacion._sum.precio || 0
  };
}

/**
 * Obtener resumen del módulo de proyectos
 */
async function obtenerResumenProyectos(modeloId?: number): Promise<any> {
  const where: any = {};
  if (modeloId) where.modelo_negocio_id = modeloId;

  // Obtener estados
  const [estadoActivo, estadoConstruccion, estadoFinalizado] = await Promise.all([
    prisma.dom_parametros.findFirst({
      where: { categoria: { codigo: 'ESTADO_PROYECTO' }, codigo: 'ACTIVO' }
    }),
    prisma.dom_parametros.findFirst({
      where: { categoria: { codigo: 'ESTADO_PROYECTO' }, codigo: 'EN_CONSTRUCCION' }
    }),
    prisma.dom_parametros.findFirst({
      where: { categoria: { codigo: 'ESTADO_PROYECTO' }, codigo: 'FINALIZADO' }
    })
  ]);

  const [total, activos, enConstruccion, finalizados] = await Promise.all([
    prisma.proyectos.count({ where }),
    prisma.proyectos.count({
      where: { ...where, estado_proyecto_id: estadoActivo?.id }
    }),
    prisma.proyectos.count({
      where: { ...where, estado_proyecto_id: estadoConstruccion?.id }
    }),
    prisma.proyectos.count({
      where: { ...where, estado_proyecto_id: estadoFinalizado?.id }
    })
  ]);

  // Total de unidades
  const unidades = await prisma.propiedades_nuevas.count({
    where: {
      proyecto: modeloId ? { modelo_negocio_id: modeloId } : undefined
    }
  });

  return {
    total,
    activos,
    en_construccion: enConstruccion,
    finalizados,
    total_unidades: unidades
  };
}

/**
 * Obtener resumen del módulo de canjes
 */
async function obtenerResumenCanjes(modeloId?: number): Promise<any> {
  const where: any = {};
  if (modeloId) where.modelo_negocio_id = modeloId;

  // Obtener estados
  const [estadoIniciado, estadoEvaluacion, estadoFinalizado] = await Promise.all([
    prisma.dom_parametros.findFirst({
      where: { categoria: { codigo: 'ESTADO_CANJE' }, codigo: 'INICIADO' }
    }),
    prisma.dom_parametros.findFirst({
      where: { categoria: { codigo: 'ESTADO_CANJE' }, codigo: 'EN_EVALUACION' }
    }),
    prisma.dom_parametros.findFirst({
      where: { categoria: { codigo: 'ESTADO_CANJE' }, codigo: 'FINALIZADO' }
    })
  ]);

  const [total, iniciados, enEvaluacion, finalizados] = await Promise.all([
    prisma.canjes.count({ where }),
    prisma.canjes.count({
      where: { ...where, estado_canje_id: estadoIniciado?.id }
    }),
    prisma.canjes.count({
      where: { ...where, estado_canje_id: estadoEvaluacion?.id }
    }),
    prisma.canjes.count({
      where: { ...where, estado_canje_id: estadoFinalizado?.id }
    })
  ]);

  // Suma de diferencias de valor
  const agregados = await prisma.canjes.aggregate({
    where,
    _sum: {
      diferencia_valor: true,
      valor_tasacion_entregada: true,
      valor_tasacion_recibida: true
    }
  });

  return {
    total,
    iniciados,
    en_evaluacion: enEvaluacion,
    finalizados,
    diferencia_total: agregados._sum.diferencia_valor || 0,
    valor_entregadas: agregados._sum.valor_tasacion_entregada || 0,
    valor_recibidas: agregados._sum.valor_tasacion_recibida || 0
  };
}

/**
 * Obtener resumen del módulo de publicaciones
 */
async function obtenerResumenPublicaciones(modeloId?: number): Promise<any> {
  const where: any = {};
  
  if (modeloId) {
    where.propiedad = {
      modelo_negocio_id: modeloId
    };
  }

  // Obtener estados
  const [estadoActiva, estadoFinalizada, estadoPausada] = await Promise.all([
    prisma.dom_parametros.findFirst({
      where: { categoria: { codigo: 'ESTADO_PUBLICACION' }, codigo: 'ACTIVA' }
    }),
    prisma.dom_parametros.findFirst({
      where: { categoria: { codigo: 'ESTADO_PUBLICACION' }, codigo: 'FINALIZADA' }
    }),
    prisma.dom_parametros.findFirst({
      where: { categoria: { codigo: 'ESTADO_PUBLICACION' }, codigo: 'PAUSADA' }
    })
  ]);

  const [total, activas, finalizadas, pausadas, vencidas] = await Promise.all([
    prisma.publicaciones_corredores.count({ where }),
    prisma.publicaciones_corredores.count({
      where: {
        ...where,
        estado_publicacion_id: estadoActiva?.id,
        fecha_vencimiento: { gte: new Date() }
      }
    }),
    prisma.publicaciones_corredores.count({
      where: { ...where, estado_publicacion_id: estadoFinalizada?.id }
    }),
    prisma.publicaciones_corredores.count({
      where: { ...where, estado_publicacion_id: estadoPausada?.id }
    }),
    prisma.publicaciones_corredores.count({
      where: {
        ...where,
        estado_publicacion_id: estadoActiva?.id,
        fecha_vencimiento: { lt: new Date() }
      }
    })
  ]);

  // Métricas de actividad
  const metricas = await prisma.publicaciones_corredores.aggregate({
    where,
    _sum: {
      visualizaciones: true,
      contactos: true,
      comision_monto: true
    }
  });

  return {
    total,
    activas,
    finalizadas,
    pausadas,
    vencidas,
    visualizaciones_total: metricas._sum.visualizaciones || 0,
    contactos_total: metricas._sum.contactos || 0,
    comisiones_total: metricas._sum.comision_monto || 0
  };
}

/**
 * Obtener resumen de modelos de negocio
 */
async function obtenerResumenModelos(): Promise<any> {
  const total = await prisma.modelos_negocio.count();
  const activos = await prisma.modelos_negocio.count({
    where: { activo: true }
  });

  // Top 3 modelos por valorización
  const topModelos = await prisma.modelos_negocio.findMany({
    where: { activo: true },
    take: 3,
    include: {
      _count: {
        select: {
          propiedades: true
        }
      }
    },
    orderBy: {
      propiedades: {
        _count: 'desc'
      }
    }
  });

  return {
    total,
    activos,
    inactivos: total - activos,
    top_modelos: topModelos.map(m => ({
      id: m.id,
      nombre: m.nombre,
      total_propiedades: m._count.propiedades
    }))
  };
}

// =====================================================
// ALERTAS Y ACTIVIDAD
// =====================================================

/**
 * Obtener alertas activas
 */
async function obtenerAlertasActivas(limite: number = 10): Promise<any[]> {
  // Obtener estado activa
  const estadoActiva = await prisma.dom_parametros.findFirst({
    where: {
      categoria: { codigo: 'ESTADO_ALERTA' },
      codigo: 'ACTIVA'
    }
  });

  if (!estadoActiva) return [];

  const alertas = await prisma.alertas.findMany({
    where: {
      estado_alerta_id: estadoActiva.id
    },
    take: limite,
    orderBy: [
      { prioridad_id: 'desc' },
      { fecha_creacion: 'desc' }
    ],
    include: {
      tipo_alerta: {
        select: {
          valor_texto: true,
          codigo: true
        }
      },
      prioridad: {
        select: {
          valor_texto: true,
          codigo: true
        }
      },
      nivel_alerta: {
        select: {
          valor_texto: true,
          codigo: true
        }
      }
    }
  });

  return alertas.map(a => ({
    id: a.id,
    tipo: a.tipo_alerta.valor_texto,
    prioridad: a.prioridad.valor_texto,
    nivel: a.nivel_alerta?.valor_texto,
    titulo: a.titulo,
    mensaje: a.mensaje,
    fecha: a.fecha_creacion
  }));
}

/**
 * Obtener actividad reciente del sistema
 */
async function obtenerActividadReciente(limite: number = 10): Promise<any[]> {
  const actividad = await prisma.auditoria_log.findMany({
    take: limite,
    orderBy: {
      fecha_accion: 'desc'
    },
    include: {
      usuario: {
        select: {
          nombre: true,
          apellido: true
        }
      },
      accion: {
        select: {
          valor_texto: true,
          codigo: true
        }
      },
      entidad_tipo: {
        select: {
          valor_texto: true,
          codigo: true
        }
      }
    }
  });

  return actividad.map(a => ({
    id: a.id,
    usuario: `${a.usuario.nombre} ${a.usuario.apellido}`,
    accion: a.accion.valor_texto,
    entidad: a.entidad_tipo.valor_texto,
    descripcion: a.descripcion,
    fecha: a.fecha_accion
  }));
}

// =====================================================
// GRÁFICOS Y VISUALIZACIONES
// =====================================================

/**
 * Obtener datos para gráfico de ventas por mes
 * GET /api/dashboard/charts/ventas-mensuales
 */
export async function getVentasMensuales(req: Request, res: Response) {
  try {
    const { meses = 12, modelo_negocio_id } = req.query;

    const fechaInicio = new Date();
    fechaInicio.setMonth(fechaInicio.getMonth() - Number(meses));

    const where: any = {
      fecha_venta: {
        gte: fechaInicio
      }
    };

    if (modelo_negocio_id) {
      where.propiedad = {
        modelo_negocio_id: Number(modelo_negocio_id)
      };
    }

    const transacciones = await prisma.transacciones.findMany({
      where,
      select: {
        fecha_venta: true,
        monto_venta: true,
        comision_total: true
      },
      orderBy: {
        fecha_venta: 'asc'
      }
    });

    // Agrupar por mes
    const ventasPorMes: { [key: string]: { ventas: number; monto: number; comision: number } } = {};

    transacciones.forEach(t => {
      if (!t.fecha_venta) return;
      
      const mes = t.fecha_venta.toISOString().slice(0, 7); // YYYY-MM
      
      if (!ventasPorMes[mes]) {
        ventasPorMes[mes] = { ventas: 0, monto: 0, comision: 0 };
      }
      
      ventasPorMes[mes].ventas += 1;
      ventasPorMes[mes].monto += t.monto_venta || 0;
      ventasPorMes[mes].comision += t.comision_total || 0;
    });

    // Convertir a array
    const datos = Object.entries(ventasPorMes).map(([mes, valores]) => ({
      mes,
      ...valores
    }));

    res.json({
      success: true,
      data: datos
    });

  } catch (error) {
    console.error('Error al obtener ventas mensuales:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
}

/**
 * Obtener datos para gráfico de distribución de propiedades por estado
 * GET /api/dashboard/charts/propiedades-estado
 */
export async function getPropiedadesPorEstado(req: Request, res: Response) {
  try {
    const { modelo_negocio_id } = req.query;

    const where: any = {};
    if (modelo_negocio_id) where.modelo_negocio_id = Number(modelo_negocio_id);

    // Obtener todos los estados
    const estados = await prisma.dom_parametros.findMany({
      where: {
        categoria: { codigo: 'ESTADO_PROPIEDAD' }
      }
    });

    // Contar propiedades por estado
    const distribucion = await Promise.all(
      estados.map(async (estado) => ({
        estado: estado.valor_texto,
        codigo: estado.codigo,
        cantidad: await prisma.propiedades.count({
          where: {
            ...where,
            estado_propiedad_id: estado.id
          }
        })
      }))
    );

    // Filtrar solo estados con propiedades
    const datos = distribucion.filter(d => d.cantidad > 0);

    res.json({
      success: true,
      data: datos
    });

  } catch (error) {
    console.error('Error al obtener distribución por estado:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
}

/**
 * Obtener datos para gráfico de performance de corredores
 * GET /api/dashboard/charts/performance-corredores
 */
export async function getPerformanceCorredores(req: Request, res: Response) {
  try {
    const { top = 10 } = req.query;

    // Obtener corredores con más publicaciones finalizadas
    const estadoFinalizada = await prisma.dom_parametros.findFirst({
      where: {
        categoria: { codigo: 'ESTADO_PUBLICACION' },
        codigo: 'FINALIZADA'
      }
    });

    if (!estadoFinalizada) {
      return res.json({ success: true, data: [] });
    }

    const corredores = await prisma.usuarios.findMany({
      where: {
        rol: {
          codigo: 'CORREDOR'
        }
      },
      take: Number(top),
      include: {
        _count: {
          select: {
            publicaciones_corredor: {
              where: {
                estado_publicacion_id: estadoFinalizada.id
              }
            }
          }
        }
      },
      orderBy: {
        publicaciones_corredor: {
          _count: 'desc'
        }
      }
    });

    const datos = corredores.map(c => ({
      nombre: `${c.nombre} ${c.apellido}`,
      publicaciones_exitosas: c._count.publicaciones_corredor
    }));

    res.json({
      success: true,
      data: datos
    });

  } catch (error) {
    console.error('Error al obtener performance de corredores:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
}

/**
 * Obtener resumen financiero
 * GET /api/dashboard/financiero
 */
export async function getResumenFinanciero(req: Request, res: Response) {
  try {
    const { modelo_negocio_id, fecha_desde, fecha_hasta } = req.query;
    const startTime = Date.now();

    const where: any = {};

    if (modelo_negocio_id) {
      where.propiedad = {
        modelo_negocio_id: Number(modelo_negocio_id)
      };
    }

    if (fecha_desde || fecha_hasta) {
      where.fecha_venta = {};
      if (fecha_desde) where.fecha_venta.gte = new Date(String(fecha_desde));
      if (fecha_hasta) where.fecha_venta.lte = new Date(String(fecha_hasta));
    }

    // Obtener agregados de transacciones
    const transacciones = await prisma.transacciones.aggregate({
      where,
      _sum: {
        monto_venta: true,
        comision_total: true,
        comision_agencia: true
      },
      _count: true
    });

    // Obtener comisiones pagadas a corredores
    const wherePublicaciones: any = {};
    if (modelo_negocio_id) {
      wherePublicaciones.propiedad = {
        modelo_negocio_id: Number(modelo_negocio_id)
      };
    }

    const estadoFinalizada = await prisma.dom_parametros.findFirst({
      where: {
        categoria: { codigo: 'ESTADO_PUBLICACION' },
        codigo: 'FINALIZADA'
      }
    });

    if (estadoFinalizada) {
      wherePublicaciones.estado_publicacion_id = estadoFinalizada.id;
    }

    const publicaciones = await prisma.publicaciones_corredores.aggregate({
      where: wherePublicaciones,
      _sum: {
        comision_monto: true
      }
    });

    const comisionTotal = transacciones._sum.comision_total || 0;
    const comisionCorredores = publicaciones._sum.comision_monto || 0;
    const comisionNeta = comisionTotal - comisionCorredores;

    const responseTime = Date.now() - startTime;

    res.json({
      success: true,
      data: {
        ventas: {
          cantidad: transacciones._count,
          monto_total: transacciones._sum.monto_venta || 0
        },
        comisiones: {
          total: comisionTotal,
          a_corredores: comisionCorredores,
          neta_agencia: comisionNeta,
          porcentaje_neto: comisionTotal > 0 
            ? Number(((comisionNeta / comisionTotal) * 100).toFixed(2))
            : 0
        }
      },
      meta: {
        responseTime: `${responseTime}ms`
      }
    });

  } catch (error) {
    console.error('Error al obtener resumen financiero:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
}
