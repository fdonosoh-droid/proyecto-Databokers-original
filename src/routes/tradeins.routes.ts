/**
 * DATABROKERS - TRADE-INS ROUTES
 * Rutas para gestión de canjes (intercambios de propiedades)
 * 
 * @version 1.0
 * @author Sistema Databrokers
 */

import { Router } from 'express';
import { authenticateToken, authorizeRoles } from '../middleware/auth.middleware';
import * as tradeInsController from '../controllers/tradeins.controller';

const router = Router();

// =====================================================
// RUTAS DE CANJES
// =====================================================

/**
 * @route   POST /api/trade-ins
 * @desc    Crear nuevo canje
 * @access  Admin, Gestor
 */
router.post(
  '/',
  authenticateToken,
  authorizeRoles('ADMIN', 'GESTOR'),
  tradeInsController.createTradeIn
);

/**
 * @route   GET /api/trade-ins
 * @desc    Listar canjes con filtros y paginación
 * @access  Admin, Gestor, Analista
 * @note    Gestores solo ven sus propios canjes
 */
router.get(
  '/',
  authenticateToken,
  authorizeRoles('ADMIN', 'GESTOR', 'ANALISTA'),
  tradeInsController.listTradeIns
);

/**
 * @route   GET /api/trade-ins/statistics
 * @desc    Obtener estadísticas de canjes
 * @access  Admin, Gestor, Analista
 */
router.get(
  '/statistics',
  authenticateToken,
  authorizeRoles('ADMIN', 'GESTOR', 'ANALISTA'),
  tradeInsController.getTradeInsStatistics
);

/**
 * @route   GET /api/trade-ins/:id
 * @desc    Obtener canje por ID
 * @access  Admin, Gestor, Analista
 * @note    Gestores solo ven sus propios canjes
 */
router.get(
  '/:id',
  authenticateToken,
  authorizeRoles('ADMIN', 'GESTOR', 'ANALISTA'),
  tradeInsController.getTradeInById
);

/**
 * @route   PUT /api/trade-ins/:id
 * @desc    Actualizar canje
 * @access  Admin, Gestor
 * @note    Gestores solo pueden modificar sus propios canjes
 */
router.put(
  '/:id',
  authenticateToken,
  authorizeRoles('ADMIN', 'GESTOR'),
  tradeInsController.updateTradeIn
);

/**
 * @route   PUT /api/trade-ins/:id/estado
 * @desc    Cambiar estado del canje
 * @access  Admin, Gestor
 * @note    Gestores solo pueden cambiar estado de sus propios canjes
 */
router.put(
  '/:id/estado',
  authenticateToken,
  authorizeRoles('ADMIN', 'GESTOR'),
  tradeInsController.changeTradeInState
);

/**
 * @route   DELETE /api/trade-ins/:id
 * @desc    Eliminar canje (soft delete)
 * @access  Admin
 */
router.delete(
  '/:id',
  authenticateToken,
  authorizeRoles('ADMIN'),
  tradeInsController.deleteTradeIn
);

export default router;
