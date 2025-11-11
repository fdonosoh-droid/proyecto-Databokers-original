/**
 * DATABROKERS - TIPOS Y INTERFACES GLOBALES
 * Definiciones de TypeScript compartidas
 *
 * @version 1.0
 * @author Sistema Databrokers
 */

import { Request } from 'express';

/**
 * Request extendido con información de usuario autenticado
 */
export interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    rol: string;
    nombre: string;
  };
}

/**
 * Respuesta estándar de la API
 */
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

/**
 * Opciones de paginación
 */
export interface PaginationOptions {
  page: number;
  limit: number;
  orderBy?: string;
  order?: 'asc' | 'desc';
}

/**
 * Opciones de filtro genérico
 */
export interface FilterOptions {
  search?: string;
  startDate?: Date;
  endDate?: Date;
  status?: string;
  [key: string]: any;
}

/**
 * Resultado de operación CRUD
 */
export interface OperationResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * KPI Data
 */
export interface KPIData {
  codigo: string;
  nombre: string;
  valor: number;
  unidad: string;
  variacion?: number;
  fecha_calculo: Date;
}

/**
 * Alerta Data
 */
export interface AlertData {
  id: number;
  tipo: string;
  prioridad: string;
  mensaje: string;
  fecha_creacion: Date;
  leida: boolean;
}
