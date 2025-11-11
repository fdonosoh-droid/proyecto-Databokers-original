// Tipos base para toda la aplicación

export interface User {
  id: string;
  email: string;
  nombre: string;
  apellido: string;
  rol: 'ADMIN' | 'GESTOR' | 'CORREDOR';
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
}

export interface Project {
  id: string;
  nombre: string;
  inmobiliariaId: string;
  inmobiliaria?: {
    nombre: string;
  };
  direccion: string;
  regionId: string;
  region?: {
    nombre: string;
  };
  comunaId: string;
  comuna?: {
    nombre: string;
  };
  modeloNegocio: string;
  estado: string;
  fechaInicioVentas: string;
  fechaEntrega: string;
  totalUnidades: number;
  unidadesDisponibles: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Typology {
  id: string;
  proyectoId: string;
  nombre: string;
  tipoPropiedad: string;
  superficieTotal: number;
  superficieUtil: number;
  dormitorios: number;
  banos: number;
  estacionamientos: number;
  bodegas: number;
  precioDesde: number;
  precioHasta: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Unit {
  id: string;
  proyectoId: string;
  tipologiaId: string;
  tipologia?: Typology;
  numero: string;
  piso: string;
  precio: number;
  superficieTotal: number;
  superficieUtil: number;
  estado: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Property {
  id: string;
  tipo: string;
  direccion: string;
  comunaId?: string;
  comuna: string;
  regionId?: string;
  region: string;
  precio: number;
  superficie: number;
  superficieUtil?: number;
  dormitorios: number;
  banos: number;
  estacionamientos: number;
  bodegas?: number;
  estado: string;
  modeloNegocio?: string;
  proyectoId?: string;
  unidadId?: string;
  descripcion?: string;
  imagenes?: string[];
  createdAt?: string;
  updatedAt?: string;
}

// Canjes (Trade-Ins)
export interface TradeIn {
  id: string;
  codigo: string;
  propiedadEntregadaId: string;
  propiedadRecibidaId: string;
  propiedadEntregada?: Property;
  propiedadRecibida?: Property;
  valorizacionEntregada: number;
  valorizacionRecibida: number;
  diferencia: number;
  estado: TradeInEstado;
  formaPagoDiferencia?: string;
  gestorId: string;
  gestor?: User;
  comentarios?: string;
  fechaCreacion: string;
  fechaActualizacion?: string;
  timeline?: TradeInTimelineEvent[];
}

export type TradeInEstado = 'INICIADO' | 'EN_EVALUACION' | 'APROBADO' | 'RECHAZADO' | 'FINALIZADO' | 'CANCELADO';

export interface TradeInTimelineEvent {
  id: string;
  estado: TradeInEstado;
  fecha: string;
  comentario?: string;
  usuario?: string;
}

export interface TradeInStats {
  totalCanjes: number;
  canjesPorEstado: Record<TradeInEstado, number>;
  tasaExito: number;
  valorPromedioDiferencia: number;
  tiempoPromedioProcesoHoras: number;
  topGestores: Array<{
    gestorId: string;
    nombre: string;
    cantidadCanjes: number;
  }>;
}

export interface TradeInFilters {
  estado?: TradeInEstado;
  gestorId?: string;
  fechaDesde?: string;
  fechaHasta?: string;
  modeloNegocio?: string;
}

// Publicaciones
export interface Publication {
  id: string;
  propiedadId: string;
  propiedad?: Property;
  corredorId: string;
  corredor?: User;
  estado: PublicationEstado;
  tipoExclusividad: TipoExclusividad;
  comisionAcordada: number;
  visualizaciones: number;
  contactos: number;
  ofertas?: number;
  fechaInicio: string;
  fechaVencimiento: string;
  fechaFinalizacion?: string;
  notas?: string;
  restricciones?: string;
  metricas?: PublicationMetricas;
}

export type PublicationEstado = 'ACTIVA' | 'PAUSADA' | 'FINALIZADA' | 'VENCIDA';

export type TipoExclusividad = 'EXCLUSIVA' | 'SEMI_EXCLUSIVA' | 'NO_EXCLUSIVA';

export interface PublicationMetricas {
  visualizacionesSemana: number;
  contactosSemana: number;
  tasaConversion: number;
  diasEnPublicacion: number;
  promedioTiempoRespuesta?: number;
}

export interface PublicationStats {
  totalPublicaciones: number;
  publicacionesPorEstado: Record<PublicationEstado, number>;
  efectividadPorCorreedor: Array<{
    corredorId: string;
    nombre: string;
    publicacionesActivas: number;
    tasaExito: number;
  }>;
  comisionesGeneradas: number;
  tiempoPromedioHastaCierre: number;
}

export interface PublicationFilters {
  estado?: PublicationEstado;
  corredorId?: string;
  tipoExclusividad?: TipoExclusividad;
  vencimientoProximo?: boolean;
}

export interface KPI {
  label: string;
  value: number | string;
  change?: number;
  trend?: 'up' | 'down' | 'neutral';
  format?: 'currency' | 'percentage' | 'number';
}

export interface Alert {
  id: string;
  tipo: 'critical' | 'warning' | 'info';
  titulo: string;
  mensaje: string;
  fecha: string;
  leida: boolean;
}
