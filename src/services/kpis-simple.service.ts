/**
 * Servicio Simplificado de KPIs
 * Usa la estructura REAL de la base de datos databrokers
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface KPIResult {
  codigo: string;
  nombre: string;
  valor: number;
  unidad: string;
  metadata?: any;
}

/**
 * Calcular todos los KPIs básicos usando la estructura real de la BD
 */
export async function calcularTodosLosKPIs(modeloNegocioId?: number) {
  try {
    const kpis: KPIResult[] = [];

    // Obtener primer modelo si no se especifica
    if (!modeloNegocioId) {
      const primerModelo = await prisma.modelos_negocio.findFirst({
        where: { activo: true }
      });
      modeloNegocioId = primerModelo?.id;
    }

    if (!modeloNegocioId) {
      return {
        success: false,
        error: 'No hay modelos de negocio activos',
        kpis: []
      };
    }

    // Período actual (mes actual)
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Filtro base para propiedades
    const whereBase = {
      modelo_negocio_id: modeloNegocioId,
      created_at: {
        gte: startOfMonth,
        lte: endOfMonth
      }
    };

    // 1. TASA DE CONVERSIÓN
    const totalPropiedades = await prisma.propiedades.count({
      where: {
        modelo_negocio_id: modeloNegocioId,
        created_at: {
          gte: startOfMonth
        }
      }
    });

    const propiedadesVendidas = await prisma.propiedades.count({
      where: {
        modelo_negocio_id: modeloNegocioId,
        estado_propiedad_id: 6, // VENDIDA
        fecha_venta: {
          gte: startOfMonth,
          lte: endOfMonth
        }
      }
    });

    const tasaConversion = totalPropiedades > 0
      ? (propiedadesVendidas / totalPropiedades) * 100
      : 0;

    kpis.push({
      codigo: 'TASA_CONVERSION',
      nombre: 'Tasa de Conversión',
      valor: Math.round(tasaConversion * 100) / 100,
      unidad: '%',
      metadata: {
        total: totalPropiedades,
        vendidas: propiedadesVendidas
      }
    });

    // 2. TIEMPO PROMEDIO DE VENTA
    const propiedadesVendidasDetalle = await prisma.propiedades.findMany({
      where: {
        modelo_negocio_id: modeloNegocioId,
        estado_propiedad_id: 6,
        fecha_venta: {
          gte: startOfMonth,
          lte: endOfMonth,
          not: null
        }
      },
      select: {
        created_at: true,
        fecha_venta: true
      }
    });

    let tiempoPromedioVenta = 0;
    if (propiedadesVendidasDetalle.length > 0) {
      const totalDias = propiedadesVendidasDetalle.reduce((sum, prop) => {
        if (prop.created_at && prop.fecha_venta) {
          const dias = Math.floor(
            (prop.fecha_venta.getTime() - prop.created_at.getTime()) / (1000 * 60 * 60 * 24)
          );
          return sum + dias;
        }
        return sum;
      }, 0);
      tiempoPromedioVenta = Math.round(totalDias / propiedadesVendidasDetalle.length);
    }

    kpis.push({
      codigo: 'TIEMPO_PROMEDIO_VENTA',
      nombre: 'Tiempo Promedio de Venta',
      valor: tiempoPromedioVenta,
      unidad: 'días',
      metadata: {
        propiedades_analizadas: propiedadesVendidasDetalle.length
      }
    });

    // 3. VALORIZACIÓN TOTAL (propiedades disponibles y reservadas)
    const valorizacion = await prisma.propiedades.aggregate({
      where: {
        modelo_negocio_id: modeloNegocioId,
        estado_propiedad_id: { in: [4, 5] }, // DISPONIBLE o RESERVADA
        activo: true
      },
      _sum: {
        precio: true
      },
      _count: true
    });

    kpis.push({
      codigo: 'VALORIZACION_TOTAL',
      nombre: 'Valorización Total',
      valor: valorizacion._sum.precio ? Number(valorizacion._sum.precio) : 0,
      unidad: 'CLP',
      metadata: {
        propiedades: valorizacion._count
      }
    });

    // 4. COMISIÓN TOTAL GENERADA
    const comisionTotal = await prisma.propiedades.aggregate({
      where: {
        modelo_negocio_id: modeloNegocioId,
        estado_propiedad_id: 6, // VENDIDA
        fecha_venta: {
          gte: startOfMonth,
          lte: endOfMonth
        }
      },
      _sum: {
        comision_monto: true
      }
    });

    kpis.push({
      codigo: 'COMISION_TOTAL_GENERADA',
      nombre: 'Comisión Total Generada',
      valor: comisionTotal._sum.comision_monto ? Number(comisionTotal._sum.comision_monto) : 0,
      unidad: 'CLP',
      metadata: {
        propiedades_vendidas: propiedadesVendidas
      }
    });

    // 5. ÍNDICE DE STOCK
    const stockActual = await prisma.propiedades.count({
      where: {
        modelo_negocio_id: modeloNegocioId,
        estado_propiedad_id: { in: [4, 5] }, // DISPONIBLE o RESERVADA
        activo: true
      }
    });

    // Stock objetivo por defecto: 50
    const stockObjetivo = 50;
    const indiceStock = stockObjetivo > 0 ? (stockActual / stockObjetivo) * 100 : 0;

    kpis.push({
      codigo: 'INDICE_STOCK',
      nombre: 'Índice de Stock',
      valor: Math.round(indiceStock * 100) / 100,
      unidad: '%',
      metadata: {
        stock_actual: stockActual,
        stock_objetivo: stockObjetivo
      }
    });

    // 6. TOTAL PROPIEDADES POR ESTADO
    const propiedadesPorEstado = await prisma.propiedades.groupBy({
      by: ['estado_propiedad_id'],
      where: {
        modelo_negocio_id: modeloNegocioId,
        activo: true
      },
      _count: true
    });

    kpis.push({
      codigo: 'PROPIEDADES_POR_ESTADO',
      nombre: 'Propiedades por Estado',
      valor: totalPropiedades,
      unidad: 'unidades',
      metadata: {
        por_estado: propiedadesPorEstado
      }
    });

    return {
      success: true,
      kpis,
      periodo: {
        inicio: startOfMonth,
        fin: endOfMonth
      },
      modelo_negocio_id: modeloNegocioId
    };

  } catch (error) {
    console.error('Error en calcularTodosLosKPIs:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
      kpis: []
    };
  }
}

/**
 * Comparar KPI con período anterior (simplificado)
 */
export async function compararKPI(
  codigoKPI: string,
  fecha: Date,
  modeloNegocioId?: number
) {
  // Por ahora retornar null, implementar si es necesario
  return null;
}

/**
 * Obtener histórico de KPI (simplificado)
 */
export async function obtenerHistoricoKPI(
  codigoKPI: string,
  modeloNegocioId?: number,
  limite: number = 12
) {
  // Por ahora retornar array vacío, implementar si es necesario
  return [];
}
