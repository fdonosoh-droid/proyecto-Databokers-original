/**
 * DATABROKERS - REPORTS ROUTES
 * Rutas para gestión y generación de reportes
 * 
 * @version 1.0
 * @author Sistema Databrokers
 */

import { Router } from 'express';
import { authenticateToken, authorizeRoles } from '../middleware/auth.middleware';
import * as reportsController from '../controllers/reports.controller';

const router = Router();

// =====================================================
// RUTAS DE GENERACIÓN DE REPORTES
// =====================================================

/**
 * @route   POST /api/reports/generate
 * @desc    Generar nuevo reporte
 * @access  Admin, Gestor, Analista
 */
router.post(
  '/generate',
  authenticateToken,
  authorizeRoles('ADMIN', 'GESTOR', 'ANALISTA'),
  reportsController.generateReport
);

/**
 * @route   GET /api/reports/templates
 * @desc    Obtener plantillas de reportes disponibles
 * @access  Admin, Gestor, Analista
 */
router.get(
  '/templates',
  authenticateToken,
  authorizeRoles('ADMIN', 'GESTOR', 'ANALISTA'),
  reportsController.getReportTemplates
);

// =====================================================
// RUTAS DE GESTIÓN DE REPORTES
// =====================================================

/**
 * @route   GET /api/reports
 * @desc    Listar reportes generados
 * @access  Admin, Gestor, Analista
 * @note    Usuarios solo ven sus propios reportes (excepto Admin)
 */
router.get(
  '/',
  authenticateToken,
  authorizeRoles('ADMIN', 'GESTOR', 'ANALISTA'),
  reportsController.listReports
);

/**
 * @route   GET /api/reports/:id
 * @desc    Obtener reporte por ID
 * @access  Admin, Gestor, Analista
 * @note    Usuarios solo ven sus propios reportes (excepto Admin)
 */
router.get(
  '/:id',
  authenticateToken,
  authorizeRoles('ADMIN', 'GESTOR', 'ANALISTA'),
  reportsController.getReportById
);

/**
 * @route   GET /api/reports/:id/download
 * @desc    Descargar reporte
 * @access  Admin, Gestor, Analista
 * @note    Usuarios solo pueden descargar sus propios reportes (excepto Admin)
 */
router.get(
  '/:id/download',
  authenticateToken,
  authorizeRoles('ADMIN', 'GESTOR', 'ANALISTA'),
  reportsController.downloadReport
);

/**
 * @route   DELETE /api/reports/:id
 * @desc    Eliminar reporte
 * @access  Admin, Gestor, Analista
 * @note    Usuarios solo pueden eliminar sus propios reportes (excepto Admin)
 */
router.delete(
  '/:id',
  authenticateToken,
  authorizeRoles('ADMIN', 'GESTOR', 'ANALISTA'),
  reportsController.deleteReport
);

// =====================================================
// RUTAS DE PROGRAMACIÓN DE REPORTES
// =====================================================

/**
 * @route   POST /api/reports/schedule
 * @desc    Programar reporte automático
 * @access  Admin, Gestor
 */
router.post(
  '/schedule',
  authenticateToken,
  authorizeRoles('ADMIN', 'GESTOR'),
  reportsController.scheduleReport
);

/**
 * @route   GET /api/reports/scheduled
 * @desc    Listar reportes programados
 * @access  Admin, Gestor
 */
router.get(
  '/scheduled',
  authenticateToken,
  authorizeRoles('ADMIN', 'GESTOR'),
  reportsController.listScheduledReports
);

/**
 * @route   PUT /api/reports/scheduled/:id/toggle
 * @desc    Activar/Desactivar reporte programado
 * @access  Admin, Gestor
 */
router.put(
  '/scheduled/:id/toggle',
  authenticateToken,
  authorizeRoles('ADMIN', 'GESTOR'),
  reportsController.toggleScheduledReport
);

/**
 * @route   DELETE /api/reports/scheduled/:id
 * @desc    Eliminar programación de reporte
 * @access  Admin, Gestor
 */
router.delete(
  '/scheduled/:id',
  authenticateToken,
  authorizeRoles('ADMIN', 'GESTOR'),
  reportsController.deleteScheduledReport
);

export default router;
