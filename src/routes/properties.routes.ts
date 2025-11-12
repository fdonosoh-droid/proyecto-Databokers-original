/**
 * DATABROKERS - RUTAS DE PROPIEDADES
 * Endpoints para gestión de propiedades
 *
 * @version 1.0
 * @author Sistema Databrokers
 */

import { Router } from 'express';
import * as propertiesController from '../controllers/properties.controller';
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
 * @route   GET /api/properties
 * @desc    Obtener lista de propiedades (con paginación y filtros)
 * @access  Private
 */
router.get('/', propertiesController.getProperties);

/**
 * @route   GET /api/properties/:id
 * @desc    Obtener una propiedad por ID
 * @access  Private
 */
router.get('/:id', propertiesController.getPropertyById);

/**
 * @route   POST /api/properties
 * @desc    Crear una nueva propiedad
 * @access  Private (ADMIN, GESTOR)
 */
router.post('/', authorizeRoles(['ADMIN', 'GESTOR']), propertiesController.createProperty);

/**
 * @route   PUT /api/properties/:id
 * @desc    Actualizar una propiedad
 * @access  Private (ADMIN, GESTOR)
 */
router.put('/:id', authorizeRoles(['ADMIN', 'GESTOR']), propertiesController.updateProperty);

/**
 * @route   DELETE /api/properties/:id
 * @desc    Eliminar (desactivar) una propiedad
 * @access  Private (ADMIN)
 */
router.delete('/:id', authorizeRoles(['ADMIN']), propertiesController.deleteProperty);

// =====================================================
// RUTAS ADICIONALES
// =====================================================

/**
 * @route   GET /api/properties/:id/history
 * @desc    Obtener historial de una propiedad
 * @access  Private
 */
router.get('/:id/history', propertiesController.getPropertyHistory);

/**
 * @route   POST /api/properties/:id/images
 * @desc    Agregar imágenes a una propiedad
 * @access  Private (ADMIN, GESTOR)
 */
router.post('/:id/images', authorizeRoles(['ADMIN', 'GESTOR']), propertiesController.addPropertyImages);

/**
 * @route   DELETE /api/properties/:id/images/:imageId
 * @desc    Eliminar una imagen de una propiedad
 * @access  Private (ADMIN, GESTOR)
 */
router.delete('/:id/images/:imageId', authorizeRoles(['ADMIN', 'GESTOR']), propertiesController.deletePropertyImage);

export default router;
