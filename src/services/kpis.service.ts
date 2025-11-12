/**
 * KPIS SERVICE
 * =====================================================
 * Sistema Databrokers - Servicio de Cálculo de KPIs
 * 
 * DESCRIPCIÓN:
 * Servicio centralizado para el cálculo, almacenamiento y análisis de KPIs.
 * Incluye los 9 KPIs principales del sistema y permite cálculos personalizados.
 * 
 * KPIs IMPLEMENTADOS:
 * 1. Tasa de Conversión: (Vendidas / Totales) × 100
 * 2. Tiempo Promedio de Venta: Días desde publicación hasta venta
 * 3. Valorización Total: Suma de precios de propiedades activas
 * 4. Comisión Total Generada: Suma de comisiones de ventas
 * 5. Comisión Neta Agencia: Comisión Total - Split Corredores
 * 6. Índice de Stock: (Stock Actual / Stock Objetivo) × 100
 * 7. Eficiencia de Corredor: (Ventas / Propiedades Asignadas) × 100
 * 8. Tasa de Canje Exitoso: (Canjes Finalizados / Iniciados) × 100
 * 9. ROI por Modelo: ((Ingresos - Costos) / Costos) × 100
 * 
 * CARACTERÍSTICAS:
 * - Cálculo automático periódico (job scheduler)
 * - Almacenamiento histórico en kpi_valores
 * - Comparación período a período
 * - Generación de alertas por umbrales
 * - Análisis de tendencias
 * - Consolidación por diferentes entidades
 * 
 * AUTOR: Sistema Databrokers
 * FECHA: Noviembre 2025
 * VERSIÓN: 1.0
 */

import { PrismaClient, Prisma } from '@prisma/client';
import cron from 'node-cron';

const prisma = new PrismaClient();

// =====================================================
// TIPOS Y CONSTANTES
// =====================================================

/**
 * Tipos de entidades para KPIs
 */
enum EntityType {
  BUSINESS_MODEL = 1,  // Modelo de Negocio
  MANAGER = 2,         // Gestor
  BROKER = 3,          // Corredor
  PROJECT = 4,         // Proyecto
  PROPERTY = 5         // Propiedad
}

/**
 * Tipos de período
 */
enum PeriodType {
  DAILY = 1,
  WEEKLY = 2,
  MONTHLY = 3,
  QUARTERLY = 4,
  YEARLY = 5
}

/**
 * Códigos de KPIs principales
 */
enum KPICode {
  CONVERSION_RATE = 'TASA_CONVERSION',
  AVG_SALE_TIME = 'TIEMPO_PROMEDIO_VENTA',
  TOTAL_VALUATION = 'VALORIZACION_TOTAL',
  TOTAL_COMMISSION = 'COMISION_TOTAL_GENERADA',
  NET_COMMISSION = 'COMISION_NETA_AGENCIA',
  STOCK_INDEX = 'INDICE_STOCK',
  BROKER_EFFICIENCY = 'EFICIENCIA_CORREDOR',
  TRADEIN_SUCCESS_RATE = 'TASA_CANJE_EXITOSO',
  ROI = 'ROI_MODELO'
}

/**
 * Resultado de cálculo de KPI
 */
interface KPIResult {
  code: string;
  value: number;
  previousValue?: number;
  percentageChange?: number;
  trend?: 'up' | 'down' | 'stable';
  isWithinThreshold: boolean;
  metadata?: any;
}

/**
 * Configuración de KPI
 */
interface KPIConfig {
  id: number;
  code: string;
  name: string;
  minThreshold?: number;
  maxThreshold?: number;
}

/**
 * Parámetros de período
 */
interface PeriodParams {
  startDate: Date;
  endDate: Date;
  periodType: PeriodType;
}

/**
 * Parámetros de entidad
 */
interface EntityParams {
  entityType: EntityType;
  entityId: number;
}

// =====================================================
// CLASE PRINCIPAL
// =====================================================

export class KPIsService {
  
  private static instance: KPIsService;
  private kpiConfigs: Map<string, KPIConfig> = new Map();
  private isInitialized: boolean = false;

  /**
   * Singleton pattern
   */
  public static getInstance(): KPIsService {
    if (!KPIsService.instance) {
      KPIsService.instance = new KPIsService();
    }
    return KPIsService.instance;
  }

  /**
   * Inicializar servicio y cargar configuraciones
   */
  async initialize() {
    if (this.isInitialized) return;

    try {
      // Cargar configuraciones de KPIs desde la base de datos
      const kpis = await prisma.kpis.findMany({
        where: { activo: true }
      });

      kpis.forEach(kpi => {
        this.kpiConfigs.set(kpi.codigo, {
          id: kpi.id,
          code: kpi.codigo,
          name: kpi.nombre,
          minThreshold: kpi.umbral_min ? parseFloat(kpi.umbral_min.toString()) : undefined,
          maxThreshold: kpi.umbral_max ? parseFloat(kpi.umbral_max.toString()) : undefined
        });
      });

      this.isInitialized = true;
      console.log('✅ KPIsService initialized with', kpis.length, 'KPIs');
    } catch (error) {
      console.error('❌ Error initializing KPIsService:', error);
      throw error;
    }
  }

  /**
   * Iniciar scheduler para cálculos automáticos
   * Ejecuta cada día a las 2 AM
   */
  startScheduler() {
    cron.schedule('0 2 * * *', async () => {
      console.log('🔄 Running scheduled KPI calculations...');
      try {
        await this.calculateAllKPIsForAllEntities();
        console.log('✅ Scheduled KPI calculations completed');
      } catch (error) {
        console.error('❌ Error in scheduled KPI calculations:', error);
      }
    });

    console.log('📅 KPI calculation scheduler started (daily at 2 AM)');
  }

  // =====================================================
  // CÁLCULO DE KPIs INDIVIDUALES
  // =====================================================

  /**
   * 1. TASA DE CONVERSIÓN
   * Fórmula: (Propiedades Vendidas / Propiedades Totales) × 100
   */
  async calculateConversionRate(
    entity: EntityParams,
    period: PeriodParams
  ): Promise<KPIResult> {
    const where: any = {
      fecha_creacion: {
        gte: period.startDate,
        lte: period.endDate
      }
    };

    // Filtrar por entidad
    if (entity.entityType === EntityType.BUSINESS_MODEL) {
      where.modelo_negocio_id = entity.entityId;
    }

    // Total de propiedades en el período
    const totalProperties = await prisma.propiedades.count({ where });

    // Propiedades vendidas (estado = 3, según dominio)
    const soldProperties = await prisma.propiedades.count({
      where: {
        ...where,
        estado: 3 // Vendida
      }
    });

    const value = totalProperties > 0 
      ? (soldProperties / totalProperties) * 100 
      : 0;

    return await this.formatKPIResult(
      KPICode.CONVERSION_RATE,
      value,
      entity,
      period,
      {
        total_properties: totalProperties,
        sold_properties: soldProperties
      }
    );
  }

  /**
   * 2. TIEMPO PROMEDIO DE VENTA
   * Fórmula: Promedio de días desde publicación hasta venta
   */
  async calculateAverageSaleTime(
    entity: EntityParams,
    period: PeriodParams
  ): Promise<KPIResult> {
    const where: any = {
      estado: 3, // Vendida
      fecha_venta: {
        gte: period.startDate,
        lte: period.endDate
      }
    };

    if (entity.entityType === EntityType.BUSINESS_MODEL) {
      where.modelo_negocio_id = entity.entityId;
    }

    const soldProperties = await prisma.propiedades.findMany({
      where,
      select: {
        fecha_creacion: true,
        fecha_venta: true
      }
    });

    if (soldProperties.length === 0) {
      return await this.formatKPIResult(
        KPICode.AVG_SALE_TIME,
        0,
        entity,
        period,
        { count: 0 }
      );
    }

    // Calcular días promedio
    const totalDays = soldProperties.reduce((sum, prop) => {
      if (prop.fecha_venta && prop.fecha_creacion) {
        const days = Math.floor(
          (prop.fecha_venta.getTime() - prop.fecha_creacion.getTime()) / (1000 * 60 * 60 * 24)
        );
        return sum + days;
      }
      return sum;
    }, 0);

    const avgDays = totalDays / soldProperties.length;

    return await this.formatKPIResult(
      KPICode.AVG_SALE_TIME,
      Math.round(avgDays),
      entity,
      period,
      {
        count: soldProperties.length,
        total_days: totalDays
      }
    );
  }

  /**
   * 3. VALORIZACIÓN TOTAL
   * Fórmula: Suma del precio de todas las propiedades activas
   */
  async calculateTotalValuation(
    entity: EntityParams,
    period: PeriodParams
  ): Promise<KPIResult> {
    const where: any = {
      estado: { in: [1, 2] }, // Disponible o Reservada
      fecha_creacion: {
        lte: period.endDate
      }
    };

    if (entity.entityType === EntityType.BUSINESS_MODEL) {
      where.modelo_negocio_id = entity.entityId;
    }

    const result = await prisma.propiedades.aggregate({
      where,
      _sum: {
        precio_venta: true
      },
      _count: true
    });

    const value = result._sum.precio_venta 
      ? parseFloat(result._sum.precio_venta.toString()) 
      : 0;

    return await this.formatKPIResult(
      KPICode.TOTAL_VALUATION,
      value,
      entity,
      period,
      {
        count: result._count,
        currency: 'CLP'
      }
    );
  }

  /**
   * 4. COMISIÓN TOTAL GENERADA
   * Fórmula: Suma de todas las comisiones de propiedades vendidas en el período
   */
  async calculateTotalCommission(
    entity: EntityParams,
    period: PeriodParams
  ): Promise<KPIResult> {
    const where: any = {
      estado: 3, // Vendida
      fecha_venta: {
        gte: period.startDate,
        lte: period.endDate
      }
    };

    if (entity.entityType === EntityType.BUSINESS_MODEL) {
      where.modelo_negocio_id = entity.entityId;
    }

    const soldProperties = await prisma.propiedades.findMany({
      where,
      select: {
        precio_venta: true,
        porcentaje_comision: true
      }
    });

    // Calcular comisión total
    const totalCommission = soldProperties.reduce((sum, prop) => {
      if (prop.precio_venta && prop.porcentaje_comision) {
        const commission = parseFloat(prop.precio_venta.toString()) * 
                          (parseFloat(prop.porcentaje_comision.toString()) / 100);
        return sum + commission;
      }
      return sum;
    }, 0);

    return await this.formatKPIResult(
      KPICode.TOTAL_COMMISSION,
      totalCommission,
      entity,
      period,
      {
        properties_count: soldProperties.length,
        currency: 'CLP'
      }
    );
  }

  /**
   * 5. COMISIÓN NETA AGENCIA
   * Fórmula: Comisión Total - Comisiones pagadas a corredores externos
   */
  async calculateNetCommission(
    entity: EntityParams,
    period: PeriodParams
  ): Promise<KPIResult> {
    // Primero obtener comisión total
    const totalCommissionResult = await this.calculateTotalCommission(entity, period);
    const totalCommission = totalCommissionResult.value;

    // Obtener comisiones pagadas a corredores externos
    const where: any = {
      propiedades: {
        estado: 3,
        fecha_venta: {
          gte: period.startDate,
          lte: period.endDate
        }
      }
    };

    if (entity.entityType === EntityType.BUSINESS_MODEL) {
      where.propiedades = {
        ...where.propiedades,
        modelo_negocio_id: entity.entityId
      };
    }

    const publications = await prisma.publicaciones.findMany({
      where,
      select: {
        comision_corredor_monto: true,
        propiedades: {
          select: {
            precio_venta: true
          }
        }
      }
    });

    const brokerCommissions = publications.reduce((sum, pub) => {
      if (pub.comision_corredor_monto) {
        return sum + parseFloat(pub.comision_corredor_monto.toString());
      }
      return sum;
    }, 0);

    const netCommission = totalCommission - brokerCommissions;

    return await this.formatKPIResult(
      KPICode.NET_COMMISSION,
      netCommission,
      entity,
      period,
      {
        total_commission: totalCommission,
        broker_commissions: brokerCommissions,
        currency: 'CLP'
      }
    );
  }

  /**
   * 6. ÍNDICE DE STOCK
   * Fórmula: (Stock Actual / Stock Objetivo) × 100
   */
  async calculateStockIndex(
    entity: EntityParams,
    period: PeriodParams
  ): Promise<KPIResult> {
    const where: any = {
      estado: { in: [1, 2] } // Disponible o Reservada
    };

    if (entity.entityType === EntityType.BUSINESS_MODEL) {
      where.modelo_negocio_id = entity.entityId;
    }

    const currentStock = await prisma.propiedades.count({ where });

    // Obtener stock objetivo del modelo de negocio
    let targetStock = 100; // Valor por defecto

    if (entity.entityType === EntityType.BUSINESS_MODEL) {
      const model = await prisma.modelos_negocio.findUnique({
        where: { id: entity.entityId }
      });
      
      // Intentar extraer stock objetivo del metadata
      if (model?.metadata && typeof model.metadata === 'object') {
        const metadata = model.metadata as any;
        targetStock = metadata.stock_objetivo || targetStock;
      }
    }

    const value = targetStock > 0 
      ? (currentStock / targetStock) * 100 
      : 0;

    return await this.formatKPIResult(
      KPICode.STOCK_INDEX,
      value,
      entity,
      period,
      {
        current_stock: currentStock,
        target_stock: targetStock
      }
    );
  }

  /**
   * 7. EFICIENCIA DE CORREDOR
   * Fórmula: (Ventas del Corredor / Propiedades Asignadas) × 100
   */
  async calculateBrokerEfficiency(
    entity: EntityParams,
    period: PeriodParams
  ): Promise<KPIResult> {
    if (entity.entityType !== EntityType.BROKER) {
      return await this.formatKPIResult(
        KPICode.BROKER_EFFICIENCY,
        0,
        entity,
        period,
        { error: 'Only applicable to broker entities' }
      );
    }

    // Propiedades asignadas al corredor
    const assignedProperties = await prisma.publicaciones.count({
      where: {
        corredor_id: entity.entityId,
        fecha_publicacion: {
          gte: period.startDate,
          lte: period.endDate
        }
      }
    });

    // Ventas realizadas por el corredor
    const salesByBroker = await prisma.publicaciones.count({
      where: {
        corredor_id: entity.entityId,
        propiedades: {
          estado: 3, // Vendida
          fecha_venta: {
            gte: period.startDate,
            lte: period.endDate
          }
        }
      }
    });

    const value = assignedProperties > 0 
      ? (salesByBroker / assignedProperties) * 100 
      : 0;

    return await this.formatKPIResult(
      KPICode.BROKER_EFFICIENCY,
      value,
      entity,
      period,
      {
        assigned_properties: assignedProperties,
        sales: salesByBroker
      }
    );
  }

  /**
   * 8. TASA DE CANJE EXITOSO
   * Fórmula: (Canjes Finalizados / Canjes Iniciados) × 100
   */
  async calculateTradeInSuccessRate(
    entity: EntityParams,
    period: PeriodParams
  ): Promise<KPIResult> {
    const where: any = {
      fecha_inicio: {
        gte: period.startDate,
        lte: period.endDate
      }
    };

    if (entity.entityType === EntityType.BUSINESS_MODEL) {
      where.propiedades_canjes_propiedad_entregada_idTopropiedades = {
        modelo_negocio_id: entity.entityId
      };
    }

    // Total de canjes iniciados
    const totalTradeIns = await prisma.canjes.count({ where });

    // Canjes finalizados exitosamente (estado = 4 según dominio)
    const successfulTradeIns = await prisma.canjes.count({
      where: {
        ...where,
        estado: 4 // Finalizado
      }
    });

    const value = totalTradeIns > 0 
      ? (successfulTradeIns / totalTradeIns) * 100 
      : 0;

    return await this.formatKPIResult(
      KPICode.TRADEIN_SUCCESS_RATE,
      value,
      entity,
      period,
      {
        total_tradeins: totalTradeIns,
        successful: successfulTradeIns
      }
    );
  }

  /**
   * 9. ROI POR MODELO
   * Fórmula: ((Ingresos - Costos) / Costos) × 100
   */
  async calculateROI(
    entity: EntityParams,
    period: PeriodParams
  ): Promise<KPIResult> {
    if (entity.entityType !== EntityType.BUSINESS_MODEL) {
      return await this.formatKPIResult(
        KPICode.ROI,
        0,
        entity,
        period,
        { error: 'Only applicable to business model entities' }
      );
    }

    // Ingresos: Comisión neta del período
    const netCommissionResult = await this.calculateNetCommission(entity, period);
    const revenue = netCommissionResult.value;

    // Costos: Extraer del metadata del modelo o usar estimación
    const model = await prisma.modelos_negocio.findUnique({
      where: { id: entity.entityId }
    });

    let costs = 0;
    if (model?.metadata && typeof model.metadata === 'object') {
      const metadata = model.metadata as any;
      costs = metadata.costos_operacionales || 0;
    }

    // Si no hay costos registrados, usar 30% de los ingresos como estimación
    if (costs === 0) {
      costs = revenue * 0.3;
    }

    const value = costs > 0 
      ? ((revenue - costs) / costs) * 100 
      : 0;

    return await this.formatKPIResult(
      KPICode.ROI,
      value,
      entity,
      period,
      {
        revenue,
        costs,
        profit: revenue - costs,
        currency: 'CLP'
      }
    );
  }

  // =====================================================
  // FUNCIONES DE CÁLCULO MASIVO
  // =====================================================

  /**
   * Calcular todos los KPIs para una entidad en un período
   */
  async calculateAllKPIs(
    entity: EntityParams,
    period: PeriodParams
  ): Promise<KPIResult[]> {
    const results: KPIResult[] = [];

    try {
      // KPIs aplicables a todos
      results.push(await this.calculateConversionRate(entity, period));
      results.push(await this.calculateAverageSaleTime(entity, period));
      results.push(await this.calculateTotalValuation(entity, period));
      results.push(await this.calculateTotalCommission(entity, period));
      results.push(await this.calculateNetCommission(entity, period));
      results.push(await this.calculateStockIndex(entity, period));
      results.push(await this.calculateTradeInSuccessRate(entity, period));

      // KPIs específicos
      if (entity.entityType === EntityType.BROKER) {
        results.push(await this.calculateBrokerEfficiency(entity, period));
      }

      if (entity.entityType === EntityType.BUSINESS_MODEL) {
        results.push(await this.calculateROI(entity, period));
      }

    } catch (error) {
      console.error('Error calculating KPIs:', error);
      throw error;
    }

    return results;
  }

  /**
   * Calcular KPIs para todos los modelos de negocio
   */
  async calculateAllKPIsForAllEntities(): Promise<void> {
    try {
      // Obtener período actual (mes actual)
      const now = new Date();
      const period: PeriodParams = {
        startDate: new Date(now.getFullYear(), now.getMonth(), 1),
        endDate: new Date(now.getFullYear(), now.getMonth() + 1, 0),
        periodType: PeriodType.MONTHLY
      };

      // Calcular para todos los modelos de negocio
      const models = await prisma.modelos_negocio.findMany({
        where: { activo: true }
      });

      for (const model of models) {
        const entity: EntityParams = {
          entityType: EntityType.BUSINESS_MODEL,
          entityId: model.id
        };

        await this.calculateAllKPIs(entity, period);
      }

      // Calcular para todos los corredores
      const brokers = await prisma.usuarios.findMany({
        where: { rol_id: 3, activo: true } // Rol corredor
      });

      for (const broker of brokers) {
        const entity: EntityParams = {
          entityType: EntityType.BROKER,
          entityId: broker.id
        };

        await this.calculateAllKPIs(entity, period);
      }

      console.log('✅ KPIs calculated for all entities');
    } catch (error) {
      console.error('❌ Error in calculateAllKPIsForAllEntities:', error);
      throw error;
    }
  }

  // =====================================================
  // FUNCIONES AUXILIARES
  // =====================================================

  /**
   * Formatear resultado de KPI y almacenar en base de datos
   */
  private async formatKPIResult(
    kpiCode: string,
    value: number,
    entity: EntityParams,
    period: PeriodParams,
    metadata?: any
  ): Promise<KPIResult> {
    const config = this.kpiConfigs.get(kpiCode);
    
    if (!config) {
      throw new Error(`KPI configuration not found for code: ${kpiCode}`);
    }

    // Obtener valor del período anterior para comparación
    const previousPeriod = this.getPreviousPeriod(period);
    const previousValue = await this.getKPIValue(
      config.id,
      entity,
      previousPeriod
    );

    // Calcular cambio porcentual
    let percentageChange: number | undefined;
    let trend: 'up' | 'down' | 'stable' = 'stable';

    if (previousValue !== null && previousValue !== 0) {
      percentageChange = ((value - previousValue) / previousValue) * 100;
      if (Math.abs(percentageChange) < 1) {
        trend = 'stable';
      } else if (percentageChange > 0) {
        trend = 'up';
      } else {
        trend = 'down';
      }
    }

    // Verificar si está dentro de umbrales
    const isWithinThreshold = this.checkThreshold(value, config);

    // Almacenar en base de datos
    await this.saveKPIValue({
      kpi_id: config.id,
      entidad_tipo_id: entity.entityType,
      entidad_id: entity.entityId,
      periodo_tipo_id: period.periodType,
      fecha_inicio: period.startDate,
      fecha_fin: period.endDate,
      valor: value,
      comparacion_periodo_anterior: previousValue,
      porcentaje_cambio: percentageChange || null,
      metadata: metadata ? JSON.stringify(metadata) : null
    });

    // Generar alerta si está fuera de umbrales
    if (!isWithinThreshold) {
      await this.generateKPIAlert(config, value, entity, period);
    }

    return {
      code: kpiCode,
      value,
      previousValue: previousValue || undefined,
      percentageChange,
      trend,
      isWithinThreshold,
      metadata
    };
  }

  /**
   * Verificar si el valor está dentro de los umbrales
   */
  private checkThreshold(value: number, config: KPIConfig): boolean {
    if (config.minThreshold !== undefined && value < config.minThreshold) {
      return false;
    }
    if (config.maxThreshold !== undefined && value > config.maxThreshold) {
      return false;
    }
    return true;
  }

  /**
   * Obtener período anterior
   */
  private getPreviousPeriod(period: PeriodParams): PeriodParams {
    const duration = period.endDate.getTime() - period.startDate.getTime();
    
    return {
      startDate: new Date(period.startDate.getTime() - duration),
      endDate: new Date(period.endDate.getTime() - duration),
      periodType: period.periodType
    };
  }

  /**
   * Obtener valor de KPI del período anterior
   */
  private async getKPIValue(
    kpiId: number,
    entity: EntityParams,
    period: PeriodParams
  ): Promise<number | null> {
    const value = await prisma.kpi_valores.findFirst({
      where: {
        kpi_id: kpiId,
        entidad_tipo_id: entity.entityType,
        entidad_id: entity.entityId,
        fecha_inicio: period.startDate,
        fecha_fin: period.endDate
      },
      orderBy: {
        fecha_calculo: 'desc'
      }
    });

    return value ? parseFloat(value.valor.toString()) : null;
  }

  /**
   * Guardar valor de KPI en base de datos
   */
  private async saveKPIValue(data: any): Promise<void> {
    try {
      await prisma.kpi_valores.create({
        data: {
          ...data,
          valor: new Prisma.Decimal(data.valor),
          comparacion_periodo_anterior: data.comparacion_periodo_anterior 
            ? new Prisma.Decimal(data.comparacion_periodo_anterior)
            : null,
          porcentaje_cambio: data.porcentaje_cambio
            ? new Prisma.Decimal(data.porcentaje_cambio)
            : null
        }
      });
    } catch (error) {
      console.error('Error saving KPI value:', error);
      // No lanzar error para no interrumpir el cálculo de otros KPIs
    }
  }

  /**
   * Generar alerta cuando KPI está fuera de umbrales
   */
  private async generateKPIAlert(
    config: KPIConfig,
    value: number,
    entity: EntityParams,
    period: PeriodParams
  ): Promise<void> {
    try {
      let level = 1; // Temprana por defecto
      let message = `KPI ${config.name} fuera de umbral: ${value.toFixed(2)}`;

      // Determinar nivel de alerta
      if (config.minThreshold && value < config.minThreshold * 0.5) {
        level = 3; // Vencida
        message += ` (muy por debajo del mínimo: ${config.minThreshold})`;
      } else if (config.minThreshold && value < config.minThreshold * 0.8) {
        level = 2; // En tiempo
        message += ` (por debajo del mínimo: ${config.minThreshold})`;
      }

      await prisma.alertas.create({
        data: {
          tipo_alerta_id: 3, // KPI según dominio
          categoria_alerta_id: level,
          nivel_prioridad_id: level,
          modulo_id: 7, // Módulo de seguimiento de desempeño
          entidad_tipo_id: entity.entityType,
          entidad_id: entity.entityId,
          titulo: `Alerta KPI: ${config.name}`,
          mensaje: message,
          estado_alerta_id: 1, // Activa
          metadata: JSON.stringify({
            kpi_code: config.code,
            value,
            min_threshold: config.minThreshold,
            max_threshold: config.maxThreshold,
            period_start: period.startDate,
            period_end: period.endDate
          })
        }
      });

      console.log(`⚠️ Alert generated for KPI ${config.code}: ${message}`);
    } catch (error) {
      console.error('Error generating KPI alert:', error);
    }
  }

  // =====================================================
  // FUNCIONES DE CONSULTA
  // =====================================================

  /**
   * Obtener KPIs consolidados para una entidad
   */
  async getConsolidatedKPIs(
    entity: EntityParams,
    period: PeriodParams
  ): Promise<any> {
    const kpiValues = await prisma.kpi_valores.findMany({
      where: {
        entidad_tipo_id: entity.entityType,
        entidad_id: entity.entityId,
        fecha_inicio: period.startDate,
        fecha_fin: period.endDate
      },
      include: {
        kpis: true
      },
      orderBy: {
        fecha_calculo: 'desc'
      }
    });

    return kpiValues.map(kv => ({
      code: kv.kpis.codigo,
      name: kv.kpis.nombre,
      value: parseFloat(kv.valor.toString()),
      previousValue: kv.comparacion_periodo_anterior 
        ? parseFloat(kv.comparacion_periodo_anterior.toString()) 
        : null,
      percentageChange: kv.porcentaje_cambio 
        ? parseFloat(kv.porcentaje_cambio.toString()) 
        : null,
      calculatedAt: kv.fecha_calculo
    }));
  }

  /**
   * Obtener histórico de un KPI específico
   */
  async getKPIHistory(
    kpiCode: string,
    entity: EntityParams,
    limit: number = 12
  ): Promise<any[]> {
    const config = this.kpiConfigs.get(kpiCode);
    
    if (!config) {
      throw new Error(`KPI not found: ${kpiCode}`);
    }

    const history = await prisma.kpi_valores.findMany({
      where: {
        kpi_id: config.id,
        entidad_tipo_id: entity.entityType,
        entidad_id: entity.entityId
      },
      orderBy: {
        fecha_fin: 'desc'
      },
      take: limit
    });

    return history.map(h => ({
      period_start: h.fecha_inicio,
      period_end: h.fecha_fin,
      value: parseFloat(h.valor.toString()),
      calculated_at: h.fecha_calculo
    })).reverse();
  }

  /**
   * Obtener tendencia de un KPI
   */
  async getKPITrend(
    kpiCode: string,
    entity: EntityParams,
    periods: number = 6
  ): Promise<any> {
    const history = await this.getKPIHistory(kpiCode, entity, periods);

    if (history.length < 2) {
      return {
        trend: 'insufficient_data',
        direction: 'stable',
        average: 0
      };
    }

    const values = history.map(h => h.value);
    const average = values.reduce((a, b) => a + b, 0) / values.length;

    // Calcular tendencia simple (primer valor vs último valor)
    const firstValue = values[0];
    const lastValue = values[values.length - 1];
    const change = lastValue - firstValue;
    const percentageChange = firstValue !== 0 ? (change / firstValue) * 100 : 0;

    let direction: 'up' | 'down' | 'stable' = 'stable';
    if (Math.abs(percentageChange) > 5) {
      direction = percentageChange > 0 ? 'up' : 'down';
    }

    return {
      trend: 'calculated',
      direction,
      average,
      first_value: firstValue,
      last_value: lastValue,
      change,
      percentage_change: percentageChange,
      data_points: history.length
    };
  }
}

// =====================================================
// EXPORTAR INSTANCIA SINGLETON
// =====================================================

export default KPIsService.getInstance();
