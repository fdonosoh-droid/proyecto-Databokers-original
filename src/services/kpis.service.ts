/**
 * DATABROKERS - KPIs SERVICE
 * Servicio para cálculo automático de KPIs (Key Performance Indicators)
 * 
 * @version 1.0
 * @author Sistema Databrokers
 */

import { PrismaClient } from '@prisma/client';
import cron from 'node-cron';

const prisma = new PrismaClient();

// =====================================================
// TIPOS Y CONSTANTES
// =====================================================

interface KPIResult {
  kpi_id: number;
  valor: number;
  periodo: Date;
  metadata?: any;
}

interface KPIComparison {
  actual: number;
  anterior: number;
  variacion: number;
  porcentaje_variacion: number;
}

// Códigos de KPIs del sistema
enum KPI_CODES {
  TASA_CONVERSION = 'TASA_CONVERSION',
  TIEMPO_PROMEDIO_VENTA = 'TIEMPO_PROMEDIO_VENTA',
  VALORIZACION_TOTAL = 'VALORIZACION_TOTAL',
  COMISION_TOTAL = 'COMISION_TOTAL',
  COMISION_NETA = 'COMISION_NETA',
  INDICE_STOCK = 'INDICE_STOCK',
  EFICIENCIA_CORREDOR = 'EFICIENCIA_CORREDOR',
  TASA_CANJE_EXITOSO = 'TASA_CANJE_EXITOSO',
  ROI_MODELO = 'ROI_MODELO'
}

// =====================================================
// FUNCIONES DE CÁLCULO DE KPIs
// =====================================================

/**
 * KPI 1: Tasa de Conversión
 * Fórmula: (Propiedades Vendidas / Total Propiedades) * 100
 */
async function calcularTasaConversion(
  modeloNegocioId?: number,
  fechaInicio?: Date,
  fechaFin?: Date
): Promise<number> {
  const where: any = {};
  
  if (modeloNegocioId) {
    where.modelo_negocio_id = modeloNegocioId;
  }

  if (fechaInicio || fechaFin) {
    where.fecha_publicacion = {};
    if (fechaInicio) where.fecha_publicacion.gte = fechaInicio;
    if (fechaFin) where.fecha_publicacion.lte = fechaFin;
  }

  // Obtener ID del estado "VENDIDA"
  const estadoVendida = await prisma.dom_parametros.findFirst({
    where: {
      categoria: { codigo: 'ESTADO_PROPIEDAD' },
      codigo: 'VENDIDA'
    }
  });

  if (!estadoVendida) return 0;

  const [total, vendidas] = await Promise.all([
    prisma.propiedades.count({ where }),
    prisma.propiedades.count({
      where: {
        ...where,
        estado_propiedad_id: estadoVendida.id
      }
    })
  ]);

  if (total === 0) return 0;

  return Number(((vendidas / total) * 100).toFixed(2));
}

/**
 * KPI 2: Tiempo Promedio de Venta (en días)
 * Fórmula: Promedio(Fecha Venta - Fecha Publicación)
 */
async function calcularTiempoPromedioVenta(
  modeloNegocioId?: number,
  fechaInicio?: Date,
  fechaFin?: Date
): Promise<number> {
  const where: any = {};
  
  if (modeloNegocioId) {
    where.propiedad = {
      modelo_negocio_id: modeloNegocioId
    };
  }

  if (fechaInicio || fechaFin) {
    where.fecha_venta = {};
    if (fechaInicio) where.fecha_venta.gte = fechaInicio;
    if (fechaFin) where.fecha_venta.lte = fechaFin;
  }

  // Obtener todas las transacciones de venta
  const transacciones = await prisma.transacciones.findMany({
    where: {
      ...where,
      fecha_venta: { not: null }
    },
    include: {
      propiedad: {
        select: {
          fecha_publicacion: true
        }
      }
    }
  });

  if (transacciones.length === 0) return 0;

  // Calcular días para cada venta
  const diasPorVenta = transacciones.map(t => {
    if (!t.fecha_venta || !t.propiedad.fecha_publicacion) return 0;
    
    const diffTime = t.fecha_venta.getTime() - t.propiedad.fecha_publicacion.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  });

  // Calcular promedio
  const suma = diasPorVenta.reduce((acc, dias) => acc + dias, 0);
  return Number((suma / diasPorVenta.length).toFixed(1));
}

/**
 * KPI 3: Valorización Total
 * Fórmula: Suma(Precio de todas las propiedades activas)
 */
async function calcularValorizacionTotal(
  modeloNegocioId?: number,
  fechaInicio?: Date,
  fechaFin?: Date
): Promise<number> {
  const where: any = {};
  
  if (modeloNegocioId) {
    where.modelo_negocio_id = modeloNegocioId;
  }

  // Solo propiedades disponibles y reservadas (activas en stock)
  const estadosActivos = await prisma.dom_parametros.findMany({
    where: {
      categoria: { codigo: 'ESTADO_PROPIEDAD' },
      codigo: { in: ['DISPONIBLE', 'RESERVADA'] }
    }
  });

  where.estado_propiedad_id = {
    in: estadosActivos.map(e => e.id)
  };

  const resultado = await prisma.propiedades.aggregate({
    where,
    _sum: {
      precio: true
    }
  });

  return resultado._sum.precio || 0;
}

/**
 * KPI 4: Comisión Total Generada
 * Fórmula: Suma(Comisión de todas las transacciones finalizadas)
 */
async function calcularComisionTotal(
  modeloNegocioId?: number,
  fechaInicio?: Date,
  fechaFin?: Date
): Promise<number> {
  const where: any = {};
  
  if (modeloNegocioId) {
    where.propiedad = {
      modelo_negocio_id: modeloNegocioId
    };
  }

  if (fechaInicio || fechaFin) {
    where.fecha_venta = {};
    if (fechaInicio) where.fecha_venta.gte = fechaInicio;
    if (fechaFin) where.fecha_venta.lte = fechaFin;
  }

  // Obtener estado finalizada
  const estadoFinalizada = await prisma.dom_parametros.findFirst({
    where: {
      categoria: { codigo: 'ESTADO_TRANSACCION' },
      codigo: 'FINALIZADA'
    }
  });

  if (estadoFinalizada) {
    where.estado_transaccion_id = estadoFinalizada.id;
  }

  const resultado = await prisma.transacciones.aggregate({
    where,
    _sum: {
      comision_total: true
    }
  });

  return resultado._sum.comision_total || 0;
}

/**
 * KPI 5: Comisión Neta Agencia
 * Fórmula: Comisión Total - Comisiones a Corredores Externos
 */
async function calcularComisionNeta(
  modeloNegocioId?: number,
  fechaInicio?: Date,
  fechaFin?: Date
): Promise<number> {
  // Calcular comisión total
  const comisionTotal = await calcularComisionTotal(modeloNegocioId, fechaInicio, fechaFin);

  // Calcular comisiones pagadas a corredores
  const wherePublicaciones: any = {};
  
  if (modeloNegocioId) {
    wherePublicaciones.propiedad = {
      modelo_negocio_id: modeloNegocioId
    };
  }

  if (fechaInicio || fechaFin) {
    wherePublicaciones.fecha_cierre = {};
    if (fechaInicio) wherePublicaciones.fecha_cierre.gte = fechaInicio;
    if (fechaFin) wherePublicaciones.fecha_cierre.lte = fechaFin;
  }

  // Estado finalizada
  const estadoFinalizada = await prisma.dom_parametros.findFirst({
    where: {
      categoria: { codigo: 'ESTADO_PUBLICACION' },
      codigo: 'FINALIZADA'
    }
  });

  if (estadoFinalizada) {
    wherePublicaciones.estado_publicacion_id = estadoFinalizada.id;
  }

  const resultadoCorredores = await prisma.publicaciones_corredores.aggregate({
    where: wherePublicaciones,
    _sum: {
      comision_monto: true
    }
  });

  const comisionesCorredores = resultadoCorredores._sum.comision_monto || 0;

  return comisionTotal - comisionesCorredores;
}

/**
 * KPI 6: Índice de Stock
 * Fórmula: (Propiedades Disponibles / Propiedades Vendidas Último Mes) * 30
 * Indica cuántos días de stock hay basado en el ritmo de ventas
 */
async function calcularIndiceStock(
  modeloNegocioId?: number
): Promise<number> {
  const where: any = {};
  
  if (modeloNegocioId) {
    where.modelo_negocio_id = modeloNegocioId;
  }

  // Propiedades disponibles
  const estadoDisponible = await prisma.dom_parametros.findFirst({
    where: {
      categoria: { codigo: 'ESTADO_PROPIEDAD' },
      codigo: 'DISPONIBLE'
    }
  });

  const disponibles = await prisma.propiedades.count({
    where: {
      ...where,
      estado_propiedad_id: estadoDisponible?.id
    }
  });

  // Ventas del último mes
  const hace30Dias = new Date();
  hace30Dias.setDate(hace30Dias.getDate() - 30);

  const estadoVendida = await prisma.dom_parametros.findFirst({
    where: {
      categoria: { codigo: 'ESTADO_PROPIEDAD' },
      codigo: 'VENDIDA'
    }
  });

  const ventasUltimoMes = await prisma.transacciones.count({
    where: {
      propiedad: modeloNegocioId ? { modelo_negocio_id: modeloNegocioId } : undefined,
      fecha_venta: {
        gte: hace30Dias
      }
    }
  });

  if (ventasUltimoMes === 0) return disponibles > 0 ? 999 : 0;

  const indice = (disponibles / ventasUltimoMes) * 30;
  return Number(indice.toFixed(1));
}

/**
 * KPI 7: Eficiencia de Corredor
 * Fórmula: (Publicaciones Finalizadas / Total Publicaciones) * 100
 */
async function calcularEficienciaCorredor(
  corredorId?: number,
  fechaInicio?: Date,
  fechaFin?: Date
): Promise<number> {
  const where: any = {};
  
  if (corredorId) {
    where.corredor_id = corredorId;
  }

  if (fechaInicio || fechaFin) {
    where.fecha_inicio = {};
    if (fechaInicio) where.fecha_inicio.gte = fechaInicio;
    if (fechaFin) where.fecha_inicio.lte = fechaFin;
  }

  const estadoFinalizada = await prisma.dom_parametros.findFirst({
    where: {
      categoria: { codigo: 'ESTADO_PUBLICACION' },
      codigo: 'FINALIZADA'
    }
  });

  const [total, finalizadas] = await Promise.all([
    prisma.publicaciones_corredores.count({ where }),
    prisma.publicaciones_corredores.count({
      where: {
        ...where,
        estado_publicacion_id: estadoFinalizada?.id
      }
    })
  ]);

  if (total === 0) return 0;

  return Number(((finalizadas / total) * 100).toFixed(2));
}

/**
 * KPI 8: Tasa de Canje Exitoso
 * Fórmula: (Canjes Finalizados / Total Canjes) * 100
 */
async function calcularTasaCanjeExitoso(
  modeloNegocioId?: number,
  fechaInicio?: Date,
  fechaFin?: Date
): Promise<number> {
  const where: any = {};
  
  if (modeloNegocioId) {
    where.modelo_negocio_id = modeloNegocioId;
  }

  if (fechaInicio || fechaFin) {
    where.fecha_inicio = {};
    if (fechaInicio) where.fecha_inicio.gte = fechaInicio;
    if (fechaFin) where.fecha_inicio.lte = fechaFin;
  }

  const estadoFinalizado = await prisma.dom_parametros.findFirst({
    where: {
      categoria: { codigo: 'ESTADO_CANJE' },
      codigo: 'FINALIZADO'
    }
  });

  const [total, finalizados] = await Promise.all([
    prisma.canjes.count({ where }),
    prisma.canjes.count({
      where: {
        ...where,
        estado_canje_id: estadoFinalizado?.id
      }
    })
  ]);

  if (total === 0) return 0;

  return Number(((finalizados / total) * 100).toFixed(2));
}

/**
 * KPI 9: ROI por Modelo (Return on Investment)
 * Fórmula: ((Comisión Neta - Costos Operacionales) / Costos Operacionales) * 100
 * Nota: Por ahora calculamos solo con comisión neta, costos pueden agregarse después
 */
async function calcularROIModelo(
  modeloNegocioId: number,
  fechaInicio?: Date,
  fechaFin?: Date
): Promise<number> {
  const comisionNeta = await calcularComisionNeta(modeloNegocioId, fechaInicio, fechaFin);
  
  // Por ahora, asumimos costos del 30% de la comisión neta
  // Este valor puede venir de una tabla de configuración
  const costosEstimados = comisionNeta * 0.30;
  
  if (costosEstimados === 0) return 0;

  const roi = ((comisionNeta - costosEstimados) / costosEstimados) * 100;
  return Number(roi.toFixed(2));
}

// =====================================================
// FUNCIONES DE ALMACENAMIENTO
// =====================================================

/**
 * Almacenar valor de KPI calculado
 */
async function almacenarKPI(
  codigoKPI: string,
  valor: number,
  periodo: Date,
  entidadId?: number,
  metadata?: any
): Promise<void> {
  // Obtener ID del KPI
  const kpi = await prisma.dom_parametros.findFirst({
    where: {
      categoria: { codigo: 'KPI_TIPO' },
      codigo: codigoKPI
    }
  });

  if (!kpi) {
    console.error(`KPI no encontrado: ${codigoKPI}`);
    return;
  }

  // Verificar si ya existe un valor para este periodo
  const existente = await prisma.kpi_valores.findFirst({
    where: {
      kpi_id: kpi.id,
      periodo,
      entidad_id: entidadId || null
    }
  });

  if (existente) {
    // Actualizar valor existente
    await prisma.kpi_valores.update({
      where: { id: existente.id },
      data: {
        valor,
        metadata
      }
    });
  } else {
    // Crear nuevo registro
    await prisma.kpi_valores.create({
      data: {
        kpi_id: kpi.id,
        valor,
        periodo,
        entidad_id: entidadId,
        metadata
      }
    });
  }
}

/**
 * Calcular y almacenar todos los KPIs
 */
export async function calcularTodosLosKPIs(
  modeloNegocioId?: number,
  fechaInicio?: Date,
  fechaFin?: Date
): Promise<{ success: boolean; kpis: any[]; error?: string }> {
  try {
    const periodo = fechaFin || new Date();
    const kpis: any[] = [];

    console.log(`📊 Calculando KPIs para periodo: ${periodo.toISOString()}`);

    // KPI 1: Tasa de Conversión
    const tasaConversion = await calcularTasaConversion(modeloNegocioId, fechaInicio, fechaFin);
    await almacenarKPI(KPI_CODES.TASA_CONVERSION, tasaConversion, periodo, modeloNegocioId);
    kpis.push({ codigo: KPI_CODES.TASA_CONVERSION, valor: tasaConversion });

    // KPI 2: Tiempo Promedio de Venta
    const tiempoVenta = await calcularTiempoPromedioVenta(modeloNegocioId, fechaInicio, fechaFin);
    await almacenarKPI(KPI_CODES.TIEMPO_PROMEDIO_VENTA, tiempoVenta, periodo, modeloNegocioId);
    kpis.push({ codigo: KPI_CODES.TIEMPO_PROMEDIO_VENTA, valor: tiempoVenta });

    // KPI 3: Valorización Total
    const valorizacion = await calcularValorizacionTotal(modeloNegocioId, fechaInicio, fechaFin);
    await almacenarKPI(KPI_CODES.VALORIZACION_TOTAL, valorizacion, periodo, modeloNegocioId);
    kpis.push({ codigo: KPI_CODES.VALORIZACION_TOTAL, valor: valorizacion });

    // KPI 4: Comisión Total
    const comisionTotal = await calcularComisionTotal(modeloNegocioId, fechaInicio, fechaFin);
    await almacenarKPI(KPI_CODES.COMISION_TOTAL, comisionTotal, periodo, modeloNegocioId);
    kpis.push({ codigo: KPI_CODES.COMISION_TOTAL, valor: comisionTotal });

    // KPI 5: Comisión Neta
    const comisionNeta = await calcularComisionNeta(modeloNegocioId, fechaInicio, fechaFin);
    await almacenarKPI(KPI_CODES.COMISION_NETA, comisionNeta, periodo, modeloNegocioId);
    kpis.push({ codigo: KPI_CODES.COMISION_NETA, valor: comisionNeta });

    // KPI 6: Índice de Stock
    const indiceStock = await calcularIndiceStock(modeloNegocioId);
    await almacenarKPI(KPI_CODES.INDICE_STOCK, indiceStock, periodo, modeloNegocioId);
    kpis.push({ codigo: KPI_CODES.INDICE_STOCK, valor: indiceStock });

    // KPI 7: Eficiencia de Corredor (solo si hay corredores)
    const eficienciaCorredor = await calcularEficienciaCorredor(undefined, fechaInicio, fechaFin);
    await almacenarKPI(KPI_CODES.EFICIENCIA_CORREDOR, eficienciaCorredor, periodo, modeloNegocioId);
    kpis.push({ codigo: KPI_CODES.EFICIENCIA_CORREDOR, valor: eficienciaCorredor });

    // KPI 8: Tasa de Canje Exitoso
    const tasaCanje = await calcularTasaCanjeExitoso(modeloNegocioId, fechaInicio, fechaFin);
    await almacenarKPI(KPI_CODES.TASA_CANJE_EXITOSO, tasaCanje, periodo, modeloNegocioId);
    kpis.push({ codigo: KPI_CODES.TASA_CANJE_EXITOSO, valor: tasaCanje });

    // KPI 9: ROI por Modelo (solo si se especifica modelo)
    if (modeloNegocioId) {
      const roi = await calcularROIModelo(modeloNegocioId, fechaInicio, fechaFin);
      await almacenarKPI(KPI_CODES.ROI_MODELO, roi, periodo, modeloNegocioId);
      kpis.push({ codigo: KPI_CODES.ROI_MODELO, valor: roi });
    }

    console.log(`✅ KPIs calculados exitosamente: ${kpis.length}`);

    return {
      success: true,
      kpis
    };

  } catch (error) {
    console.error('❌ Error al calcular KPIs:', error);
    return {
      success: false,
      kpis: [],
      error: error.message
    };
  }
}

// =====================================================
// FUNCIONES DE COMPARACIÓN
// =====================================================

/**
 * Comparar KPI con periodo anterior
 */
export async function compararKPI(
  codigoKPI: string,
  periodoActual: Date,
  modeloNegocioId?: number
): Promise<KPIComparison | null> {
  try {
    // Obtener ID del KPI
    const kpi = await prisma.dom_parametros.findFirst({
      where: {
        categoria: { codigo: 'KPI_TIPO' },
        codigo: codigoKPI
      }
    });

    if (!kpi) return null;

    // Calcular periodo anterior (mes anterior)
    const periodoAnterior = new Date(periodoActual);
    periodoAnterior.setMonth(periodoAnterior.getMonth() - 1);

    // Obtener valores
    const [valorActual, valorAnterior] = await Promise.all([
      prisma.kpi_valores.findFirst({
        where: {
          kpi_id: kpi.id,
          periodo: periodoActual,
          entidad_id: modeloNegocioId || null
        }
      }),
      prisma.kpi_valores.findFirst({
        where: {
          kpi_id: kpi.id,
          periodo: periodoAnterior,
          entidad_id: modeloNegocioId || null
        }
      })
    ]);

    const actual = valorActual?.valor || 0;
    const anterior = valorAnterior?.valor || 0;
    const variacion = actual - anterior;
    const porcentajeVariacion = anterior !== 0 
      ? Number(((variacion / anterior) * 100).toFixed(2))
      : 0;

    return {
      actual,
      anterior,
      variacion,
      porcentaje_variacion: porcentajeVariacion
    };

  } catch (error) {
    console.error('Error al comparar KPI:', error);
    return null;
  }
}

/**
 * Obtener histórico de un KPI
 */
export async function obtenerHistoricoKPI(
  codigoKPI: string,
  meses: number = 6,
  modeloNegocioId?: number
): Promise<any[]> {
  try {
    // Obtener ID del KPI
    const kpi = await prisma.dom_parametros.findFirst({
      where: {
        categoria: { codigo: 'KPI_TIPO' },
        codigo: codigoKPI
      }
    });

    if (!kpi) return [];

    // Calcular fecha de inicio
    const fechaInicio = new Date();
    fechaInicio.setMonth(fechaInicio.getMonth() - meses);

    // Obtener valores históricos
    const valores = await prisma.kpi_valores.findMany({
      where: {
        kpi_id: kpi.id,
        periodo: {
          gte: fechaInicio
        },
        entidad_id: modeloNegocioId || null
      },
      orderBy: {
        periodo: 'asc'
      }
    });

    return valores.map(v => ({
      periodo: v.periodo,
      valor: v.valor,
      metadata: v.metadata
    }));

  } catch (error) {
    console.error('Error al obtener histórico KPI:', error);
    return [];
  }
}

// =====================================================
// SCHEDULER - ACTUALIZACIÓN AUTOMÁTICA
// =====================================================

/**
 * Iniciar cálculo automático de KPIs
 * Se ejecuta diariamente a las 02:00 AM
 */
export function iniciarSchedulerKPIs(): void {
  console.log('🚀 Iniciando scheduler de KPIs...');

  // Ejecutar diariamente a las 2 AM
  cron.schedule('0 2 * * *', async () => {
    console.log('⏰ Ejecutando cálculo automático de KPIs...');
    
    try {
      // Calcular KPIs generales
      await calcularTodosLosKPIs();

      // Calcular KPIs por cada modelo de negocio
      const modelos = await prisma.modelos_negocio.findMany({
        where: {
          activo: true
        }
      });

      for (const modelo of modelos) {
        await calcularTodosLosKPIs(modelo.id);
      }

      console.log('✅ Cálculo automático de KPIs completado');

    } catch (error) {
      console.error('❌ Error en cálculo automático de KPIs:', error);
    }
  });

  console.log('✅ Scheduler de KPIs iniciado (se ejecutará diariamente a las 02:00)');
}

// =====================================================
// FUNCIONES DE ALERTA
// =====================================================

/**
 * Verificar umbrales de KPIs y generar alertas
 */
export async function verificarUmbralesKPIs(): Promise<void> {
  try {
    // Obtener umbrales configurados
    const umbrales = await prisma.kpi_umbrales.findMany({
      where: {
        activo: true
      },
      include: {
        kpi: true
      }
    });

    for (const umbral of umbrales) {
      // Obtener último valor del KPI
      const ultimoValor = await prisma.kpi_valores.findFirst({
        where: {
          kpi_id: umbral.kpi_id,
          entidad_id: umbral.entidad_id
        },
        orderBy: {
          periodo: 'desc'
        }
      });

      if (!ultimoValor) continue;

      // Verificar si se superó el umbral
      const superaMinimo = umbral.valor_minimo !== null && ultimoValor.valor < umbral.valor_minimo;
      const superaMaximo = umbral.valor_maximo !== null && ultimoValor.valor > umbral.valor_maximo;

      if (superaMinimo || superaMaximo) {
        // Generar alerta
        const tipoAlertaId = await prisma.dom_parametros.findFirst({
          where: {
            categoria: { codigo: 'TIPO_ALERTA' },
            codigo: 'KPI_FUERA_UMBRAL'
          }
        });

        if (tipoAlertaId) {
          await prisma.alertas.create({
            data: {
              tipo_alerta_id: tipoAlertaId.id,
              prioridad_id: await getPrioridadAlerta('ALTA'),
              entidad_tipo_id: await getEntidadTipoId('KPI'),
              entidad_id: umbral.kpi_id,
              titulo: `KPI fuera de umbral: ${umbral.kpi.valor_texto}`,
              mensaje: `El KPI ${umbral.kpi.valor_texto} tiene un valor de ${ultimoValor.valor}, ${superaMinimo ? 'por debajo' : 'por encima'} del umbral establecido`,
              metadata: {
                kpi_codigo: umbral.kpi.codigo,
                valor_actual: ultimoValor.valor,
                valor_minimo: umbral.valor_minimo,
                valor_maximo: umbral.valor_maximo
              }
            }
          });
        }
      }
    }

  } catch (error) {
    console.error('Error al verificar umbrales de KPIs:', error);
  }
}

// =====================================================
// FUNCIONES AUXILIARES
// =====================================================

async function getPrioridadAlerta(codigo: string): Promise<number> {
  const prioridad = await prisma.dom_parametros.findFirst({
    where: {
      categoria: { codigo: 'PRIORIDAD_ALERTA' },
      codigo
    }
  });
  return prioridad?.id || 0;
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

// Exportar funciones individuales para uso directo
export {
  calcularTasaConversion,
  calcularTiempoPromedioVenta,
  calcularValorizacionTotal,
  calcularComisionTotal,
  calcularComisionNeta,
  calcularIndiceStock,
  calcularEficienciaCorredor,
  calcularTasaCanjeExitoso,
  calcularROIModelo
};
