/**
 * DATABROKERS - RUTAS DE USUARIOS
 * Endpoints para gestión de usuarios y perfiles
 *
 * @version 1.0
 * @author Sistema Databrokers
 */

import { Router } from 'express';
import * as usersController from '../controllers/users.controller';
import { authenticateToken, authorizeRoles } from '../middleware/auth.middleware';

const router = Router();

// =====================================================
// TODAS LAS RUTAS REQUIEREN AUTENTICACIÓN
// =====================================================

router.use(authenticateToken);

// =====================================================
// RUTAS DE PERFIL (todos los usuarios autenticados)
// =====================================================

/**
 * @route   GET /api/users/profile
 * @desc    Obtener perfil del usuario autenticado
 * @access  Private
 */
router.get('/profile', usersController.getProfile);

// =====================================================
// RUTAS CRUD (solo ADMIN)
// =====================================================

/**
 * @route   GET /api/users
 * @desc    Obtener lista de usuarios (con paginación y filtros)
 * @access  Private (ADMIN)
 */
router.get('/', authorizeRoles(['ADMIN']), usersController.getUsers);

/**
 * @route   GET /api/users/:id
 * @desc    Obtener un usuario por ID
 * @access  Private (ADMIN o propio usuario)
 */
router.get('/:id', usersController.getUserById);

/**
 * @route   POST /api/users
 * @desc    Crear un nuevo usuario
 * @access  Private (ADMIN)
 */
router.post('/', authorizeRoles(['ADMIN']), usersController.createUser);

/**
 * @route   PUT /api/users/:id
 * @desc    Actualizar un usuario
 * @access  Private (ADMIN o propio usuario)
 */
router.put('/:id', usersController.updateUser);

/**
 * @route   DELETE /api/users/:id
 * @desc    Eliminar (desactivar) un usuario
 * @access  Private (ADMIN)
 */
router.delete('/:id', authorizeRoles(['ADMIN']), usersController.deleteUser);

/**
 * @route   PUT /api/users/:id/password
 * @desc    Cambiar contraseña de un usuario
 * @access  Private (propio usuario o ADMIN)
 */
router.put('/:id/password', usersController.changePassword);

export default router;
