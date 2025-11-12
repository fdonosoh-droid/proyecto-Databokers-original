/**
 * DATABROKERS - RUTAS DE MODELOS DE NEGOCIO
 * Endpoints para gestión de modelos de negocio
 *
 * @version 1.0
 * @author Sistema Databrokers
 */

import { Router } from 'express';
import * as businessModelsController from '../controllers/business-models.controller';
import { authenticateToken, authorizeRoles } from '../middleware/auth.middleware';

const router = Router();

// =====================================================
// TODAS LAS RUTAS REQUIEREN AUTENTICACIÓN
// =====================================================

router.use(authenticateToken);

// =====================================================
// RUTAS CRUD
// =====================================================

/**
 * @route   GET /api/business-models
 * @desc    Obtener lista de modelos de negocio
 * @access  Private
 */
router.get('/', businessModelsController.getBusinessModels);

/**
 * @route   GET /api/business-models/:id
 * @desc    Obtener un modelo de negocio por ID
 * @access  Private
 */
router.get('/:id', businessModelsController.getBusinessModelById);

/**
 * @route   POST /api/business-models
 * @desc    Crear un nuevo modelo de negocio
 * @access  Private (ADMIN)
 */
router.post('/', authorizeRoles(['ADMIN']), businessModelsController.createBusinessModel);

/**
 * @route   PUT /api/business-models/:id
 * @desc    Actualizar un modelo de negocio
 * @access  Private (ADMIN)
 */
router.put('/:id', authorizeRoles(['ADMIN']), businessModelsController.updateBusinessModel);

/**
 * @route   DELETE /api/business-models/:id
 * @desc    Eliminar (desactivar) un modelo de negocio
 * @access  Private (ADMIN)
 */
router.delete('/:id', authorizeRoles(['ADMIN']), businessModelsController.deleteBusinessModel);

export default router;
