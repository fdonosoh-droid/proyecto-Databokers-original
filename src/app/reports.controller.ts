/**
 * DATABROKERS - REPORTS CONTROLLER
 * Controlador para gestión y generación de reportes
 * 
 * @version 1.0
 * @author Sistema Databrokers
 */

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';
import {
  generarReportePropiedades,
  generarReporteKPIs,
  generarReporteFinanciero,
  generarReporteConsolidado
} from '../services/reports.service';

const prisma = new PrismaClient();

// =====================================================
// SCHEMAS DE VALIDACIÓN
// =====================================================

const generateReportSchema = z.object({
  tipo_reporte: z.enum(['PROPIEDADES', 'PROYECTOS', 'CANJES', 'PUBLICACIONES', 'KPIS', 'FINANCIERO', 'CONSOLIDADO']),
  formato: z.enum(['PDF', 'EXCEL']),
  filtros: z.record(z.any()).optional(),
  fecha_inicio: z.string().optional(),
  fecha_fin: z.string().optional(),
  enviar_email: z.boolean().optional(),
  email_destino: z.string().email().optional()
});

const scheduleReportSchema = z.object({
  tipo_reporte: z.enum(['PROPIEDADES', 'PROYECTOS', 'CANJES', 'PUBLICACIONES', 'KPIS', 'FINANCIERO', 'CONSOLIDADO']),
  formato: z.enum(['PDF', 'EXCEL']),
  frecuencia: z.enum(['DIARIA', 'SEMANAL', 'MENSUAL']),
  dia_mes: z.number().int().min(1).max(31).optional(),
  dia_semana: z.number().int().min(0).max(6).optional(),
  hora: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/),
  email_destinos: z.array(z.string().email()),
  filtros: z.record(z.any()).optional(),
  activo: z.boolean().default(true)
});

// =====================================================
// FUNCIONES AUXILIARES
// =====================================================

/**
 * Obtener ID de tipo de reporte
 */
async function getTipoReporteId(codigo: string): Promise<number | null> {
  const tipo = await prisma.dom_parametros.findFirst({
    where: {
      categoria: { codigo: 'TIPO_REPORTE' },
      codigo
    }
  });
  return tipo?.id || null;
}

/**
 * Registrar reporte generado en base de datos
 */
async function registrarReporte(
  usuarioId: number,
  tipoReporte: string,
  formato: string,
  rutaArchivo: string,
  tamanoBytes: number,
  metadata?: any
): Promise<any> {
  const tipoReporteId = await getTipoReporteId(tipoReporte);
  const formatoId = await prisma.dom_parametros.findFirst({
    where: {
      categoria: { codigo: 'FORMATO_ARCHIVO' },
      codigo: formato
    }
  });

  if (!tipoReporteId || !formatoId) {
    throw new Error('Tipo de reporte o formato no válido');
  }

  return await prisma.reportes.create({
    data: {
      tipo_reporte_id: tipoReporteId,
      formato_id: formatoId.id,
      usuario_generador_id: usuarioId,
      ruta_archivo: rutaArchivo,
      tamano_bytes: tamanoBytes,
      metadata
    },
    include: {
      tipo_reporte: true,
      formato: true,
      usuario_generador: {
        select: {
          nombre: true,
          apellido: true
        }
      }
    }
  });
}

// =====================================================
// CONTROLADORES PRINCIPALES
// =====================================================

/**
 * Generar nuevo reporte
 * POST /api/reports/generate
 */
export async function generateReport(req: Request, res: Response) {
  try {
    const startTime = Date.now();
    
    // Validar datos
    const validatedData = generateReportSchema.parse(req.body);

    let rutaArchivo: string;

    // Generar reporte según tipo
    switch (validatedData.tipo_reporte) {
      case 'PROPIEDADES':
        rutaArchivo = await generarReportePropiedades(
          validatedData.formato,
          validatedData.filtros
        );
        break;

      case 'KPIS':
        const periodo = validatedData.fecha_fin 
          ? new Date(validatedData.fecha_fin)
          : new Date();
        rutaArchivo = await generarReporteKPIs(validatedData.formato, periodo);
        break;

      case 'FINANCIERO':
        const fechaInicio = validatedData.fecha_inicio 
          ? new Date(validatedData.fecha_inicio)
          : undefined;
        const fechaFin = validatedData.fecha_fin
          ? new Date(validatedData.fecha_fin)
          : undefined;
        rutaArchivo = await generarReporteFinanciero(
          validatedData.formato,
          fechaInicio,
          fechaFin
        );
        break;

      case 'CONSOLIDADO':
        rutaArchivo = await generarReporteConsolidado(validatedData.formato);
        break;

      default:
        return res.status(400).json({
          success: false,
          message: 'Tipo de reporte no implementado aún'
        });
    }

    // Obtener tamaño del archivo
    const stats = fs.statSync(rutaArchivo);
    const tamanoBytes = stats.size;

    // Registrar en base de datos
    const reporte = await registrarReporte(
      req.user!.id,
      validatedData.tipo_reporte,
      validatedData.formato,
      rutaArchivo,
      tamanoBytes,
      {
        filtros: validatedData.filtros,
        fecha_inicio: validatedData.fecha_inicio,
        fecha_fin: validatedData.fecha_fin
      }
    );

    // Enviar por email si se solicita
    if (validatedData.enviar_email && validatedData.email_destino) {
      // TODO: Integrar con NotificationsService
      // await enviarReportePorEmail(validatedData.email_destino, rutaArchivo);
    }

    // Registrar auditoría
    await prisma.auditoria_log.create({
      data: {
        usuario_id: req.user?.id,
        accion_id: await getAccionId('CREAR'),
        entidad_tipo_id: await getEntidadTipoId('REPORTE'),
        entidad_id: reporte.id,
        descripcion: `Reporte generado: ${validatedData.tipo_reporte} (${validatedData.formato})`,
        valores_nuevos: reporte,
        ip_address: req.ip,
        user_agent: req.get('user-agent')
      }
    });

    const responseTime = Date.now() - startTime;

    res.status(201).json({
      success: true,
      message: 'Reporte generado exitosamente',
      data: {
        ...reporte,
        url_descarga: `/api/reports/${reporte.id}/download`,
        tamano_mb: (tamanoBytes / (1024 * 1024)).toFixed(2)
      },
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

    console.error('Error al generar reporte:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

/**
 * Listar reportes generados
 * GET /api/reports
 */
export async function listReports(req: Request, res: Response) {
  try {
    const {
      page = 1,
      limit = 20,
      tipo_reporte,
      formato,
      fecha_desde,
      fecha_hasta
    } = req.query;

    const where: any = {};

    // Filtrar por usuario si no es admin
    if (req.user?.rol?.codigo !== 'ADMIN') {
      where.usuario_generador_id = req.user?.id;
    }

    if (tipo_reporte) {
      const tipoId = await getTipoReporteId(String(tipo_reporte));
      if (tipoId) where.tipo_reporte_id = tipoId;
    }

    if (formato) {
      const formatoParam = await prisma.dom_parametros.findFirst({
        where: {
          categoria: { codigo: 'FORMATO_ARCHIVO' },
          codigo: String(formato)
        }
      });
      if (formatoParam) where.formato_id = formatoParam.id;
    }

    if (fecha_desde || fecha_hasta) {
      where.fecha_generacion = {};
      if (fecha_desde) where.fecha_generacion.gte = new Date(String(fecha_desde));
      if (fecha_hasta) where.fecha_generacion.lte = new Date(String(fecha_hasta));
    }

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const [reportes, total] = await Promise.all([
      prisma.reportes.findMany({
        where,
        skip,
        take,
        orderBy: {
          fecha_generacion: 'desc'
        },
        include: {
          tipo_reporte: true,
          formato: true,
          usuario_generador: {
            select: {
              nombre: true,
              apellido: true
            }
          }
        }
      }),
      prisma.reportes.count({ where })
    ]);

    // Agregar URL de descarga a cada reporte
    const reportesConUrl = reportes.map(r => ({
      ...r,
      url_descarga: `/api/reports/${r.id}/download`,
      tamano_mb: (r.tamano_bytes / (1024 * 1024)).toFixed(2)
    }));

    res.json({
      success: true,
      data: reportesConUrl,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit))
      }
    });

  } catch (error) {
    console.error('Error al listar reportes:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
}

/**
 * Obtener reporte por ID
 * GET /api/reports/:id
 */
export async function getReportById(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const reporte = await prisma.reportes.findUnique({
      where: { id: Number(id) },
      include: {
        tipo_reporte: true,
        formato: true,
        usuario_generador: {
          select: {
            nombre: true,
            apellido: true,
            email: true
          }
        }
      }
    });

    if (!reporte) {
      return res.status(404).json({
        success: false,
        message: 'Reporte no encontrado'
      });
    }

    // Verificar autorización
    if (req.user?.rol?.codigo !== 'ADMIN' && 
        reporte.usuario_generador_id !== req.user?.id) {
      return res.status(403).json({
        success: false,
        message: 'No tiene permiso para ver este reporte'
      });
    }

    res.json({
      success: true,
      data: {
        ...reporte,
        url_descarga: `/api/reports/${reporte.id}/download`,
        tamano_mb: (reporte.tamano_bytes / (1024 * 1024)).toFixed(2)
      }
    });

  } catch (error) {
    console.error('Error al obtener reporte:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
}

/**
 * Descargar reporte
 * GET /api/reports/:id/download
 */
export async function downloadReport(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const reporte = await prisma.reportes.findUnique({
      where: { id: Number(id) },
      include: {
        tipo_reporte: true,
        formato: true
      }
    });

    if (!reporte) {
      return res.status(404).json({
        success: false,
        message: 'Reporte no encontrado'
      });
    }

    // Verificar autorización
    if (req.user?.rol?.codigo !== 'ADMIN' && 
        reporte.usuario_generador_id !== req.user?.id) {
      return res.status(403).json({
        success: false,
        message: 'No tiene permiso para descargar este reporte'
      });
    }

    // Verificar que el archivo existe
    if (!fs.existsSync(reporte.ruta_archivo)) {
      return res.status(404).json({
        success: false,
        message: 'Archivo de reporte no encontrado'
      });
    }

    // Actualizar contador de descargas
    await prisma.reportes.update({
      where: { id: Number(id) },
      data: {
        descargas: {
          increment: 1
        },
        ultima_descarga: new Date()
      }
    });

    // Determinar Content-Type
    const contentType = reporte.formato.codigo === 'PDF'
      ? 'application/pdf'
      : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

    // Generar nombre de archivo
    const extension = reporte.formato.codigo.toLowerCase();
    const filename = `reporte_${reporte.tipo_reporte.codigo.toLowerCase()}_${reporte.id}.${extension}`;

    // Enviar archivo
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', reporte.tamano_bytes);

    const fileStream = fs.createReadStream(reporte.ruta_archivo);
    fileStream.pipe(res);

  } catch (error) {
    console.error('Error al descargar reporte:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
}

/**
 * Eliminar reporte
 * DELETE /api/reports/:id
 */
export async function deleteReport(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const reporte = await prisma.reportes.findUnique({
      where: { id: Number(id) }
    });

    if (!reporte) {
      return res.status(404).json({
        success: false,
        message: 'Reporte no encontrado'
      });
    }

    // Solo el creador o admin pueden eliminar
    if (req.user?.rol?.codigo !== 'ADMIN' && 
        reporte.usuario_generador_id !== req.user?.id) {
      return res.status(403).json({
        success: false,
        message: 'No tiene permiso para eliminar este reporte'
      });
    }

    // Eliminar archivo físico
    if (fs.existsSync(reporte.ruta_archivo)) {
      fs.unlinkSync(reporte.ruta_archivo);
    }

    // Eliminar registro de BD
    await prisma.reportes.delete({
      where: { id: Number(id) }
    });

    // Auditoría
    await prisma.auditoria_log.create({
      data: {
        usuario_id: req.user?.id,
        accion_id: await getAccionId('ELIMINAR'),
        entidad_tipo_id: await getEntidadTipoId('REPORTE'),
        entidad_id: Number(id),
        descripcion: `Reporte eliminado: ${reporte.id}`,
        valores_anteriores: reporte,
        ip_address: req.ip,
        user_agent: req.get('user-agent')
      }
    });

    res.json({
      success: true,
      message: 'Reporte eliminado exitosamente'
    });

  } catch (error) {
    console.error('Error al eliminar reporte:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
}

// =====================================================
// PROGRAMACIÓN DE REPORTES
// =====================================================

/**
 * Programar reporte automático
 * POST /api/reports/schedule
 */
export async function scheduleReport(req: Request, res: Response) {
  try {
    const validatedData = scheduleReportSchema.parse(req.body);

    // Obtener IDs necesarios
    const tipoReporteId = await getTipoReporteId(validatedData.tipo_reporte);
    const formatoId = await prisma.dom_parametros.findFirst({
      where: {
        categoria: { codigo: 'FORMATO_ARCHIVO' },
        codigo: validatedData.formato
      }
    });

    const frecuenciaId = await prisma.dom_parametros.findFirst({
      where: {
        categoria: { codigo: 'FRECUENCIA_REPORTE' },
        codigo: validatedData.frecuencia
      }
    });

    if (!tipoReporteId || !formatoId || !frecuenciaId) {
      return res.status(400).json({
        success: false,
        message: 'Parámetros no válidos'
      });
    }

    // Crear programación
    const programacion = await prisma.programacion_reportes.create({
      data: {
        tipo_reporte_id: tipoReporteId,
        formato_id: formatoId.id,
        frecuencia_id: frecuenciaId.id,
        dia_mes: validatedData.dia_mes,
        dia_semana: validatedData.dia_semana,
        hora: validatedData.hora,
        email_destinos: validatedData.email_destinos,
        usuario_creador_id: req.user!.id,
        filtros: validatedData.filtros,
        activo: validatedData.activo
      },
      include: {
        tipo_reporte: true,
        formato: true,
        frecuencia: true,
        usuario_creador: {
          select: {
            nombre: true,
            apellido: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Reporte programado exitosamente',
      data: programacion
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Error de validación',
        errors: error.errors
      });
    }

    console.error('Error al programar reporte:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
}

/**
 * Listar reportes programados
 * GET /api/reports/scheduled
 */
export async function listScheduledReports(req: Request, res: Response) {
  try {
    const where: any = {};

    // Filtrar por usuario si no es admin
    if (req.user?.rol?.codigo !== 'ADMIN') {
      where.usuario_creador_id = req.user?.id;
    }

    const programaciones = await prisma.programacion_reportes.findMany({
      where,
      include: {
        tipo_reporte: true,
        formato: true,
        frecuencia: true,
        usuario_creador: {
          select: {
            nombre: true,
            apellido: true
          }
        }
      },
      orderBy: {
        fecha_creacion: 'desc'
      }
    });

    res.json({
      success: true,
      data: programaciones
    });

  } catch (error) {
    console.error('Error al listar reportes programados:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
}

/**
 * Activar/Desactivar reporte programado
 * PUT /api/reports/scheduled/:id/toggle
 */
export async function toggleScheduledReport(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const programacion = await prisma.programacion_reportes.findUnique({
      where: { id: Number(id) }
    });

    if (!programacion) {
      return res.status(404).json({
        success: false,
        message: 'Programación no encontrada'
      });
    }

    // Verificar autorización
    if (req.user?.rol?.codigo !== 'ADMIN' && 
        programacion.usuario_creador_id !== req.user?.id) {
      return res.status(403).json({
        success: false,
        message: 'No tiene permiso para modificar esta programación'
      });
    }

    const actualizada = await prisma.programacion_reportes.update({
      where: { id: Number(id) },
      data: {
        activo: !programacion.activo
      }
    });

    res.json({
      success: true,
      message: `Programación ${actualizada.activo ? 'activada' : 'desactivada'} exitosamente`,
      data: actualizada
    });

  } catch (error) {
    console.error('Error al cambiar estado de programación:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
}

/**
 * Eliminar programación de reporte
 * DELETE /api/reports/scheduled/:id
 */
export async function deleteScheduledReport(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const programacion = await prisma.programacion_reportes.findUnique({
      where: { id: Number(id) }
    });

    if (!programacion) {
      return res.status(404).json({
        success: false,
        message: 'Programación no encontrada'
      });
    }

    // Verificar autorización
    if (req.user?.rol?.codigo !== 'ADMIN' && 
        programacion.usuario_creador_id !== req.user?.id) {
      return res.status(403).json({
        success: false,
        message: 'No tiene permiso para eliminar esta programación'
      });
    }

    await prisma.programacion_reportes.delete({
      where: { id: Number(id) }
    });

    res.json({
      success: true,
      message: 'Programación eliminada exitosamente'
    });

  } catch (error) {
    console.error('Error al eliminar programación:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
}

/**
 * Obtener plantillas de reportes disponibles
 * GET /api/reports/templates
 */
export async function getReportTemplates(req: Request, res: Response) {
  try {
    const templates = await prisma.dom_parametros.findMany({
      where: {
        categoria: {
          codigo: 'TIPO_REPORTE'
        }
      },
      select: {
        id: true,
        codigo: true,
        valor_texto: true,
        descripcion: true
      }
    });

    const formatos = await prisma.dom_parametros.findMany({
      where: {
        categoria: {
          codigo: 'FORMATO_ARCHIVO'
        },
        codigo: {
          in: ['PDF', 'EXCEL']
        }
      },
      select: {
        id: true,
        codigo: true,
        valor_texto: true
      }
    });

    res.json({
      success: true,
      data: {
        plantillas: templates,
        formatos
      }
    });

  } catch (error) {
    console.error('Error al obtener plantillas:', error);
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
