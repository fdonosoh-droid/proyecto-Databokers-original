/**
 * DATABROKERS - PUBLICATIONS ROUTES
 * Rutas para gestión de publicaciones a corredores externos
 * 
 * @version 1.0
 * @author Sistema Databrokers
 */

import { Router } from 'express';
import { authenticateToken, authorizeRoles } from '../middleware/auth.middleware';
import * as publicationsController from '../controllers/publications.controller';

const router = Router();

// =====================================================
// RUTAS DE PUBLICACIONES
// =====================================================

/**
 * @route   POST /api/publications
 * @desc    Crear nueva publicación
 * @access  Admin, Gestor
 */
router.post(
  '/',
  authenticateToken,
  authorizeRoles('ADMIN', 'GESTOR'),
  publicationsController.createPublication
);

/**
 * @route   GET /api/publications
 * @desc    Listar publicaciones con filtros y paginación
 * @access  Admin, Gestor, Corredor
 * @note    Corredores solo ven sus propias publicaciones
 */
router.get(
  '/',
  authenticateToken,
  authorizeRoles('ADMIN', 'GESTOR', 'CORREDOR'),
  publicationsController.listPublications
);

/**
 * @route   GET /api/publications/statistics
 * @desc    Obtener estadísticas de publicaciones
 * @access  Admin, Gestor, Analista
 */
router.get(
  '/statistics',
  authenticateToken,
  authorizeRoles('ADMIN', 'GESTOR', 'ANALISTA'),
  publicationsController.getPublicationsStatistics
);

/**
 * @route   GET /api/publications/:id
 * @desc    Obtener publicación por ID
 * @access  Admin, Gestor, Corredor
 * @note    Corredores solo ven sus propias publicaciones
 */
router.get(
  '/:id',
  authenticateToken,
  authorizeRoles('ADMIN', 'GESTOR', 'CORREDOR'),
  publicationsController.getPublicationById
);

/**
 * @route   PUT /api/publications/:id
 * @desc    Actualizar publicación
 * @access  Admin, Gestor
 */
router.put(
  '/:id',
  authenticateToken,
  authorizeRoles('ADMIN', 'GESTOR'),
  publicationsController.updatePublication
);

/**
 * @route   PUT /api/publications/:id/estado
 * @desc    Cambiar estado de publicación
 * @access  Admin, Gestor, Corredor
 * @note    Corredores pueden pausar/reactivar sus publicaciones
 */
router.put(
  '/:id/estado',
  authenticateToken,
  authorizeRoles('ADMIN', 'GESTOR', 'CORREDOR'),
  publicationsController.changePublicationState
);

// =====================================================
// RUTAS DE ACTIVIDADES
// =====================================================

/**
 * @route   POST /api/publications/:id/activities
 * @desc    Registrar actividad en publicación
 * @access  Admin, Gestor, Corredor
 */
router.post(
  '/:id/activities',
  authenticateToken,
  authorizeRoles('ADMIN', 'GESTOR', 'CORREDOR'),
  publicationsController.recordActivity
);

/**
 * @route   GET /api/publications/:id/activities
 * @desc    Listar actividades de una publicación
 * @access  Admin, Gestor, Corredor, Analista
 */
router.get(
  '/:id/activities',
  authenticateToken,
  authorizeRoles('ADMIN', 'GESTOR', 'CORREDOR', 'ANALISTA'),
  publicationsController.listActivities
);

export default router;
