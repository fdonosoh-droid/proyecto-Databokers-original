// ========================================
// TIPOS DE USUARIO Y AUTENTICACIÓN
// ========================================

export type UserRole = 'ADMIN' | 'GESTOR' | 'CORREDOR';

export interface User {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  role: UserRole;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
}

// ========================================
// TIPOS DE PROYECTO
// ========================================

export type ProjectStatus =
  | 'PLANIFICACION'
  | 'EN_CONSTRUCCION'
  | 'EN_VERDE'
  | 'ENTREGADO'
  | 'FINALIZADO';

export type BusinessModel = 'CORREDOR' | 'CANJE' | 'MIXTO';

export interface Project {
  id: string;
  nombre: string;
  inmobiliaria: string;
  direccion: string;
  comuna: string;
  region: string;
  estado: ProjectStatus;
  modeloNegocio: BusinessModel;
  fechaInicioVentas: string;
  fechaEntrega: string;
  totalUnidades: number;
  unidadesDisponibles: number;
  createdAt: string;
  updatedAt: string;
}

// ========================================
// TIPOS DE PROPIEDAD
// ========================================

export type PropertyType =
  | 'DEPARTAMENTO'
  | 'CASA'
  | 'OFICINA'
  | 'LOCAL_COMERCIAL'
  | 'TERRENO'
  | 'BODEGA'
  | 'ESTACIONAMIENTO';

export type PropertyStatus =
  | 'DISPONIBLE'
  | 'RESERVADA'
  | 'VENDIDA'
  | 'EN_CANJE'
  | 'BLOQUEADA';

export interface Property {
  id: string;
  tipo: PropertyType;
  direccion: string;
  comuna: string;
  region: string;
  estado: PropertyStatus;
  superficieTotal: number;
  superficieUtil: number;
  dormitorios: number;
  banos: number;
  estacionamientos: number;
  bodegas: number;
  precio: number;
  valorUF: number;
  createdAt: string;
  updatedAt: string;
}

// ========================================
// TIPOS DE CANJE
// ========================================

export type TradeInStatus =
  | 'INICIADO'
  | 'EN_EVALUACION'
  | 'APROBADO'
  | 'RECHAZADO'
  | 'FINALIZADO'
  | 'CANCELADO';

export interface TradeIn {
  id: string;
  codigo: string;
  propiedadEntregadaId: string;
  propiedadRecibidaId: string;
  valorEntregada: number;
  valorRecibida: number;
  diferencia: number;
  estado: TradeInStatus;
  gestorId: string;
  fechaInicio: string;
  fechaFinalizacion?: string;
  createdAt: string;
  updatedAt: string;
}

// ========================================
// TIPOS DE PUBLICACIÓN
// ========================================

export type PublicationStatus = 'ACTIVA' | 'PAUSADA' | 'FINALIZADA' | 'VENCIDA';

export type ExclusivityType = 'EXCLUSIVA' | 'NO_EXCLUSIVA';

export interface Publication {
  id: string;
  propiedadId: string;
  corredorExternoId: string;
  estado: PublicationStatus;
  tipoExclusividad: ExclusivityType;
  comisionAcordada: number;
  fechaInicio: string;
  fechaVencimiento: string;
  visualizaciones: number;
  contactosGenerados: number;
  createdAt: string;
  updatedAt: string;
}

// ========================================
// TIPOS DE DASHBOARD
// ========================================

export interface KPI {
  label: string;
  value: number | string;
  previousValue?: number;
  change?: number;
  changePercentage?: number;
  trend?: 'up' | 'down' | 'neutral';
  format?: 'currency' | 'number' | 'percentage';
}

export interface DashboardData {
  kpis: KPI[];
  statistics: any;
  alerts: Alert[];
  recentActivity: any[];
}

// ========================================
// TIPOS DE ALERTA
// ========================================

export type AlertType = 'CRITICAL' | 'WARNING' | 'INFO';

export interface Alert {
  id: string;
  type: AlertType;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

// ========================================
// TIPOS DE API
// ========================================

export interface ApiError {
  message: string;
  code?: string;
  details?: any;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
}
