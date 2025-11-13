/**
 * DATABROKERS - DASHBOARD ROUTES
 * Rutas para dashboard ejecutivo y visualizaciones
 * 
 * @version 1.0
 * @author Sistema Databrokers
 */

import { Router } from 'express';
import { authenticateToken, authorizeRoles } from '../middleware/auth.middleware';
import * as dashboardController from '../controllers/dashboard.controller';

const router = Router();

// =====================================================
// RUTAS DEL DASHBOARD PRINCIPAL
// =====================================================

/**
 * @route   GET /api/dashboard
 * @desc    Obtener datos completos del dashboard ejecutivo
 * @access  Admin, Gestor, Analista
 */
router.get(
  '/',
  authenticateToken,
  authorizeRoles('ADMIN', 'GESTOR', 'ANALISTA'),
  dashboardController.getDashboardData
);

/**
 * @route   GET /api/dashboard/financiero
 * @desc    Obtener resumen financiero
 * @access  Admin, Gestor, Analista
 */
router.get(
  '/financiero',
  authenticateToken,
  authorizeRoles('ADMIN', 'GESTOR', 'ANALISTA'),
  dashboardController.getResumenFinanciero
);

// =====================================================
// RUTAS DE KPIs
// =====================================================

/**
 * @route   GET /api/dashboard/kpis
 * @desc    Obtener KPIs con comparación temporal
 * @access  Admin, Gestor, Analista
 */
router.get(
  '/kpis',
  authenticateToken,
  authorizeRoles('ADMIN', 'GESTOR', 'ANALISTA'),
  dashboardController.getKPIsWithComparison
);

/**
 * @route   GET /api/dashboard/kpis/:codigo/historico
 * @desc    Obtener histórico de un KPI específico
 * @access  Admin, Gestor, Analista
 */
router.get(
  '/kpis/:codigo/historico',
  authenticateToken,
  authorizeRoles('ADMIN', 'GESTOR', 'ANALISTA'),
  dashboardController.getKPIHistorico
);

// =====================================================
// RUTAS DE ESTADÍSTICAS Y ALERTAS
// =====================================================

/**
 * @route   GET /api/dashboard/statistics
 * @desc    Obtener estadísticas del dashboard
 * @access  Admin, Gestor, Analista
 */
router.get(
  '/statistics',
  authenticateToken,
  authorizeRoles('ADMIN', 'GESTOR', 'ANALISTA'),
  dashboardController.getStatistics
);

/**
 * @route   GET /api/dashboard/alerts
 * @desc    Obtener alertas del dashboard
 * @access  Admin, Gestor, Analista
 */
router.get(
  '/alerts',
  authenticateToken,
  authorizeRoles('ADMIN', 'GESTOR', 'ANALISTA'),
  dashboardController.getAlerts
);

/**
 * @route   GET /api/dashboard/recent-activity
 * @desc    Obtener actividad reciente
 * @access  Admin, Gestor, Analista
 */
router.get(
  '/recent-activity',
  authenticateToken,
  authorizeRoles('ADMIN', 'GESTOR', 'ANALISTA'),
  dashboardController.getRecentActivity
);

/**
 * @route   PATCH /api/dashboard/alerts/:id/read
 * @desc    Marcar alerta como leída
 * @access  Admin, Gestor, Analista
 */
router.patch(
  '/alerts/:id/read',
  authenticateToken,
  authorizeRoles('ADMIN', 'GESTOR', 'ANALISTA'),
  dashboardController.markAlertAsRead
);

// =====================================================
// RUTAS DE GRÁFICOS
// =====================================================

/**
 * @route   GET /api/dashboard/charts/ventas-mensuales
 * @desc    Obtener datos para gráfico de ventas por mes
 * @access  Admin, Gestor, Analista
 */
router.get(
  '/charts/ventas-mensuales',
  authenticateToken,
  authorizeRoles('ADMIN', 'GESTOR', 'ANALISTA'),
  dashboardController.getVentasMensuales
);

/**
 * @route   GET /api/dashboard/charts/propiedades-estado
 * @desc    Obtener distribución de propiedades por estado
 * @access  Admin, Gestor, Analista
 */
router.get(
  '/charts/propiedades-estado',
  authenticateToken,
  authorizeRoles('ADMIN', 'GESTOR', 'ANALISTA'),
  dashboardController.getPropiedadesPorEstado
);

/**
 * @route   GET /api/dashboard/charts/performance-corredores
 * @desc    Obtener performance de corredores
 * @access  Admin, Gestor, Analista
 */
router.get(
  '/charts/performance-corredores',
  authenticateToken,
  authorizeRoles('ADMIN', 'GESTOR', 'ANALISTA'),
  dashboardController.getPerformanceCorredores
);

export default router;
