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
  direccion: string;
  regionId: string;
  comunaId: string;
  modeloNegocio: string;
  estado: string;
  fechaInicioVentas: string;
  fechaEntrega: string;
  totalUnidades: number;
  unidadesDisponibles: number;
}

export interface Property {
  id: string;
  tipo: string;
  direccion: string;
  comuna: string;
  region: string;
  precio: number;
  superficie: number;
  dormitorios: number;
  banos: number;
  estacionamientos: number;
  estado: string;
}

export interface TradeIn {
  id: string;
  codigo: string;
  propiedadEntregadaId: string;
  propiedadRecibidaId: string;
  diferencia: number;
  estado: string;
  gestorId: string;
  fechaCreacion: string;
}

export interface Publication {
  id: string;
  propiedadId: string;
  corredorId: string;
  estado: string;
  tipoExclusividad: string;
  comisionAcordada: number;
  visualizaciones: number;
  contactos: number;
  fechaVencimiento: string;
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
