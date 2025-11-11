/**
 * DATABROKERS - PROJECTS ROUTES
 * Rutas para gestión de proyectos inmobiliarios
 * 
 * @version 1.0
 * @author Sistema Databrokers
 */

import { Router } from 'express';
import { authenticateToken, authorizeRoles } from '../middleware/auth.middleware';
import * as projectsController from '../controllers/projects.controller';

const router = Router();

// =====================================================
// RUTAS DE PROYECTOS
// =====================================================

/**
 * @route   POST /api/projects
 * @desc    Crear nuevo proyecto
 * @access  Admin, Gestor
 */
router.post(
  '/',
  authenticateToken,
  authorizeRoles('ADMIN', 'GESTOR'),
  projectsController.createProject
);

/**
 * @route   GET /api/projects
 * @desc    Listar proyectos con filtros y paginación
 * @access  Admin, Gestor, Corredor, Analista
 */
router.get(
  '/',
  authenticateToken,
  projectsController.listProjects
);

/**
 * @route   GET /api/projects/:id
 * @desc    Obtener proyecto por ID con información completa
 * @access  Admin, Gestor, Corredor, Analista
 */
router.get(
  '/:id',
  authenticateToken,
  projectsController.getProjectById
);

/**
 * @route   PUT /api/projects/:id
 * @desc    Actualizar proyecto
 * @access  Admin, Gestor
 */
router.put(
  '/:id',
  authenticateToken,
  authorizeRoles('ADMIN', 'GESTOR'),
  projectsController.updateProject
);

/**
 * @route   PUT /api/projects/:id/estado
 * @desc    Cambiar estado del proyecto
 * @access  Admin, Gestor
 */
router.put(
  '/:id/estado',
  authenticateToken,
  authorizeRoles('ADMIN', 'GESTOR'),
  projectsController.changeProjectStatus
);

/**
 * @route   GET /api/projects/:id/statistics
 * @desc    Obtener estadísticas del proyecto
 * @access  Admin, Gestor, Analista
 */
router.get(
  '/:id/statistics',
  authenticateToken,
  authorizeRoles('ADMIN', 'GESTOR', 'ANALISTA'),
  projectsController.getProjectStatistics
);

// =====================================================
// RUTAS DE TIPOLOGÍAS
// =====================================================

/**
 * @route   POST /api/projects/:id/typologies
 * @desc    Crear tipología en un proyecto
 * @access  Admin, Gestor
 */
router.post(
  '/:id/typologies',
  authenticateToken,
  authorizeRoles('ADMIN', 'GESTOR'),
  projectsController.createTypology
);

/**
 * @route   GET /api/projects/:id/typologies
 * @desc    Listar tipologías de un proyecto
 * @access  Admin, Gestor, Corredor, Analista
 */
router.get(
  '/:id/typologies',
  authenticateToken,
  projectsController.listTypologies
);

/**
 * @route   PUT /api/typologies/:id
 * @desc    Actualizar tipología
 * @access  Admin, Gestor
 */
router.put(
  '/typologies/:id',
  authenticateToken,
  authorizeRoles('ADMIN', 'GESTOR'),
  projectsController.updateTypology
);

/**
 * @route   DELETE /api/typologies/:id
 * @desc    Eliminar tipología
 * @access  Admin, Gestor
 */
router.delete(
  '/typologies/:id',
  authenticateToken,
  authorizeRoles('ADMIN', 'GESTOR'),
  projectsController.deleteTypology
);

// =====================================================
// RUTAS DE UNIDADES
// =====================================================

/**
 * @route   POST /api/projects/:id/units
 * @desc    Crear unidad en un proyecto
 * @access  Admin, Gestor
 */
router.post(
  '/:id/units',
  authenticateToken,
  authorizeRoles('ADMIN', 'GESTOR'),
  projectsController.createUnit
);

/**
 * @route   GET /api/projects/:id/units
 * @desc    Listar unidades de un proyecto
 * @access  Admin, Gestor, Corredor, Analista
 */
router.get(
  '/:id/units',
  authenticateToken,
  projectsController.listUnits
);

export default router;
