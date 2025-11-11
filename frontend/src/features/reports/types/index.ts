/**
 * Tipos e interfaces para el módulo de Reportes
 */

// Tipos de reportes disponibles
export const ReportType = {
  PROJECTS: 'projects',
  SALES: 'sales',
  TRADEINS: 'tradeins',
  PUBLICATIONS: 'publications',
  COMMISSIONS: 'commissions',
  CONSOLIDATED: 'consolidated'
} as const;

export type ReportType = typeof ReportType[keyof typeof ReportType];

// Formatos de exportación
export const ReportFormat = {
  PDF: 'pdf',
  EXCEL: 'excel'
} as const;

export type ReportFormat = typeof ReportFormat[keyof typeof ReportFormat];

// Estados de generación de reporte
export const ReportStatus = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed'
} as const;

export type ReportStatus = typeof ReportStatus[keyof typeof ReportStatus];

// Frecuencia de reportes programados
export const ReportFrequency = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly'
} as const;

export type ReportFrequency = typeof ReportFrequency[keyof typeof ReportFrequency];

// Interfaz para configuración de reporte
export interface ReportConfig {
  type: ReportType;
  format: ReportFormat;
  startDate: string;
  endDate: string;
  filters?: ReportFilters;
  groupBy?: string[];
}

// Filtros específicos por tipo de reporte
export interface ReportFilters {
  projectId?: number;
  propertyId?: number;
  gestorId?: number;
  corredorId?: number;
  estado?: string;
  modeloNegocio?: string;
  region?: string;
  comuna?: string;
}

// Interfaz para reporte generado
export interface GeneratedReport {
  id: number;
  type: ReportType;
  format: ReportFormat;
  status: ReportStatus;
  config: ReportConfig;
  fileUrl?: string;
  createdAt: string;
  generatedBy: number;
  error?: string;
}

// Interfaz para reporte programado
export interface ScheduledReport {
  id: number;
  name: string;
  type: ReportType;
  format: ReportFormat;
  frequency: ReportFrequency;
  config: ReportConfig;
  recipients: string[];
  nextRun: string;
  isActive: boolean;
  createdAt: string;
  lastRun?: string;
}

// Datos para preview de reporte
export interface ReportPreviewData {
  title: string;
  subtitle: string;
  period: {
    startDate: string;
    endDate: string;
  };
  data: any;
  summary?: ReportSummary;
}

// Resumen de reporte
export interface ReportSummary {
  totalRecords: number;
  totalValue?: number;
  averageValue?: number;
  percentageChange?: number;
  additionalMetrics?: Record<string, any>;
}

// Metadata de tipo de reporte
export interface ReportTypeMetadata {
  type: ReportType;
  label: string;
  description: string;
  icon: string;
  availableFilters: string[];
  availableGroupBy: string[];
}

// Request para generar reporte
export interface GenerateReportRequest {
  type: ReportType;
  format: ReportFormat;
  startDate: string;
  endDate: string;
  filters?: ReportFilters;
  groupBy?: string[];
}

// Request para programar reporte
export interface ScheduleReportRequest {
  name: string;
  type: ReportType;
  format: ReportFormat;
  frequency: ReportFrequency;
  config: ReportConfig;
  recipients: string[];
}

// Response de historial de reportes
export interface ReportHistoryResponse {
  reports: GeneratedReport[];
  total: number;
  page: number;
  limit: number;
}
