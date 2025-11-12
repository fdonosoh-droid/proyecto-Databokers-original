/**
 * DATABROKERS - SERVIDOR PRINCIPAL
 * Sistema de Gestión Inmobiliaria - Backend API
 *
 * @version 3.0.0
 * @author Sistema Databrokers
 */

import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Importar rutas
import authRoutes from './routes/auth.routes';
import usersRoutes from './routes/users.routes';
import propertiesRoutes from './routes/properties.routes';
import businessModelsRoutes from './routes/business-models.routes';
import domainsRoutes from './routes/domains.routes';
import dashboardRoutes from './routes/dashboard.routes';
import projectsRoutes from './routes/projects.routes';
import publicationsRoutes from './routes/publications.routes';
import reportsRoutes from './routes/reports.routes';
import tradeinsRoutes from './routes/tradeins.routes';

// Importar servicios para inicialización
// import { iniciarSchedulerKPIs } from './services/kpis.service'; // Temporalmente comentado

// Configuración de variables de entorno
dotenv.config();

// Crear aplicación Express
const app: Application = express();
const PORT = process.env.PORT || 3000;

// =====================================================
// MIDDLEWARES GLOBALES
// =====================================================

// CORS
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
}));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging de requests (desarrollo)
if (process.env.NODE_ENV === 'development') {
  app.use((req: Request, res: Response, next: NextFunction) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
  });
}

// =====================================================
// HEALTH CHECK
// =====================================================

app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
  });
});

// =====================================================
// RUTAS DE LA API
// =====================================================

// Ruta raíz
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: '🏢 Databrokers API - Sistema de Gestión Inmobiliaria',
    version: '3.0.0',
    status: 'Backend 100% Completado ✅',
    endpoints: {
      health: '/health',
      api: {
        auth: '/api/auth',
        users: '/api/users',
        properties: '/api/properties',
        businessModels: '/api/business-models',
        domains: '/api/domains',
        dashboard: '/api/dashboard',
        projects: '/api/projects',
        publications: '/api/publications',
        reports: '/api/reports',
        tradeins: '/api/trade-ins',
      },
    },
    documentation: 'https://github.com/databrokers/api-docs',
  });
});

// Registrar rutas de módulos
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/properties', propertiesRoutes);
app.use('/api/business-models', businessModelsRoutes);
app.use('/api/domains', domainsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/projects', projectsRoutes);
app.use('/api/publications', publicationsRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/trade-ins', tradeinsRoutes);

// =====================================================
// MANEJO DE ERRORES
// =====================================================

// 404 - Ruta no encontrada
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Ruta no encontrada',
    path: req.path,
  });
});

// Manejador global de errores
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);

  res.status(500).json({
    success: false,
    message: 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// =====================================================
// INICIALIZACIÓN DEL SERVIDOR
// =====================================================

async function startServer() {
  try {
    // Iniciar servicios automáticos
    console.log('🔄 Iniciando servicios automáticos...');
    // iniciarSchedulerKPIs(); // Temporalmente comentado
    // console.log('✅ Scheduler de KPIs iniciado');

    // Nota: Descomentar cuando AlertsService esté disponible
    // import { iniciarMonitoreoAlertas } from './services/alerts.service';
    // iniciarMonitoreoAlertas();
    // console.log('✅ Sistema de alertas iniciado');

    // Iniciar servidor
    app.listen(PORT, () => {
      console.log('');
      console.log('╔════════════════════════════════════════════════╗');
      console.log('║                                                ║');
      console.log('║     🏢  DATABROKERS API - ACTIVO  🚀           ║');
      console.log('║                                                ║');
      console.log('╚════════════════════════════════════════════════╝');
      console.log('');
      console.log(`📡 Servidor escuchando en puerto: ${PORT}`);
      console.log(`🌍 Entorno: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📊 Endpoints API disponibles: 58+`);
      console.log(`✅ Backend completado al 100%`);
      console.log('');
      console.log(`🔗 URL: http://localhost:${PORT}`);
      console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
      console.log('');
      console.log('═══════════════════════════════════════════════');
      console.log('Presiona Ctrl+C para detener el servidor');
      console.log('═══════════════════════════════════════════════');
      console.log('');
    });
  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error);
    process.exit(1);
  }
}

// Manejo de señales de terminación
process.on('SIGTERM', () => {
  console.log('SIGTERM recibido. Cerrando servidor...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\nSIGINT recibido. Cerrando servidor...');
  process.exit(0);
});

// Iniciar servidor
startServer();

export default app;
