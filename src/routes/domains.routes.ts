/**
 * DATABROKERS - RUTAS DE DOMINIOS (Parámetros del Sistema)
 * Endpoints para gestión de categorías y parámetros
 *
 * @version 1.0
 * @author Sistema Databrokers
 */

import { Router } from 'express';
import * as domainsController from '../controllers/domains.controller';
import { authenticateToken, authorizeRoles } from '../middleware/auth.middleware';

const router = Router();

// =====================================================
// TODAS LAS RUTAS REQUIEREN AUTENTICACIÓN
// =====================================================

router.use(authenticateToken);

// =====================================================
// RUTAS DE CATEGORÍAS
// =====================================================

/**
 * @route   GET /api/domains/categorias
 * @desc    Obtener todas las categorías
 * @access  Private
 */
router.get('/categorias', domainsController.getCategorias);

/**
 * @route   GET /api/domains/categorias/:id
 * @desc    Obtener una categoría por ID
 * @access  Private
 */
router.get('/categorias/:id', domainsController.getCategoriaById);

/**
 * @route   POST /api/domains/categorias
 * @desc    Crear una nueva categoría
 * @access  Private (ADMIN)
 */
router.post('/categorias', authorizeRoles(['ADMIN']), domainsController.createCategoria);

// =====================================================
// RUTAS DE PARÁMETROS
// =====================================================

/**
 * @route   GET /api/domains/parametros/:categoriaId
 * @desc    Obtener parámetros de una categoría (por ID)
 * @access  Private
 */
router.get('/parametros/:categoriaId', domainsController.getParametrosByCategoria);

/**
 * @route   GET /api/domains/parametros/codigo/:codigo
 * @desc    Obtener parámetros por código de categoría
 * @access  Private
 */
router.get('/parametros/codigo/:codigo', domainsController.getParametrosByCategoriaCode);

/**
 * @route   POST /api/domains/parametros
 * @desc    Crear un nuevo parámetro
 * @access  Private (ADMIN)
 */
router.post('/parametros', authorizeRoles(['ADMIN']), domainsController.createParametro);

/**
 * @route   PUT /api/domains/parametros/:id
 * @desc    Actualizar un parámetro
 * @access  Private (ADMIN)
 */
router.put('/parametros/:id', authorizeRoles(['ADMIN']), domainsController.updateParametro);

/**
 * @route   DELETE /api/domains/parametros/:id
 * @desc    Eliminar (desactivar) un parámetro
 * @access  Private (ADMIN)
 */
router.delete('/parametros/:id', authorizeRoles(['ADMIN']), domainsController.deleteParametro);

export default router;
